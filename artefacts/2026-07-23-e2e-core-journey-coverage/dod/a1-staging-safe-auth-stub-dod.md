# Definition of Done: Stand up a staging-safe GitHub OAuth/email auth stub for real-staging E2E

**PR:** https://github.com/heymishy/skills-repo/pull/551 | **Merged:** 2026-07-22
**Story:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/a1-staging-safe-auth-stub.md
**Test plan:** artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/a1-staging-safe-auth-stub-test-plan.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| All ACs (staging-safe auth stub for real-browser E2E) | ✅ | `tests/e2e/a1-staging-auth-stub.spec.js` — 6/6 test plan tests; runs as part of the `"Scenario A E2E (staging)"` CI-blocking gate on every PR | Continuous CI evidence, confirmed via `.github/workflows/e2e.yml` line 229, and directly observed passing on `si-s1`'s PR #749 and `si-s2`'s PR #748 (both merged 2026-08-17, same session) | None |

---

## Scope Deviations

None identified in this retroactive pass.

---

## Test Plan Coverage

**Tests passing in CI:** 6/6 per test plan. This spec is CI-blocking (`a5`'s own gate wiring) — not spot-re-run in this pass, since it has run and passed on every PR since merge, including two from today's own session.
**Gaps:** None identified.

---

## NFR Status

No red flags found in this pass. This is the foundation every other story in this feature's E2E suite depends on (the auth stub they all authenticate through) — its continued passing on every subsequent PR is strong ongoing evidence.

---

## Metric Signal

No formal benefit-metric artefact exists for this feature. No metric signal to record.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. ~4 weeks live as an active, continuously-exercised CI gate (not a one-time check) — every PR merged since, including two from this very session, has re-validated this story's own correctness as a side effect.
2. This DoD pass relies on continuous CI evidence rather than a fresh manual re-run, since the underlying Playwright E2E spec requires a full staging environment round-trip already covered by the existing CI gate — re-running it manually in this pass would duplicate, not add, evidence.
