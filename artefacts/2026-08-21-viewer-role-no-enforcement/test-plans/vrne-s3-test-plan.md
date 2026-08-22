## Test Plan: Wire the viewer-write-block gate to Credits/billing routes

**Story reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s3-credits-billing.md`
**Epic reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/epics/vrne-e1-viewer-write-blocking.md`
**Test plan author:** Copilot
**Date:** 2026-08-22

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Viewer denied on `/billing/checkout` | 1 test | — | — | — | — | 🟢 |
| AC2 | Non-viewer roles unaffected | 2 tests | — | — | — | — | 🟢 |
| AC3 | Denial is logged | 1 test | — | — | — | — | 🟢 |
| AC4 | `/webhook/stripe` unaffected by the gate | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — in-memory `req`/`res` mocks, same pattern as `vrne-s1`/`vrne-s2`.
**PCI/sensitivity in scope:** No — this story gates the *initiation* of a Stripe-hosted Checkout session; no card data is ever handled by this app directly (Stripe Checkout is hosted, per this repo's existing PCI-scope-avoidance design). Confirmed via `routes/billing.js:135`'s existing implementation.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mock `req.session.role = 'viewer'`; spy on the Stripe Checkout session-creation call | Synthetic | None | Spy assertion proves no real Stripe API call is attempted |
| AC2 | Mock `req.session.role` = `'engineer'`/`'admin'` | Synthetic | None | |
| AC3 | Injectable test logger | Synthetic | None | |
| AC4 | Mock Stripe webhook payload with a valid test signature | Synthetic (test-fixture signature, not a real Stripe secret) | None | Confirms the new gate is not accidentally applied to this route |

### PCI / sensitivity constraints

None — Stripe-hosted Checkout keeps card data out of this app entirely, confirmed at `/definition`.

### Gaps

None.

---

## Unit Tests

### viewer-denied-billing-checkout

- **Verifies:** AC1
- **Precondition:** `req.session.role = 'viewer'`.
- **Action:** Call `POST /billing/checkout`.
- **Expected result:** 403; Stripe Checkout session-creation function never invoked (spy-verified).
- **Edge case:** No.

### engineer-billing-checkout-succeeds / admin-billing-checkout-succeeds

- **Verifies:** AC2
- **Precondition:** `req.session.role = 'engineer'` (and separately `'admin'`).
- **Action:** Call `POST /billing/checkout`.
- **Expected result:** Gate calls `next()`; Checkout session-creation proceeds exactly as before this story.
- **Edge case:** No.

### billing-denial-logged

- **Verifies:** AC3
- **Precondition:** Injectable test logger wired.
- **Action:** Trigger a viewer denial on `/billing/checkout`.
- **Expected result:** Logger called with `personId`, `tenantId`, `timestamp`, `route` — same shape as the other stories' audit tests.
- **Edge case:** No.

### webhook-stripe-unaffected-by-gate

- **Verifies:** AC4
- **Precondition:** A valid, test-fixture-signed Stripe webhook payload (matching this repo's existing webhook test fixtures, not a real secret).
- **Action:** Call `POST /webhook/stripe`.
- **Expected result:** Processed exactly as before this story — the gate is not applied to this route at all (confirmed by the route handling proceeding without ever checking `req.session.role`, since the webhook has no session concept).
- **Edge case:** Yes — this is the regression guard against accidentally over-applying the new gate to a route that has no role/session concept.

---

## Integration Tests

None required beyond the unit-level coverage above — `/billing/checkout`'s existing test suite (pre-dating this story) already exercises the real `server.js` dispatch path; this story's change is additive to that existing coverage, not a new integration seam.

---

## NFR Tests

### audit-log-format-consistent-with-other-stories

- **NFR addressed:** Audit
- **Measurement method:** Same structural assertion as `vrne-s1`/`vrne-s2`'s NFR tests.
- **Pass threshold:** Same field names, same event-name convention.
- **Tool:** Node `assert`.

No Performance/Accessibility NFR tests — same rationale as the other 3 stories.

---

## Out of Scope for This Test Plan

- Products/Features, Skill session, and edge-case routes — covered by the other 3 stories.
- Stripe's own webhook signature verification logic — pre-existing, unmodified by this story.
- Credit-provisioning logic triggered by a successful webhook — unaffected by this story.

---

## Test Gaps and Risks

None.
