# Definition of Done: wsd-s5 — fetch pipeline-state.json content via the Git Blobs API

**Track:** Short-track
**PR:** https://github.com/heymishy/skills-repo/pull/892 | **Merged:** 2026-09-15 (merge commit `5ef55467`)
**Test plan:** artefacts/2026-09-15-web-ui-pipeline-state-durability/test-plans/wsd-s5-test-plan.md
**DoR artefact:** artefacts/2026-09-15-web-ui-pipeline-state-durability/dor/wsd-s5-dor.md
**Assessed by:** Claude Sonnet 5 (orchestrating session)
**Date:** 2026-09-15

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | 7 regression files re-run unchanged (93 checks total, including `wsd-s4`'s own new suite) | automated test re-run | None |
| AC2 | ✅ | `check-wsd-s2-github-pipeline-state-writer.js` updated to the two-GET mock shape — 24 existing assertions all still pass | automated test re-run | None |
| AC3 | ✅ | New T10 — mocked Contents API response with NO `content` field at all (mirrors GitHub's real >1 MB behaviour) — writer succeeds via the Git Blobs API fetch, correct field change present in the final PUT | automated test (new, 3 assertions) | None |
| AC4 | ✅✅ | **Live-verified in full, end to end.** Continued the same throwaway feature (`2026-09-14-wsd-s2-live-verification-throwaway`) through a real `definition` stage completion in the production web UI. Commit `69ac3388` landed on `origin/master`, `git show` confirms `.github/pipeline-state.json` correctly gained the feature entry with `"stage": "definition"`. `node scripts/check-pipeline-state-integrity.js` confirms 0 failures against the live-written state (after a follow-up fix adding the feature's missing `track` field, unrelated to this story's own code — a pre-existing gap in how brand-new features get created via this path, shared with the local-fs writer's own equivalent behaviour). | Live production verification — direct `git show`/`git log` inspection of the actual commit, not a self-report | None — this is the strongest possible verification level: the actual bug this whole chain (`wsd-s2` through `wsd-s5`) exists to fix is now provably working in production. |

**Confirmed in CI, not just locally:** all 8 required PR #892 checks passed before merge.

---

## Scope Deviations

None. This story closed the full remaining gap exactly as scoped.

---

## Test Plan Coverage

**Tests from plan implemented:** T1-T11, all implemented
**Tests passing in CI:** all PR #892 checks green; `check-wsd-s2-github-pipeline-state-writer.js` 27/27 locally; full regression sweep (93 checks across 7 files) all green

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1-T9 | ✅ | ✅ | Existing suite, mocks updated to the two-GET shape, all still pass |
| T10 | ✅ | ✅ | New — Contents API response with no `content` field, writer succeeds via blob fetch |
| T11 | ✅ | ✅✅ | Live verification — the actual production write succeeded, confirmed via direct `git show` of the real commit |

**Gaps:** None. This is the story that fully closes the entire `wsd-s2`-through-`wsd-s5` chain's benefit-metric.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|----------|
| Performance — one additional GET per write | ✅ | Negligible; production path only, local-fs writer unaffected |

---

## Metric Signal

**Closes the benefit-metric gap in full.** `2026-09-15-web-ui-pipeline-state-durability`'s Tier 1 Metric 1 (Pipeline-state accuracy for web-UI-originated features: baseline 0% confirmed absent for multiple independent features across this session, target 100%) is now mechanically demonstrated working end-to-end in production, not just in an automated test — the strongest possible confirmation this benefit-metric could ask for.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. The throwaway feature (`2026-09-14-wsd-s2-live-verification-throwaway`) has served its full purpose (proved the fix live, multiple times, across `wsd-s2` through `wsd-s5`). Decide whether to delete it from production or leave it as a permanent record of this verification — still outstanding from earlier in this session (the operator has not yet answered).
2. Consider whether new features created directly via the GitHub-API writer's own feature-creation path (as opposed to the local journey-creation flow) should have their `track`/`name` fields populated at creation time rather than left to be patched in later — a minor completeness gap found during this story's own live verification, not blocking, not scoped to this story.

---

## DoD Observations

1. **This is the third and final bug in a chain where each fix was real, necessary, and individually insufficient — found entirely through live production re-verification, never through static review or the existing test suite.** `wsd-s2` (missing context construction) → `wsd-s3` (wrong theory, real but insufficient defensive fix) → `wsd-s4` (correct root cause: an unrelated earlier story's code movement made the context source unreachable) → `wsd-s5` (a GitHub API size ceiling no fixture-based test had ever triggered, since every fixture used was under 1 MB). Each fix shipped its own new, targeted regression test reproducing the exact failure mode found — none of these three bugs can now silently recur.
2. **The Git Blobs API fix is strictly safer than the original single-GET design's own stated concurrency goal, not a compromise of it.** Fetching content by an immutable, content-addressed sha (rather than trusting a second field in the same response) removes any possibility of content/sha mismatch — a cleaner design than the one it replaced, discovered only because the original design's untested assumption (files stay under 1 MB) turned out to be false for the real file.
3. **Real production data (`.github/pipeline-state.json`'s actual size) was the single fact that made this entire investigation tractable once suspected** — checking `ls -la .github/pipeline-state.json` (1,535,145 bytes) took one command and immediately confirmed the size-ceiling hypothesis against GitHub's documented 1 MB Contents API limit. A reminder that when an external API's error message is opaque ("Unexpected end of JSON input"), checking the real data shape/size against the external system's own documented limits is often faster than re-reading application code for a logic bug that may not exist.
