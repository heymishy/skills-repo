# Contract Proposal — Session-origin indicator on the org kanban board

**What will be built:**
- A new `_enrichColumnsWithSessionOrigin(columns)` function in `src/web-ui/routes/products.js`, mirroring `_enrichColumnsWithArtefactCounts`'s exact shape: gather journeyIds from `columns`, call sob-s1's `_getSessionOriginBulk` once, attach the resulting state to each card, mutate and return `columns`.
- A call to `_enrichColumnsWithSessionOrigin(columns)` in `handleGetOrgKanban`, alongside the existing `_enrichColumnsWithArtefactCounts(columns)` call.
- Render the indicator on each kanban card via `kanban-view.js`, using the same markup sob-s1/sob-s2 already established.

**What will NOT be built:**
- A second, independently-implemented bulk-lookup function — reuses sob-s1's `_getSessionOriginBulk` exactly.
- Any taxonomy merge for org kanban (would make "no session" reachable here — explicitly out of scope, see `decisions.md`/`design.md`).

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration test: fully session-backed card fixture renders the indicator | integration |
| AC2 | Integration test: mixed card fixture renders the indicator | integration |
| AC3 | Integration test: `setGetSessionOriginBulk` spy (sob-s1's own seam) is called via `_enrichColumnsWithSessionOrigin` | integration |
| AC4 | Integration test: spy throws, board still renders 200 with no indicators | integration |
| AC5 | Source-level test: `handleGetOrgKanban`'s function body contains no taxonomy-merge call | integration (source assertion) |

**Assumptions:**
- `buildOrgKanbanColumns`'s existing column/card shape carries each card's `journey_id` already (confirmed from `handleGetOrgKanban`'s real query during `/design`) — no new field needs to be threaded through the column builder itself, only consumed by the new enrichment step.

**Estimated touch points:**
Files: `src/web-ui/routes/products.js` (`_enrichColumnsWithSessionOrigin`, `handleGetOrgKanban` call site), `src/web-ui/views/kanban-view.js` (render the indicator on cards), `tests/check-sob-s3-org-kanban-integration.js` (new), `scripts/run-all-tests.js` (register the new test file).
Services: None new — reuses sob-s1's Postgres-backed bulk seam.
APIs: None new.

**Dependencies / schemaDepends:**
Upstream: sob-s1 must be DoD-complete (reuses its `_getSessionOriginBulk`/`setGetSessionOriginBulk` seam and `deriveSessionOrigin`).
`schemaDepends: []` — code dependency, not a `pipeline-state.json` field dependency.
