# Definition of Ready — ep1-s2: Assign Pod to Product as Default

**Feature:** new-feature-2b74a292 (Multi-User Role-Aware Synchronous Collaboration)  
**Story:** ep1-s2 — Assign Pod to Product as Default  
**Date:** 2026-09-15  
**Status:** Signed Off

---

## Contract Proposal

**What will be built:**
A "Set default pod" UI in Product settings that allows a product owner to select an existing pod from a dropdown and persist it as the product's default. When saved, the assignment record is written to the `pod_assignments` table with `assignmentType: inherit-to-all-features`. Product settings immediately displays the default pod name and member count without a page refresh.

**What will NOT be built:**
- Changing or updating a product's default pod after features already exist (deferred to Epic 4)
- Unassigning a product's default pod (deferred)
- Pod creation (handled in ep1-s1)

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1: Assignment saved + UI confirmation | Unit test on POST `/api/products/{productId}/set-default-pod`; E2E test on form submission and immediate UI update | integration |
| AC2: New features auto-inherit default | Unit test on feature creation flow; E2E test full create-feature flow | integration |
| AC3: Existing features unaffected | Unit test on boundary case (default set after features created); E2E test with pre-existing feature | unit |

**Assumptions:**
- Pods already exist in the system (created via ep1-s1)
- Pod membership is stable at the time of assignment (no concurrent pod edits)
- Tenant context is available via `req.session.tenantId` (ADR-025)
- Product owners have permission to set defaults on their products

**Estimated touch points:**
Files: `src/web-ui/routes/products.js`, `src/web-ui/public/product-settings.html`, `src/db/migrations/` (pod_assignments table if not yet created in ep1-s1)  
Services: Postgres  
APIs: POST `/api/products/{productId}/set-default-pod`, GET `/api/products/{productId}`

---

## Hard Blocks — All Passing ✅

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS (3 ACs) |
| H3 | Every AC has test in test plan | ✅ PASS |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage to named metric | ✅ PASS ("Synchronous team access") |
| H6 | Complexity rated | ✅ PASS (Rating: 2) |
| H7 | No HIGH findings from review | ✅ PASS (Run 2: 0 HIGH) |
| H8 | Test plan covers all ACs | ✅ PASS (11 tests total) |
| H8-ext | Schema dependency check | ✅ PASS (pod_assignments table, depends on pods from ep1-s1) |
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

**Rationale:** New database record type (pod_assignments) and product settings UI with straightforward CRUD semantics; no complex merging or state machines yet.

**Action:** Share this DoR artefact with the tech lead before assigning to the coding agent.

---

## Coding Agent Instructions

You are implementing: **Assign Pod to Product as Default (ep1-s2)**  
**Feature slug:** new-feature-2b74a292  
**Oversight level:** Medium (tech lead review required before dispatch)

### Acceptance Criteria (Binding)

**AC1:** Given a product owner is in Product settings for "Payments", When they select "Set default pod" and choose "Core Platform Pod", Then the assignment is saved to pod_assignments (assignmentType: inherit-to-all-features), and Product settings shows "Default pod: Core Platform Pod (3 members)" immediately, with no page refresh needed.

**AC2:** Given "Payments" now has default pod "Core Platform Pod", When a product owner creates a new feature under "Payments", Then the new feature shows "Assigned pods: Core Platform Pod (3 members)" automatically, with no manual assignment step.

**AC3:** Given "Payments" already has existing features created before any default pod was set, When a product owner sets "Core Platform Pod" as the new default, Then none of those existing features' pod assignments change — only features created after this point inherit the new default.

### Touch Points (Binding Contract)

**Files you MUST modify:**
- `src/web-ui/routes/products.js` — POST `/api/products/{productId}/set-default-pod` handler
- `src/web-ui/public/product-settings.html` — "Set default pod" UI (dropdown + button)
- `src/db/migrations/` — Schema migration for `pod_assignments` table (if not created in ep1-s1; coordinate with ep1-s1 implementation)

