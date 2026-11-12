# Implementation Plan: Web UI rendering of incident records

**Story reference:** artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s3-web-ui-rendering.md
**Test plan reference:** artefacts/2026-11-08-incident-triage-and-respond/test-plans/itar-s3-web-ui-rendering-test-plan.md
**DoR reference:** artefacts/2026-11-08-incident-triage-and-respond/dor/itar-s3-web-ui-rendering-dor.md

---

## File map

| File | Change |
|------|--------|
| `src/web-ui/routes/products.js` | Add `_parseIncidentRecords`, `_renderIncidentItem`, `_renderIncidentsSection`, `_fetchIncidentRecords`; add trailing optional `incidents` param to `_renderProductView` and `_renderConsolidatedFeaturesSection`; fetch in `handleGetProductView` (HTML branch only) |
| `tests/check-itar-s3-web-ui-rendering.js` (new) | Unit + integration + NFR + wiring tests, driven through the real `handleGetProductView` and the real `realFetchRepoPath` against a stubbed `global.fetch` |

No new adapter is introduced (`fetchRepoPath` is already wired in `server.js`), so there is no new wiring task. `server.js` is unchanged; a wiring test asserts the existing `GET /products/:id` registration and `setFetchRepoPath(realFetchRepoPath)`.

---

## Task 1 — Failing tests (RED)

Write the test file first; confirm RED.

## Task 2 — Pure helpers

- `_parseIncidentRecords(raw)`: JSON-parse a string; non-array, bad JSON, empty and null all yield `[]`. Keep only records whose `type` is `'incident'`, treating a missing `type` as `'incident'` (the file is mixed-type: `workspace/incidents.json` holds `deferred-item` records, which belong to ddft-s5 and are never rendered here). Sorted newest first by `createdAt`.
- `_renderIncidentItem(record)`: one `<li data-incident-item>` showing id, a text status label ("Status: open", MC-A11Y-02), trigger, summary, tags and, when present, the triage summary inline in the same block (`data-incident-triage`). Every string passes through `_escapeHtml` (same escaping as `html-shell.js`'s `escHtml`; this file already uses it everywhere). Only `DESIGN.md` tokens (`var(--line)`, `var(--surface)`, `var(--muted)`, `var(--ink)`, `var(--warn)`); no hex colours.
- `_renderIncidentsSection(incidents)`: returns `''` for zero incidents (zero items, normal page), else a headed `<section>`.

## Task 3 — Thread into `_renderConsolidatedFeaturesSection`

Add `incidents` as a trailing 8th optional parameter. Prepend `_renderIncidentsSection(incidents)` to both the early-return "No features yet" branch and the main return. Add `incidents` as the trailing 20th parameter of `_renderProductView` and pass it through (appended last so the 18+ existing positional callers are unaffected).

## Task 4 — Fetch in the real handler

`handleGetProductView`, HTML branch only: if the product has `repo_owner`, `repo_name` and `req.session.accessToken`, call `_artefactFetcher.fetchRepoPath(owner, repo, 'workspace/incidents.json', token)` inside try/catch, raced against a 3 second timer (the `fetchRepoPath` wrapper accepts only 4 arguments, so its own timeout cannot be passed through). `ArtefactNotFoundError`, any other error, empty or null all degrade to `[]` (silent fallback, three paths tested). The 3 second race bounds the added page latency (NFR: fetch latency is `[UNKNOWN BASELINE]`; this bounds the worst case, it does not measure the typical case).

## Task 5 — Verify

Run the story test, `node scripts/check-design-tokens.js`, then the full suite.
