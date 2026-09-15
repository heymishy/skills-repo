# Test Plan: Create Pod UI and Backend (ep1-s1)

**Story reference:** artefacts/new-feature-2b74a292/stories/ep1-s1.md
**Epic reference:** artefacts/new-feature-2b74a292/epics/pod-formation-product-assignment.md
**Domain:** web-ui
**Date:** 2026-09-15

---

## User Story
As an **Organisation administrator**, I want **to create a pod — a named team with members and their roles — and have it persisted in the system**, So that **I have a reusable team definition that can later be assigned to products**.

---

## Acceptance Criteria

**AC1:** Given an organisation admin is logged in and navigates to Pod Manager, When they click "Create Pod", enter name "Core Platform", add members Hamish (conductor), Susan (engineer), Darren (engineer), and save, Then the pod is created in the pods table, members are added to pod_members, and the admin sees "Pod created: Core Platform (3 members)".

**AC2:** Given a pod named "Core Platform" already exists for this tenant, When an org admin attempts to create another pod also named "Core Platform", Then the creation is rejected with an inline error ("A pod named 'Core Platform' already exists") and no new row is written to the pods table.

**AC3:** Given an org admin is creating a pod, When they attempt to assign a member a role that is not in the organisation's known role set, Then the save is rejected with an inline error naming the invalid role, and no pod is created.

---

## Test Data Strategy

**Strategy selected:** Synthetic — test data generated in test setup, no real data involved.

**Test data approach:**
- Fixture users (Hamish, Susan, Darren) are created in-memory during test setup with UUIDs
- Known roles (conductor, engineer, architect, product) are pre-defined in a test role registry
- Tenant context is mocked via `req.session.tenantId = 'tenant-test-123'`
- Pod names are generated per test (e.g. "Core Platform Pod Test Run 1") to avoid collision across parallel test runs
- No production data required; all data is disposable post-test
- Database: test instance or in-memory mock (see unit test setup)

**Sensitivity assessment:** Not applicable — no PCI, PHI, or sensitive data involved.

---

## AC Coverage & Test Approach

| AC | Test type | Coverage | Gap? |
|----|-----------|----------|------|
| AC1 | Unit + E2E | Happy path: form submission, pod creation, member insertion, UI confirmation | No |
| AC2 | Unit + E2E | Duplicate name validation, error rendering, no DB write on rejection | No |
| AC3 | Unit + E2E | Invalid role validation, error message specificity, no pod creation on failure | No |

**Gap table:** None — all ACs have corresponding tests.

---

## Unit Tests

### AC1: Pod Creation Happy Path

**Test name:** `pods.post.create-pod.happy-path`

**What it tests:** AC1 — pod creation with valid name and members

**Setup:**
- Mock tenant context: `{ tenantId: 'tenant-test-123' }`
- Mock org roles: `[{ roleId: 'role-conductor', name: 'conductor' }, { roleId: 'role-engineer', name: 'engineer' }]`
- Fixture users: Hamish (hamish-uuid), Susan (susan-uuid), Darren (darren-uuid)
- Mock database: set up empty pods and pod_members tables

**Action:**
- Call POST `/api/pods/create` with payload:
  ```json
  {
    "name": "Core Platform Test Run 1",
    "members": [
      { "userId": "hamish-uuid", "roleId": "role-conductor" },
      { "userId": "susan-uuid", "roleId": "role-engineer" },
      { "userId": "darren-uuid", "roleId": "role-engineer" }
    ]
  }
  ```

**Expected result:**
- HTTP 200 response
- Response body: `{ podId: "...", name: "Core Platform Test Run 1", memberCount: 3 }`
- Pod row created in `pods` table with `tenantId: 'tenant-test-123'`, `name: 'Core Platform Test Run 1'`
- Three rows inserted in `pod_members` table, each with correct `userId` and `roleId`
- No errors in logs

---

### AC2: Duplicate Name Rejection

**Test name:** `pods.post.create-pod.duplicate-name-rejection`

**What it tests:** AC2 — validation rejects duplicate pod names within same tenant

**Setup:**
- Tenant context: `{ tenantId: 'tenant-test-123' }`
- Pre-existing pod: "Core Platform Duplicate Test" already in `pods` table for `tenant-test-123`
- Fixture: same members as AC1

**Action:**
- POST `/api/pods/create` with name "Core Platform Duplicate Test" (same as existing)

**Expected result:**
- HTTP 400 response
- Response body: `{ error: "A pod named 'Core Platform Duplicate Test' already exists" }`
- No new row written to `pods` table (count remains 1)
- Error message includes the specific pod name
- No pod_members rows created

