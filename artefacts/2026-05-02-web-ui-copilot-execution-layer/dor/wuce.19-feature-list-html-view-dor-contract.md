# Contract: Feature list HTML view

**Story:** wuce.19
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-03

---

## Components built by this story

- Content-type negotiation added to `handleGetFeatures()` in `src/web-ui/routes/features.js`
  - `Accept: text/html` → `renderShell` wrapping feature list HTML
  - `Accept: application/json` or absent → JSON response unchanged
- Feature list HTML: `<ul>` of features with slug, stage, last-updated date, and link to artefact index
- Empty state: zero features → message displayed, no empty `<ul>`
- Audit log entry on each `/features` HTML request: `{ userId, route: '/features', timestamp }`

## Components NOT built by this story

- Any new route handler — only content-type negotiation added to the existing handler
- Any create, edit, or delete feature capability
- Sorting, filtering, or search across features
- Changes to the JSON response shape returned by `GET /features`
- Any change to `src/web-ui/utils/html-shell.js` (that is wuce.18 scope)

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | HTML response contains renderShell wrapper and feature slugs | T1: Accept text/html → 200 HTML, T2: <html> tag present, T3: feature slug in body, T13: Content-Type text/html |
| AC2 | Each feature shows slug, stage, date, link to artefact index | T4: slug visible, T5: pipeline stage visible, T6: last-updated date visible, T7: link to /features/:slug |
| AC3 | Zero features → empty-state message, no empty list | T8: empty response → message present, T9: no empty <ul> element |
| AC4 | Accept application/json → JSON response unchanged | T10: JSON shape unchanged, T11: no HTML in JSON response |
| AC5 | Unauthenticated → 302 redirect | T12: no session cookie → 302 |

## Assumptions

- `listFeatures(token)` adapter already exists from wuce.6 — this story does not create it
- `renderShell` and `escHtml` exist from wuce.18 — imported, not created here

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/web-ui/routes/features.js` | Extend | Add content-type negotiation to handleGetFeatures() |
| `tests/check-wuce19-feature-list-html.js` | Create | 16 tests |

## Out of scope — files that MUST NOT be touched

- `src/web-ui/utils/html-shell.js`
- `src/web-ui/routes/features.js` GET /:slug handler (that is wuce.20 scope)
- Any test file other than `tests/check-wuce19-feature-list-html.js`
- Any file under `artefacts/`

## Contract review

**APPROVED** — all components are within story scope, AC → test mapping is complete, no scope boundary violations identified.
