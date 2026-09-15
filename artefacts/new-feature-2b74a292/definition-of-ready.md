# Definition of Ready — ep1-s1: Create Pod UI and Backend

**Feature:** new-feature-2b74a292 (Multi-User Role-Aware Synchronous Collaboration)
**Story:** ep1-s1 — Create Pod UI and Backend
**Date:** 2025-01-30
**Status:** Signed Off

---

## Contract Proposal

**What will be built:**
A Pod Manager UI in the web-ui layer with a form to create a pod (name, members, roles). Backend will add two new database tables (`pods`, `pod_members`), validate tenant scoping (ADR-025), and return confirmation to the UI.

**What will NOT be built:**
- Pod editing or archival (create-only for MVP)
- Pod templates
- Real-time pod member status or notifications

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1: Pod creation with happy path | Unit test on pod creation endpoint; E2E test on Pod Manager form → DB check | integration |
| AC2: Duplicate name validation | Unit test on validation logic; E2E test duplicate name rejection | unit |
| AC3: Invalid role rejection | Unit test on role validator; E2E test invalid role error display | unit |

**Assumptions:**
- Organisation role definitions already exist in a `roles` table or equivalent; validation checks against that list
- Pod names are unique per tenant only (not globally)
- Tenant context is available from the authenticated session

**Estimated touch points:**
Files: `src/web-ui/routes/pods.js`, `src/web-ui/public/pod-manager.html`, schema migration for `pods` and `pod_members` tables
Services: Postgres (new tables)
APIs: POST `/api/pods/create`, GET `/api/pods` (list for assignment in later stories)

---

## Hard Blocks Checklist

| Block | Check | Result |
|-------|-------|--------|
| H1 | User story in As/Want/So format with named persona | ✅ PASS |
| H2 | At least 3 ACs in Given/When/Then format | ✅ PASS |
| H3 | Every AC has at least one test in test plan | ✅ PASS |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage references a named metric | ✅ PASS |
| H6 | Complexity is rated | ✅ PASS |
| H7 | No unresolved HIGH findings from review | ✅ PASS |
| H8 | Test plan has no uncovered ACs | ✅ PASS |
| H8-ext | Schema dependency check | ✅ PASS — no upstream dependencies |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ PASS |
| H-E2E | CSS-layout-dependent AC check | ✅ PASS — no layout-dependent ACs |
| H-NFR | NFR profile or "None" stated | ✅ PASS — NFRs populated |
| H-NFR2 | Compliance NFR sign-off | ✅ PASS — no compliance NFRs |
| H-NFR3 | Data classification field | ✅ PASS — N/A for this story |
| H-NFR-profile | NFR profile presence | ✅ PASS — story NFRs are self-contained |
| H-GOV | Approved By section in discovery | ✅ PASS — present (approval pending) |
| H-ADAPTER | Injectable adapter wiring check | ✅ PASS — no adapters in scope |
| H-INF | Infra-plan gate check | ✅ PASS — not applicable |
| H-MIG | Migration-review gate check | ✅ PASS — not applicable |

---

## Coding Agent Instructions

You are implementing: **Create Pod UI and Backend (ep1-s1)**
Feature: new-feature-2b74a292 (Multi-User Role-Aware Synchronous Collaboration)
Oversight level: **Medium**

### Acceptance Criteria

**AC1:** Given an organisation admin is logged in and navigates to Pod Manager, When they click "Create Pod", enter name "Core Platform", add members Hamish (conductor), Susan (engineer), Darren (engineer), and save, Then the pod is created in the pods table, members are added to pod_members, and the admin sees "Pod created: Core Platform (3 members)".

**AC2:** Given a pod named "Core Platform" already exists for this tenant, When an org admin attempts to create another pod also named "Core Platform", Then the creation is rejected with an inline error ("A pod named 'Core Platform' already exists") and no new row is written to the pods table.

**AC3:** Given an org admin is creating a pod, When they attempt to assign a member a role that is not in the organisation's known role set, Then the save is rejected with an inline error naming the invalid role, and no pod is created.