---

### AC3: Invalid Role Rejection

**Test name:** `pods.post.create-pod.invalid-role-rejection`

**What it tests:** AC3 — validation rejects roles not in the org's known role set

**Setup:**
- Tenant context: `{ tenantId: 'tenant-test-123' }`
- Known roles: `[conductor, engineer, architect, product]` (no role named "wizard")
- Fixture: attempt to assign Hamish to "wizard" role

**Action:**
- POST `/api/pods/create` with payload:
  ```json
  {
    "name": "Invalid Role Test Pod",
    "members": [
      { "userId": "hamish-uuid", "roleId": "role-wizard" }
    ]
  }
  ```

**Expected result:**
- HTTP 400 response
- Response body: `{ error: "Invalid role: 'wizard'. Valid roles are: conductor, engineer, architect, product" }`
- No pod row created (count remains at baseline)
- No pod_members rows created
- Error message names the invalid role and lists valid roles

---

## Integration Tests

### Pod Creation Isolation by Tenant

**Test name:** `pods.integration.tenant-isolation`

**What it tests:** ADR-025 — pods are tenant-scoped; one tenant's pods do not leak to another

**Setup:**
- Two tenants: `tenant-A` and `tenant-B`
- Tenant A session creates pod "Platform A" with one member
- Tenant B session creates pod "Platform B" with one member

**Action:**
- Tenant A queries GET `/api/pods` (list pods)
- Tenant B queries GET `/api/pods` (list pods)

**Expected result:**
- Tenant A's response includes only "Platform A"
- Tenant B's response includes only "Platform B"
- Both tenants can have a pod named "Core Platform" without conflict (isolated by tenant)

---

### Pod Member Insertion Atomicity

**Test name:** `pods.integration.member-insertion-atomic`

**What it tests:** Pod and member rows are created together; partial creation is avoided

**Setup:** Fixture pod creation with 3 members

**Action:** POST `/api/pods/create` (all 3 members valid)

**Expected result:**
- Pod row exists in `pods` table
- All 3 member rows exist in `pod_members` table
- No orphaned pods (pod with no members) or orphaned members (members with no pod)
- If any member insert fails, entire pod creation is rolled back (transaction semantics)

---

## NFR Tests

### NFR-Perf-1: Pod Creation Latency

**Test name:** `pods.nfr.creation-latency`

**Setup:** Same as AC1 happy path

**Action:** POST `/api/pods/create`, measure response time from request to response

**Expected result:** Response time ≤ 2000ms (2 seconds)

---

### NFR-Val-1: Pod Names Unique per Tenant

**Test name:** `pods.nfr.uniqueness`

**Setup:** Two creation attempts with same name in same tenant

**Action:** First succeeds, second fails with specific error

**Expected result:** Database constraint (UNIQUE(tenantId, name)) or application validation enforces uniqueness

---

### NFR-Val-2: Roles Validated Against Known Set

**Test name:** `pods.nfr.role-validation`

**Setup:** Attempt to create pod with unknown role

**Action:** POST with invalid role

**Expected result:** Rejected before DB insert; error message lists valid roles

---

## E2E Tests (Browser via Playwright)

### E2E: Full Pod Creation Flow (AC1)

**Test name:** `pods.e2e.create-pod-full-flow`

**Setup:**
- Browser: open `http://localhost:3000/admin/pods/manager`
- Logged in as tenant admin for `tenant-test-123`

**Action:**
1. Click "Create Pod" button
2. Enter name: "Core Platform E2E Test"
3. Click "Add Member" (1st)
4. Select Hamish from user dropdown
5. Select "conductor" from role dropdown
6. Click "Add Member" (2nd)
7. Select Susan, select "engineer"
8. Click "Add Member" (3rd)
9. Select Darren, select "engineer"
10. Click "Save"

**Expected result:**
- Modal/form closes
- Success message: "Pod created: Core Platform E2E Test (3 members)" appears
- Pod list now includes "Core Platform E2E Test (3 members)"
- Verify in browser DevTools or test assertion that pod row exists in DOM

---

### E2E: Duplicate Name Error Display (AC2)

**Test name:** `pods.e2e.duplicate-name-error`

**Setup:**
- Browser: `http://localhost:3000/admin/pods/manager`
- Pre-existing pod: "Core Platform Duplicate E2E" visible in list

