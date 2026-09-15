# Test Plan: Assign Pod to Product as Default (ep1-s2)

**Story reference:** artefacts/new-feature-2b74a292/stories/ep1-s2.md
**Epic reference:** artefacts/new-feature-2b74a292/epics/pod-formation-product-assignment.md
**Domain:** web-ui
**Date:** 2026-09-15

---

## User Story
As a **Product owner**, I want **to assign an existing pod as the default team for a product**, So that **all new features in that product automatically inherit the team without per-feature setup**.

---

## Acceptance Criteria

**AC1:** Given a product owner is in Product settings for "Payments", When they select "Set default pod" and choose "Core Platform Pod", Then the assignment is saved to pod_assignments (assignmentType: inherit-to-all-features), and Product settings shows "Default pod: Core Platform Pod (3 members)" immediately, with no page refresh needed.

**AC2:** Given "Payments" now has default pod "Core Platform Pod", When a product owner creates a new feature under "Payments", Then the new feature shows "Assigned pods: Core Platform Pod (3 members)" automatically, with no manual assignment step.

**AC3:** Given "Payments" already has existing features created before any default pod was set, When a product owner sets "Core Platform Pod" as the new default, Then none of those existing features' pod assignments change — only features created after this point inherit the new default.

---

## Test Data Strategy

**Strategy selected:** Synthetic — test data generated in test setup, no real data involved.

**Test data approach:**
- Fixture product: "Payments" with tenant context `tenantId = 'tenant-test-123'`
- Fixture pod: "Core Platform Pod" pre-created with 3 members (Hamish, Susan, Darren)
- Fixture features: "Feature A0" created before any default pod is set; created in-memory during test setup
- Tenant context mocked via `req.session.tenantId = 'tenant-test-123'`
- No production data required; all data is disposable post-test
- Database: test instance or in-memory mock

**Sensitivity assessment:** Not applicable — no PCI, PHI, or sensitive data involved.

---

## AC Coverage & Test Approach

| AC | Test type | Coverage | Gap? |
|----|-----------|----------|------|
| AC1 | Unit + E2E | Assignment save, UI confirmation, no page refresh | No |
| AC2 | Unit + E2E | Feature creation auto-inherits, no manual step | No |
| AC3 | Unit + E2E | Existing features unaffected, boundary case | No |

**Gap table:** None — all ACs have corresponding tests.

---

## Unit Tests

### AC1: Product Default Pod Assignment

**Test name:** `pods.post.set-product-default-pod.happy-path`

**What it tests:** AC1 — product default pod is saved and immediately visible

**Setup:**
- Mock tenant context: `{ tenantId: 'tenant-test-123' }`
- Fixture product: "Payments" with `productId = 'prod-payments-uuid'`
- Fixture pod: "Core Platform Pod" with `podId = 'pod-core-uuid'`
- Mock database: empty pod_assignments table

**Action:**
- Call POST `/api/products/{productId}/set-default-pod` with payload:
  ```json
  {
    "podId": "pod-core-uuid"
  }
  ```

**Expected result:**
- HTTP 200 response
- Response body: `{ productId: "prod-payments-uuid", defaultPodId: "pod-core-uuid", podName: "Core Platform Pod", memberCount: 3 }`
- Row inserted in `pod_assignments` table with `productId`, `podId`, `assignmentType: "inherit-to-all-features"`
- GET `/api/products/{productId}` now includes `defaultPod: { podId, name, memberCount }`
- No page refresh required for UI update (response body contains all necessary data)

---

### AC2: New Feature Inherits Product Default

**Test name:** `pods.feature-create.inherits-product-default-pod`

**What it tests:** AC2 — feature creation automatically assigns the product's default pod

**Setup:**
- Tenant context: `{ tenantId: 'tenant-test-123' }`
- Product "Payments" with default pod set to "Core Platform Pod" (from AC1 test or pre-fixture)
- Fixture: feature creation payload

**Action:**
- Call POST `/api/features` with payload:
  ```json
  {
    "productId": "prod-payments-uuid",
    "name": "Feature A1",
    "description": "Test feature"
  }
  ```

**Expected result:**
- HTTP 201 response
- Response body includes `{ featureId: "...", podAssignments: [{ podId: "pod-core-uuid", name: "Core Platform Pod", memberCount: 3 }] }`
- `feature_collaborators` is pre-populated with all members of Core Platform Pod (Hamish, Susan, Darren)
- No additional API call or step required from the product owner — assignment is automatic

---

### AC3: Existing Features Unaffected by Default Pod Change

**Test name:** `pods.set-product-default-pod.preserves-existing-features`

