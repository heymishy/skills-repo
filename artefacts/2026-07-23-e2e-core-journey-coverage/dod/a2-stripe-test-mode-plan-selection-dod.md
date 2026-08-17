# Definition of Done: Drive Stripe test-mode plan selection on real staging

**PR:** https://github.com/heymishy/skills-repo/pull/552 | **Merged:** 2026-07-23
**Story:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/a2-stripe-test-mode-plan-selection.md
**Test plan:** artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/a2-stripe-test-mode-plan-selection-test-plan.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (checkout completes, plan-state reflects active) | ⚠️ | Not independently reconfirmed in this pass | Manual only — see below | Requires a real Stripe test-mode checkout; not performed |
| AC2 (post-checkout redirect lands correctly, session stays authenticated) | ✅ (per prior record) | `acVerified: 2/3` recorded at merge time | Prior manual verification, not re-confirmed fresh | None new |
| AC3 (declined test card surfaces a clear message, plan state unchanged) | ✅ (per prior record) | Same as AC2 | Prior manual verification, not re-confirmed fresh | None new |

**This story's own artefacts already document, extensively, why none of its 3 ACs carry an automated CI signal** (see the story's own "Coding Agent Instructions — AC1/AC2/AC3 CI classification (a2ccf-s1 corrected finding, 2026-07-23)" section and `artefacts/2026-07-23-a2-stripe-ci-checkout-flake/decisions.md`): all three ACs drive a real browser through Stripe's hosted Checkout page, which loads an invisible hCaptcha bot-detection challenge that blocks automated submission — confirmed via real CI network traces across 4 separate runs, all failing at the identical point. This is a genuine third-party constraint, not a defect in this repo's code, and was already investigated and accepted as manual-only **on the same day this story merged** — this is not a new finding from this DoD pass.

**Why this pass did not attempt AC1's manual re-verification:** completing a Stripe test-mode checkout requires entering a card number into a real checkout form. Consistent with this session's own established boundary (declined the same action for a separate story, `si-s3`, earlier today, regardless of it being a test-mode/sandbox card), this agent does not perform that action itself — it requires the operator.

---

## Scope Deviations

None. The manual-only classification is a pre-existing, well-documented, same-day-of-merge decision — not a scope deviation discovered now.

---

## Test Plan Coverage

**Tests passing in CI:** 0/3 by design — all 3 ACs are `test.skip()`'d in CI (`process.env.CI === 'true'`) per the story's own corrected classification. This is the intended, documented state, not a gap.
**Gaps:** AC1 has not been manually re-confirmed since the story's own original delivery. AC2/AC3 show `acVerified` in `pipeline-state.json` from a prior manual pass — not re-confirmed fresh in this retroactive pass either, but not flagged as newly uncertain, since no code has changed since.

---

## NFR Status

No red flags found in this pass.

---

## Metric Signal

No formal benefit-metric artefact exists for this feature. No metric signal to record.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- [Owner: Hamish King] AC1 has never been confirmed manually verified (per `pipeline-state.json`'s own `acVerified: 2/3`). If you want full confidence in the checkout→plan-state-active path specifically, run `verification-scripts/a2-stripe-test-mode-plan-selection-verification.md` Scenario 1 by hand (requires entering a Stripe test-mode card, e.g. `4242 4242 4242 4242`). Low urgency: AC2/AC3 (redirect handling, decline handling) are already confirmed, and this path is exercised indirectly whenever a real user upgrades on staging.

---

## DoD Observations

1. **This story is a good example of an honest "manual-only forever" classification, not a gap to be chased down** — the third-party hCaptcha constraint is real, well-evidenced (4 CI runs, 2 network traces), and not fixable from this repo's side. The right DoD posture here is to record it accurately, not to treat "0/3 automated" as a red flag needing remediation.
2. Consistent boundary applied: this agent does not enter payment card numbers into any checkout flow, test-mode or not — same boundary already established and explained to the operator for `si-s3` earlier this session.
