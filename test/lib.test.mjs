import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, whatsappLink, fill, slug, validateConfig, planPages } from "../src/lib.mjs";

const product = (code, photos = 3) => ({ code, name: `Product ${code}`, photos: Array.from({ length: photos }, (_, i) => `${code}-${i}`) });
const config = (over = {}) => ({
  brand: "Demo", whatsapp: "573000000000", whatsappDisplay: "+57 300 000 0000", message: "Hi, {name}", cover: "c",
  sections: [{ name: "Sofás", cover: "s", products: [product("A"), product("B")] }, { name: "Mesas", products: [product("C")] }],
  ...over,
});

test("escapeHtml escapes the characters that break attributes and markup", () => {
  assert.equal(escapeHtml(`<a href="x">&</a>`), "&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;");
});

test("whatsappLink encodes the message, including accents and line breaks", () => {
  assert.equal(
    whatsappLink("573000000000", "Hola, ¿precio?\nGracias & saludos"),
    "https://api.whatsapp.com/send?phone=573000000000&text=Hola%2C%20%C2%BFprecio%3F%0AGracias%20%26%20saludos",
  );
});

test("whatsappLink rejects numbers with symbols or without country code", () => {
  assert.throws(() => whatsappLink("+57 300 000 0000", "x"));
  assert.throws(() => whatsappLink("3000", "x"));
});

test("fill replaces known placeholders and leaves unknown ones untouched", () => {
  assert.equal(fill("{name} ({code}) {missing}", { name: "Sofá", code: "S1" }), "Sofá (S1) {missing}");
});

test("slug removes accents and symbols", () => {
  assert.equal(slug("Cómodas & Mesas"), "comodas-mesas");
});

test("validateConfig accepts a complete config", () => {
  assert.deepEqual(validateConfig(config()), []);
});

test("validateConfig reports missing fields, bad numbers, duplicate codes and missing photos", () => {
  assert.deepEqual(validateConfig({ brand: "x" }).length, 5);
  const cfg = config({ whatsapp: "+57300" });
  cfg.sections[1].products.push(product("A"));
  const errors = validateConfig(cfg, id => id !== "B-1");
  assert.ok(errors.some(e => e.includes('"whatsapp"')));
  assert.ok(errors.some(e => e.includes('duplicate product code "A"')));
  assert.ok(errors.some(e => e.includes('photo "B-1" not found')));
});

test("planPages numbers dividers and products after cover and table of contents", () => {
  const plan = planPages(config());
  assert.equal(plan.sections[0].divider, 3);
  assert.deepEqual(plan.sections[0].products.map(p => p.page), [4, 5]);
  assert.equal(plan.sections[1].divider, null); // no cover photo -> no divider page
  assert.deepEqual(plan.sections[1].products.map(p => p.page), [6]);
  assert.equal(plan.backCover, 7);
  assert.equal(plan.total, 7);
});

test("planPages skips products below minPhotos and drops sections left empty", () => {
  const cfg = config({ minPhotos: 3 });
  cfg.sections[0].products[1] = product("B", 2);
  cfg.sections[1].products = [product("C", 1)];
  const plan = planPages(cfg);
  assert.deepEqual(plan.sections.map(s => s.name), ["Sofás"]);
  assert.deepEqual(plan.sections[0].products.map(p => p.code), ["A"]);
  assert.equal(plan.total, 5);
});
