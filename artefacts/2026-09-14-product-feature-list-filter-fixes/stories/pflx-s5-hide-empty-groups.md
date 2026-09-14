## Story: Hide a module/phase group entirely once its current filter leaves it with zero visible items

**Epic reference:** None — short-track (bounded UX follow-up to already-shipped work, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery; scope stated directly below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **the operator with "Active only" checked on a product's feature list**,
I want **a group whose every item is now filtered out to disappear entirely, not just show a `(0)` count I still have to scroll past**,
So that **the list actually gets visibly shorter, instead of leaving a long wall of empty, unexpandable group headers behind**.

## Benefit Linkage

**Metric moved:** None formal — UX follow-up, per this story's own short-track Benefit Linkage convention.
**How:** Directly closes the gap the operator reported immediately after live-verifying `pflx-s4` in production: "all of the features even with 0... the names of the containers are displayed and then there's nothing to expand — they should be hidden if [they] have 0 items." `pflx-s3`'s own story explicitly scoped this out ("Auto-hiding or auto-removing a group that filters down to zero visible items" — Out of Scope) so the count itself would be honest without a larger, riskier change — this story is the deliberate, agreed follow-up now that the count is proven correct (`pflx-s4`) and the operator has confirmed the remaining gap live.

## Architecture Constraints

- **Builds directly on `pflx-s3`'s own `pvcSyncGroupCounts()`** — that function already computes each group's real, currently-visible item count on every `pvcApplyFilters()` call. This story adds one more step: toggle the entire `.a4-module-section` (header + body together, not just the body) hidden when that count is `0`, visible otherwise.
- **Hide the whole section, not just the body.** Hiding only `.a4-module-body` (as `pflx-s1`'s collapse mechanism does) would still leave the header row (name, `(0)`, health glyph, expand arrow) visible with nothing useful behind it — exactly the operator's complaint. The fix must hide `.a4-module-section` itself.
- **When every group in the currently-active tab is hidden this way** (e.g. "Active only" is checked and every single feature happens to be complete), show a clear, honest empty-state message — reusing this codebase's existing "No features yet." convention (`_renderConsolidatedFeaturesSection`'s own zero-items fallback) rather than leaving a silently blank page.
- **Applies independently per tab**, mirroring `pflx-s1`'s and `pflx-s3`'s own precedent — "By Module" and "By Phase" each render their own separate copies of the same groups.
- **Do not change `pvcSyncGroupCounts()`'s own count computation** — this story only adds a visibility toggle driven by the count it already produces.
- **Do not touch the "All" tab** — it has no group/section concept at all (a flat list of items), so this story has nothing to add there.

## Dependencies

- **Upstream:** `pflx-s1` (group collapse/expand), `pflx-s2` (active-only default), `pflx-s3` (`pvcSyncGroupCounts()`, whose live count this story reads) — all already merged and live in production.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given a group's currently-visible item count (as computed by `pvcSyncGroupCounts()`) is `0`, When `pvcApplyFilters()` runs, Then the group's entire `.a4-module-section` (header and body together) is hidden.

**AC2:** Given a hidden (zero-count) group's count becomes greater than `0` again (e.g. the operator unchecks "Active only" or clears a search), When `pvcApplyFilters()` runs, Then the group's section becomes visible again.

**AC3:** Given every group in the currently-active tab has a zero count under the current filter, When `pvcApplyFilters()` runs, Then a clear "No active features match" empty-state message is shown in that tab, not a silently blank area.

**AC4:** Given the "By Module" and "By Phase" tabs each render their own separate copies of the same underlying groups, When filters change, Then each tab's own empty-group hiding (and empty-state message) applies independently and correctly.

**AC5 (regression guard):** A group with at least one visible item is never hidden, and its `pflx-s3`-computed count badge is unaffected by this story's own change.

## Out of Scope

- The "All" tab (no group/section concept).
- Any change to `pvcSyncGroupCounts()`'s own count computation.
- Persisting which groups were hidden across page reloads.
- Auto-hiding a group for any reason other than a zero currently-visible-item count (e.g. this story does not add a way to manually dismiss a non-empty group).

## NFRs

- **Performance:** the hide/show toggle piggybacks on the count already computed by `pvcSyncGroupCounts()` — no new computation, one additional attribute/class write per group per existing `pvcApplyFilters()` call.
- **Security:** None — pure client-side DOM state, no new data or input surface.
- **Accessibility:** a hidden section is removed from the accessibility tree (`hidden` attribute, not just visual `display:none` styling alone) so screen-reader users don't tab into empty, non-interactive group headers either.

## Complexity Rating

**Rating:** 1 — small, mechanical, directly reuses an already-correct, already-tested count computation from `pflx-s3`.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic
