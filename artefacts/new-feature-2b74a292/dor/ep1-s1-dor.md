# Definition of Ready — ep1-s1: Create Pod UI and Backend

**Feature:** new-feature-2b74a292 (Multi-User Role-Aware Synchronous Collaboration)  
**Story:** ep1-s1 — Create Pod UI and Backend  
**Date:** 2026-09-15  
**Status:** Signed Off

---

## Contract Proposal

**What will be built:**
A Pod Manager UI in the web-ui layer with a form to create a pod (name, members, assigned roles). Backend adds two new database tables (`pods`, `pod_members`), validates tenant scoping (ADR-025), enforces uniqueness constraints per tenant, validates roles against the organisation's known role set, and returns confirmation to the UI.

**What will NOT be built:**
- Pod editing or archival (deferred to ep4-s3)
- Pod templates or pre-built team structures (deferred)
- Real-time pod member status or notifications (deferred)
- Bulk pod operations (deferred)

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1: Pod creation happy path | Unit test on POST `/api/pods/create` endpoint; E2E test on form submission | integration |
| AC2: Duplicate name rejection | Unit test on uniqueness validation; E2E test error message display | unit |
| AC3: Invalid role rejection | Unit test on role validator; E2E test error message specificity | unit |

**Assumptions:**
- Organisation role definitions exist in a roles table or cache
- Pod names are unique per tenant (not globally unique)
- Tenant context is available via `req.session.tenantId` (ADR-025)
- Role validation happens against a known set: conductor, engineer, architect, product

**Estimated touch points:**
Files: `src/web-ui/routes/pods.js`, `src/web-ui/public/pod-manager.html`, `src/db/migrations/` (schema)  
Services: Postgres  
APIs: POST `/api/pods/create`, GET `/api/pods`

---

## Hard Blocks — All Passing ✅

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS (3 ACs) |
| H3 | Every AC has test in test plan | ✅ PASS |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage to named metric | ✅ PASS (Synchronous team access) |
| H6 | Complexity rated | ✅ PASS (Rating: 2) |
| H7 | No HIGH findings from review | ✅ PASS (Run 2: 0 HIGH) |
| H8 | Test plan covers all ACs | ✅ PASS |
| H8-ext | Schema dependency check | ✅ PASS (new schema, no upstream dependencies) |
| H9 | Architecture Constraints; no HIGH findings | ✅ PASS (ADR-025, ADR-026 referenced) |
| H-E2E | CSS-layout-dependent check | ✅ PASS (no CSS-layout ACs) |
| H-NFR | NFR profile or "None" | ✅ PASS (NFRs listed in story) |
| H-NFR2 | Compliance NFR sign-off | ✅ PASS (no regulated compliance NFRs) |
| H-NFR3 | Data classification | ✅ PASS (non-sensitive data) |
| H-NFR-profile | NFR profile presence | ✅ PASS (story declares NFRs; no separate profile required) |
| H-GOV | Approved By in discovery artefact | ✅ PASS (discovery.md "Approved By" section present) |
| H-ADAPTER | Injectable adapter check (D37) | ✅ PASS (no injectable adapters introduced) |
| H-INF | Infra-plan gate | ✅ PASS (hasInfraTrack absent; check skipped) |
| H-MIG | Migration-review gate | ✅ PASS (hasMigrationTrack absent; check skipped) |

---

## Warnings — None Triggered

No W1–W5 warnings apply to this story.

---

## Oversight Level

**Oversight:** Medium

**Rationale:** New schema and admin UI with straightforward CRUD semantics; no complex merging or state machines yet.

**Action:** Share this DoR artefact with the tech lead before assigning to the coding agent.

---

## Coding Agent Instructions

You are implementing: **Create Pod UI and Backend (ep1-s1)**  
**Feature slug:** new-feature-2b74a292  
**Oversight level:** Medium (tech lead review required before dispatch)

### Acceptance Criteria (Binding)

**AC1:** Given an organisation admin is logged in and navigates to Pod Manager, When they click "Create Pod", enter name "Core Platform", add members Hamish (conductor), Susan (engineer), Darren (engineer), and save, Then the pod is created in the pods table, members are added to pod_members, and the admin sees "Pod created: Core Platform (3 members)".