### Touch Points (Binding Contract)

**Files you MUST modify:**
- `src/web-ui/routes/pods.js` — POST `/api/pods/create` handler, validation, tenant scoping
- `src/web-ui/public/pod-manager.html` — Pod Manager UI form
- Database schema — migration for `pods` table and `pod_members` table

**Files you MUST NOT modify:**
- Existing auth/session routes (auth is pre-wired; do not change `req.session` structure)
- Pod assignment logic (deferred to ep1-s2)
- Feature creation flow (deferred to ep1-s3)

**Out-of-scope:**
- Pod editing or deletion
- Archival
- Pod templates
- Real-time presence or notifications

### Architecture Constraints

- **ADR-025:** Pod is tenant-scoped; use `req.session.tenantId` to isolate pod creation per organisation
- **ADR-026:** `getProductDefaultPod()` is the canonical builder for later use; this story does not build that — only the pod CRUD foundation
- New `pods` and `pod_members` tables must be added to `pipeline-state.schema.json` simultaneously

### Applicable Standards

**From `.github/standards/web-ui/core.md`:**
- All form submissions must validate input on both client and server
- Session tenant context must be passed to all database operations
- Error messages must be specific and actionable (e.g. "A pod named 'Core Platform' already exists" — not just "Creation failed")

**From `.github/standards/web-ui/POLICY.md`:**
- WCAG 2.1 AA accessibility required for all form controls and error displays
- Form labels must be associated with inputs (use `<label for="...">`; not just placeholder text)

### Implementation Notes

1. **Pod creation endpoint** (`POST /api/pods/create`):
   - Extract `req.session.tenantId` (constraint: all pods scoped by tenant)
   - Validate: pod name is non-empty, unique per tenant
   - Validate: members array has at least 1 member
   - Validate: each member's role exists in the organisation's role definitions
   - If any validation fails, return 400 with specific error message (see AC2, AC3)
   - Insert row into `pods` table
   - For each member, insert row into `pod_members` (pod_id, user_id, role_id)
   - Return 200 with `{ podId, name, memberCount }`

2. **Pod Manager UI** (`pod-manager.html`):
   - Form with: Name field, Members picker (multi-select or add-one-by-one), Role dropdown per member
   - Client-side validation: name not empty, at least 1 member
   - On submit: POST to `/api/pods/create`
   - On success: show "Pod created: [name] ([count] members)", clear form, optionally show in list
   - On 400: display the server error message inline (e.g. in a red alert box near the submit button)

3. **Database schema**:
   - `pods` table: `podId` (UUID), `tenantId` (UUID), `name` (string, unique per tenant), `description` (nullable string), `createdBy` (userId), `createdAt` (timestamp), `status` (default 'active')
   - `pod_members` table: `podId` (UUID FK), `userId` (UUID FK), `roleId` (UUID FK), `joinedAt` (timestamp), `status` (default 'active')

### Test Coverage Expected

- **Unit tests** (3 minimum, one per AC):
  - AC1: Happy path — pod is created, members added, response is correct
  - AC2: Duplicate name is rejected with correct error message
  - AC3: Invalid role is rejected with correct error message
- **Integration tests** (recommended):
  - Tenant isolation: pod created by tenant A is not visible to tenant B
  - E2E (optional): form submission → pod appears in list → can be used in later stories

### Non-Functional Requirements

- Pod creation completes within 2s
- Pod names are unique per tenant
- Role definitions are validated against org's known role set
- Form is WCAG 2.1 AA accessible

### Success Criteria for DoD

- All 3 ACs verified (unit + integration tests passing)
- No unhandled exceptions in error paths
- Tenant scoping confirmed (two tenants, two pods with same name, no collision)
- Form is accessible (labels, error messages readable, keyboard-navigable)

---

## Sign-Off

**Status:** ✅ READY TO CODE

All hard blocks pass. No blocking findings. Standards have been injected. Coding Agent Instructions are complete.

Proceed to `/branch-setup` to create an isolated worktree and start implementation.