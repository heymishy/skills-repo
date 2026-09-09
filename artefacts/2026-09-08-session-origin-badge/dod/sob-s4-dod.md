# Definition of Done: sob-s4 — journey.js DRY completion + sw-pill--neutral badge tone

**Track:** Short-track
**PR:** https://github.com/heymishy/skills-repo/pull/851 | **Merged:** 2026-09-09 (merge commit `a3756fdc`)
**Test plan:** artefacts/2026-09-08-session-origin-badge/test-plans/sob-s4-test-plan.md
**DoR artefact:** artefacts/2026-09-08-session-origin-badge/dor/sob-s4-dor.md
**Assessed by:** Claude Sonnet 5 (orchestrating session, all findings independently verified against real git/gh state)
**Date:** 2026-09-09

---

## AC Coverage

| Item | Satisfied? | Evidence | Verification method | Deviation |
|------|-----------|----------|---------------------|-----------|
| T1 (regression, sob-s1) | ✅ | 9/9 passing (8 pre-existing + 1 new), `check-sob-s1-product-list-integration.js` | automated test | None |
| T2 (regression, sob-s2) | ✅ | 10/10 passing (9 pre-existing + 1 new), `check-sob-s2-journey-dashboard-integration.js` | automated test | None |
| T3 (regression, sob-s3) | ✅ | 8/8 passing (7 pre-existing + 1 new), `check-sob-s3-org-kanban-integration.js` | automated test | None |
| T4 (new — sw-pill--neutral class) | ✅ | One new assertion per surface confirming `class="sw-pill sw-pill--nodot sw-pill--neutral"` renders on all 3 call sites | automated test | None |
| journey.js DRY completion | ✅ | `journey.js`'s `_renderJourneyHome` now calls the shared `sessionOriginBadgeMeta` helper (top-level require, no new require added — reused the existing `features.js` require) instead of its own inline `_sobLabelMap`/`_sobGlyphMap` copy | code review (diff inspection) + regression tests unchanged in count/behaviour beyond the new T4 assertion | None |

**Confirmed in CI, not just locally:** all 8 required checks passed on PR #851 (Lint/typecheck/test/build, Assurance gate, Watermark gate, Cross-tenant isolation repeat gate, Playwright E2E smoke, Scenario A/B staging E2E, Trace validation), `mergeStateStatus` was `CLEAN` before merge — no repeat of the merge-conflict/CI-never-dispatched issue that affected PR #849 and #850, since this branch was created fresh off current master rather than carrying forward stale checkpoint commits.

---

## Scope Deviations

None. This story's scope was itself already a scope-reduction/completion of prior work (finishing sob-s3's own deferred DRY-extraction decision, and sob-s1's final reviewer's polish suggestion) — nothing was added beyond what the test-plan and DoR specified.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4 (T1-T3 regression, T4 new)
**Tests passing in CI:** 27 / 27 total across the three affected test files (9+10+8)

**Gaps:** None. The test-plan's own NFR note classified the CSS/visual aspect (T4) as verifiable via DOM class-attribute assertion, not requiring Playwright visual regression — and additionally committed to a live post-merge smoke-check, which was executed (see below).

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|----------|
| CSS/visual (B2 classification) | ✅ | Classified at DoR time as automated (class-attribute assertion), plus a live post-merge visual smoke-check on `wuce-staging` (see below) — both completed, no RISK-ACCEPT needed |
| Behavioural equivalence (journey.js refactor) | ✅ | All pre-existing assertions for `journey.js`'s rendering unchanged in count or outcome; only the new T4 assertion is additive |

**Post-merge live smoke-check:** Confirmed directly on `wuce-staging` immediately after merge, via Chrome browser automation, using `getComputedStyle` (not just the raw `class` attribute — this proves the CSS rule actually resolved and painted, not only that the class name is present): every live badge across all 3 surfaces now has `backgroundColor: rgb(26, 26, 24)` — a real, non-transparent colour, versus the pre-fix state where the base `.sw-pill` rule alone declares no background at all. Counts: `skills-framework` product list 630/630 badges with `sw-pill--neutral` and the resolved colour, `/journey` 264/264, `/org/kanban` 31/31. A direct full-page screenshot was attempted but hit the same intermittent CDP renderer flakiness documented in `decisions.md`'s 2026-09-09 verification-walkthrough note; `getComputedStyle` inspection is stronger evidence of the actual visual fix than a screenshot would have been in any case (it confirms the rule resolved, not just that pixels look a certain way to visual inspection). See verification detail appended to `decisions.md`.

---

## Metric Signal

Not applicable — this is a cleanup/polish item, not a metric-contributing story. The parent feature's metric (`m1`, List-view session-origin visibility) was already marked `measured` prior to this story; this story improves the visual quality of that already-measured signal, it does not change coverage.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None outstanding for the `session-origin-badge` feature. All 4 stories (sob-s1 through sob-s4) are now merged and DoD-complete.

---

## DoD Observations

1. **A fresh branch off current master avoided the merge-conflict/CI-never-dispatched issue entirely.** Unlike sob-s2 and sob-s3, which each carried forward `subagent-execution`/`verify-completion` checkpoint commits from a base that predated a same-story-entry edit later merged to master via a separate short-lived branch, sob-s4's branch was created directly off `origin/master` at the start of this work and never accumulated that kind of divergence. This is a strong signal that the fix for the recurring pattern isn't "detect and resolve conflicts better" but "avoid creating them in the first place" — e.g. by not maintaining long-lived feature branches with their own separately-advancing `pipeline-state.json` checkpoints that race against master's own bookkeeping commits. Reinforces the `/improve` candidate already logged in sob-s2's and sob-s3's own DoDs.
2. **A real, load-bearing visual bug** (three separately-merged, separately-reviewed, separately-CI-passed stories all shipping an unstyled badge, since no test ever asserted on the class string) went undetected through 3 full inner loops, 2 mandatory final reviews, and a live staging verification pass — because the live verification pass checked *presence and correctness of content* (title, aria-label, glyph, tri-state value, `class` attribute string) but not *actual resolved rendering*. This is a genuine gap in this feature's own verification methodology: reading the raw `class` attribute proves the markup is correct, but not that the referenced CSS classes exist and resolve to anything. `/improve` candidate, refined by this story's own fix: post-merge staging walkthroughs for anything CSS-adjacent should call `getComputedStyle` on the element and assert a real, non-default computed value (e.g. `backgroundColor` isn't `transparent`/`rgba(0,0,0,0)`) — not stop at reading the `class` attribute string. `getComputedStyle` proves the referenced classes actually resolve to a visible effect; a `className` check (what the original walkthrough did) only proves the markup string is well-formed, which is exactly why it missed the missing tone modifier — the earlier walkthrough never checked class names at all for this reason, only `title`/`aria-label`/`data-*` content, since visual styling wasn't in that pass's scope. `getComputedStyle` is also more reliable than a full-page screenshot, which this session's own browser tooling proved intermittently flaky twice.