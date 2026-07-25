## Story: Show pipeline progress instead of a bare "Unknown" for features with no test data yet

**Short-track:** UX gap — a real live-usage finding (see `../decisions.md`), scoped as a copy/data fix, not a visual redesign.

## User Story

As **Hamish King (Founder/Operator)**,
I want **a feature that hasn't reached `/test-plan` yet to show something informative about its actual progress**,
So that **"? Unknown" / "No test data yet" — which reads as a broken or stalled feature — doesn't apply to every single brand-new feature by default**.

## Background / Investigation

`_renderEpicRow` and `_renderPvcItemRow` (`src/web-ui/routes/products.js:230-311`) render a health pill (`✓ Healthy` / `⚠ Warning` / `✕ Blocked` / `? Unknown`) and a separate coverage label (a real `N%` or the literal string `'No test data yet'`), following a4's own deliberate dual-indicator convention (never combined into one value/color). `health: 'unknown'` is the real, correct value whenever no test/DoD signal exists for a feature yet (`_renderProductView`, `products.js:615`: `healthBySlug.hasOwnProperty(item.slug) ? healthBySlug[item.slug] : 'unknown'`) — which is every feature before it reaches `/test-plan`, i.e. every brand-new feature. There's nothing wrong with the underlying data model; the presentation just gives the operator no way to distinguish "just started" from "actually stuck."

A batched, already-proven mechanism for surfacing real per-feature progress signal already exists: `s2.2`'s artefact-count enrichment (`products.js:31-46`, `_getArtefactCountsBulk` → `journey-store-pg.js`'s `getArtefactCountsForJourneys`, one `GROUP BY` query for the whole board render) is used today by the kanban board view (`kanban-view.js:44-47, 313-317`) to show a "`N` artefact(s)" / "no artefacts yet" badge on cards. The product detail page's feature rows don't use this enrichment at all today — `_renderProductView` never calls `_getArtefactCountsBulk`.

## Architecture Constraints

- **Only the `unknown`-health rendering changes.** `green`/`amber`/`red` health values (real signals from actual test/DoD data) keep their exact existing labels, colors, and rendering — this story does not touch the health computation itself (`healthBySlug`/`realHealth` in `_renderProductView`), only what's displayed when the value is `'unknown'`.
- **Reuse the existing artefact-count batching (`_getArtefactCountsBulk`), do not add a new per-row query.** `handleGetProductView` is already `async`; it can `await _getArtefactCountsBulk(journeyIds)` once, alongside its existing rollup fetch, and pass the resulting map into `_renderProductView` — following the exact same "one batched read per render, never N+1" pattern s2.2 already established for the kanban board.
- **Reuse s2.2's exact wording convention** (`'no artefacts yet'` / `'N artefact(s)'`, `kanban-view.js:46,316-317`) rather than inventing new copy for the same concept in a different view.
- **No visual redesign.** Same pill/label markup, same `var(--muted)` color already used for `unknown` — only the text content of the coverage label (and, where stage information helps, the health-pill area) changes for the `unknown` case.
- **Graceful degradation matching s2.2's own AC5 precedent:** if the bulk artefact-count read fails or the item has no `journeyId` (e.g. a taxonomy-only item with no journey), fall back to today's plain `'No test data yet'` text — never let this enrichment break the page render.

## Dependencies

- **Upstream:** fdn-s1 (same render functions — sequence after fdn-s1 to avoid re-touching the same markup twice); s2.2 (reuses its artefact-count batching).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a feature with `health: 'unknown'` and a resolvable `journeyId` with N > 0 artefacts, When its row renders (`_renderEpicRow` or `_renderPvcItemRow`), Then the coverage label reads `"<stage>  ·  N artefacts"` (or singular `"1 artefact"`) instead of `"No test data yet"` — reusing s2.2's exact pluralisation wording.

**AC2:** Given a feature with `health: 'unknown'` and a resolvable `journeyId` with 0 artefacts, When its row renders, Then the coverage label reads `"<stage>  ·  no artefacts yet"` — reusing s2.2's exact wording — rather than the bare `"No test data yet"`.

**AC3:** Given a feature with `health: 'unknown'` and no resolvable `journeyId` (e.g. a taxonomy-only item), When its row renders, Then the coverage label falls back to today's plain `"No test data yet"`, unchanged.

**AC4:** Given the artefact-count bulk read throws or `DATABASE_URL`/the PG adapter isn't configured, When the product detail page renders, Then the page still renders successfully with every `unknown`-health row falling back to today's plain `"No test data yet"` — matching s2.2's own AC5 failure-mode precedent, not a page-breaking error.

**AC5:** Given a feature with `health: 'green'`, `'amber'`, or `'red'` (a real signal), When its row renders, Then its health label, color, and coverage percentage are completely unchanged from current behaviour — this story's scope is strictly the `unknown` case.

**AC6:** Given the product detail page render, When artefact counts are fetched for `unknown`-health rows, Then exactly one batched call is made for the whole render (via `_getArtefactCountsBulk`), never one call per row.

## Out of Scope

- Any change to how `health` itself is computed (real green/amber/red signal logic).
- A visual/component redesign of the health pill or coverage label (colors, shape, iconography) — text content only.
- Applying this same enrichment to the kanban board view — s2.2 already covers that surface.

## NFRs

- **Performance:** Exactly one additional batched query per product-detail-page render (AC6) — no N+1 regression.
- **Reliability:** A failed or unavailable artefact-count read must degrade to today's existing text, never surface an error to the operator (AC4).
- **Accessibility:** No change to the existing text-label-always-present convention (a4's own accessibility rule — health is never colour-only).

## Complexity Rating

**Rating:** 1 — reuses an existing, already-tested batching mechanism (s2.2) end-to-end; the only new work is wiring it into a second call site and changing display text for one specific case.
**Scope stability:** Stable.
