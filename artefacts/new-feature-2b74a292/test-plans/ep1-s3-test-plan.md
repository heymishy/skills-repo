# Test Plan: Feature Inherits Product Default Pod on Creation (ep1-s3)

**Story reference:** artefacts/new-feature-2b74a292/stories/ep1-s3.md
**Epic reference:** artefacts/new-feature-2b74a292/epics/pod-formation-product-assignment.md
**Domain:** web-ui
**Date:** 2026-09-16

---

## User Story
As a **Product owner**, I want **a newly-created feature to automatically inherit its product's default pod**, So that **I don't have to manually assign a team to every new feature**.

---

## Acceptance Criteria

**AC1:** Given "Payments" product has default pod "Core Platform Pod", When a product owner creates a new feature "Feature A1", Then the feature is created with podAssignments: [Core Platform Pod] recorded against it.

**AC2:** Given the feature has been created with podAssignments: [Core Platform Pod], When feature_collaborators is inspected, Then it is pre-populated with every member of Core Platform Pod (Hamish, Susan, Darren), each row referencing the pod as its source.

**AC3:** Given feature_collaborators has been pre-populated, When each collaborator's role is inspected, Then it matches their role in Core Platform Pod exactly (Hamish: conductor, Susan: engineer, Darren: engineer) — no role is dropped or defaulted incorrectly.

---

## Test Data Strategy

**Strategy selected:** Synthetic — test data generated in test setup, no real data involved.

**Test data approach:**
- Fixture product: "Payments" with tenant context `tenantId = 'tenant-test-123'`, `productId = 'prod-payments-uuid'`
- Fixture pod: "Core Platform Pod" pre-created with `podId = 'pod-core-uuid'` and 3 members (Hamish: conductor, Susan: engineer, Darren: engineer)
- Fixture pod_assignments: default assignment already set for "Payments" product (assignmentType: inherit-to-all-features, from ep1-s2 pre-condition)
- Feature creation payload: minimal valid feature record with productId and name
- Tenant context mocked via `req.session.tenantId = 'tenant-test-123'`
- No production data required; all data is disposable post-test
- Database: test instance or in-memory mock

**Sensitivity assessment:** Not applicable — no PCI, PHI, or sensitive data involved.

---

## AC Coverage & Test Approach

| AC | Test type | Coverage | Gap? |
|----|-----------|----------|------|
| AC1 | Unit | podAssignments recorded on feature creation | No |
| AC2 | Unit + Integration | feature_collaborators pre-populated from pod members | No |
| AC3 | Unit | Role accuracy — each collaborator's role matches pod | No |

**Gap table:** None — all ACs have corresponding tests.

---

## Unit Tests

### AC1: podAssignments Recorded on Feature Creation

**Test name:** `pods.feature-create.podassignments-recorded`

**What it tests:** AC1 — feature creation automatically records the product's default pod in podAssignments

**Setup:**
- Mock tenant context: `{ tenantId: 'tenant-test-123' }`
- Fixture product: "Payments" with `productId = 'prod-payments-uuid'`, default pod already set to `podId = 'pod-core-uuid'`
- Fixture pod: "Core Platform Pod" with 3 members
- Feature creation payload ready: `{ productId: 'prod-payments-uuid', name: 'Feature A1', description: '...' }`

**Action:**
- Call POST `/api/features` with feature creation payload

**Expected result:**
- HTTP 201 response
- Response body includes `{ featureId: "...", podAssignments: [{ podId: "pod-core-uuid", name: "Core Platform Pod", memberCount: 3 }] }`
- Query database: `SELECT podAssignments FROM features WHERE featureId = ?` returns the array with the default pod

---

### AC2: feature_collaborators Pre-populated with Pod Members

**Test name:** `pods.feature-create.collaborators-prepopulated`

**What it tests:** AC2 — feature_collaborators table is pre-populated with all members of the assigned pod

**Setup:**
- Same as AC1 (feature created with default pod assignment)
- Pod members in fixture: Hamish (conductor), Susan (engineer), Darren (engineer)

**Action:**
- After feature creation (from AC1), query `SELECT * FROM feature_collaborators WHERE featureId = ?`

**Expected result:**
- 3 rows returned, one per pod member
- Each row has: `featureId`, `userId`, `roleId`, `joinedAt`, `podId = 'pod-core-uuid'`
- User IDs correspond to Hamish, Susan, Darren
- All rows have `isApprover = false` (default)

---

### AC3: Collaborator Roles Match Pod Roles Exactly

**Test name:** `pods.feature-create.collaborator-roles-match-pod`

**What it tests:** AC3 — each collaborator's role in feature_collaborators matches their role in the pod

**Setup:**
- Same as AC1/AC2 (feature created with pre-populated collaborators)
- Fixture pod roles: Hamish → conductor, Susan → engineer, Darren → engineer

**Action:**
- Query feature_collaborators for the newly created feature
- For each row, cross-reference the roleId against the pod_members table for the same podId
- Assert role match

**Expected result:**
- Hamish's roleId in feature_collaborators matches "conductor" (as stored in pod_members for Hamish in pod-core-uuid)
- Susan's roleId matches "engineer"
- Darren's roleId matches "engineer"
- No roles are dropped, defaulted, or mismatched

---

## Integration Tests

### Feature Creation with Default Pod — Full Path

**Test name:** `pods.integration.feature-creation-with-default-pod-full-path`

**What it tests:** Complete feature creation flow with default pod inheritance; verifies all three ACs' data flow together

**Setup:**
- Tenant context: `{ tenantId: 'tenant-test-123' }`
- Product "Payments" with default pod "Core Platform Pod" already set (from ep1-s2 pre-condition)
- Pod "Core Platform Pod" with 3 members

