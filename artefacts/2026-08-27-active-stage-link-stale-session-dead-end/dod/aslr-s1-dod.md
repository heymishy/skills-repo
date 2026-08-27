# Definition of Done: aslr-s1 — Route the journey navigator's active-stage link through the existing resume flow

**PR:** https://github.com/heymishy/skills-repo/pull/776 | **Merged:** 2026-08-27T06:59:11Z (commit `99c86278`)
**Story:** `artefacts/2026-08-27-active-stage-link-stale-session-dead-end/stories/aslr-s1-route-active-stage-link-through-resume.md`
**Test plan:** `artefacts/2026-08-27-active-stage-link-stale-session-dead-end/test-plans/aslr-s1-test-plan.md`
**DoR:** `artefacts/2026-08-27-active-stage-link-stale-session-dead-end/dor/aslr-s1-dor.md`
**Decisions:** `artefacts/2026-08-27-active-stage-link-stale-session-dead-end/decisions.md`
**Assessed by:** Claude (agent)
**Date:** 2026-08-27

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Live in-memory session case unaffected — confirmed via `check-s0.2-resume-existing-session.js`'s existing AC1 re-run | Automated test re-run | None |
| AC2 | ✅ | Redis-restorable case unaffected — confirmed via `check-s0.4-resume-redis-session.js` re-run | Automated test re-run | None |
| AC3 | ✅ | Neither memory nor Redis → fresh session, not a 404 — confirmed via `check-s0.2`'s existing AC4 coverage plus this story's own AC6/AC7 direct-handler tests | Automated test | None |
| AC4 | ✅ | Journey's `activeSessionId` updated to the new session's ID — covered by the same tests as AC3 | Automated test | None |
| AC5 | ✅ | `isDone` step-nav branch confirmed byte-unchanged: still `/journey/:journeyId/stage/:skillName` | Automated test (`check-aslr-s1-active-stage-link-resume.js`) | None |
| AC6 | ✅ | `handleGetStageReview`'s not-done/no-session fallback now redirects to `/journey/:featureSlug/resume`, not the raw chat URL | Automated test | None |
| AC7 | ✅ | `handleGetJourneyStageView`'s own no-artefact-yet fallback likewise redirects through `/resume`; `check-jsvr-s1-wire-stage-view-route.js`'s edge-case assertion updated to match | Automated test | None |
| AC8 | ✅ | Full resume/stage-view regression suite (`check-s0.1`, `check-s0.2`, `check-s0.4`, `check-jsvr-s1`, `check-frsr-s1`, `check-dsh-s4`) re-run clean; `handleGetJourneyResume` itself confirmed untouched by diff | Automated test re-run | None |

**Test file:** `tests/check-aslr-s1-active-stage-link-resume.js` — 9/9 passing, re-confirmed on merged master.

---

## Scope Deviations

**Expanded from 1 to 4 call sites during implementation.** The original scope investigation (recorded in the story/test-plan/DoR at DoR sign-off) found only the step-nav `isActive` breadcrumb (line 891) as unsafe. During implementation, direct re-inspection of the remaining un-individually-verified candidates from the same original grep (lines 478, 632, 779) found two more genuine instances of the identical pattern (`handleGetStageReview`'s fallback, `handleGetJourneyStageView`'s own no-artefact-yet fallback), plus a fourth (`currentChatUrl`, the "← Current stage" button) that turned out to be the literal link clicked during the original live reproduction, distinct from line 891. All three story/test-plan/DoR artefacts were corrected in place before the PR was opened, with the correction itself documented in `decisions.md`. No scope was added beyond fixing the same identified bug pattern everywhere it occurred.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 AC groups, all covered (4 new direct tests + 4 groups exercised via existing, unmodified endpoint coverage).
**Tests passing:** 9/9 in the new file; full existing resume/stage-view suite clean; full suite 561 files run, 0 real failures (1 known pre-existing flaky file, `check-p3.5-validate-trace.js`, confirmed as a PowerShell encoding quirk in an unmodified file, unrelated to this change).
**Gaps:** None per the test plan's own "Coverage gaps" section.

**Process note:** A pre-existing, unrelated CI blocker was discovered and fixed while shipping this story: `ssp.1` (`2026-06-20-skill-session-precomp`) had `stage: definition-of-ready` recorded in `pipeline-state.json` with no backing artefacts anywhere in the repo (a June 23 data gap, unrelated to this work), which broke "Validate traceability chain" CI for this PR. Per operator direction, rolled the stage back to `review` (the last stage with a real recorded basis) rather than fabricating a retroactive test-plan document or adding a CI exemption.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | One additional same-origin redirect hop through `/journey/:featureSlug/resume`, which performs the same memory/Redis lookups the old direct link's destination would have done anyway |
| Security | ✅ | `handleGetJourneyResume` enforces `requireJourneyAccess` (tenant/ownership) before resolving anything — at least as strict as the old direct link |
| Accessibility | ✅ N/A | Same link elements, same visible labels, different `href`/`Location` targets only |
| Audit | ✅ N/A | Reuses `handleGetJourneyResume`'s existing `stage_started` event; no new audit call |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| None declared | N/A | N/A | Short-track direct correctness fix, no formal benefit-metric artefact. |

**Live validation (post-merge, 2026-08-27):** Deployed to `wuce-staging` (v807). Confirmed via `fly ssh console` that all 4 fixed call sites are present in the running container. Live-reproduced the exact dead-end condition (forced a machine restart to expire a freshly-created skill session on the "Wizard view" test journey, re-authenticated, then navigated directly to the stage-view page) and confirmed the "← Current stage" link's `href` now reads `/journey/2026-07-05-wizard-view/resume`; following it created a brand-new live session and rendered a working chat page — no "Session not found" anywhere in the flow.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None from this story. The still-open items from the original 4-bug production report are: (1) the decision-log-view UI gap (not yet storied), and (2) awaiting production deployment approval (operator's manual gate) to carry `cpr-s1`, `alsg-s1`, `lsbm-s1`, and this story's fixes from staging to production.

---

## DoD Observations

1. **Pipeline-state bookkeeping was missed at merge time**, identically to `cpr-s1` (same session, same day) — both stories' `prStatus`/`stage`/`dodStatus` fields sat at `dor-signed-off` despite merging hours earlier. Both corrected together in this bookkeeping pass. Worth flagging as a recurring gap: this session's `branch-complete` step does not appear to be reliably followed by a prompt or reminder to advance state post-merge for short-track stories that skip the standard `/definition-of-done` invocation trigger.
2. **A pre-implementation scope investigation is not a substitute for verifying every enumerated candidate individually.** The original investigation correctly grepped all `journey.activeSessionId` call sites but only fully verified some of them before sign-off, missing 3 of 4 real instances. The gap was caught before merge (during implementation, via direct re-inspection), not after — but the lesson is that a "some remaining un-verified" state in an investigation should be flagged explicitly at DoR time rather than implicitly assumed safe.
3. **Live Chrome validation of a session/auth-adjacent fix on a Fly.io app with `min_machines_running=0` is structurally hard to isolate cleanly** — a full machine restart always wipes both the specific state under test AND the operator's own HTTP session/accessToken together, since both live in the same in-memory process. Confirmed workable technique: let the forced restart's own silent GitHub SSO re-auth complete first (landing on `/dashboard`), THEN immediately re-issue the exact request under test — this yields a clean "valid auth, dead target state" condition without needing to disentangle the two.
