// Builds dist/catalog.html (+ optimized images, fonts and a links manifest) from a catalog JSON file.
// Usage: node src/build.mjs [catalog.json]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { escapeHtml as esc, whatsappLink, fill, validateConfig, planPages } from "./lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.resolve(process.argv[2] || path.join(ROOT, "catalog.json"));
const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
const PHOTOS = path.resolve(path.dirname(configPath), cfg.photosDir || "photos");
const OUT = path.join(ROOT, "dist");
const t = cfg.texts;

const photoPath = id => path.join(PHOTOS, `${id}.jpg`);
const errors = validateConfig(cfg, id => fs.existsSync(photoPath(id)));
if (errors.length) {
  console.error("Invalid catalog config:\n  - " + errors.join("\n  - "));
  process.exit(1);
}

const plan = planPages(cfg);
const products = plan.sections.flatMap(s => s.products);
const wa = text => whatsappLink(cfg.whatsapp, text);
const waGeneral = wa(fill(t.generalMessage, { brand: cfg.brand }));
const waProduct = p => wa(fill(cfg.message, p));

// ---------- Assets ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "img"), { recursive: true });
fs.mkdirSync(path.join(OUT, "fonts"));

const used = new Set([cfg.cover, ...plan.sections.map(s => s.cover).filter(Boolean), ...products.flatMap(p => p.photos.slice(0, 3))]);
const size = {};
await Promise.all([...used].map(async id => {
  const info = await sharp(photoPath(id)).rotate().resize(1400, 1400, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(OUT, "img", `${id}.jpg`));
  size[id] = info;
}));

const FONT_WEIGHTS = [300, 400, 500, 600, 800];
const fontDir = path.join(ROOT, "node_modules/@fontsource/montserrat/files");
const fontFaces = FONT_WEIGHTS.map(w => {
  const file = `montserrat-latin-${w}-normal.woff2`;
  fs.copyFileSync(path.join(fontDir, file), path.join(OUT, "fonts", file));
  return `@font-face{font-family:Montserrat;font-weight:${w};src:url(fonts/${file}) format("woff2")}`;
}).join("\n");

// ---------- Icons ----------
const ICON = {
  instagram: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.3" fill="currentColor"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.6-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2h2.8V22h3.4z"/></svg>`,
  location: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>`,
  link: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/></svg>`,
  whatsapp: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.6 1.1 2.7c.1.2 1.9 2.9 4.6 4.1 1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.4-.3z"/></svg>`,
};
const socials = (cfg.socials || []).filter(s => ICON[s.type]);
const socialItem = (s, withLabel) =>
  `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${ICON[s.type]}<span>${withLabel && s.label ? esc(s.label) + " " : ""}${esc(s.text)}</span></a></li>`;

// ---------- Building blocks ----------
const productOf = id => products.find(p => p.photos.includes(id)) || products[0];
const photo = (id, p, cls, alt) =>
  `<a class="ph ${cls}" href="${esc(waProduct(p))}" target="_blank" rel="noopener" title="${esc(fill(t.photoTitle, p))}"><img src="img/${id}.jpg" width="${size[id].width}" height="${size[id].height}" alt="${esc(alt)}" loading="lazy"></a>`;

const footer = (n, href) => `
  <footer class="pie">
    <a class="pie-wa" href="${esc(href)}" target="_blank" rel="noopener">${ICON.whatsapp}<span><b>${esc(cfg.whatsappDisplay)}</b><small>${esc(t.contact)}</small></span></a>
    <span class="pie-tip"><i class="globito"></i>${esc(t.tip)}</span>
    <span class="pie-n">${n}</span>
  </footer>`;

const notice = `<p class="aviso"><i class="globito"></i><span><b>${esc(t.noticeTitle)}</b> ${esc(t.notice)}</span></p>`;

const coverPage = () => `
<section class="page portada" id="inicio">
  <div class="portada-top">
    <span class="rule"></span>
    <p class="portada-pre">${esc(t.catalog)}</p>
    <h1 class="portada-marca">${esc(cfg.brand)}</h1>
    <p class="portada-sub">${esc(cfg.subtitle || "")}</p>
  </div>
  ${photo(cfg.cover, productOf(cfg.cover), "portada-foto", cfg.brand)}
  <div class="portada-bottom">
    ${notice}
    <ul class="redes">
      <li><a href="${esc(waGeneral)}" target="_blank" rel="noopener">${ICON.whatsapp}<span>${esc(cfg.whatsappDisplay)}</span></a></li>
      ${socials.filter(s => s.type !== "link").map(s => socialItem(s, false)).join("\n      ")}
    </ul>
  </div>
</section>`;