**Action:**
1. Call POST `/api/features` with product "Payments"
2. Query `features` table for the new feature
3. Query `podAssignments` for that feature
4. Query `feature_collaborators` for that feature
5. Cross-check roles against pod_members

**Expected result:**
- Features row has `featureId` and `productId` correctly set
- podAssignments row exists with `assignmentType = "inherit-to-all-features"`, pointing at the default pod
- feature_collaborators has 3 rows, one per pod member, with correct roles
- Every cross-reference (featureId → podId → roleId) is valid and consistent

---

### Feature Creation Isolation by Tenant

**Test name:** `pods.integration.feature-creation-isolation-by-tenant`

**What it tests:** ADR-025 — feature creation with default pod is tenant-scoped; one tenant's product does not inherit another's default pod

**Setup:**
- Tenant A: product "Payments" with default pod "Platform A"
- Tenant B: product "Payments" (same name, different tenant) with default pod "Platform B"
- Feature created in Tenant A's "Payments"

**Action:**
- Create feature in Tenant A
- Query feature_collaborators for Tenant A's feature
- Verify the members came from "Platform A", not "Platform B"

**Expected result:**
- Tenant A's feature has collaborators from "Platform A"
- Tenant B's product and features are completely unaffected

---

## NFR Tests

### NFR-Perf-1: Feature Creation Latency

**Test name:** `pods.nfr.feature-creation-latency-with-default-pod`

**Setup:** Same as AC1

**Action:** POST `/api/features`, measure response time

**Expected result:** Response time ≤ 2000ms (2 seconds), including the pod lookup and feature_collaborators pre-population

---

### NFR-Data-1: feature_collaborators Consistency

**Test name:** `pods.nfr.collaborators-consistency-with-pod`

**Setup:** Same as AC1/AC2

**Action:** Create feature, query feature_collaborators, count rows

**Expected result:** Row count = pod member count (3); no duplicates; no missing members

---

### NFR-Completeness-1: All Collaborator Fields Populated

**Test name:** `pods.nfr.collaborators-fields-complete`

**Setup:** Feature created with default pod

**Action:** Query one feature_collaborators row; check every required field

**Expected result:** `featureId`, `userId`, `roleId`, `joinedAt`, `podId` all non-null; `isApprover` has a default value (false); no fields are undefined or placeholder

---

## Test Summary

- **Unit tests:** 3 (AC1 podAssignments, AC2 collaborators pre-populated, AC3 role accuracy)
- **Integration tests:** 2 (full-path, tenant isolation)
- **NFR tests:** 3 (latency, consistency, completeness)
- **Total:** 8 tests
- **All ACs covered:** Yes
- **Test data gaps:** None
- **Gaps in AC coverage:** None

---

# AC Verification Script: Feature Inherits Product Default Pod on Creation (ep1-s3)

**Setup:** You are logged in as a product owner and can access "Payments" product settings at `http://localhost:3000/products/payments/settings`. "Payments" already has default pod "Core Platform Pod" assigned (from ep1-s2 completed).

---

### Scenario AC1: podAssignments Recorded on Feature Creation

**Expected outcome:** When you create a new feature under "Payments", the feature is immediately recorded with the default pod assigned.

1. Navigate to "Payments" product's feature creation page: `http://localhost:3000/products/payments/features/create`.
2. Enter feature name: "Feature A1 Verification".
3. Enter description: "Testing default pod inheritance".
4. Click "Create".
5. **Verify:** The feature is created and you are redirected to the feature details page.
6. **Verify:** In the browser's developer console, run `fetch('/api/features/{featureId}').then(r => r.json()).then(d => console.log(d.podAssignments))` (replace `{featureId}` with the actual feature ID from the URL). The output should show: `[{ podId: "...", name: "Core Platform Pod", memberCount: 3 }]`.
7. Alternatively, in Feature settings, look for a "Pod Assignment" or "Assigned Pods" field showing "Core Platform Pod (3 members)".

---

### Scenario AC2: feature_collaborators Pre-populated

**Expected outcome:** The feature's team sidebar automatically shows all members of the inherited pod, without requiring a manual assignment step.

1. Navigate to Feature A1 details page (from Scenario AC1, or directly: `http://localhost:3000/features/{featureId}`).
2. Look for a "Team" sidebar or "Collaborators" section on the page.
3. **Verify:** The sidebar lists exactly 3 collaborators: Hamish, Susan, and Darren.
4. **Verify:** Each name is displayed with their role: "Hamish (conductor)", "Susan (engineer)", "Darren (engineer)".
5. **Verify:** No "Assign collaborators" step was required — they were added automatically.
6. **Verify:** If you refresh the page, the same 3 collaborators remain listed (not transient).

---

### Scenario AC3: Collaborator Roles Match Pod Roles

**Expected outcome:** Every collaborator's role in the feature matches their role in the original pod.

1. From Feature A1's Team sidebar (Scenario AC2), note the roles displayed: Hamish (conductor), Susan (engineer), Darren (engineer).
2. Navigate to Pod Manager (or Admin > Pods) and view "Core Platform Pod" details.
3. **Verify:** "Core Platform Pod" lists the same 3 members with the same roles:
   - Hamish: conductor
   - Susan: engineer
   - Darren: engineer
4. **Verify:** The roles in Feature A1's sidebar exactly match the roles in the pod definition — no role has been changed, dropped, or defaulted incorrectly.
5. Create a second feature "Feature A2" under "Payments" (same default pod).
6. **Verify:** Feature A2's Team sidebar shows the same 3 collaborators with the same roles, confirming consistency across features.

---