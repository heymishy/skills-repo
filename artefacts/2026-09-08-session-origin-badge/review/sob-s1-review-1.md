# Review Report: Shared session-origin derivation + product feature-list indicator — Run 1

**Story reference:** artefacts/2026-09-08-session-origin-badge/stories/sob-s1-shared-derivation-and-product-list-indicator.md
**Date:** 2026-09-08
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Architecture compliance — The story's Architecture Constraints describe reusing the "Bulk per-board-render lookup seam" pattern but do not specify *which* array of items the bulk call's `journeyIds` argument is built from. `handleGetProductView` has two candidate arrays in scope: the raw `rows` (journeys-table-only, every entry guaranteed a `journey_id`, the same array the existing `_getArtefactCountsBulk(rows.map(j => j.journey_id))` call already uses) and `mergedItems` (taxonomy+journey merged via `mergeFeatureSources`, where taxonomy-only entries have no `journeyId` at all — verified directly against `product-rollup.js`). AC4 requires classifying taxonomy-only items as "no session", which is only reachable if the derivation runs over `mergedItems`, not `rows` — but nothing in the story states this explicitly, so an implementer could plausibly reuse the existing `rows`-based call site by pattern-matching on `_getArtefactCountsBulk` and silently fail AC4.
  Risk if proceeding: An implementer copies the existing `_getArtefactCountsBulk(rows.map(...))` call shape exactly (the most obvious precedent in the file) and never builds a bulk-ID list from `mergedItems`, so AC4 (taxonomy-only → "no session") fails at test time or, worse, is never actually exercised because the wrong array was queried.
  To acknowledge: run /decisions, category RISK-ACCEPT — or add one line to Architecture Constraints: "the bulk call's ID list must be built from `mergedItems.filter(item => item.journeyId).map(item => item.journeyId)`, not the raw `rows` array `_getArtefactCountsBulk` uses."

---

## LOW findings — note for retrospective

- **[1-L1]** AC quality — AC6, AC7, and AC9 each name a specific internal function (`_getSessionOriginBulk`, `deriveSessionOrigin`) rather than describing purely externally observable behaviour. This is technically implementation-coupled per Category C's "describes observable behaviour, not implementation" check, though it is consistent with this repo's own established precedent for NFR-type ACs on identical bulk-lookup seams (`_getArtefactCountsBulk`'s own call-count assertions) and AC9 is deliberately a direct unit test of a new function's own contract, which requires naming it. Not blocking; noted for consistency awareness only.

---

## Summary

0 HIGH, 1 MEDIUM, 1 LOW.
**Outcome:** PASS