**AC2:** Given a pod named "Core Platform" already exists for this tenant, When an org admin attempts to create another pod also named "Core Platform", Then the creation is rejected with an inline error ("A pod named 'Core Platform' already exists") and no new row is written to the pods table.

**AC3:** Given an org admin is creating a pod, When they attempt to assign a member a role that is not in the organisation's known role set, Then the save is rejected with an inline error naming the invalid role, and no pod is created.

### Touch Points (Binding Contract)

**Files you MUST modify:**
- `src/web-ui/routes/pods.js` — POST `/api/pods/create` handler with validation
- `src/web-ui/public/pod-manager.html` — Pod Manager form UI
- `src/db/migrations/` — Schema migration for `pods` and `pod_members` tables

**Files you MUST NOT modify:**
- Existing auth/session routes
- Pod assignment logic (ep1-s2)
- Feature creation (ep1-s3)
- Other routes or services

### Architecture Constraints

- **ADR-025 (Multi-tenancy):** All operations are tenant-scoped via `req.session.tenantId`; no cross-tenant leakage
- **ADR-026 (Canonical builders):** Foundation for future `getProductDefaultPod()` and `getFeatureCollaborators()` patterns; no builder implemented in this story

### Applicable Standards

**From `.github/standards/web-ui/core.md`:**
- Form validation on both client and server
- Session tenant context required on all DB operations
- Error messages must be specific and actionable (not generic "Error")

**From `.github/standards/web-ui/POLICY.md`:**
- WCAG 2.1 AA accessibility minimum
- Form labels must be associated with inputs (use `<label for>`)

### Implementation Specification

**Pod creation endpoint** (`POST /api/pods/create`):
- Extract `tenantId` from `req.session`
- Validate: pod name is non-empty, unique per tenant, at least 1 member, all roles exist
- Return HTTP 400 with specific error message if validation fails (do not create any data)
- On success: insert to `pods` table, insert all members to `pod_members` table, return HTTP 200 with `{ podId, name, memberCount }`

**Pod Manager form UI:**
- Input field: pod name (required)
- Section: members (add multiple)
  - Per member: user picker dropdown, role dropdown
  - "Add Member" button to add another row
  - "Remove" button per member row
- "Save" button submits POST request
- On success: show "Pod created: [name] ([count] members)", close form
- On error: display server error inline, keep form open with fields populated

**Database schema:**
```sql
CREATE TABLE pods (
  podId UUID PRIMARY KEY,
  tenantId UUID NOT NULL,
  name VARCHAR NOT NULL,
  createdBy UUID,
  createdAt TIMESTAMP,
  status VARCHAR DEFAULT 'active',
  UNIQUE(tenantId, name)
);

CREATE TABLE pod_members (
  id UUID PRIMARY KEY,
  podId UUID NOT NULL REFERENCES pods(podId),
  userId UUID NOT NULL,
  roleId UUID NOT NULL,
  joinedAt TIMESTAMP,
  status VARCHAR DEFAULT 'active'
);
```

### Test Coverage (from test-plan.md)

- **Unit tests:** 3 (AC1 happy path, AC2 duplicate validation, AC3 role validation)
- **Integration tests:** 2 (tenant isolation, member atomicity)
- **NFR tests:** 3 (latency ≤2s, uniqueness enforced, role validation)
- **E2E tests:** 3 (full flow, duplicate error display, invalid role error display)
- **Total:** 11 tests; all ACs covered; no gaps

### NFRs (Non-Functional Requirements)

- Pod creation completes within 2 seconds
- Pod names are unique per tenant (database constraint + application validation)
- Roles are validated against known set before save
- WCAG 2.1 AA accessibility

### Success Criteria for Definition of Done

- All 3 ACs passing (unit + E2E tests green)
- No unhandled exceptions or error logs
- Tenant isolation verified (queries include `WHERE tenantId = ?`)
- Form is keyboard-accessible and WCAG 2.1 AA compliant
- Uniqueness constraint enforced at both application and database level

---

## Completion Summary

✅ **READY TO CODE**

All hard blocks pass (19/19). No blocking findings. Architecture constraints confirmed (ADR-025, ADR-026 foundation). Standards injected. Coding Agent Instructions complete and binding.

**Next action after tech lead review:** Proceed to `/branch-setup`.