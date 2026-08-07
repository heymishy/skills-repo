# Definition of Done: Fix "Resume conversation" to always resolve to a real conversation view

**PR:** https://github.com/heymishy/skills-repo/pull/628 | **Merged:** 2026-07-28
**Story:** artefacts/2026-07-28-durable-session-history/stories/dsh-s4-fix-resume-conversation-link.md
**Test plan:** artefacts/2026-07-28-durable-session-history/test-plans/dsh-s4-fix-resume-conversation-link-test-plan.md
**DoR artefact:** artefacts/2026-07-28-durable-session-history/dor/dsh-s4-fix-resume-conversation-link-dor.md
**Assessed by:** Copilot (Claude)
**Date:** 2026-07-28

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | "Resume conversation href points at /journey/:journeyId/stage/:stageName" | automated unit test | None |
| AC2 | ✅ | Real-staging E2E spec, re-run against the post-merge redeployed app: session evicted from memory via `/test/evict-skill-session`, resume link renders the real durable conversation, never "Session not found" | real-staging E2E test (post-merge confirmation) | None — see Notes |
| AC3 | ✅ | Same real-staging E2E spec, no-eviction case: renders correctly for a still-in-memory session | unit test + real-staging E2E | None |
| AC4 | ✅ | Reuses dsh-s3's existing artefact-only fallback, unmodified | not re-tested (by design) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found.

**Note on AC2's verification timeline:** this PR's own pre-merge CI run for Scenario A E2E was expected to fail on AC2 specifically — a documented, understood deployment-timing gap (the new `POST /test/evict-skill-session` endpoint cannot be live on staging until after this PR merges, since `staging-deploy.yml` only deploys on push to master; no PR-preview deploy mechanism exists in this repo). This was logged as a RISK-ACCEPT in `decisions.md` before merge, with AC2's real confirmation explicitly deferred to a post-merge check. After merging, GitHub had already deleted the source branch, so the PR's own CI re-run failed at the checkout step (fetching a now-nonexistent ref) — not a test failure. AC2 was instead confirmed by running the E2E spec directly against the real, redeployed `wuce-staging` app: 2/2 tests passing (AC2 and AC3 both green).

---

## Scope Deviations

None. 4 commits on the branch: baseline confirmation (RISK-ACCEPT) plus the 3 planned tasks (repoint link, add eviction endpoint, real-staging E2E spec + CI wiring). Confirmed against Out of Scope: the in-progress-stage resume-link computation and live interactivity from this entry point were both untouched.

---

## Test Plan Coverage

**Tests from plan implemented:** 3 / 3 (AC1 unit, AC2 real-staging E2E, AC3 unit; AC4 reuses dsh-s3 unmodified per the test plan's own scope)
**Tests passing in CI:** 3 / 3 confirmed — full suite 432 files, same 37 pre-existing failures as baseline; AC2/AC3's real-staging E2E spec 2/2 passing (confirmed post-merge)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: href points at the new stage-view route | ✅ | ✅ | Unit |
| AC2: survives real session eviction against real staging | ✅ | ✅ | Confirmed post-merge, real redeployed app |
| AC3: still-in-memory case unregressed | ✅ | ✅ | Unit + real-staging E2E |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — none new beyond dsh-s2/dsh-s3 | ✅ | This story only changes a link's target URL; no new render path. |
| Security — none new, reuses dsh-s3's existing guard | ✅ | Confirmed — the eviction endpoint is gated by `_isTestEndpointAllowed`, never touches Redis/Postgres, and the destination route's tenant guard is dsh-s3's own, unmodified. |
| Accessibility — none new, link unchanged visually | ✅ | Confirmed — only the `href` attribute changed. |
| Audit — none identified | ✅ | Confirmed. |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| m1 — Resume conversation link success rate | ✅ (baseline ~0% for stages completed before the last restart) | The literal fix is deployed and independently confirmed working end-to-end against real infrastructure | No real operator usage/analytics data has been collected yet — still recorded as `not-yet-measured` pending actual usage observation, though this is a stronger confirmation than a "technically observable" claim (dsh-s3's m2 status): the exact originally-reported bug was reproduced-and-fixed against real, redeployed staging, not just unit-tested. |

m2 is unaffected by this story — dsh-s4 does not contribute to m2 per `benefit-metric.md`'s Metric Coverage Matrix.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. dsh-s5 (archive job) and dsh-s6 (archive rehydration) remain DoR-signed-off but unimplemented — the last two stories in the dsh-e1 epic.
2. Once dsh-s5/s6 ship, m3 (turn storage stays bounded) can be assessed; m1/m2 should have their first real signal captured from actual operator sessions, not just "confirmed working."
3. **Process follow-up, worth prioritising:** this is the second story in this feature where a new endpoint + its own real-staging E2E test landed in the same PR, requiring a manual post-merge confirmation step outside the normal CI gate. Consider a `/improve` candidate: either a documented standard playbook for this exact bootstrapping shape (add the endpoint and test in one PR, expect one red pre-merge check, confirm manually post-merge), or a structural fix (e.g. a lightweight post-merge CI job that specifically re-runs any new real-staging spec against the freshly-deployed app and updates the PR/commit status, removing the need for a human/agent to do this by hand each time).

---

## DoD Observations

1. **Post-merge confirmation required a manual workaround.** The PR's source branch was deleted by GitHub immediately after merge, so re-running the PR's own CI check (`gh run rerun`) failed at the checkout step (fetching a now-nonexistent branch ref) rather than genuinely re-testing anything. AC2 was instead confirmed by running the E2E spec directly, locally, against the real redeployed staging app. This is a real gap in the "re-run CI post-merge" workflow for any check tied to a PR-branch checkout after the branch is gone — worth noting for the next story that needs the same post-merge confirmation pattern (dsh-s5/s6, if they have a similar shape).
2. **Feature-level guardrails again left at their DoR-time assessment** (4 of 6 stories now merged) — same judgment call as dsh-s1/s2/s3's DoD artefacts.
3. Third recurrence of the CI/staging-deploy-collision pattern was also observed during this story's dispatch (on the pre-merge PR check, before the deployment-timing issue was even reached) — already logged previously in `workspace/capture-log.md`, no new entry needed.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Fix "Resume conversation" to always resolve to a real conversation view (dsh-s4).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
