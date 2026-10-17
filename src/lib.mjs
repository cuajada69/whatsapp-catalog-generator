// Pure helpers: no file system or browser access, so they can be unit tested.

export const escapeHtml = s =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// api.whatsapp.com/send works on desktop, Android and iOS PDF viewers;
// wa.me and whatsapp:// links failed in some of them during real-client testing.
export function whatsappLink(phone, text) {
  if (!/^\d{8,15}$/.test(phone)) throw new Error(`Invalid WhatsApp number "${phone}": use digits only, with country code`);
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
}

export const fill = (template, product) => template.replace(/\{(\w+)\}/g, (m, key) => product[key] ?? m);

export const slug = s =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Returns a list of human-readable problems; an empty list means the config is usable. */
export function validateConfig(cfg, photoExists = () => true) {
  const errors = [];
  for (const key of ["brand", "whatsapp", "whatsappDisplay", "message", "cover", "sections"])
    if (cfg[key] == null) errors.push(`Missing "${key}"`);
  if (errors.length) return errors;
  if (!/^\d{8,15}$/.test(cfg.whatsapp)) errors.push(`"whatsapp" must be digits only with country code, got "${cfg.whatsapp}"`);
  if (!Array.isArray(cfg.sections) || !cfg.sections.length) errors.push(`"sections" must be a non-empty array`);
  const codes = new Set();
  const checkPhoto = (id, where) => { if (!photoExists(id)) errors.push(`${where}: photo "${id}" not found`); };
  checkPhoto(cfg.cover, "cover");
  for (const [i, sec] of (cfg.sections || []).entries()) {
    if (!sec.name) errors.push(`sections[${i}]: missing "name"`);
    if (sec.cover) checkPhoto(sec.cover, `section "${sec.name}"`);
    for (const p of sec.products || []) {
      if (!p.code || !p.name) errors.push(`section "${sec.name}": every product needs "code" and "name"`);
      if (codes.has(p.code)) errors.push(`duplicate product code "${p.code}"`);
      codes.add(p.code);
      if (!p.photos?.length) errors.push(`product "${p.code}": no photos`);
      for (const id of p.photos || []) checkPhoto(id, `product "${p.code}"`);
    }
  }
  return errors;
}

/**
 * Assigns page numbers. Layout: cover, table of contents, then for each section
 * an optional divider page followed by one page per product, and a back cover.
 * Products with fewer than `minPhotos` photos are skipped (a client rule: no lonely photos).
 */
export function planPages(cfg) {
  const minPhotos = cfg.minPhotos ?? 1;
  let page = 3;
  const sections = [];
  for (const sec of cfg.sections) {
    const products = sec.products.filter(p => p.photos.length >= minPhotos);
    if (!products.length) continue;
    const divider = sec.cover ? page++ : null;
    sections.push({ ...sec, id: slug(sec.name), divider, products: products.map(p => ({ ...p, page: page++ })) });
  }
  return { sections, backCover: page, total: page };
}
