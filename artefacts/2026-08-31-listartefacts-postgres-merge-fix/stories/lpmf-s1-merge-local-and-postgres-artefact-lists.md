## Story: Merge local-disk and Postgres artefact lists instead of local-wins-if-nonempty

**Epic reference:** None — short-track (no epic; single bounded story)
**Discovery reference:** None — short-track (no discovery artefact by design)
**Benefit-metric reference:** None — short-track
**Domain:** [web-ui]

## User Story

As an **operator viewing a feature's artefact list on /features/:slug**,
I want to **see every artefact that has actually been produced for that feature, whether it landed on the local checkout or only in Postgres**,
So that **the artefact count and list are trustworthy after a redeploy or a partial local checkout, instead of silently hiding real, durably-saved artefacts.**

## Bug found (live, via web UI dogfooding)

Live on `/features/new-feature-af17f555`, the artefact list showed 3 artefacts, while `completedStages` (the durable source of truth) recorded 8. Root-caused in `src/web-ui/adapters/artefact-list.js`'s `listArtefacts` (lines 81-105): when a `repoRoot` is supplied, `listLocalArtefacts` is checked first, and if it returns **any** non-empty result, that result is returned immediately — `pgArtefactRows` (the Postgres-backed, durably-saved artefact rows) is never consulted, even when the local checkout is a stale or partial subset of what has actually been produced. This is a real gap, not a duplicate of the already-shipped `alrf-s4` fix: `alrf-s4`'s own test suite (`tests/check-alrf-s4-postgres-artefact-fallback.js`, AC2/AC3) deliberately confirms and pins "local wins when local is non-empty" and "Postgres is checked when local is empty" as intended behavior — but neither AC covers the case this bug report hits: local is non-empty **and** incomplete relative to Postgres (some artefacts present locally, others only in Postgres). `alrf-s4`'s binary local-vs-Postgres choice cannot represent that case correctly; the fix is to merge both sources by artefact path, not to pick one source wholesale.

## Architecture Constraints

- Edit `src/web-ui/adapters/artefact-list.js`'s `listArtefacts` only. Do not change `listLocalArtefacts`, `deriveTypeFromPath`, or the GitHub-API fallback path (only reached when neither local nor Postgres has anything, and is out of scope here).
- Merge strategy: union of local items and `pgArtefactRows`, deduplicated by artefact path (the relative `path` value used to build `viewUrl`). When the same path exists in both sources, the local item wins (preserves `alrf-s4` AC2's existing guarantee that fresh local content is never shadowed by potentially-stale Postgres content for a path both sources have).
- Must not regress any existing `alrf-s4` AC — `tests/check-alrf-s4-postgres-artefact-fallback.js` must still pass unmodified (AC2's single-path scenario has only one path in both sources, so a dedupe-preferring-local merge produces the same single-item result AC2 already asserts).
- Must not change the function signature or any caller (`src/web-ui/routes/features.js`'s `handleGetFeatureArtefacts`) — this is an internal behavior fix only.

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given local disk has 3 artefacts for a feature and `pgArtefactRows` has 8 artefacts for the same feature (including those same 3 paths plus 5 more), When `listArtefacts` is called with both, Then the returned `artefacts` array contains all 8 distinct paths, not just the 3 local ones.

**AC2:** Given the same scenario as AC1, When a path exists in both local and Postgres results, Then the returned artefact for that path uses the local item's fields (not the Postgres row's), preserving existing `alrf-s4` AC2 behavior for any path present in both.

**AC3:** Given local disk has 0 artefacts (empty existing dir) and Postgres has 2, When `listArtefacts` is called, Then all 2 Postgres artefacts are returned (unchanged from current `alrf-s4` AC3 behavior — this is a regression check, not new behavior).

**AC4:** Given local disk has 2 artefacts and `pgArtefactRows` is empty or undefined, When `listArtefacts` is called, Then exactly those 2 local artefacts are returned (unchanged from current behavior — regression check).

**AC5:** Given the merge produces a combined list, When `groupArtefactsByStage` is called on it (as the function already does), Then grouping behaves identically to today for any single-source case, and correctly groups the merged multi-source case with no path appearing in two different stage groups.

## Out of Scope

- The GitHub-API fallback path (reached only when both local and Postgres are empty) — untouched.
- Any change to how `pgArtefactRows` is fetched by the caller (`handleGetFeatureArtefacts` in `routes/features.js`) — untouched.
- Sorting/ordering of the merged list beyond whatever `Array.prototype` concat naturally produces — not specified by any AC, no test asserts a specific order.

## NFRs

- **Performance:** Not applicable — in-memory array merge over small lists (single feature's artefacts, typically <50 items).
- **Security:** Not applicable — no new external input surface.
- **Accessibility:** Not applicable.
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description) — short-track, N/A
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic — short-track, operator confirmed directly in-session (operator asked to tackle this and 2 other findings blocking continued dogfooding)
