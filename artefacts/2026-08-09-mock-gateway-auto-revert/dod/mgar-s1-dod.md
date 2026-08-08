# Definition of Done: Auto-revert the staging mock LLM gateway override, and force it on before CI staging E2E runs

**PR:** https://github.com/heymishy/skills-repo/pull/692 | **Merged:** 2026-08-08
**Story:** artefacts/2026-08-09-mock-gateway-auto-revert/stories/mgar-s1-auto-revert-and-ci-enforcement.md
**Test plan:** artefacts/2026-08-09-mock-gateway-auto-revert/test-plans/mgar-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-09-mock-gateway-auto-revert/dor/mgar-s1-dor.md
**Assessed by:** Copilot
**Date:** 2026-08-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (stale off override auto-reverts after TTL) | ✅ | `offOverride_expiresAfterTTL_fallsBackToEnvDefault` | automated test (injectable clock, no real sleeps) | TTL confirmed at 30 minutes by the operator before implementation, not the 60-minute value first drafted in the story — story/DoR text updated accordingly before coding began |
| AC2 (on override never auto-reverts) | ✅ | `onOverride_neverExpires_evenPastTTL` — confirmed still true after 10 simulated hours | automated test | None |
| AC3 (refresh restarts TTL window) | ✅ | `offOverride_refreshedBeforeExpiry_windowRestarts` | automated test | None |
| AC4 (admin page states TTL/remaining time) | ✅ | `adminPage_offOverride_showsTTLAndRemainingTime` | automated test | None |
| AC5 (CI force-on step before staging E2E) | ✅ | `ensureMockGatewayOn_establishesSession_postsToggleOn`, `ensureMockGatewayOn_sessionFails_returnsReasonWithoutThrowing`; new step wired into both `scenario-a-staging-e2e` and `scenario-b-staging-e2e` in `.github/workflows/e2e.yml`, confirmed structurally correct via the existing `check-a5-ci-gate-config`/`check-b2-ci-gate-config`/`check-cif-s1`/`check-cif-s2` regression suites | automated test (mocked HTTP) + CI-structure regression suites | The mocked-HTTP integration test proves the fixture's request-construction logic is correct; it cannot itself prove the real CI step succeeds against real wuce-staging. The test plan's own manual-verification step (confirming the new step's log line on a real `scenario-a-staging-e2e` run) has **not yet been executed** — genuine open gap, recorded below, not silently dropped |
| AC6 (existing amgt-s1 suite unaffected) | ✅ | `tests/check-amgt-s1-mock-gateway-toggle.js` — 9/9 passing | automated test re-run | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. AC5's manual-verification gap is the one open item — see Test Plan Coverage and Follow-up actions below.

---

## Scope Deviations

None. The persistence-model redesign (DB/Redis), re-provisioning the already-live `e2e-test-admin@example.test` identity, and the fixture-response mechanism were all correctly left untouched per the story's explicit out-of-scope declaration.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 automated / 6 planned, plus 1 manual step
**Tests passing in CI:** 6 / 6

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| offOverride_expiresAfterTTL_fallsBackToEnvDefault | ✅ | ✅ | |
| onOverride_neverExpires_evenPastTTL | ✅ | ✅ | |
| offOverride_refreshedBeforeExpiry_windowRestarts | ✅ | ✅ | |
| adminPage_offOverride_showsTTLAndRemainingTime | ✅ | ✅ | |
| ensureMockGatewayOn_establishesSession_postsToggleOn | ✅ | ✅ | Mocked `@playwright/test` HTTP layer |
| ensureMockGatewayOn_sessionFails_returnsReasonWithoutThrowing | ✅ | ✅ | |
| Real CI run confirms the force-on step against real wuce-staging (manual) | ❌ **not yet executed** | — | The test plan itself classified this as the AC5 external-dependency closure step, to be run *after* this story merges. It has not been run yet as of this DoD assessment. |

**Gaps (tests not implemented):** The manual post-merge verification (re-running `scenario-a-staging-e2e` against real staging and confirming the new step's "forced on" log line) has not yet been executed. This is a genuine, not-yet-closed external-dependency gap, consistent with this repo's established pattern for real-external-dependency ACs (per `workspace/learnings.md`'s cross-surface-state-sync entry, 2026-08-07) — flagged here rather than silently treated as done because the automated test suite is green.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Availability/cost-safety (this story's own primary motivation) | ✅ | TTL and CI-force-on both implemented and unit-tested; real-world confirmation pending the manual step above |
| Performance | ✅ (negligible, as stated) | One `Date.now()` comparison per check; CI step adds a small, bounded amount of time to two already-multi-minute jobs |
| Security | ✅ | Reuses the existing, already-audited admin-session and CSRF mechanisms verbatim; no new credential or bypass introduced |
| Accessibility | N/A to AC1-3/5-6; AC4's page copy follows the existing accessible-text pattern | |
| Audit | ✅ (improves) | The mock-gateway-toggle event log gains a natural companion signal (`mock_gateway_override_auto_reverted`) when the TTL fires |

---

## Metric Signal

No metrics array — short-track story. Not applicable.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. **Owner: operator or next session.** Run the manual post-merge verification: toggle the staging admin UI to "off," then trigger (or wait for) a real `scenario-a-staging-e2e` CI run, and confirm the new step's log line shows the gateway was forced back on before the real Playwright specs ran. This closes AC5's remaining external-dependency gap.
2. **Owner: next session, low priority.** Observe whether the `mock_gateway_override_auto_reverted` log event ever fires in real staging logs over the following weeks — confirms the TTL path is exercised in practice, not just in unit tests with an injectable clock.

---

## DoD Observations

1. **The one open item (AC5's manual verification) is honestly recorded as incomplete, not glossed over.** All 6 automated tests pass and the CI workflow structure is confirmed correct via regression suites, but "the mocked test proves the logic is right" and "the real staging call actually works" are genuinely different claims — per this repo's own established `/definition-of-done` discipline (Step 4's explicit coverage-gap-audit language), this is recorded as `COMPLETE WITH DEVIATIONS`, not `COMPLETE`, until the manual step runs.
2. **This story closes a real, operator-reported safety gap same-day.** From the operator's live report of manually toggling the staging gateway off, through capture-log entry, memory save, story/review/test-plan/DoR, an explicit TTL-duration confirmation question, implementation, and merge — all within one session. The TTL value (30 minutes) was deliberately not assumed by the agent; the DoR itself flagged it as an operator decision point given the safety-relevant nature of the choice, and the question was asked before coding began rather than after.
3. **Reused an existing, already-provisioned admin identity and CSRF mechanism rather than inventing a new one** for the CI-side fix, following this codebase's own established `admin-credits-topup.js` precedent closely (same non-throwing, reason-reporting failure pattern) — reduces the audit surface for anyone reviewing how CI authenticates against real staging.
