# Contributing

Thanks for your interest! Bug reports, ideas and pull requests are welcome.

## Setup

Requires Node.js 22+ and Chrome, Edge or Chromium (set `BROWSER_PATH` if it is not auto-detected).

```bash
npm install
npm test           # unit tests (node:test)
npm run catalog    # builds the sample catalog and verifies the PDF
```

## Pull requests

- Keep changes focused: one feature or fix per pull request.
- Add or update tests in `test/` for logic in `src/lib.mjs`.
- Run `npm test` and `npm run catalog` before opening the pull request; CI runs both.
- Use made-up sample data only: never commit real phone numbers, customer data or photos you do not have the rights to.

## Ideas and planned work

See [ROADMAP.md](ROADMAP.md) and the open issues.
