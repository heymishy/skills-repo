# Definition of Done: Session-origin indicator on the /journey dashboard

**PR:** https://github.com/heymishy/skills-repo/pull/849 | **Merged:** 2026-09-09 (merge commit `26d6bf1e`)
**Story:** artefacts/2026-09-08-session-origin-badge/stories/sob-s2-journey-dashboard-indicator.md
**Test plan:** artefacts/2026-09-08-session-origin-badge/test-plans/sob-s2-test-plan.md
**DoR artefact:** artefacts/2026-09-08-session-origin-badge/dor/sob-s2-dor.md
**Assessed by:** Claude Sonnet 5 (orchestrating session, all findings independently verified against real git/gh state)
**Date:** 2026-09-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `real journey with all completedStages carrying sessionId returns fully-session-backed` (unit) + `a fully session-backed real journey card renders data-sob-session-origin="fully-session-backed"` (render-level) | automated unit + integration test (`check-sob-s2-journey-dashboard-integration.js`) | None |
| AC2 | ✅ | `real journey with partial sessionId coverage returns mixed` (unit) + `a mixed journey card renders data-sob-session-origin="mixed"` (render-level) | automated unit + integration test | None |
| AC3 | ✅ | `a synthesized _mergeStateFeaturesIntoJourneyList-shaped entry returns no-session, does not throw` (unit) + `a synthesized entry card renders data-sob-session-origin="no-session"` (render-level) | automated unit + integration test | None |
| AC4 | ✅ | `real journey with completedStages: [] returns null` (unit) + `a real journey with completedStages: [], zero completed stages, renders NO data-sob-session-origin element at all` (render-level) | automated unit + integration test | None |
| AC5 | ✅ | `listJourneys and _mergeStateFeaturesIntoJourneyList are each still called exactly once per /journey render` — added during the mandatory two-stage review's code-quality fix cycle, replacing an initial bare counter with a proper injectable `setMergeStateFeaturesIntoJourneyList(fn)` seam mirroring `journey.js`'s own existing `_journeyStore`/`setJourneyStoreModule` idiom | automated integration test, end-to-end via `_renderJourneyHome` | None |

**Confirmed in CI, not just locally:** PR #849's CI initially never dispatched at all (0 check-runs, confirmed via the GitHub API) — traced to a real merge conflict with `master` in `.github/pipeline-state.json` and `decisions.md` (the documented "epic-nested story state bookkeeping" gotcha: an earlier `subagent-execution` checkpoint had been merged to master via a separate short-lived branch, but `feature/sob-s2` was never rebased onto it). Resolved by merging `master` into `feature/sob-s2`, resolving the conflict in favour of the branch's more advanced state, and pushing — after which all 8 required checks ran and passed (Lint/typecheck/test/build, Assurance gate, Watermark gate, Cross-tenant isolation repeat gate, Playwright E2E smoke, Scenario A/B staging E2E, Trace validation).

---

## Scope Deviations

None against the story's own ACs. Two adjacent, explicitly-logged deviations from the *implementation plan* (not the ACs):

