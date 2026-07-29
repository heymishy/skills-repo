# Definition of Done: Prevent a staging redeploy from racing a PR's real-staging E2E job

**PR:** https://github.com/heymishy/skills-repo/pull/632 | **Merged:** 2026-07-29
**Story:** artefacts/2026-07-29-ci-deploy-collision-fix/stories/cif-s1-add-deploy-concurrency-guard.md
**Test plan:** artefacts/2026-07-29-ci-deploy-collision-fix/test-plans/cif-s1-add-deploy-concurrency-guard-test-plan.md
**DoR artefact:** artefacts/2026-07-29-ci-deploy-collision-fix/dor/cif-s1-dor.md
**Assessed by:** Copilot (autonomous, short-track)
**Date:** 2026-07-29

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `.github/workflows/e2e.yml`'s `scenario-a-staging-e2e` job (merged, on master) declares `concurrency: deploy-group`, matching `staging-deploy.yml`'s `deploy-staging` group name exactly | Automated test (`node tests/check-cif-s1-deploy-concurrency-guard.js`, U1), re-run against merged master code | None |
| AC2 | ✅ | `scenario-b-staging-e2e` job (merged, on master) declares the same `concurrency: deploy-group` | Automated test (U1), re-run against merged master code | None |
| AC3 | ✅ | `smoke-test`, `promote-to-prod` (`staging-deploy.yml`), and `e2e` (`e2e.yml`) jobs confirmed to have no `concurrency` key added | Automated test (U2), re-run against merged master code | None |
| AC4 | ✅ | Both workflow files parse into a valid `jobs:` block with no conflict markers | Automated test (U3), re-run against merged master code | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. The merged PR touches only the two `concurrency:` lines in `.github/workflows/e2e.yml` (`scenario-a-staging-e2e`, `scenario-b-staging-e2e`) plus the new test file. `staging-deploy.yml` was not modified — its existing `deploy-staging` group name is reused as-is, matching the story's Architecture Constraints. No other job in either workflow file gained a concurrency declaration.

---

## Test Plan Coverage

**Tests from plan implemented:** 3 / 3 (U1 covers both AC1 and AC2)
**Tests passing in CI:** 4 / 4 assertions (U1 asserts AC1 and AC2 separately)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| U1 (AC1, AC2): Scenario A/B declare `concurrency: deploy-group` | ✅ | ✅ | Re-run against merged master code today |
| U2 (AC3): no new concurrency declarations on unrelated jobs | ✅ | ✅ | Re-run against merged master code today |
| U3 (AC4): both files remain valid YAML | ✅ | ✅ | Re-run against merged master code today |

**Gaps (tests not implemented):** One permanent, accepted gap, documented in the test plan itself: the actual GitHub-side cross-workflow queueing behaviour (does a job entering the occupied `deploy-group` genuinely queue rather than race?) cannot be verified locally or in an automated test — it is governed by GitHub Actions' own server-side implementation. Real-world confirmation requires observing subsequent PRs that touch Scenario A/B for the absence of the collision pattern. As of this DoD (2026-07-29, merged minutes before), no subsequent PR has yet opened to provide that observation — this is expected and tracked as a pending confirmation, not a failure.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — CI wall-clock time for a PR touching Scenario A/B increases by roughly the smaller job's duration (sequential instead of parallel) | ✅ | Confirmed by design (bare-string concurrency group with no `cancel-in-progress` override queues rather than parallelizes); explicitly accepted tradeoff per the story's Out of Scope section |
| Security — no new secrets, no new permissions, no change to job access | ✅ | Confirmed by code review — the diff adds only a `concurrency:` key, no new `env:`, `secrets:`, or `permissions:` blocks |

---

## Metric Signal

No metrics array entries reference this story (`2026-07-29-ci-deploy-collision-fix` has an empty `metrics: []` in `pipeline-state.json` — short-track infra fix, no benefit-metric artefact). The story's own Benefit Linkage section quantifies the problem (5 confirmed collision occurrences this session: PRs #626, #627, #628 ×2, #629, #630) rather than a formal metric; ongoing confirmation is "no further collision-pattern failures observed on future PRs," tracked as the coverage-gap item above, not a formal metric signal.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None blocking. Informal: watch the next several PRs that trigger Scenario A/B for absence of the collision pattern (see Test Plan Coverage gap above) — no explicit action owner needed, this is passive confirmation via normal CI observation.

---

## DoD Observations

1. This story directly closes the recurring pattern first logged 2026-07-28 (`workspace/capture-log.md`, dsh-s2 branch-complete entry) and confirmed 5 times across the `durable-session-history` epic (PRs #626, #627, #628 ×2, #629, #630) plus once more on PR #631 (dfr-s1) after cif-s1's own story and test-plan were already written but before its fix had merged — that PR #631 recurrence is direct, timestamp-correlated real-world evidence supporting the root-cause diagnosis behind this fix (two `staging-deploy.yml` redeploys landed at 22:29:25–22:30:15 and 22:30:23–22:30:53, squarely inside PR #631's Scenario A job window of 22:29:58–22:32:59).
2. Cross-story note (already recorded in dfr-s1's own DoD, repeated here for this story's own traceability since both PRs merged in the same session): PR #631 also surfaced a structurally distinct assurance-gate failure (stale `pipeline-state.json` on the PR branch relative to master, since bookkeeping commits are pushed directly to master per this repo's convention) — unrelated to this story's own scope, fixed by rebasing dfr-s1 onto master before merge. Flagged as a `/improve` candidate; not addressed by this story.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Prevent a staging redeploy from racing a PR's real-staging E2E job" (cif-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