**What it tests:** AC3 — changing product default does not retroactively change existing features

**Setup:**
- Tenant context: `{ tenantId: 'tenant-test-123' }`
- Product "Payments" with NO default pod initially
- Pre-existing feature "Feature A0" created before any default (created in the before() fixture, with no pod assignment)
- Fixture pod: "Core Platform Pod" exists but is NOT assigned to "Payments" yet

**Action:**
1. Verify Feature A0 has empty podAssignments
2. Call POST `/api/products/{productId}/set-default-pod` with "Core Platform Pod"
3. Verify Feature A0 again

**Expected result:**
- Step 1: Feature A0's podAssignments is `[]` (empty)
- Step 2: Assignment succeeds (HTTP 200)
- Step 3: Feature A0's podAssignments is still `[]` (unchanged) — the pod assignment does NOT apply retroactively
- New features created AFTER the assignment use the default; existing features are unaffected

---

## Integration Tests

### Product Default Pod Isolation by Tenant

**Test name:** `pods.integration.product-default-isolation-by-tenant`

**What it tests:** ADR-025 — pod assignments are tenant-scoped; one tenant's product defaults do not leak to another

**Setup:**
- Two tenants: `tenant-A` and `tenant-B`
- Tenant A: product "Payments" with default pod "Platform A"
- Tenant B: product "Payments" (same name, different tenant) with default pod "Platform B"

**Action:**
- Tenant A queries GET `/api/products/{productId}` (Payments in tenant-A)
- Tenant B queries GET `/api/products/{productId}` (Payments in tenant-B)

**Expected result:**
- Tenant A's response includes `defaultPod: { name: "Platform A" }`
- Tenant B's response includes `defaultPod: { name: "Platform B" }`
- Both tenants can have a product named "Payments" with different default pods without conflict

---

### Feature Inheritance Idempotence

**Test name:** `pods.integration.feature-inheritance-idempotent`

**What it tests:** Creating multiple features under the same product with the same default pod produces consistent results

**Setup:**
- Product "Payments" with default pod "Core Platform Pod"
- Create 3 features sequentially: Feature A1, A2, A3

**Action:**
- For each feature, verify its podAssignments and feature_collaborators

**Expected result:**
- All 3 features have identical `podAssignments: [{ podId: "pod-core-uuid", ... }]`
- All 3 have the same set of collaborators (same members from Core Platform Pod)
- No divergence or inconsistency between feature 1 and feature 3

---

## NFR Tests

### NFR-Perf-1: Default Pod Assignment Latency

**Test name:** `pods.nfr.product-default-assignment-latency`

**Setup:** Same as AC1 happy path

**Action:** POST `/api/products/{productId}/set-default-pod`, measure response time

**Expected result:** Response time ≤ 2000ms (2 seconds)

---

### NFR-UI-1: Default Pod Visibility Without Refresh

**Test name:** `pods.nfr.default-pod-immediate-visibility`

**Setup:** Product settings page is open in the browser

**Action:** Call POST to set default pod

