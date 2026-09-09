# Definition of Done: Session-origin indicator on the org kanban board

**PR:** https://github.com/heymishy/skills-repo/pull/850 | **Merged:** 2026-09-09 (merge commit `4908e1cb`)
**Story:** artefacts/2026-09-08-session-origin-badge/stories/sob-s3-org-kanban-indicator.md
**Test plan:** artefacts/2026-09-08-session-origin-badge/test-plans/sob-s3-test-plan.md
**DoR artefact:** artefacts/2026-09-08-session-origin-badge/dor/sob-s3-dor.md
**Assessed by:** Claude Sonnet 5 (orchestrating session, all findings independently verified against real git/gh state)
**Date:** 2026-09-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `fully session-backed and mixed cards each get the correct tri-state value` (data) + `renderKanban outputs data-sob-session-origin for a card carrying sessionOrigin` (render-level) | automated unit + integration test (`check-sob-s3-org-kanban-integration.js`) | None |
| AC2 | ✅ | Same data-derivation test (mixed branch) + `renderKanban outputs data-sob-session-origin for a card carrying the "mixed" tri-state` (render-level, added during the mandatory final-review pass — the original Task 3 coverage only reached AC1 at render level) | automated unit + integration test | None |
| AC3 | ✅ | `_enrichColumnsWithSessionOrigin is the only path org kanban uses to populate sessionOrigin` (call-count assertion) | automated integration test | None |
| AC4 | ✅ | `board render survives a thrown bulk read, cards simply have no sessionOrigin` | automated integration test | None |
| AC5 | ✅ | `handleGetOrgKanban source contains no taxonomy-merge/mergeFeatureSources reference` | automated source-inspection test | None |

**Confirmed in CI, not just locally:** PR #850's CI initially never dispatched (0 check-runs — same root cause as sob-s2: a real merge conflict with `master`, this repo's own documented "epic-nested story state bookkeeping" gotcha, from `sob-s3`'s own subagent-execution checkpoints diverging from master's later state after PR #849 merged). Resolved by merging `master` into `feature/sob-s3` and pushing — after which all 8 required checks ran and passed (Lint/typecheck/test/build, Assurance gate, Watermark gate, Cross-tenant isolation repeat gate, Playwright E2E smoke, Scenario A/B staging E2E, Trace validation), and `mergeStateStatus` showed `CLEAN` before merge.

---

## Scope Deviations

None against the story's own ACs. Three deviations from the original *implementation plan*, all logged in `decisions.md` at the time they occurred:

1. **The badge's CSS class was corrected before merge.** Task 3's coding subagent initially used a new, unstyled `kb-session-origin-badge` class with no CSS rule defined anywhere — the mandatory final reviewer caught this as a real AC1 violation ("visually identical to sob-s1 and sob-s2's treatment") and fixed it to reuse the shared `sw-pill sw-pill--nodot` classes, confirmed available on this page via `renderShellWithNav`.
2. **`_getSessionOriginBulk`'s return shape required correcting mid-plan.** The implementation plan initially assumed the bulk seam returned a pre-derived tri-state string; a direct read of `getSessionOriginForJourneys` (journey-store-pg.js) during Task 2 confirmed it returns raw `completedStages` arrays, requiring a per-card `deriveSessionOrigin` call inside `_enrichColumnsWithSessionOrigin` — corrected before any code was written against the wrong assumption.
3. **Task 1's optional `journey.js` DRY-refactor was narrowed to `products.js`+`features.js` only.** `journey.js`'s sob-s2 call site did not exist in this story's worktree base (sob-s2's PR #849 was still unmerged at the time) — nothing there to refactor. Tracked as an explicit, still-open follow-up (not blocking this story's own ACs, which never named `journey.js` as a touchpoint).

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7 (test plan originally estimated 5 at DoR time; 2 additional render-level tests were added during the mandatory final-review fix cycle — AC2's render-level coverage and the no-badge-when-absent case — reconciled in `pipeline-state.json` and `decisions.md`)
**Tests passing in CI:** 7 / 7

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1–AC5 (data-derivation, call-count, graceful-degradation, source-inspection) | ✅ | ✅ | `check-sob-s3-org-kanban-integration.js`, 4 tests from Task 2 |
| AC1–AC2 (render-level) + no-badge-when-absent | ✅ | ✅ | same file, 3 render-level tests from Task 3 |

**Gaps (tests not implemented):** None against the story's own ACs. One residual risk logged separately (not a test-plan gap): the exactly-one local, non-`@real-staging` Playwright spec navigating to `/org/kanban` (`psh-s7-org-kanban.spec.js`) passed clean with no differential-revert check needed — no pre-existing flakiness found on this route, unlike sob-s1/sob-s2's own equivalent findings.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|----------|
| Performance — reuses sob-s1's existing bulk seam, zero new queries | ✅ | AC3's own test proves `_enrichColumnsWithSessionOrigin` is the sole call path, one batched read per render |
| Security — none identified (read-only, no new user input) | ✅ | Confirmed at design/definition time; nothing in the merged diff introduces new input handling |
| Accessibility — text-equivalent required, not colour alone | ✅ | Reuses the shared `sessionOriginBadgeMeta` helper's `title`/`aria-label` pattern, fixed to the correct `sw-pill` treatment per the final-review finding above |
| Audit — none identified (no new write action) | ✅ | Confirmed — this feature is read-only |

`artefacts/2026-09-08-session-origin-badge/nfr-profile.md` should be updated to reflect all three stories' own verification — not yet updated as part of this DoD; tracked as a follow-up action below (also still outstanding from sob-s2's own DoD).

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| List-view session-origin visibility | ✅ (0%, recorded at benefit-metric time) | **Full — 3/3 surfaces** (product feature-list, `/journey` dashboard, org kanban) | This is the final story — the benefit-metric's full stated target (100% coverage across all three list surfaces) is now code-complete and merged on all three PRs (#848, #849, #850). The RISK-ACCEPTed post-merge manual verification-script walkthrough on `wuce-staging` (DoR decisions.md W4 entry, deferred across all three stories specifically so it could be done once, combined) has **not yet been executed** — this is the first point at which it can be, and is the primary remaining action before the metric can be marked as a live-traffic-confirmed 100%. |

