# Definition of Ready — ep1-s3: Feature Inherits Product Default Pod on Creation

**Feature:** new-feature-2b74a292 (Multi-User Role-Aware Synchronous Collaboration)  
**Story:** ep1-s3 — Feature Inherits Product Default Pod on Creation  
**Date:** 2026-09-16  
**Status:** Signed Off

---

## Contract Proposal

**What will be built:**
When a product owner creates a new feature under a product that has a default pod assigned (via ep1-s2), the feature creation endpoint will automatically detect the product's default pod, pre-populate a `podAssignments` array with that pod, and pre-populate the `feature_collaborators` table with every member of that pod — preserving each member's role exactly as defined in the pod. The feature details page will immediately display "Assigned pods: [Pod Name] ([member count] members)" without requiring any additional assignment step.

**What will NOT be built:**
- Allowing the product owner to override the default pod during feature creation (deferred to Epic 2)
- Listing pod members in the feature creation UI (deferred to Epic 2 UI stories)
- Editing or changing pod assignments after creation (handled separately)

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1: podAssignments recorded | Unit test on POST `/api/features` with product that has default pod set; assert response includes podAssignments array | unit |
| AC2: feature_collaborators pre-populated | Unit test: query feature_collaborators table after feature creation; assert 3 rows present matching pod members | unit |
| AC3: Role accuracy | Unit test: cross-reference each collaborator's roleId against pod_members; assert all roles match exactly | unit |

**Assumptions:**
- Product's default pod has already been set via ep1-s2 (pre-condition)
- Pod membership is stable at the time of feature creation (no concurrent pod edits)
- Tenant context is available via `req.session.tenantId` (ADR-025)
- Product owners have permission to create features in their products

**Estimated touch points:**
Files: `src/web-ui/routes/features.js` (feature creation handler), `src/db/migrations/` (if feature_collaborators table not already created in ep1-s2)  
Services: Postgres  
APIs: POST `/api/features` (modified to detect and inherit default pod)

---

## Hard Blocks — All Passing ✅

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS (3 ACs) |
| H3 | Every AC has test in test plan | ✅ PASS |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage to named metric | ✅ PASS ("Synchronous team access") |
| H6 | Complexity rated | ✅ PASS (Rating: 1) |
| H7 | No HIGH findings from review | ✅ PASS (Run 2: 0 HIGH) |
| H8 | Test plan covers all ACs | ✅ PASS (8 tests total) |
| H8-ext | Schema dependency check | ✅ PASS (feature_collaborators table, depends on ep1-s1 and ep1-s2) |
| H9 | Architecture Constraints; no HIGH findings | ✅ PASS (ADR-026, ADR-025 referenced) |
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

**Oversight:** Low

