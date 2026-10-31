# Roadmap

Where the generator is going: from a repository you clone into a tool any seller who takes orders on WhatsApp can run with one command. Each item is tracked as an issue; estimates are rough.

| # | Item | Type | Estimate |
|---|---|---|---|
| [#1](https://github.com/cuajada69/whatsapp-catalog-generator/issues/1) | CLI with `init` / `build` / `pdf`, published to npm | feature | ~5 h |
| [#2](https://github.com/cuajada69/whatsapp-catalog-generator/issues/2) | JSON Schema for `catalog.json` (editor autocomplete, clearer errors) | feature | ~2 h |
| [#3](https://github.com/cuajada69/whatsapp-catalog-generator/issues/3) | Three new themes and a `theme` option | feature | ~5 h |
| [#4](https://github.com/cuajada69/whatsapp-catalog-generator/issues/4) | Optional prices with currency formatting, sold-out badge | feature | ~2 h |
| [#5](https://github.com/cuajada69/whatsapp-catalog-generator/issues/5) | QR code to WhatsApp on cover and back cover | feature | ~1.5 h |
| [#6](https://github.com/cuajada69/whatsapp-catalog-generator/issues/6) | Accept PNG and WebP photos, report optimization | feature | ~2 h |
| [#7](https://github.com/cuajada69/whatsapp-catalog-generator/issues/7) | Import products from CSV | feature | ~3 h |
| [#8](https://github.com/cuajada69/whatsapp-catalog-generator/issues/8) | Live preview while editing | feature | ~2 h |
| [#9](https://github.com/cuajada69/whatsapp-catalog-generator/issues/9) | Export the catalog as a static website | feature | ~3 h |
| [#10](https://github.com/cuajada69/whatsapp-catalog-generator/issues/10) | Integration test for PDF link verification | test | ~2 h |
| [#11](https://github.com/cuajada69/whatsapp-catalog-generator/issues/11) | Spanish README, non-developer guide, examples for other businesses | docs | ~2 h |

**Total: about 30 hours.**

## Suggested order

1. **Foundation**: #10 (integration test) and #2 (schema), so later changes are safe.
2. **Usable by anyone**: #1 (CLI on npm) and #11 (docs for non-developers).
3. **More catalogs**: #3, #4, #5, #6, #7.
4. **Beyond PDF**: #8 and #9.

## Out of scope

- Hosting or a web editor: the tool stays local and free to run.
- Storing customer data: the catalog only contains the seller's own products.
