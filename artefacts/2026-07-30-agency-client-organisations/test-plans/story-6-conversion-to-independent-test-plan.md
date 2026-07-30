# Test Plan: Client org self-service conversion to an independent paying account

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-6-conversion-to-independent.md
**Epic reference:** artefacts/2026-07-30-agency-client-organisations/epics/agency-client-organisations.md
**Test plan author:** Claude (agent-authored)
**Date:** 2026-07-31

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `org_type` updated `client`→`standalone` in place, same `org_id` | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Redirect into existing Stripe checkout flow | — | 1 test | — | — | External-dependency (Stripe itself) | 🟢 |
| AC3 | Existing relationships/grants unchanged after conversion | 1 test | 1 test | — | — | — | 🟢 |
| AC4 | Concurrency: conversion + concurrent grant op don't corrupt each other | 1 test | 1 test | — | — | — | 🔴 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|-----------------------------|----------|
| Actual Stripe checkout session completion | AC2 | External-dependency | Stripe's hosted checkout is a third-party service; `createCheckoutSession` is mocked at the adapter boundary in automated tests, matching the existing convention for every other `standalone` signup test | Manual scenario in verification script confirms the redirect target and that the existing checkout mechanism (already used and tested elsewhere) is reached, not re-tested from scratch |

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup; mocked Stripe `createCheckoutSession` adapter (reusing the existing mock already used by other billing tests)
**PCI/sensitivity in scope:** No — no new payment code is introduced; the existing, already-reviewed Stripe checkout mechanism is reused unchanged
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | An existing Client org with products/journeys/artefacts attached | Synthetic | None | |
| AC2 | The same org, mocked `createCheckoutSession` | Synthetic + reused mock | None | Reuses the existing mock already established for `standalone` signup tests — do not build a new one |
| AC3 | A Client org with an existing Agency relationship and at least one shared-access grant | Synthetic | None | |
| AC4 | Two concurrent operations: the conversion transaction and a grant-creation call, run against the same org | Synthetic | None | |

### PCI / sensitivity constraints

None — the story's own Architecture Constraint confirms no new billing/payment code is introduced.

### Gaps

None beyond the External-dependency note above.

---

## Unit Tests

### `convertsOrgTypeInPlaceRetainingSameOrgId`

- **Verifies:** AC1
- **Precondition:** A Client-org user with `team_memberships.role = 'admin'` for that org, with existing products/journeys attached to the org's `org_id`
- **Action:** Call the conversion adapter
- **Expected result:** `org_type` updated to `standalone` on the SAME `org_id` row; all previously-attached products/journeys/artefacts remain queryable under that same `org_id` after conversion
- **Edge case:** No

### `conversionRejectedForNonAdminRole`

- **Verifies:** AC1 (negative — role check)
- **Precondition:** A Client-org user whose `team_memberships.role` is NOT `'admin'` (e.g. `'viewer'`)
- **Action:** Call the conversion adapter/handler as that user
- **Expected result:** Rejected (403); `org_type` unchanged
- **Edge case:** No

### `existingRelationshipsAndGrantsSurviveConversion`

