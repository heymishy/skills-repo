# Definition of Done: promote-to-prod writes the real version stamp before deploying

**PR:** https://github.com/heymishy/skills-repo/pull/834 | **Merged:** 2026-09-04 (commit `dc98304a`)
**Story:** artefacts/2026-09-05-promote-to-prod-version-stamp/stories/ptvs-s1-promote-to-prod-writes-version-stamp.md
**Test plan:** artefacts/2026-09-05-promote-to-prod-version-stamp/test-plans/ptvs-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-05-promote-to-prod-version-stamp/dor/ptvs-s1-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-05

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-ptvs-s1-promote-to-prod-version-stamp.js` T1: `Set up Node.js` step present | automated test | None |
| AC2 | ✅ | Same suite T2: version-stamp step, correct env, before `Deploy to production` | automated test | None |
| AC3 | ✅ | Same suite T3: learnings-count step, before `Deploy to production` | automated test | None |
| AC4 (regression guard) | ✅ | Same suite T4: `deploy-staging`'s own steps unchanged | automated test | None |
| AC5 (regression guard) | ✅ | `check-bri-s2.6-smoke-test-promote-gate.js` 10/10 passing, unmodified | automated test | None |
| AC6 (real-world) | ✅ **CONFIRMED WORKING** | See "Live verification" below | Direct browser check on production `/version` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Live verification (the load-bearing check this story exists to produce)

Performed 2026-09-05, immediately after production promotion of commit `dc98304a` (confirmed via the `promote-to-prod` job's own step-by-step log: `Set up Node.js`, `Write version stamp`, and `Write learnings count` all completed successfully before `Deploy to production`):

`GET https://skills-framework.fly.dev/version` returned:
```json
{"sha":"dc98304a5503466bf9c96c345d2d098807472377","shortSha":"dc98304","prNumber":834,"commitSubject":"ptvs-s1: promote-to-prod writes the real version stamp before deploying (#834)","deployedAt":"2026-09-04T21:58:37.458Z"}
```

Every field matches the actual deployed commit exactly: `sha` matches the merge commit confirmed via `gh pr view`, `prNumber` matches this story's own PR, `commitSubject` matches the real merge-commit message, and `deployedAt` matches the `Write version stamp` step's own `completed_at` timestamp to the millisecond. Previously this endpoint always returned the `DEV_FALLBACK` (`{"sha":null,"shortSha":"dev",...}`) regardless of what was deployed -- this is the first time it has ever shown real data for a production build.

---

## Scope Deviations

None. This story's own scope was implemented exactly as planned, and its own AC6 -- explicitly RISK-ACCEPTed with a mandatory (not optional) post-merge check -- was actually performed and confirmed working, not deferred.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6 (T1-T6)
**Tests passing:** 6 / 6 -- T1-T5 automated, T6 (the real live-endpoint re-check) performed directly and confirmed passing

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 Set up Node.js step | ✅ | ✅ | |
| T2 version-stamp step, correct order/env | ✅ | ✅ | |
| T3 learnings-count step, correct order | ✅ | ✅ | |
| T4 deploy-staging unchanged | ✅ | ✅ | |
| T5 bri-s2.6 regression suite | ✅ | ✅ | 10/10, unmodified |
| T6 real live-endpoint re-check | ✅ | ✅ | Performed directly post-promotion, real data confirmed matching the deployed commit exactly |

**TDD verification performed (RED confirmed, not assumed):** before committing, the workflow change was stashed (`git stash push -u`, reapplied and dropped by SHA per this repo's worktree stash-safety convention) and the new test file re-run against pre-fix content -- T1-T3 failed exactly as expected, T4 unaffected either way, then restored.

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No regression to deploy-staging's own working version-stamp mechanism | ✅ | AC4, byte-identical, confirmed by test and direct diff review |
| The fix actually works in production, not just in CI | ✅ | Live verification section, real endpoint data matching the real deployed commit |

`nfr-profile.md` status: not created for this story -- covered fully by the AC table.

---

## Metric Signal

Not applicable — short-track story, no formal benefit-metric artefact (per CLAUDE.md's short-track path). Benefit linkage is now empirically confirmed: `GET /version` on production, previously always showing fake `DEV_FALLBACK` data, now correctly identifies the real deployed build.

---

## Outcome

**COMPLETE**

Every AC has concrete evidence, including the one that mattered most -- AC6 was performed immediately after promotion, in the same session as the fix, matching the discipline established one story earlier by `dcfx-s1`. This closes out the second (and final, currently-known) of the two follow-up findings from today's own `dcfx-s1` investigation.

**Follow-up actions:**
None outstanding from this story's own scope.

---

## DoD Observations

1. **This is the third consecutive story this session (`stcs-s1`, `dcfx-s1`, `ptvs-s1`) whose own DoR-mandated real-world check was actually performed at DoD time, not deferred.** Combined with `daga-s1`'s own earlier lapse (a recommended-but-non-blocking live check that sat unexecuted for a full session-day), this session now has a clear, evidenced before/after: naming a check as "recommended" invites deferral; naming it as mandatory in the DoR's own Coding Agent Instructions, and then actually doing it before writing the DoD, closes the loop the same session. Worth carrying forward as the standing convention, not just for Docker/deploy-topology stories.
2. **A small, deliberately-deferred finding from a bigger investigation (`dcfx-s1`) turned into a complete, well-evidenced fix of its own within the same day.** This is a good example of the "capture and defer, don't fold in" discipline (used throughout this session for scope control) working as intended -- the deferred item didn't get lost or forgotten, it got its own proper short-track treatment shortly after, with its own full artefact chain.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "promote-to-prod writes the real version stamp before deploying" (ptvs-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is the "Live verification" section specific enough to trust it was a real check (real JSON response, real matching field values)?
3. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
