# Definition of Done: Show a real, visible confirmation after a successful checkout instead of a silent redirect

**PR:** #697 (merge commit `4d4f4cd6`) | **Merged:** 2026-08-09
**Story:** artefacts/2026-08-09-billing-success-confirmation/stories/bsc-s1-real-checkout-confirmation.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 -- real plan read from Stripe session metadata (set at creation), not a client-suppliable query param | Yes | `createCheckoutSession-sets-metadata-planId`, `retrieve-called-with-real-session-id`, `billing-success-body-names-real-plan`, `client-suppliable-plan-name-ignored` | Unit + NFR (mocked Stripe adapter) | None |
| AC2 -- visible confirmation page (not silent 302) naming the specific plan purchased | Yes | `billing-success-renders-200-confirmation-not-redirect`, `billing-success-body-mentions-payment-success`, `billing-success-body-names-real-plan` | Unit (rendered response body assertions) | None |
| AC3 -- clear continue link/button to `/dashboard` | Yes | `billing-success-has-continue-link-to-dashboard` (asserts `href="/dashboard"`) | Unit (markup assertion) | None |
| AC4 -- `checkout_completed` PostHog event carries real `planName`, fixing the always-empty-string bug | Yes | `posthog-checkout-completed-fired`, `posthog-planName-is-real-not-empty` | Unit (mocked PostHog client, asserts `props.planName === 'ENTERPRISE'` fixture value) | None |
| AC5 -- fails open to original 302 redirect when `session_id` missing or Stripe retrieve fails | Yes | `missing-session-id-does-not-throw`, `missing-session-id-falls-back-to-dashboard-redirect`, `retrieve-failure-does-not-throw`, `retrieve-failure-falls-back-to-dashboard-redirect` | Unit (both failure modes: missing param, adapter throw) | None |

Implementation spot-check: `src/web-ui/routes/billing.js` -- `handlePostCheckout` stashes `planId` into the Stripe session's `metadata` at creation (line ~183-188, comment "bsc-s1: planId is stashed in session metadata so /billing/success can read back"), and `handleGetBillingSuccess` reads `session.metadata.planId` back on the success path (line ~217-222), confirming the code matches both the story's architecture constraint and the test fixtures.

---

## Scope Deviations

None. The story's own "Out of Scope" section names three explicitly deferred items, all accepted (not defects):
- Changing what actually grants plan entitlement -- the Stripe webhook (`checkout.session.completed` → `setPlanState`) remains the sole authoritative trigger, unaffected by this story.
- Adding a confirmation banner to the dashboard itself (`handleGetDashboard`) -- this story ships a dedicated `/billing/success` page instead, per design.
- Retrying or polling for webhook completion before showing the confirmation -- the confirmation is sourced from the checkout session itself, not from waiting on `tenant-plan.js` state, per design (a known, accepted race between browser redirect and webhook arrival).

---

## Test Plan Coverage

`check-bsc-s1-billing-success-confirmation.js`: **13 passed, 0 failed** (re-run this session, 2026-08-20, after the originally-supplied result of "null passed, null failed" -- which was not a coherent real test outcome -- looked suspicious). All 6 unit tests, 1 NFR test, and the AC1 creation/retrieve round-trip pairing named in `test-plans/bsc-s1-test-plan.md` are present and passing. The test plan's separately-listed "Integration Tests" section (`fullCheckoutToSuccessFlow_metadataRoundTrips_correctly`) is not present as a distinct named test in the check file, but its intent -- proving the metadata round-trips from creation through retrieval -- is covered by the combination of `createCheckoutSession-sets-metadata-planId` and `retrieve-called-with-real-session-id` / `billing-success-body-names-real-plan` using the same `PRO`/`cs_test_pro` fixture across both halves of the flow.

---

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Performance | Met (by design, not separately tested) | One additional low-frequency Stripe API call; story rates this negligible and no perf test was planned. |
| Security | Met | `client-suppliable-plan-name-ignored` proves a client-supplied `plan_name=ENTERPRISE` query param is never read or trusted when real metadata says `FREE`. |
| Accessibility | Not independently verified | Story requires semantic markup / real `<a>`/`<button>`; test only asserts `href="/dashboard"` is present, not full accessible-markup conventions. No dedicated accessibility test exists. |
| Audit | Met | `posthog-planName-is-real-not-empty` confirms the analytics gap (previously always-empty `planName`) is fixed. |

---

## Metric Signal

No formal benefit-metric artefact exists for this story -- it is explicitly short-track (bug fix found via informal agentic-review, discovery and benefit-metric steps both skipped per the story's own header). The story states its benefit directly rather than through a tracked metric: fixing a UX-correctness gap (silent redirect) and a pre-existing analytics data-quality bug (`checkout_completed.planName` always empty in production). No quantitative before/after signal is available or expected for this story.

---

## Outcome

**COMPLETE**
**Follow-up actions:** None required. Optional, non-blocking: a dedicated accessibility assertion for the confirmation page's markup would close the one NFR area (Accessibility) that has no direct test coverage, though the story's own test plan did not call for one either.

---

## DoD Observations

Implementation matches both the story's architecture constraint (session metadata, not client query param) and its test plan; spot-checking `src/web-ui/routes/billing.js` confirmed the metadata round-trip is real code, not just mocked-test theater. Production longevity not independently confirmed beyond the merge commit itself.