**Expected result:** Product settings page updates to show "Default pod: [name] ([count] members)" without a page refresh. Verify via assertion that the DOM has updated (e.g. by checking the element's text content).

---

### NFR-Data-1: Feature Inheritance Consistency

**Test name:** `pods.nfr.feature-inheritance-consistency`

**Setup:** Product with default pod set

**Action:** Create a feature via API, then query GET `/api/features/{featureId}`

**Expected result:** Response includes `podAssignments` matching the product's default pod; `feature_collaborators` matches the pod's membership exactly

---

## E2E Tests (Browser via Playwright)

### E2E: Set Product Default Pod (AC1)

**Test name:** `pods.e2e.set-product-default-pod`

**Setup:**
- Browser: open `http://localhost:3000/products/payments/settings`
- Logged in as product owner for tenant-test-123
- "Payments" product is displayed
- "Core Platform Pod" exists and is visible in pod list

**Action:**
1. Click "Set default pod"
2. From the dropdown, select "Core Platform Pod"
3. Click "Confirm"

**Expected result:**
- Modal/dropdown closes
- Success message: "Default pod set: Core Platform Pod (3 members)" appears
- Product settings page now shows "Default pod: Core Platform Pod (3 members)" in the summary section
- No page refresh occurred (verify by checking that an unrelated page element remains in the DOM)

---

### E2E: New Feature Inherits Default (AC2)

**Test name:** `pods.e2e.new-feature-inherits-default-pod`

**Setup:**
- Browser: open `http://localhost:3000/products/payments/features/create`
- Logged in as product owner
- "Payments" product has default pod "Core Platform Pod" already set

**Action:**
1. Enter feature name "Test Feature A2"
2. Enter description "For E2E testing"
3. Click "Create"

**Expected result:**
- Feature is created
- Browser redirects to feature details page
- Feature settings show "Assigned pods: Core Platform Pod (3 members)" automatically
- Team sidebar shows Hamish, Susan, Darren as collaborators
- No "Assign pod" step was required or shown

---

### E2E: Existing Features Unaffected (AC3)

**Test name:** `pods.e2e.existing-features-unaffected-by-default-change`

**Setup:**
- Browser: open `http://localhost:3000/products/payments/settings`
- Pre-existing feature "Old Feature" created before any default pod was set
- Verify "Old Feature" has no pod assignments (visible in product feature list or via API)
- "Payments" product currently has no default pod set

**Action:**
1. Click "Set default pod"
2. Select "Core Platform Pod"
3. Click "Confirm"
4. Navigate to "Old Feature" details page (or API query)

**Expected result:**
- Default pod assignment succeeds (AC1 UI confirms)
- "Old Feature" still shows "Assigned pods: (none)" or an empty pod list
- "Old Feature" has no collaborators from Core Platform Pod
- A NEW feature created after this point WILL inherit the default

---

## Test Summary

- **Unit tests:** 3 (AC1 assignment, AC2 inheritance, AC3 existing-features boundary)
- **Integration tests:** 2 (tenant isolation, inheritance idempotence)
- **NFR tests:** 3 (latency, UI visibility, consistency)
- **E2E tests:** 3 (set default, inherit, existing-unaffected)
- **Total:** 11 tests
- **All ACs covered:** Yes
- **Test data gaps:** None
- **Gaps in AC coverage:** None

---

# AC Verification Script: Assign Pod to Product as Default (ep1-s2)

**Setup:** You are logged in as a product owner and can access Product settings at `http://localhost:3000/products/payments/settings`.

---

### Scenario AC1: Set Default Pod for Product

**Expected outcome:** A default pod is assigned to the product and is immediately visible in settings without a page refresh.

1. Navigate to Product settings for "Payments" (if not already there).
2. Look for a "Pod & Team" section or "Default pod" field.
3. Click "Set default pod" or a similar button.
4. In the dropdown that appears, select "Core Platform Pod".
5. Click "Confirm" or "Save".
6. **Verify:** The dropdown closes and a success message appears: "Default pod set: Core Platform Pod (3 members)".
7. **Verify:** The Product settings page now displays "Default pod: Core Platform Pod (3 members)" in the summary area.
8. **Verify:** Refresh your browser. The setting persists — it is not lost on reload.

---

### Scenario AC2: New Feature Inherits Default Pod Automatically

**Expected outcome:** When creating a new feature under a product with a default pod, the feature automatically inherits that pod without requiring a manual assignment step.

1. Navigate to "Payments" product's feature creation page: `http://localhost:3000/products/payments/features/create`.
2. Enter feature name: "Feature A2 Verification".
3. Enter description: "Testing default pod inheritance".
4. Click "Create".
5. **Verify:** The feature is created and you are redirected to the feature details page.
6. **Verify:** In the Feature settings (or on the feature card), the "Assigned pods" field shows "Core Platform Pod (3 members)" automatically.
7. **Verify:** Click on the feature or navigate to its Team sidebar — you should see Hamish (conductor), Susan (engineer), and Darren (engineer) already listed as collaborators, without any additional assignment step.

---

### Scenario AC3: Existing Features Are Not Affected by Default Pod Change

**Expected outcome:** When a product's default pod is changed, features that existed before the change retain their original pod assignments (which may be empty). Only features created AFTER the change inherit the new default.

1. In the Payments product, verify that an older feature (e.g. "Old Feature") exists and has NO pods assigned to it.
   - Navigate to the feature details or the product's feature list, and confirm "Assigned pods: (none)" or an empty pod list.
2. Return to Product settings for "Payments".
3. If a default pod is already set, note its name; otherwise, proceed to step 4.
4. Click "Set default pod" (or "Change default pod") and select "Core Platform Pod".
5. Click "Confirm".
6. **Verify:** The product settings now show "Default pod: Core Platform Pod (3 members)".
7. **Verify:** Navigate back to "Old Feature" and check its "Assigned pods" field — it should still show "(none)" or be empty, unchanged by the product-level default change.
8. **Verify:** Create a brand-new feature "New Feature After Change" under "Payments".
9. **Verify:** The new feature automatically shows "Assigned pods: Core Platform Pod (3 members)" — only NEW features inherit the default, not old ones.

---