const tocPage = () => `
<section class="page indice">
  <span class="rule"></span>
  <h2 class="indice-t">${t.toc}</h2>
  ${notice}
  ${plan.sections.map(s => `
  <div class="indice-grupo"><a href="#${s.divider ? s.id : esc(s.products[0].code.toLowerCase())}"><span>${esc(s.name)}</span><i></i><span>${esc(t.page)} ${s.divider ?? s.products[0].page}</span></a></div>
  <ol class="indice-lista">${s.products.map(p => `
    <li><a href="#${esc(p.code.toLowerCase())}"><span>${esc(p.name)}</span><i></i><span>${esc(t.page)} ${p.page}</span></a></li>`).join("")}</ol>`).join("")}
  ${footer(2, waGeneral)}
</section>`;

const dividerPage = s => `
<section class="page separador" id="${s.id}">
  <h2 class="sep-t">${esc(s.name)}</h2>
  ${photo(s.cover, productOf(s.cover), "sep-foto", s.name)}
  ${footer(s.divider, waGeneral)}
</section>`;

const productPage = (s, p) => {
  const [main, ...extra] = p.photos.slice(0, 3);
  return `
<section class="page producto extras-${extra.length}" id="${esc(p.code.toLowerCase())}">
  <header class="cab">
    <p class="cab-cat">${esc(s.name)}</p>
    <p class="cab-cod" aria-hidden="true">${esc(p.code)}</p>
  </header>
  <div class="producto-fotos">
    ${photo(main, p, "principal", `${p.name}, ${t.mainPhoto}`)}
    ${extra.length ? `<div class="extras">${extra.map((id, i) => photo(id, p, "extra", `${p.name}, ${t.photo} ${i + 2}`)).join("")}</div>` : ""}
  </div>
  <div class="ficha">
    <div>
      <h2 class="ficha-t">${esc(p.name)}</h2>
      ${p.description ? `<p class="ficha-d">${esc(p.description)}</p>` : ""}
    </div>
    <a class="ficha-cta" href="${esc(waProduct(p))}" target="_blank" rel="noopener">${esc(t.cta)}</a>
  </div>
  ${footer(p.page, waProduct(p))}
</section>`;
};

const backCoverPage = () => `
<section class="page contra">
  <div class="contra-in">
    <span class="rule"></span>
    <h2 class="contra-marca">${esc(cfg.brand)}</h2>
    <p class="contra-lema">${t.closing}</p>
    <a class="contra-wa" href="${esc(waGeneral)}" target="_blank" rel="noopener">${ICON.whatsapp}<span>WhatsApp<b>${esc(cfg.whatsappDisplay)}</b></span></a>
    <ul class="contra-datos">
      ${socials.map(s => socialItem(s, true)).join("\n      ")}
    </ul>
  </div>
  <p class="contra-n">${plan.backCover}</p>
</section>`;

const css = ["base.css", `theme-${cfg.theme || "graphite"}.css`].map(f => fs.readFileSync(path.join(ROOT, "styles", f), "utf8")).join("\n");
const html = `<!doctype html>
<html lang="${esc(cfg.lang || "es")}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t.catalog)} · ${esc(cfg.brand)}</title>
<style>
${fontFaces}
${css}
</style>
</head>
<body class="theme-${esc(cfg.theme || "graphite")}">
<main class="libro">
${coverPage()}
${tocPage()}
${plan.sections.map(s => (s.divider ? dividerPage(s) : "") + s.products.map(p => productPage(s, p)).join("\n")).join("\n")}
${backCoverPage()}
</main>
</body>
</html>`;

fs.writeFileSync(path.join(OUT, "catalog.html"), html);
// The PDF step checks every link in the PDF against this manifest.
fs.writeFileSync(path.join(OUT, "links.json"), JSON.stringify({
  general: waGeneral,
  products: products.map(p => ({ code: p.code, url: waProduct(p) })),
  socials: socials.map(s => s.url),
  pages: plan.total,
}, null, 2));
console.log(`Built dist/catalog.html: ${plan.total} pages, ${products.length} products in ${plan.sections.length} sections, ${used.size} images`);
