// Renders dist/catalog.html to dist/catalog.pdf with a Chromium browser, then verifies the result:
// every image loaded and is a WhatsApp link, no page overflows, and every link in the PDF
// is one we generated (none missing, none unexpected).
// Usage: node src/pdf.mjs [--screenshots]   (set BROWSER_PATH to use a specific Chrome/Edge binary)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const DOCS = path.join(ROOT, "docs");

const CANDIDATES = [
  process.env.BROWSER_PATH,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);
const executablePath = CANDIDATES.find(p => fs.existsSync(p));
if (!executablePath) {
  console.error("No Chrome/Edge/Chromium found. Set BROWSER_PATH to your browser executable.");
  process.exit(1);
}

const links = JSON.parse(fs.readFileSync(path.join(DIST, "links.json"), "utf8"));
const expected = new Set([links.general, ...links.products.map(p => p.url), ...links.socials]);

const browser = await puppeteer.launch({ executablePath, args: ["--allow-file-access-from-files"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 1200 });
  await page.goto(pathToFileURL(path.join(DIST, "catalog.html")).href, { waitUntil: "networkidle0" });
  await page.evaluate(async () => {
    document.querySelectorAll("img").forEach(i => (i.loading = "eager"));
    await document.fonts.ready;
    await Promise.all([...document.images].map(i => (i.complete ? 0 : new Promise(r => (i.onload = i.onerror = r)))));
  });

  const html = await page.evaluate(() => ({
    pages: document.querySelectorAll(".page").length,
    broken: [...document.images].filter(i => !i.naturalWidth).map(i => i.src),
    unlinked: [...document.images].filter(i => !i.closest('a[href^="https://api.whatsapp.com/send"]')).length,
    overflow: [...document.querySelectorAll(".page")].map((p, i) => (p.scrollHeight > p.clientHeight + 2 ? i + 1 : 0)).filter(Boolean),
  }));

  const pdfPath = path.join(DIST, "catalog.pdf");
  await page.emulateMediaType("print");
  await page.pdf({ path: pdfPath, preferCSSPageSize: true, printBackground: true });

  const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(pdfPath)), verbosity: 0 }).promise;
  const found = new Set();
  const unexpected = [];
  let internal = 0;
  for (let n = 1; n <= doc.numPages; n++) {
    for (const a of await (await doc.getPage(n)).getAnnotations()) {
      if (a.subtype !== "Link") continue;
      const url = a.url || a.unsafeUrl;
      if (!url) { internal++; continue; }
      found.add(url);
      if (!expected.has(url)) unexpected.push(url);
    }
  }
  const missing = [...expected].filter(u => !found.has(u));

  const problems = [];
  if (doc.numPages !== links.pages) problems.push(`PDF has ${doc.numPages} pages, expected ${links.pages}`);
  if (html.broken.length) problems.push(`broken images: ${html.broken.join(", ")}`);
  if (html.unlinked) problems.push(`${html.unlinked} images without a WhatsApp link`);
  if (html.overflow.length) problems.push(`content overflows on pages ${html.overflow.join(", ")}`);
  if (missing.length) problems.push(`links missing from PDF: ${missing.join(", ")}`);
  if (unexpected.length) problems.push(`unexpected links in PDF: ${unexpected.join(", ")}`);

  console.log(`dist/catalog.pdf: ${doc.numPages} pages, ${(fs.statSync(pdfPath).size / 1e6).toFixed(1)} MB, ${found.size} external links, ${internal} internal links`);

  if (process.argv.includes("--screenshots")) {
    fs.mkdirSync(DOCS, { recursive: true });
    await page.emulateMediaType("screen");
    await page.setViewport({ width: 900, height: 1200, deviceScaleFactor: 0.7 });
    const pages = await page.$$(".page");
    for (const [i, el] of pages.entries())
      await el.screenshot({ path: path.join(DOCS, `page-${String(i + 1).padStart(2, "0")}.jpg`), type: "jpeg", quality: 72 });
    console.log(`Saved ${pages.length} page screenshots to docs/`);
  }

  if (problems.length) {
    console.error("Verification FAILED:\n  - " + problems.join("\n  - "));
    process.exitCode = 1;
  } else {
    console.log("Verification passed: all images load and link to WhatsApp, no overflow, links match exactly.");
  }
} finally {
  await browser.close();
}