**Action:**
1. Click "Create Pod"
2. Enter name: "Core Platform Duplicate E2E"
3. Add one member (e.g. Hamish as conductor)
4. Click "Save"

**Expected result:**
- Form does NOT close
- Error message appears inline: "A pod named 'Core Platform Duplicate E2E' already exists"
- Form fields remain populated
- Pod list still shows only 1 "Core Platform Duplicate E2E"

---

### E2E: Invalid Role Error Display (AC3)

**Test name:** `pods.e2e.invalid-role-error`

**Setup:**
- Browser: `http://localhost:3000/admin/pods/manager`
- Role dropdown populated with valid roles (conductor, engineer, architect, product)

**Action:**
1. Click "Create Pod"
2. Enter name: "Test Invalid Role Pod"
3. Click "Add Member"
4. Select Hamish
5. Try to select an invalid role (if UI allows) or enter "wizard" as a custom value
6. Click "Save"

**Expected result:**
- Form does NOT close
- Error message appears: "Invalid role: 'wizard'. Valid roles are: conductor, engineer, architect, product"
- No pod is created

---

## Test Summary

- **Unit tests:** 3 (AC1 happy path, AC2 duplicate validation, AC3 role validation)
- **Integration tests:** 2 (tenant isolation, member atomicity)
- **NFR tests:** 3 (latency, uniqueness, role validation)
- **E2E tests:** 3 (full flow, duplicate error, invalid role error)
- **Total:** 11 tests
- **All ACs covered:** Yes
- **Test data gaps:** None
- **Gaps in AC coverage:** None

---

## Output 2: AC Verification Script

---

# AC Verification Script: Create Pod UI and Backend (ep1-s1)

**Setup:** You are logged in as an organisation administrator and can access the Pod Manager at `http://localhost:3000/admin/pods/manager`.

---

### Scenario AC1: Create a Pod with Multiple Members

**Expected outcome:** A new pod with three members is created and visible in the pods list with a success message.

1. Navigate to Pod Manager (if not already there).
2. Click the "Create Pod" button.
3. In the "Pod Name" field, type "Core Platform".
4. Click "Add Member" to add the first member.
5. In the member picker, select "Hamish" from the user list.
6. In the role dropdown, select "conductor".
7. Click "Add Member" again to add a second member.
8. Select "Susan" from the user list.
9. In the role dropdown, select "engineer".
10. Click "Add Member" one more time.
11. Select "Darren" from the user list.
12. In the role dropdown, select "engineer".
13. Click "Save".
14. **Verify:** The form closes and a success message appears: "Pod created: Core Platform (3 members)".
15. **Verify:** The Pod Manager list now includes a row showing "Core Platform (3 members)" with today's date.
16. **Verify:** Click on the pod name to view members; you should see Hamish (conductor), Susan (engineer), and Darren (engineer).

---

### Scenario AC2: Reject Duplicate Pod Name

**Expected outcome:** Attempting to create a second pod with the same name is rejected with a clear error message, and no duplicate pod is created.

1. In the Pod Manager, verify "Core Platform" pod exists in the list (from Scenario AC1 or pre-test setup).
2. Click "Create Pod".
3. In the "Pod Name" field, type "Core Platform" (the same name).
4. Add at least one member (e.g. Hamish as conductor).
5. Click "Save".
6. **Verify:** The form does NOT close.
7. **Verify:** An error message appears on the form: "A pod named 'Core Platform' already exists".
8. **Verify:** The form fields remain populated.
9. Click "Cancel" or navigate away.
10. **Verify:** The pods list still shows only one "Core Platform" (no duplicate was created).

---

### Scenario AC3: Reject Invalid Role

**Expected outcome:** Assigning an invalid role is rejected with an error naming the invalid role and listing valid ones.

1. In the Pod Manager, click "Create Pod".
2. In the "Pod Name" field, type "Test Validation Pod".
3. Click "Add Member".
4. Select "Hamish" from the user list.
5. In the role dropdown, select "conductor" (any valid role).
6. Click "Add Member" again.
7. Select "Susan".
8. **Try to enter an invalid role:** If the UI allows free text in the role field, type "wizard" or another invalid role name. If the role field is a dropdown-only, verify that only conductor, engineer, architect, and product are available (no custom/invalid roles).
9. Click "Save".
10. **Verify:** The form does NOT close.
11. **Verify:** An error message appears: "Invalid role: [role name]. Valid roles are: conductor, engineer, architect, product".
12. **Verify:** No pod is created (the pods list does not gain a "Test Validation Pod" entry).
13. Click "Cancel" and return to the pods list.

---