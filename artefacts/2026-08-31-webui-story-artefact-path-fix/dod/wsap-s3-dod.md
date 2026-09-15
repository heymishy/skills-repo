# Definition of Done: wsap-s3 — multi-story commit gating and review cadence

**Track:** Short-track
**PR:** https://github.com/heymishy/skills-repo/pull/894 | **Merged:** 2026-09-15 (merge commit `d6d86e13`)
**Test plan:** artefacts/2026-08-31-webui-story-artefact-path-fix/test-plans/wsap-s3-test-plan.md
**DoR artefact:** artefacts/2026-08-31-webui-story-artefact-path-fix/dor/wsap-s3-dor.md
**Assessed by:** Claude Sonnet 5 (orchestrating session)
**Date:** 2026-09-15

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | New `check-wsap-s3-multi-story-commit-and-no-review-rerun.js` Block 1 — mocked 2-story product-linked feature, both stories' `test-plan` completions via the real `handlePostTurnStreamHtml` path; 2 distinct commits fire with story-scoped paths | automated test (new) | None |
| AC2 | ✅ | Same file, Block 2 — DoR completion with `advanceToNextStory` returning a real next story; `handlePostGateConfirm` redirects to `test-plan`, not `review`; new session's `skillName` is `test-plan` | automated test (new) | None |
| AC3 | ✅ | `check-ougl7-dor-and-journey-complete.js` T7.3 corrected and passing (8/8); 6 additional regression files re-run unchanged | automated test (corrected + re-run) | None |
| AC4 | ✅✅ | **Live-verified in full, end to end, against a real production 3-story feature created specifically for this purpose** (`2026-09-15-wsap-s3-live-verify-3story`, since `new-feature-2b74a292` turned out to have no GitHub product link and so could not exercise Fix 1 — see Scope Deviations). Drove all 3 stories through discovery → benefit-metric → design(skipped) → definition → review(once) → test-plan(s1) → DoR(s1) → test-plan(s2) → DoR(s2) → test-plan(s3) → DoR(s3) → Journey Complete via the live web UI. Confirmed via direct `git log --oneline origin/master` inspection: all 6 test-plan/DoR artefacts (one pair per story) landed as individual `artefact: commit` commits on `origin/master` — including stories 2 and 3, which is exactly the case Fix 1 addresses (pre-fix, only story 1's would have committed; stories 2/3 would have been silently skipped as false "revisions"). Review ran exactly once for the whole feature (`review.md` + 3 per-story review files, one commit each, no repeats) — confirming Fix 2: no review re-run occurred between any of the 3 stories' DoR completions. | Live production verification — direct `git log` inspection of real commits, not a self-report or assumption | None |

**Confirmed in CI, not just locally:** all required PR #894 checks passed before merge (see `wsap-s3` PR body / earlier session record).

---

## Scope Deviations

1. **The originally-planned live-verification target could not be used for AC4.** `new-feature-2b74a292` (the real, originally-affected feature) was the first candidate, but investigation during this session established it has no GitHub product link — none of its artefacts have ever been committed to `origin/master` (confirmed via `git log --diff-filter=D` and `--follow` both returning empty history for its `dor/` path, and `git show --stat` on the commit initially believed to touch it, which actually belonged to a different, similarly-named feature). Since Fix 1 is specifically about GitHub commit gating, a feature with no GitHub link at all cannot exercise it regardless of correctness. Pivoted to creating a fresh, product-linked, 3-story throwaway feature (`2026-09-15-wsap-s3-live-verify-3story`) instead, which cleanly exercised both fixes across two separate "advance to next story" transitions (s1→s2, s2→s3).
2. **The skill-completion marker flakiness** (documented in `wsap-s2`'s own DoD as a known, separate issue) recurred several times during this verification — `test-plan` and `definition-of-ready` sessions on `claude-haiku-4-5` occasionally paused after describing a stage as saved without emitting the artefact markers, or misread session continuity after a completed story. Worked around each time by explicitly re-prompting for the marker block, or by naming the specific pending story when the model's own "no further story" framing was incorrect. Not a `wsap-s3` regression — same pre-existing gap, still out of scope for this story, still a candidate for a future `/improve` pass.

---

## Test Plan Coverage

**Tests from plan implemented:** T1-T5, all implemented
**Tests passing:** `check-wsap-s3-multi-story-commit-and-no-review-rerun.js` 7/7 (new); `check-ougl7-dor-and-journey-complete.js` 8/8 (T7.3 corrected); 6 additional regression files unchanged; AC4 live-verified against real production traffic

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 | ✅ | ✅ | New test, Block 1 — both story commits fire with distinct paths |
| T2 | ✅ | ✅ | New test, Block 2 — DoR "more stories" redirects to test-plan |
| T3 | ✅ | ✅ | Corrected regression, T7.3 now asserts the intentional new redirect target |
| T4 | ✅ | ✅ | 7 regression files re-run unchanged |
| T5 | ✅ | ✅✅ | Live-verified against a real, fresh 3-story production feature — direct git-log confirmation of both fixes across 2 story-advance transitions |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|----------|
| Cost — one fewer full-feature review LLM call per story after the first | ✅ | Confirmed structurally by the fix (removing `'review'` from `PER_STORY_SEQ`) and observationally: the live-verification run showed exactly one review pass for 3 stories, not 3 |

---

## Metric Signal

Not applicable — bug fix with no formal benefit-metric artefact for this short-track feature folder (consistent with `wsap-s1`/`wsap-s2`). The qualitative outcome is unambiguous: multi-story features now commit every story's test-plan/DoR artefacts to GitHub (not just the first), and review runs exactly once per feature as CLAUDE.md's own pipeline table documents — both confirmed against real production traffic, not mocks.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. **`new-feature-2b74a292` remains without a GitHub product link** and its per-story artefacts still only exist (when they exist at all) on ephemeral container disk, lost on every redeploy. This was already flagged in `wsap-s2`'s DoD as a data-recovery gap; this session's investigation clarified the root cause further (no product link at all, not a partial-commit issue) but did not change its status — still an outstanding manual follow-up, now better understood: recovering it requires either linking it to a real GitHub repo before re-running its stages, or accepting its artefacts as web-UI-session-only.
2. **The throwaway verification feature `2026-09-15-wsap-s3-live-verify-3story`** has served its purpose (Journey Complete, both fixes confirmed) and can be archived/ignored — no further action needed, consistent with how prior throwaway verification features (`wsd-s2 live verification throwaway`, `2026-09-15 e2e web ui to dor proof`) were left in place after use.
3. **The skill-completion marker flakiness** (Scope Deviation 2) continues to recur across `wsap-s2` and `wsap-s3`'s own live verifications — now observed in `test-plan` and `definition-of-ready` sessions specifically, and also as a session-continuity confusion after a story completes. Still worth a future `/improve` investigation; still out of scope for this story.
