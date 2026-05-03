# Contract: Feature artefact index HTML view

**Story:** wuce.20
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-03

---

## Components built by this story

- Content-type negotiation added to `handleGetFeatureArtefacts()` in `src/web-ui/routes/features.js`
  - `Accept: text/html` → `renderShell` wrapping artefact index HTML
  - `Accept: application/json` or absent → JSON response unchanged
- `src/web-ui/utils/artefact-labels.js` — new module; exports `getLabel(type)` with static type mapping:
  - `dor` → "Ready Check", `benefit-metric` → "Benefit Metric", `test-plan` → "Test Plan", `discovery` → "Discovery"
  - Unknown types return a non-empty fallback string (not throw)
- Artefact list HTML: items rendered with plain-language label, path, and date
- Zero artefacts → empty-state message, no empty `<ul>`
- Audit log: `{ userId, route: '/features/:slug', featureSlug, timestamp }`

## Components NOT built by this story

- Any change to `listArtefacts` adapter behaviour or JSON response shape
- Feature list handler (wuce.19 scope)
- Any create, edit, or delete artefact capability
- Full-text search or version history
- Any change to `src/web-ui/utils/html-shell.js`

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | HTML response contains renderShell wrapper and artefact entries | T1: Accept text/html → 200 HTML, T2: <html> tag present, T3: artefact path in body, T13: Content-Type text/html, T14: artefact date visible |
| AC2 | Artefact type shows plain-language label via getLabel() | T8: "dor" → "Ready Check" in HTML, T9: "discovery" → "Discovery" in HTML |
| AC3 | Each artefact shows label, path, date, link | T4: label visible, T5: path visible, T6: date visible, T7: link to artefact, T15: link href correct, T16: unknown type shows fallback not error |
| AC4 | Zero artefacts → empty state, no empty list | T10: no artefacts → message present |
| AC5 | Accept application/json → JSON response unchanged | T11: JSON shape unchanged |
| AC6 | Unauthenticated → 302 | T12: no session → 302 |

## Assumptions

- `listArtefacts(featureSlug, token)` adapter already exists — not created here
- `renderShell` and `escHtml` exist from wuce.18 — imported, not created here
- `renderArtefactItem(artefact)` exists — used as-is; `getLabel()` from artefact-labels.js feeds into it

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/web-ui/routes/features.js` | Extend | Add content-type negotiation to handleGetFeatureArtefacts() |
| `src/web-ui/utils/artefact-labels.js` | Create | getLabel(type) export |
| `tests/check-wuce20-artefact-index-html.js` | Create | 17 tests |

## Out of scope — files that MUST NOT be touched

- `src/web-ui/utils/html-shell.js`
- `src/web-ui/routes/features.js` GET /features handler (wuce.19 scope)
- Any adapter under `src/web-ui/adapters/` or `src/adapters/`
- Any test file other than `tests/check-wuce20-artefact-index-html.js`
- Any file under `artefacts/`

## Contract review

**APPROVED** — all components are within story scope, AC → test mapping is complete, no scope boundary violations identified.