- **Verifies:** AC3
- **Precondition:** A Client org with an Agency relationship and an active grant, about to convert
- **Action:** Run the conversion adapter, then query relationships/grants for the same `org_id`
- **Expected result:** Relationship and grant rows are unchanged (same `relationship_id`, same `revoked_at = null`) and remain functionally enforced (Story 2's grant-check still returns true for the previously-granted resource) after conversion
- **Edge case:** No

### `concurrentConversionAndGrantCreationDoNotCorruptEachOther`

- **Verifies:** AC4
- **Precondition:** A Client org mid-conversion (transaction in flight) while a grant-creation call for the same org's relationship fires concurrently
- **Action:** Run both operations concurrently against the same fake-pool transaction boundary (simulating a race, e.g. via a controlled promise-ordering test double)
- **Expected result:** Both operations complete without corrupting each other's data — the final state is exactly one of: (a) grant created against the still-`client` org before conversion completes, or (b) grant created against the now-`standalone` org after conversion completes; never a partial/corrupted row (e.g. a grant referencing a relationship whose org row is mid-write, or a duplicate/torn `org_type` value). This is a genuine concurrency test using real interleaving, not a sequential call in disguise.
- **Edge case:** Yes — this is itself the edge case the story requires

---

## Integration Tests

### `conversionFlowEndToEndAsOrgAdmin`

- **Verifies:** AC1
- **Components involved:** Conversion route, organisations adapter
- **Precondition:** Client-org admin session
- **Action:** Full HTTP-level POST to the conversion confirmation route
- **Expected result:** `org_type` updated; response indicates success

### `conversionRedirectsToExistingStripeCheckout`

- **Verifies:** AC2
- **Components involved:** Conversion route, existing `routes/billing.js` `createCheckoutSession` (mocked)
- **Precondition:** Just-converted org
- **Action:** Follow the full HTTP-level redirect chain after conversion
- **Expected result:** Redirect target is the SAME `createCheckoutSession`-produced URL every new `standalone` signup uses — asserted by confirming the same function is called, not a separate/new checkout code path

### `relationshipsAndGrantsFunctionUnchangedPostConversionEndToEnd`

- **Verifies:** AC3
- **Components involved:** Conversion route, Story 2's grant-check guard, full route stack
- **Precondition:** Converted org with a pre-existing grant
- **Action:** Full HTTP-level GET for the previously-granted resource, as the (now-`standalone`, formerly-`client`) org's user
- **Expected result:** Resource still accessible exactly as before conversion — grant enforcement unaffected by the `org_type` change

### `concurrencyTestReRunAtRouteLevelUnderLoad`

- **Verifies:** AC4
- **Components involved:** Full route stack for both conversion and grant-creation endpoints
- **Precondition:** Same org, both routes fired concurrently via `Promise.all`
- **Action:** Fire both HTTP-level requests concurrently
- **Expected result:** Both requests complete with a well-defined, non-corrupted final state (matching the unit test's assertion) — no unhandled rejection, no torn write, no duplicate `organisations` row

---

## NFR Tests

### `conversionHasNoSpecificLatencyTargetBeyondPageLoadNorms`

- **NFR addressed:** Performance
- **Measurement method:** N/A — story NFR states conversion is a rare, deliberate action with no specific target
- **Pass threshold:** N/A
- **Tool:** **None — confirmed with story NFRs**

### `conversionRestrictedToAdminRoleServerSide`

- **NFR addressed:** Security
- **Measurement method:** Covered functionally by `conversionRejectedForNonAdminRole` above; this NFR test additionally confirms the check is server-side only (no reliance on a client-supplied flag)
- **Pass threshold:** Rejection driven purely by server-resolved `team_memberships.role`, never a request body/query value
- **Tool:** Node

### `conversionFormIsKeyboardNavigable`

- **NFR addressed:** Accessibility
- **Measurement method:** Static assertion that the confirmation UI uses real `<form>`/confirmation elements
- **Pass threshold:** Real elements present in rendered HTML
- **Tool:** Node (HTML-string assertion)

### `conversionIsAudited`

- **NFR addressed:** Audit
- **Measurement method:** Assert a log entry is emitted on conversion containing the converting `org_id`, the initiating user, and a timestamp
- **Pass threshold:** All three fields present
- **Tool:** Node (injectable logger stub)

---

## Out of Scope for This Test Plan

- Any change to the billing model itself — deferred to the follow-up billing-model-redesign discovery
- Reverting a conversion — not built, one-directional MVP
- Any change to which Agency relationships a converted org has

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real Stripe checkout session completion | Stripe's hosted flow is a third-party service, mocked at the adapter boundary — same convention as all other billing tests in this codebase | Manual verification scenario confirms the redirect reaches Stripe's real checkout in a test-mode Stripe account after merge |