1. **AC5's implementation differs from the original bare-counter approach.** The mandatory code-quality review flagged the original bare permanent call-count variable as a weak test seam; fixed via a proper injectable `setMergeStateFeaturesIntoJourneyList(fn)` seam before merge (`decisions.md`, D37-adjacent finding, not a stub-throws adapter since it mirrors the existing real-by-default pattern).
2. **The deferred DRY-extraction decision (`_sobLabelMap`/`_sobGlyphMap` → shared helper) was assigned to sob-s3, not sob-s2**, per an explicit `decisions.md` entry reasoning that retrofitting sob-s1's already-merged `products.js` from sob-s2's branch would be cross-story scope contamination. sob-s3 (PR #850) has since completed the `products.js`/`features.js` half of that extraction; `journey.js`'s own half remains a small, explicitly tracked, non-blocking follow-up (see `decisions.md`'s 2026-09-09 recovery note).

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9 (test plan originally estimated 5 at DoR time; 4 additional tests were added during implementation — Task 1's own unit-level mapping tests alongside the story's render-level ACs, reconciled in `pipeline-state.json` and `decisions.md` as the work progressed)
**Tests passing in CI:** 9 / 9

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1–AC4 (unit) | ✅ | ✅ | `check-sob-s2-journey-dashboard-integration.js`, 4 unit-level tests |
| AC1–AC5 (render-level + call-count) | ✅ | ✅ | same file, 5 render-level/integration tests |

**Gaps (tests not implemented):** None against the story's own ACs. One residual risk logged separately (not a test-plan gap): 2 pre-existing, unrelated local Playwright E2E specs (`dsda-s1-default-all-stories.spec.js` AC3, `ep1-s4-stage-selector.spec.js` Scenario 2) fail in this local sandbox on journey *detail* sub-pages (not the `/journey` dashboard this story touches) — differentially confirmed at `/verify-completion` to fail identically with this story's code entirely absent (pre-existing environment flakiness, not a coverage gap). All corresponding CI checks (including the CI-hosted Playwright E2E smoke suite) passed on the actual merged PR.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|----------|
| Performance — zero new queries (AC5) | ✅ | AC5's own test proves `listJourneys`/`_mergeStateFeaturesIntoJourneyList` call counts are unchanged from pre-story baseline |
| Security — none identified (read-only, no new user input) | ✅ | Confirmed at design/definition time; nothing in the merged diff introduces new input handling |
| Accessibility — text-equivalent required, not colour alone | ✅ | Same `title`/`aria-label` pattern as sob-s1, reused via the shared `sessionOriginBadgeMeta` helper as of sob-s3 |
| Audit — none identified (no new write action) | ✅ | Confirmed — this feature is read-only |

Feature-level NFR profile (`artefacts/2026-09-08-session-origin-badge/nfr-profile.md`) should be updated to reflect this story's own verification alongside sob-s1's — not yet updated as part of this DoD; tracked as a follow-up action below.

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| List-view session-origin visibility | ✅ (0%, recorded at benefit-metric time) | Partial — product feature-list + `/journey` dashboard surfaces, 2 of 3 | sob-s1 + sob-s2 together reach 2/3 of the benefit-metric's stated coverage target. The full target (100% across all 3 surfaces) is not yet measurable — org kanban wiring is sob-s3, currently PR #850, not yet merged. The RISK-ACCEPTed post-merge manual verification-script walkthrough on `wuce-staging` (DoR decisions.md W4 entry) has not yet been executed — deferred until all 3 stories are merged so all three surfaces can be checked in one combined pass. |

**Measurement-ready gate answer:** Not yet (full metric). Recording `not-yet-measured` for this story's own contribution.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. Merge sob-s3 (PR #850, still open/draft) — the metric's full target requires all three surfaces.
2. Execute the RISK-ACCEPTed post-merge manual verification-script walkthrough on `wuce-staging` (deferred from DoR's W4 finding) — once sob-s3 merges, so all three surfaces can be checked in one pass.
3. Complete `journey.js`'s own half of the deferred DRY extraction (swap its inline `_sobLabelMap`/`_sobGlyphMap` for the now-merged `sessionOriginBadgeMeta` helper in `features.js`) — small, non-blocking, tracked in `decisions.md`.
4. Update `artefacts/2026-09-08-session-origin-badge/nfr-profile.md` to record sob-s2's own NFR verification, mirroring sob-s1's DoD update.

---

## DoD Observations

1. **A PR can sit with zero CI dispatch and no obvious error message when it has an unresolved merge conflict with the target branch — this is easy to miss.** `gh pr checks` on a never-dispatched PR simply reports "no checks reported," which reads identically to "CI hasn't started yet" rather than surfacing the actual blocker (`mergeStateStatus: DIRTY`/`mergeable: CONFLICTING`). The operator caught this by directly asking "haven't CI actions run" rather than the orchestrating session noticing on its own — worth adding an explicit `gh pr view --json mergeable,mergeStateStatus` check to this repo's own `/branch-complete`/`/verify-completion` routine as a standard post-push sanity check, not just `gh pr checks`. `/improve` candidate.
2. **This is the epic-nested story state bookkeeping gotcha (cdg.6/B2) manifesting as a real, blocking git conflict rather than a silent revert** — a variant this repo's own `CLAUDE.md` documents the silent-revert case for, but not this harder-to-miss conflicting-edit case. Both stem from the same root cause: a feature branch's own pipeline-state.json checkpoint commits diverging from a same-story-entry edit merged to master via a separate short-lived branch, without the feature branch ever rebasing. Worth strengthening the documented guidance to explicitly call out both failure shapes.
3. **A genuine, never-committed decision entry ("Deferred: extract `_sobLabelMap`/`_sobGlyphMap`...") sat as an uncommitted local diff in the main checkout for the bulk of this feature's delivery**, surfacing only when a routine `git pull` on master would have silently discarded it. Recovered and committed directly (not force-discarded), with a note cross-referencing that sob-s3 had, in the meantime, independently re-derived and acted on the same decision from conversation context alone — confirming the decision was sound even though its written record was temporarily lost. Reinforces this session's own established discipline (never blind-discard uncommitted changes; verify before overwriting) rather than surfacing a new failure mode.