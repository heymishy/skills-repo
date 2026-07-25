## Test Plan: Billing journey staging-safe fixes (bjs-s1)

**Story reference:** artefacts/2026-07-25-billing-journey-staging-safe/stories/bjs-s1-billing-journey-staging-safe.md

## AC Coverage

| AC | Description | Test | Gap type | Risk |
|----|-------------|------|----------|------|
| AC1 | Secret unset -> /test/session unchanged | 1 test | — | 🟢 |
| AC2 | Secret+header, no tenantId -> default e2e-tester | 1 test | — | 🟢 |
| AC3 | tenantId without e2e- prefix -> 400, no session | 1 test | — | 🟢 |
| AC4 | tenantId with e2e- prefix -> session created | 1 test | — | 🟢 |
| AC5 | Secret unset -> webhook stub never activates | 1 test | — | 🟢 |
| AC6 | Secret+header+all e2e- tenantIds -> stub activates, dispatch runs | 2 tests | — | 🟢 |
| AC7 | Any non-e2e- tenantId field -> 400, no mutation | 3 tests (client_reference_id, metadata.tenant_id, subscription_details.metadata.tenant_id) | — | 🟢 |
| AC8 | Local NODE_ENV=test harness unaffected | existing bri-s3.5 Playwright suite re-run | — | 🟢 |

## Unit/Integration Tests (new file: tests/check-bjs-s1-billing-journey-staging-safe.js)

### testSessionSecretUnsetUnchanged
- **Verifies:** AC1
- **Action:** call the `/test/session` route handler directly (or via a thin router shim) with `NODE_ENV` not `'test'`, secret unset
- **Expected:** route does not match / falls through (behaviour identical to today)

### testSessionStubDefaultsToE2ETester
- **Verifies:** AC2
- **Action:** secret set, header matches, no `tenantId` query param
- **Expected:** session created with `tenantId === 'e2e-tester'`, 200 response

### testSessionStubRejectsNonE2ETenantId
- **Verifies:** AC3
- **Action:** secret set, header matches, `tenantId=real-customer-org`
- **Expected:** 400, no session created

### testSessionStubAcceptsE2ETenantId
- **Verifies:** AC4
- **Action:** secret set, header matches, `tenantId=e2e-custom-tenant`
- **Expected:** session created with that tenantId, 200

### testWebhookSecretUnsetStubNeverActivates
- **Verifies:** AC5
- **Action:** secret unset, webhook-stub header present, POST a synthetic event
- **Expected:** real `stripeClient.verifyWebhookSignature` is invoked (spy), stub path not taken

### testWebhookStubActivatesForAllE2ETenantIds
- **Verifies:** AC6
- **Action:** secret set, header matches, event with `client_reference_id: 'e2e-alice'`
- **Expected:** real `verifyWebhookSignature` NOT called; existing dispatch logic runs (e.g. `tenantPlan.setPlanState` called with `'e2e-alice'`)

### testWebhookStubActivatesForMetadataTenantId
- **Verifies:** AC6
- **Action:** event using `metadata.tenant_id: 'e2e-bob'` instead of `client_reference_id`
- **Expected:** stub activates, dispatch runs with that tenantId

### testWebhookStubRejectsNonE2EClientReferenceId
- **Verifies:** AC7
- **Action:** event with `client_reference_id: 'real-customer-org'`
- **Expected:** 400, no `tenantPlan`/`creditsModule` mutation call happens

### testWebhookStubRejectsNonE2EMetadataTenantId
- **Verifies:** AC7
- **Action:** event with `metadata.tenant_id: 'real-customer-org'`
- **Expected:** 400, no mutation

### testWebhookStubRejectsNonE2ESubscriptionMetadataTenantId
- **Verifies:** AC7
- **Action:** event with `subscription_details.metadata.tenant_id: 'real-customer-org'`
- **Expected:** 400, no mutation

## Existing Suite Re-run (AC8)

- Local Playwright run of `tests/e2e/bri-s3.5-billing-journey.spec.js` (`NODE_ENV=test`) — must remain 100% passing after the spec's `postWebhook`/`seedTenantSession` helper updates.

## Out of Scope for This Test Plan

- A live re-run against real `wuce-staging` — deferred to post-merge verification.
