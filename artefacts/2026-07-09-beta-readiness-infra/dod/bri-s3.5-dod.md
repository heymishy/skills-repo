# Definition of Done: Billing journey spec

**PR:** https://github.com/heymishy/skills-repo/pull/449 | **Merged:** 2026-07-10
**Story:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.5-billing-journey.md
**Test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.5-billing-journey-test-plan.md
**DoR artefact:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s3.5-billing-journey-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Trial-to-paid upgrade reflected immediately after mocked `checkout.session.completed` webhook | automated test (`check-bri-s3.5-billing-webhook.js`) | None |
| AC2 | ✅ | Usage-gate blocks with a clear, human-readable error (cap/count fields), not a raw 402 | automated test (`check-bri-s3.5-usage-gate.js`, 13/13) | None |
| AC3 | ✅ | Payment-failure webhook reflected in plan state (`past_due`), not silently ignored | automated test | See Scope Deviations — required a genuine behavioural addition, not pure test authoring |
| AC4 (Acceptance Criterion 4) | ✅ | Cancellation webhook restricts usage gates per new (downgraded) plan | automated test | See Scope Deviations |
| AC5 | ✅ | Spec tagged `@mocked @billing`; synthetic webhook payloads POSTed to `/webhook/stripe` via a `NODE_ENV=test`-only fake adapter — no real Stripe calls | E2E spec present and correctly tagged + `check-bri-s3.5-nfr-stripe-keys.js` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

**Disclosed and reasoned in `decisions.md` (2026-07-10, ARCH, bri-s3.5 implementation — a DoR contract amendment)**: the DoR contract anticipated "read-only test consumption, no behavioural change expected unless a genuine gap is found." Investigation confirmed a genuine gap — `src/web-ui/routes/billing.js`'s Stripe webhook handler only ever handled 3 credit-provisioning event types; a payment failure or cancellation fell into a generic `stripe_unhandled_event` branch with no state change, meaning AC3/AC4 could not be made true without a real fix. Extended the handler with two new event branches (`invoice.payment_failed`, `customer.subscription.deleted`) and a minimal in-memory tenant plan-state store (`src/web-ui/modules/tenant-plan.js`) that `checkJourneyCap` now consults. An async/Postgres-backed version was explicitly rejected as disproportionate to this story's Complexity 2/Stable rating — the in-memory store mirrors the existing `_capReader` pattern and is sufficient for the `@mocked`/`@billing` per-PR variant this story covers (real persistence across restarts is out of scope, matching the story's own Out of Scope section on `@live` testing). Flagged in the draft PR description for tech-lead review before merge, per this story's Medium oversight level. Does not touch the epic's declared out-of-scope items (real Stripe webhook delivery testing, per-seat billing).

---

## Test Plan Coverage

**Tests from plan implemented:** 11 / 11 (unit/integration across 3 files) + 1 E2E spec
**Tests passing in CI:** 25 / 25 (re-verified directly against current master, 2026-07-14)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `check-bri-s3.5-billing-webhook.js` | ✅ | ✅ (8/8) | Checkout upgrade, payment-failure → past_due, cancellation → downgrade, regression credit-provisioning |
| `check-bri-s3.5-nfr-stripe-keys.js` | ✅ | ✅ (4/4) | No `sk_live_`/`rk_live_` pattern anywhere committed; `.env.example` test-mode-only |
| `check-bri-s3.5-usage-gate.js` | ✅ | ✅ (13/13) | At-limit block with readable message, paid-plan cap lift, past_due still capped, downgrade restores cap |
| `tests/e2e/bri-s3.5-billing-journey.spec.js` | ✅ | Present, tagged `@mocked @billing` | Synthetic webhook payloads, no real Stripe calls |

**Gaps (tests not implemented):** None. Review confirmed 0 HIGH/MEDIUM findings — "best-grounded story in the epic."

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No real Stripe secret/webhook signing secret used in `@mocked`/`@billing` CI runs | ✅ | `check-bri-s3.5-nfr-stripe-keys.js` (4/4); `pipeline-state.json` guardrail `NFR-billing-secrets` already marked `met` |
| Contributes to shared `@mocked` suite under-10-minute budget | ✅ | No individual per-spec budget violation found |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 4 — Risk-critical journeys have deterministic E2E coverage | ✅ (0 of 5) | Yes — billing journey covered | |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- None blocking. The in-memory plan-state store's revisit trigger (per `decisions.md`) — replace with a real Postgres-backed adapter using the same D37 injectable pattern as `credits.js`/`stripe-client.js` if a future story needs plan state to persist across server restarts/multi-instance deployment — is noted for awareness, not an open defect against this story's own scope.

---

## DoD Observations

1. This story's own user-story framing explicitly cites the session's prior billing bugs ("the recent GitHub-OAuth-first-login and plan-limit bugs") as the direct motivation — the AC3/AC4 gap found here (payment-failure and cancellation silently no-op'd) is exactly the class of defect this epic exists to catch, and it was caught before shipping rather than in production.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Billing journey spec" (bri-s3.5).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
