# Definition of Done: Branch-complete's freshness check must not be invalidated by verify-completion's own bookkeeping commit

**PR:** https://github.com/heymishy/skills-repo/pull/1056 | **Merged:** 2026-11-06
**Story:** artefacts/2026-11-06-bcfx-s1/stories/bcfx-s1-freshness-bookkeeping-commit-fix.md
**Test plan:** artefacts/2026-11-06-bcfx-s1/test-plans/bcfx-s1-test-plan.md
**DoR artefact:** artefacts/2026-11-06-bcfx-s1/dor/bcfx-s1-dor.md
**Assessed by:** Claude (Sonnet 5)
**Date:** 2026-11-06

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `getLastCodeCommitTimestamp excludes a commit that only touches the bookkeeping paths`, plus a real (non-mocked) integration test against this repo's own git history | integration-real-code | None |
| AC2 | ✅ | `isFresh still correctly reports not-fresh when getLastCodeCommitTimestamp finds a later real commit` | integration-real-code | None |
| AC3 | ✅ | `getLastCodeCommitTimestamp uses the injected executor, not real execSync, when provided` | unit | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found.

---

## Scope Deviations

None. `git diff c1a14dd2 40a8c51d --stat` (the merge range) touches exactly the expected files: `scripts/lib/branch-complete-freshness.js`, `skills/branch-complete/SKILL.md`'s Step 1, the new test file, and this feature's own artefacts/bookkeeping. `isFresh`'s core comparison logic and `decideSkipOrRun`'s return shape are unchanged, matching the story's own explicit out-of-scope boundary.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4 (test plan's own count; the shipped file grew to 7 tests across three review-driven fix rounds, all additive)
**Tests passing in CI:** 7 / 7 (fresh run on master, `node tests/check-bcfx-s1-freshness-commit-filter.js`)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| getLastCodeCommitTimestamp excludes a commit that only touches the bookkeeping paths | ✅ | ✅ | |
| getLastCodeCommitTimestamp returns null when no code commit exists | ✅ | ✅ | |
| isFresh still correctly reports not-fresh when getLastCodeCommitTimestamp finds a later real commit | ✅ | ✅ | |
| getLastCodeCommitTimestamp uses the injected executor, not real execSync, when provided | ✅ | ✅ | |
| getLastCodeCommitTimestamp with the real default executor returns a valid ISO 8601 timestamp from this repo's own history | ✅ | ✅ | Added during review round 2 — closes the "only the mocked path was tested" gap |
| getLastCodeCommitTimestamp returns null without throwing when the git command itself fails | ✅ | ✅ | Added during review round 2 |
| decideSkipOrRun returns skipped:false when lastCommitTimestamp is null (git-log failure path) | ✅ | ✅ | Added during review round 3 — regression test for the Critical epoch-zero bug found and fixed during that round |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: skip path well under 1 second | ✅ | Unchanged budget from `ilce-s2`'s own NFR; this fix only changes which commit is counted, not the comparison's cost |
| Security | N/A | None identified |

---

## Metric Signal

**[Metric 2] (Metric 2 — Redundant full-suite reruns in `/branch-complete`, `pipeline-state.json`'s `m2`)**
Measurement-ready: **not yet**
Signal: not-yet-measured
Evidence note: This fix removes the structural bug that prevented the skip path from ever firing, but no story has yet run through `/branch-complete` *after* this fix landed to produce a real skip-rate observation. The next story to go through the inner loop will be the first real data point.
Date measured: null

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None.

---

## DoD Observations

1. **This fix exists only because `/definition-of-done` was actually run on `ilce-s2`.** The bug (freshness check structurally could never skip, because `/verify-completion`'s own bookkeeping commit always postdated its own record) passed `ilce-s2`'s own 9 unit tests cleanly, two independent spec-compliance reviews, and a full cross-task final review — because all of that verification used synthetic timestamps, never the real git-commit-sequencing behavior that only shows up in live operation. This is a concrete instance of DoD's own "verification strength" tagging rule doing its job: the AC's real-world claim (branch-complete actually skips in practice) was only ever backed by `unit`-level evidence, and running DoD's live-usage lens caught what every other gate missed.
2. **A second, more severe bug was introduced and caught within the fix-review loop itself**, not at DoD time: the first attempt at fixing issue #1 (catching the git-log exception and returning `null`) created a worse bug — `new Date(null).getTime()` is epoch 0, not `NaN`, so a `null` fallback was silently treated as "always fresher than any real timestamp," meaning a git failure would have caused the safety-net full-suite rerun to be silently *skipped* rather than conservatively run. This was caught by the code-quality reviewer during the same subagent-execution cycle, independently reproduced by the orchestrator before dispatching the fix, and closed with a dedicated regression test. Recorded here as a strong example of why the parallel-review-dispatch design (`ilce-s3`) and its discard-and-redispatch loop matter in practice, not just in theory.
3. This story's own existence (and the need to retroactively create a `/improve`-style short-track fix mid-session) suggests a `/improve` candidate: DoD's own guidance should perhaps note explicitly that a "freshness"/"skip" mechanism keyed to git-commit timestamps needs to be verified against the *real* commit-sequencing pattern of its own calling skills, not just synthetic timestamps — this exact failure mode (a skill's own closing commit poisoning a freshness check keyed off "most recent commit") could recur for any future similar mechanism.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Branch-complete's freshness check must not be invalidated by verify-completion's own bookkeeping commit".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