**Rationale:** Feature creation with automatic pod inheritance is straightforward inheritance logic. The feature creation flow is already established; this story extends it with a conditional lookup (check for product's default pod) and pre-population of dependent tables. No complex state machines, real-time concurrency, or merging logic.

**Action:** No tech lead review required before dispatch.

---

## Coding Agent Instructions

You are implementing: **Feature Inherits Product Default Pod on Creation (ep1-s3)**  
**Feature slug:** new-feature-2b74a292  
**Oversight level:** Low (no tech lead review required)

### Acceptance Criteria (Binding)

**AC1:** Given "Payments" product has default pod "Core Platform Pod" (set via ep1-s2), When a product owner creates a new feature "Feature A1", Then the feature is created with `podAssignments: [Core Platform Pod]` recorded against it.

**AC2:** Given the feature has been created with `podAssignments: [Core Platform Pod]`, When `feature_collaborators` is inspected, Then it is pre-populated with every member of Core Platform Pod (Hamish, Susan, Darren), each row referencing the pod as its source (`podId = "pod-core-uuid"`).

**AC3:** Given `feature_collaborators` has been pre-populated, When each collaborator's role is inspected, Then it matches their role in Core Platform Pod exactly (Hamish: conductor, Susan: engineer, Darren: engineer) — no role is dropped or defaulted incorrectly.

### Touch Points (Binding Contract)

**Files you MUST modify:**
- `src/web-ui/routes/features.js` — POST `/api/features` handler: add logic to (a) look up product's default pod from `pod_assignments`, (b) if found, pre-populate `podAssignments` in the feature response, (c) trigger pre-population of `feature_collaborators` table with all pod members
- `src/db/migrations/` — if `feature_collaborators` table does not already exist from ep1-s2, create it here (coordinate with ep1-s2 implementation)

**Files you MUST NOT modify:**
- Pod creation (ep1-s1)
- Product default pod assignment (ep1-s2)
- Feature creation UI/form (only the backend POST handler)
- Pod member tables or pod_members queries

### Architecture Constraints

- **ADR-025 (Multi-tenancy):** All operations are tenant-scoped via `req.session.tenantId`; no cross-tenant leakage
- **ADR-026 (Canonical builders):** Foundation for future `getFeatureCollaborators()` builder; this story implements the data write and read paths that the builder will later encapsulate

### Applicable Standards

**From `.github/standards/web-ui/core.md`:**
- Session tenant context required on all DB operations
- Error responses must be specific and actionable (not generic "Error")

**From `.github/standards/web-ui/POLICY.md`:**
- WCAG 2.1 AA accessibility minimum

### Implementation Specification

**Feature creation endpoint** (`POST /api/features`):
- Extract `tenantId` from `req.session`
- Validate: `productId` exists and belongs to this tenant
- Query `pod_assignments` for `productId` with `assignmentType = "inherit-to-all-features"` and `featureId IS NULL`
- If a default pod is found, retrieve `podId` from that assignment
- Create the feature in the `features` table with `featureId`, `productId`, `tenantId`
- If a default pod was found:
  - Insert to `podAssignments` table with `featureId`, `podId`, `tenantId`, `assignmentType = "feature-inherits-product-default"`
  - Query `pod_members` for the `podId` to get all members and their roles
  - For each member, insert to `feature_collaborators` with `featureId`, `userId`, `roleId`, `joinedAt = now()`, `podId`, `isApprover = false`
- Return HTTP 201 with response body: `{ featureId, productId, podAssignments: [{ podId, name, memberCount }], collaborators: [...] }`
- If any validation fails (product not found, tenant mismatch), return HTTP 400 with specific error message

**Database schema** (`feature_collaborators` table, if not created in ep1-s2):
```sql
CREATE TABLE feature_collaborators (
  collaboratorId UUID PRIMARY KEY,
  featureId UUID NOT NULL,
  userId UUID NOT NULL,
  roleId VARCHAR NOT NULL,
  joinedAt TIMESTAMP NOT NULL,
  podId UUID,  -- nullable if non-pod member
  isApprover BOOLEAN DEFAULT false,
  UNIQUE(featureId, userId)  -- one entry per user per feature
);
```

### Test Coverage (from test-plan.md)

- **Unit tests:** 3 (AC1 podAssignments recorded, AC2 collaborators pre-populated, AC3 role accuracy)
- **Integration tests:** 2 (full-path inheritance, tenant isolation)
- **NFR tests:** 3 (latency ≤2s, consistency, completeness)
- **Total:** 8 tests; all ACs covered; no gaps

### NFRs (Non-Functional Requirements)

- Feature creation with default pod inheritance completes within 2 seconds
- Collaborators are visible in feature settings immediately after creation (no additional query needed)
- Roles are correctly preserved (no defaults, no drops)

### Success Criteria for Definition of Done

- All 3 ACs passing (unit + integration tests green)
- No unhandled exceptions or error logs
- Tenant isolation verified (queries include `WHERE tenantId = ?`)
- Feature inherits default pod automatically — no manual assignment step required
- ep1-s1 pod creation and ep1-s2 product default assignment are already complete (pods and assignments exist before this story begins)

---

## Completion Summary

✅ **READY TO CODE**

All hard blocks pass (19/19). No blocking findings. Oversight level: Low. Coding Agent Instructions complete and binding.

**Next action:** Proceed to `/branch-setup`.