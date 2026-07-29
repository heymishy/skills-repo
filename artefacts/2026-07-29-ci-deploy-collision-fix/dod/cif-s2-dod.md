# Definition of Done: Sequence Scenario B after Scenario A so they never simultaneously race for the shared concurrency slot

**PR:** https://github.com/heymishy/skills-repo/pull/634 | **Merged:** 2026-07-29
**Story:** artefacts/2026-07-29-ci-deploy-collision-fix/stories/cif-s2-sequence-scenario-b-after-scenario-a.md
**Test plan:** artefacts/2026-07-29-ci-deploy-collision-fix/test-plans/cif-s2-sequence-scenario-b-after-scenario-a-test-plan.md
**DoR artefact:** artefacts/2026-07-29-ci-deploy-collision-fix/dor/cif-s2-dor.md
**Assessed by:** Copilot (autonomous, short-track)
**Date:** 2026-07-29

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `.github/workflows/e2e.yml`'s `scenario-b-staging-e2e` job (merged, on master) declares `needs: scenario-a-staging-e2e` | Automated test (U1, `node tests/check-cif-s2-scenario-sequencing.js`), re-run against merged master code | None |
| AC2 | ✅ | Both scenario jobs still declare `concurrency: deploy-group`, matching `deploy-staging`'s group name | Automated test (U2), re-run against merged master code | None |
| AC3 | ✅ | `e2e`, `smoke-test`, `promote-to-prod`, `deploy-staging` jobs' `needs:` values all confirmed unchanged | Automated test (U3), re-run against merged master code | None |
| AC4 | ✅ | Both workflow files parse into a valid `jobs:` block, no conflict markers | Automated test (U4), re-run against merged master code | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. The merged PR touches only the single `needs:` line added to `scenario-b-staging-e2e` in `.github/workflows/e2e.yml`, plus the new test file and this feature's `decisions.md`. `staging-deploy.yml` was not modified.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4
**Tests passing in CI:** 4 / 4

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| U1 (AC1): scenario-b-staging-e2e declares needs: scenario-a-staging-e2e | ✅ | ✅ | Re-run against merged master code today |
| U2 (AC2): both scenario jobs retain concurrency: deploy-group | ✅ | ✅ | Re-run against merged master code today |
| U3 (AC3): no other job's needs: changed | ✅ | ✅ | Re-run against merged master code today |
| U4 (AC4): both files remain valid YAML | ✅ | ✅ | Re-run against merged master code today |

**Gaps (tests not implemented):** One permanent, accepted gap (same category already accepted for cif-s1): the actual GitHub-side concurrency-queue behaviour cannot be proven by a static test. This gap already has strong real-world evidence, not just theory — **direct confirmation on PR #634's own CI run**: Scenario A completed first, Scenario B then started only after Scenario A finished (visible in the run timeline — Scenario B's job did not even appear as a check until Scenario A completed), and Scenario B finished with a genuine `pass` conclusion rather than `cancelled`. This is the strongest possible confirmation short of a live multi-PR concurrency stress test.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — sequential cost was already being incurred implicitly via the shared concurrency group; this story makes it explicit/deterministic rather than adding new cost | ✅ | Confirmed on PR #634's own run: Scenario A ~2m35s, Scenario B ~2m28s, running sequentially — consistent with cif-s1's own already-accepted ~2 min tradeoff, not a new cost |
| Security — no new secrets, no new permissions | ✅ | Confirmed by code review — the diff is a single `needs:` line |

---

## Metric Signal

No metrics array entries reference this story (`2026-07-29-ci-deploy-collision-fix` has an empty `metrics: []` in `pipeline-state.json`).

---

## Outcome

**COMPLETE**

**Follow-up actions:** None blocking. Passive: continue observing for the cancellation pattern under genuine multi-PR concurrent load (a scenario this fix reduces the likelihood of but cannot eliminate entirely, since `deploy-staging` and any other concurrent PR's Scenario A/B pair still compete for the same repo-wide group — see the story's Out of Scope section).

---

## DoD Observations

1. This story is a fix-forward correction of a gap discovered in cif-s1 (already merged and DoD-marked-complete) while independently verifying an unrelated PR (#633, pmec-s1). This is a concrete instance of CLAUDE.md's "verify coding-agent dispatch completion independently" principle paying off in a slightly different form: verifying one PR's CI against shared infrastructure surfaced a latent defect in different, already-shipped work. Worth reinforcing as a standing practice — checking a new PR's CI results in full (not just the checks relevant to that PR's own story) can catch cross-story regressions that a narrowly-scoped review would miss.
2. cif-s1's own DoD (already merged) did not anticipate this race; this DoD entry is the natural place to note that cif-s1's original test plan and DoD both explicitly accepted "the real GitHub-side queueing behaviour cannot be tested locally" as a permanent gap — this story is a direct, concrete instance of that exact gap materializing in practice, now closed.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Sequence Scenario B after Scenario A so they never simultaneously race for the shared concurrency slot" (cif-s2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
