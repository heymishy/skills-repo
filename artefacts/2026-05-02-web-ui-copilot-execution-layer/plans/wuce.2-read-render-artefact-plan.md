# Implementation Plan: wuce.2 — Read and render artefact from GitHub repository

**Story:** wuce.2
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-03

---

## File map

| File | Action | Purpose |
|------|--------|---------|
| `tests/fixtures/markdown/discovery-sample.md` | Create | Markdown fixture with headings, bold, table, list |
| `tests/fixtures/github/contents-api-not-found.json` | Create | GitHub Contents API 404 fixture |
| `tests/fixtures/github/contents-api-rate-limit.json` | Create | GitHub Contents API 403 rate-limit fixture |
| `tests/fixtures/github/contents-api-discovery-md.json` | Create | GitHub Contents API success fixture (base64-encoded discovery-sample.md) |
| `src/web-ui/adapters/artefact-fetcher.js` | Create | ADR-012 adapter — `fetchArtefact()`, `ArtefactNotFoundError`, `ArtefactFetchError` |
| `src/web-ui/utils/markdown-renderer.js` | Create | `renderArtefactToHTML()`, `extractMetadata()` with XSS sanitisation |
| `src/web-ui/routes/artefact.js` | Create | Route handler `handleArtefactRoute()` with `setLogger()` and `setFetcher()` |
| `src/web-ui/server.js` | Extend | Mount `/artefact/:slug/:type` route |
| `tests/check-wuce2-read-render-artefact.js` | Create | 18 AC verification tests |
| `package.json` | Extend | Add `node tests/check-wuce2-read-render-artefact.js` to test chain |
| `CHANGELOG.md` | Extend | Add wuce.2 entry under `### Added` |

---

## Task 1 — Create fixtures

### 1a. `tests/fixtures/markdown/discovery-sample.md`

Markdown with:
- `## Discovery: Example Feature` heading
- `**Status:** Approved`, `**Approved by:** Test Stakeholder`, `**Created:** 2026-01-15` bold fields
- `## Key Points` section with unordered list (required for T1.3 `<ul>/<li>` assertion)
- `## Constraints` section with a two-column table

### 1b. GitHub API fixtures

Three JSON files matching the test plan fixture spec.

### 1c. `contents-api-discovery-md.json`

Base64-encode `discovery-sample.md` and embed in `content` field.

---

## Task 2 — Artefact fetcher adapter

File: `src/web-ui/adapters/artefact-fetcher.js`

Exports: `fetchArtefact(featureSlug, artefactType, token)`, `ArtefactNotFoundError`, `ArtefactFetchError`

- Path: `artefacts/${featureSlug}/${artefactType}.md`
- URL: `${GITHUB_API_BASE_URL}/repos/${GITHUB_REPO}/contents/${path}`
- 404 → `ArtefactNotFoundError`
- 403 / non-2xx → `ArtefactFetchError` with GitHub error message as `cause`
- Network rejection → `ArtefactFetchError`
- Base64 decode: `Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8')`

---

## Task 3 — Markdown renderer

File: `src/web-ui/utils/markdown-renderer.js`

Exports: `renderArtefactToHTML(markdown, meta?)`, `extractMetadata(markdown)`

Renderer handles (without external deps):
- `#` → `<h1>` through `######` → `<h6>`
- `**bold**` → `<strong>bold</strong>`
- `- item` lists → `<ul><li>`
- Pipe tables → `<table><thead><th>/<tbody><td>`
- Paragraphs → `<p>`
- XSS sanitisation: strip `<script>...</script>` and `<iframe>...</iframe>` on input

Output structure:
- With meta: `<div class="metadata-bar">...</div>\n<article>...</article>`
- Without meta: `<article>...</article>`

`extractMetadata` uses regex to find `**Status:**`, `**Approved by:**`, `**Created:**` fields.

---

## Task 4 — Artefact route handler

File: `src/web-ui/routes/artefact.js`

Exports: `handleArtefactRoute(req, res, slug, artefactType)`, `setLogger(logger)`, `setFetcher(fn)`

Behaviour:
- No session → 302 to `/`
- Success → 200 `text/html` with rendered artefact
- `ArtefactNotFoundError` → 404 "artefact not found"
- `ArtefactFetchError` → 503 "Unable to load artefact" + `logger.warn` with technical detail
- Audit log: `logger.info('artefact_read', { userId, featureSlug, artefactType, timestamp })`

---

## Task 5 — Extend server.js

Add to `src/web-ui/server.js`:
- Import `handleArtefactRoute` from `./routes/artefact`
- Add `else if (pathname.match(/^\/artefact\/[^/]+\/[^/]+$/) && req.method === 'GET')` branch

---

## Task 6 — Test file

File: `tests/check-wuce2-read-render-artefact.js`

18 tests: T1.1–T1.3, T2.1–T2.2, T3.1–T3.2, T4.1–T4.3, T5.1–T5.2, IT1–IT3, NFR1–NFR3

Pattern matches wuce.1: Node.js built-ins only, custom `test()` / `assert()` runner, `global.fetch` mocking, `setFetcher()` / `setLogger()` injection.

---

## Commit sequence

1. `test(RED): fixtures + failing test stub for wuce.2`
2. `feat(GREEN): artefact-fetcher adapter (T1.1, T1.2, T3.1, T4.1, T4.2)`
3. `feat(GREEN): markdown-renderer (T1.3, T2.1, T2.2, T5.1, T5.2, NFR1, NFR2)`
4. `feat(GREEN): artefact route handler (T3.2, T4.3, IT1-IT3, NFR3)`
5. `feat(GREEN): mount artefact route in server.js`
6. `chore: add wuce.2 test to npm chain + CHANGELOG entry`