**Measurement-ready gate answer:** Code-complete across all 3 surfaces; live measurement pending the deferred manual walkthrough. Recording `not-yet-measured` (live) / `code-complete` (implementation) for this story's own contribution — the feature-level metric can move to `measured` once that walkthrough runs.

---

## Outcome

**COMPLETE — this closes the `session-origin-badge` feature's inner loop (all 3 stories: sob-s1 #848, sob-s2 #849, sob-s3 #850, all merged and DoD-complete).**

**Follow-up actions (feature-level, not story-specific):**
1. **Execute the RISK-ACCEPTed post-merge manual verification-script walkthrough on `wuce-staging`** across all three surfaces in one combined pass (deferred from DoR's W4 finding specifically for this reason) — this is the one remaining action before the benefit-metric can be marked fully measured, not just code-complete.
2. Complete `journey.js`'s own half of the deferred DRY extraction (swap its inline `_sobLabelMap`/`_sobGlyphMap` for the now-merged `sessionOriginBadgeMeta` helper in `features.js`) — small, non-blocking, tracked in `decisions.md` since sob-s2's DoD.
3. Update `artefacts/2026-09-08-session-origin-badge/nfr-profile.md` to record all three stories' own NFR verification.
4. Optional, non-blocking polish item from sob-s1's own final reviewer: add a tone modifier class (e.g. `sw-pill--neutral`) to the indicator's `sw-pill` span, matching every other `.sw-pill` usage in this codebase.
5. Two genuine tool/process defects surfaced during this feature's delivery are worth a dedicated `/improve` pass: (a) `bin/skills advance`'s dot-notation silently corrupts array-shaped fields like `tasks[]` (see DoD Observations below); (b) a PR with a real merge conflict against master shows "no checks reported" rather than surfacing the actual blocker, easy to misread as "CI just hasn't started yet."

---

## DoD Observations

1. **A genuine data-corruption bug in `bin/skills advance` was found and fixed during this story's delivery.** `task-N.tddState=committed`'s dot-notation handling (`cli-advance.js`) does literal `story[parent][child] = val` with no awareness that `tasks` is an array indexed by `id` — every call for this story's 3 tasks silently created bogus top-level `task-1`/`task-2`/`task-3` keys instead of updating the real `tasks` array. `scripts/check-pipeline-state-integrity.js` reported 0 failures every time this ran (its schema coverage doesn't include this shape), so the corruption was invisible until the JSON was read back directly — which only happened because an unrelated merge-conflict resolution required it. Fixed by hand-reconstructing the array (commit `e57ac64c`); a `SendFeedback` bug report has been drafted (not yet sent) covering the tool defect itself. This is a real gap in this session's own "verify, don't trust" discipline: a CLI's exit code and a general integrity checker's pass were treated as sufficient confirmation without ever reading back the actual resulting structure for this specific field.
2. **Same root-cause class as sob-s2's own CI-never-dispatched finding, confirming it as a real recurring pattern, not a one-off.** Both PR #849 and PR #850 hit an unresolved merge conflict with `master` in `pipeline-state.json`/`decisions.md`, caused by a feature branch's own subagent-execution/verify-completion checkpoints diverging from a same-story-entry edit merged to master via a separate short-lived branch, without ever rebasing. This happened twice in immediate succession within the same feature — strong signal this repo's own documented "epic-nested story state bookkeeping" guidance needs strengthening (or the short-lived-checkpoint-branch pattern itself needs revisiting) rather than treating each occurrence as an isolated incident.
3. **The mandatory final-review step caught a real, otherwise-shippable visual defect** (the unstyled badge class) that every automated test passed cleanly against, since no existing test asserted on the specific CSS class name. Consistent with this epic's own repeated finding (sob-s1, sob-s2) that this step earns its keep by tracing real behaviour end-to-end rather than trusting per-task reviews' own conclusions.
4. **A coding subagent hit a session-wide rate limit mid-task with real, correct partial work already applied** (Task 1, the `features.js` helper) — recovered by completing the remaining steps directly in the orchestrating session, the same pattern now confirmed sound across all three stories in this feature (`cat-s5`, sob-s1 Task 4, and this occurrence).