**Files you MUST NOT modify:**
- Pod creation (ep1-s1)
- Feature creation core logic (ep1-s3 will handle inheritance)
- Existing product settings routes (only add the new set-default-pod endpoint)
- Pod member tables or pod_members queries

### Architecture Constraints

- **ADR-025 (Multi-tenancy):** All operations are tenant-scoped via `req.session.tenantId`; no cross-tenant leakage
- **ADR-026 (Canonical builders):** Foundation for future `getProductDefaultPod()` builder; this story does not implement the builder, only the data write and read paths

### Applicable Standards

**From `.github/standards/web-ui/core.md`:**
- Form validation on both client and server
- Session tenant context required on all DB operations
- Error messages must be specific and actionable (not generic "Error")

**From `.github/standards/web-ui/POLICY.md`:**
- WCAG 2.1 AA accessibility minimum
- Dropdown must be keyboard-navigable

### Implementation Specification

**Pod assignment endpoint** (`POST /api/products/{productId}/set-default-pod`):
- Extract `tenantId` from `req.session`
- Validate: `podId` exists and belongs to this tenant, product exists and belongs to this tenant
- Return HTTP 400 with specific error message if validation fails (do not create any data)
- On success: insert to `pod_assignments` table with `productId`, `podId`, `tenantId`, `assignmentType: "inherit-to-all-features"`, `assignedBy: userId`, `assignedAt: now`
- Return HTTP 200 with response body: `{ productId, defaultPodId, podName, memberCount }`

**Product settings UI ("Set default pod" section):**
- Dropdown: list all reusable pods for this tenant (or pods already assigned to this product)
- "Set" or "Confirm" button
- On success: show "Default pod set: [name] ([count] members)" success message
- On error: display server error inline, keep form open with dropdown value preserved
- No page refresh on success (response data is sufficient for immediate UI update)

**Database schema** (`pod_assignments` table, if not created in ep1-s1):
```sql
CREATE TABLE pod_assignments (
  assignmentId UUID PRIMARY KEY,
  tenantId UUID NOT NULL,
  podId UUID NOT NULL REFERENCES pods(podId),
  productId UUID NOT NULL,
  featureId UUID,  -- NULL for product-level default
  assignmentType VARCHAR NOT NULL,  -- "inherit-to-all-features", "explicit-feature", "multi-feature-set"
  assignedBy UUID,
  assignedAt TIMESTAMP,
  UNIQUE(tenantId, productId, featureId) -- only one default per product per tenant
);
```

### Test Coverage (from test-plan.md)

- **Unit tests:** 3 (AC1 assignment save, AC2 feature inheritance, AC3 existing-features boundary)
- **Integration tests:** 2 (tenant isolation, inheritance idempotence)
- **NFR tests:** 3 (latency ≤2s, UI visibility without refresh, consistency)
- **E2E tests:** 3 (set default flow, inherit flow, existing-features-unaffected)
- **Total:** 11 tests; all ACs covered; no gaps

### NFRs (Non-Functional Requirements)

- Default pod assignment completes within 2 seconds
- Product settings UI updates immediately without page refresh
- Default pod assignment is unique per product per tenant
- WCAG 2.1 AA accessibility

### Success Criteria for Definition of Done

- All 3 ACs passing (unit + E2E tests green)
- No unhandled exceptions or error logs
- Tenant isolation verified (queries include `WHERE tenantId = ?`)
- Dropdown is keyboard-accessible and WCAG 2.1 AA compliant
- Uniqueness constraint enforced at both application and database level
- ep1-s1 pod creation stories are already complete (pods exist before this story begins)

---

## Completion Summary

✅ **READY TO CODE**

All hard blocks pass (19/19). No blocking findings. Architecture constraints confirmed (ADR-025, ADR-026 foundation). Standards injected. Coding Agent Instructions complete and binding.

**Next action after tech lead review:** Proceed to `/branch-setup`.