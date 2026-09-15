# Definition of Ready — ep4-s3: Archive a Pod and Preserve Audit Trail

**Feature:** new-feature-2b74a292 (Multi-User Role-Aware Synchronous Collaboration)
**Story:** ep4-s3 — Archive a Pod and Preserve Audit Trail
**Date:** 2026-09-16
**Status:** Signed Off

---

## Contract Proposal

**What will be built:**
An organisation administrator can mark a pod as archived via a UI button in the Pod Manager. The `pods.status` field is updated to "archived" atomically. Archived pods no longer appear in the "Assign pod" dropdown for new feature assignments. Features that were already using an archived pod continue to display that pod's members in their collaborator lists and audit trails — archival does not remove or hide historical team composition.

**What will NOT be built:**
- Bulk archival of multiple pods
- Un-archiving a pod (reverse the archived status)
- Merging archived pods with other pods
- Notifications or workflows triggered by archival

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1: Archive action available, no confirmation modal required | Unit test: DOM presence of archive button, immediate status field update to "archived", no modal triggered | unit |
| AC2: Archived status persists, dropdown filtering works | Integration test: status persists after page reload, dropdown renders with archived pod absent, dropdown shows only active pods | integration |
| AC3: Historical data preserved — archived pod's members visible in feature audit | Integration test: feature_collaborators unchanged, pod_members unchanged, audit trail shows pod name and members | integration |

**Assumptions:**
- `pods` table has a `status` field (or can be added without schema-breaking migration)
- Archived pods are queryable by status and can be excluded from SELECT queries
- Tenant isolation is enforced at the query level (ADR-025 already in place)
- The "Assign pod" dropdown already has a query filter — can be extended from `WHERE status = 'active'` (or equivalent)
- Existing features' `pod_assignments` and `feature_collaborators` views resolve pod data at read time, not at assignment time (so archival does not require data migration)

**Estimated touch points:**
Files: `src/web-ui/routes/pods.js` (POST `/api/pods/{podId}/archive` handler), `src/web-ui/modules/pod-manager.js` (dropdown filter for active pods only), `src/web-ui/public/pods-manager.html` (archive button UI)
Services: Postgres (`pods` table `status` column)
APIs: POST `/api/pods/{podId}/archive` (idempotent — safe to retry), GET `/api/pods?status=active` (filtered list for dropdown)

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs.
- AC1 specifies immediate action, no modal: contract proposes button-triggered API call. ✅
- AC2 specifies status field + dropdown filtering: contract names `status` field and dropdown query logic. ✅
- AC3 specifies historical preservation: contract notes that archival does not touch `pod_members` or `feature_collaborators`. ✅
- Assumptions are reasonable and grounded in existing patterns (tenant scoping, query-level filtering).

---

## Hard Blocks — All Passing ✅

| # | Check | Result |
|---|-------|--------|
| H1 | User story in As/Want/So with named persona | ✅ PASS |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS |
| H3 | Every AC has test in test plan | ✅ PASS |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage to named metric | ✅ PASS |
| H6 | Complexity rated | ✅ PASS |
| H7 | No HIGH findings from review | ✅ PASS |
| H8 | Test plan covers all ACs | ✅ PASS |
| H8-ext | Schema dependency check | ✅ PASS |
| H9 | Architecture Constraints; no Category E HIGH findings | ✅ PASS |
| H-E2E | CSS-layout-dependent AC check | ✅ PASS |
| H-NFR | NFR profile or "None" | ✅ PASS |
| H-NFR2 | Compliance NFR sign-off | ✅ PASS |
| H-NFR3 | Data classification | ✅ PASS |
| H-NFR-profile | NFR profile presence check | ✅ PASS |
| H-GOV | Approved By in discovery | ✅ PASS |
| H-ADAPTER | Injectable adapter check (D37) | ✅ PASS |
| H-INF | Infra-plan gate | ✅ PASS |
| H-MIG | Migration-review gate | ✅ PASS |

---

## Warnings — None Triggered

All W1–W5 checks pass. No warnings apply to this story.

---

## Oversight Level

**Oversight:** Low

**Rationale:** Archive operations are straightforward state changes with no concurrent complexity, no approval workflow, and no regulatory constraints. This is a housekeeping enhancement to the pod lifecycle, not a core feature. Implementation is additive and does not affect the core three-way merge or concurrent editing logic.

**Action:** Assign directly to the coding agent. No special coordination required before implementation begins.

---

## Coding Agent Instructions

You are implementing: **Archive a Pod and Preserve Audit Trail — ep4-s3**
**Feature slug:** new-feature-2b74a292
**Oversight level:** Low (direct assignment to coding agent)

### Acceptance Criteria (Binding)

**AC1:** Given the "Legacy Platform Pod" is no longer used, When an org admin navigates to Pod Manager and clicks "Archive" on that pod, Then the action completes immediately (no confirmation dialog required) and the `pods.status` field is set to "archived".

**AC2:** Given a pod has been archived, When the "Assign pod" dropdown is opened for a new feature assignment, Then archived pods do not appear in the list — only active pods are shown.

**AC3:** Given a feature that was using an archived pod before archival, When that feature's collaborators or audit trail is inspected, Then the archived pod's members are still listed there with full historical attribution — archival does not remove or hide the historical record.

### Touch Points (Binding Contract)

**Files you MUST modify:**
- `src/web-ui/routes/pods.js` — add POST `/api/pods/{podId}/archive` handler to set `pods.status = 'archived'` and return the updated pod object
- `src/web-ui/modules/pod-manager.js` — extend `getPodsList()` or equivalent to filter: `WHERE status = 'active'` for the "Assign pod" dropdown only; keep all queries for historical/audit contexts unrestricted
- `src/web-ui/public/pods-manager.html` — add "Archive" button next to each pod in the Pod Manager list; button submits to POST `/api/pods/{podId}/archive`

**Files you MUST NOT modify:**
- Pod member tables (`pod_members`) — archival does not remove or modify member records
- Feature assignment tables (`pod_assignments`, `feature_collaborators`) — archival does not cascade or update these tables
- Historical audit views or queries — existing features' collaborator lists read from these tables unfiltered

### Architecture Constraints

- **Status field:** The new `status` column on `pods` defaults to `'active'` for all existing pods. Archival sets it to `'archived'` in a single UPDATE statement.
- **Dropdown filtering (AC2):** The "Assign pod" dropdown query filters `WHERE status = 'active'` (or equivalent; use `IS NULL` pattern if status is initially absent and treated as active). Other queries that read pod data for historical/display purposes do NOT filter by status.
- **Tenant scoping (ADR-025):** All queries include the implicit `AND tenant_id = ?` condition from the session context.
- **Idempotency:** POST `/api/pods/{podId}/archive` is safe to call twice; the second call finds `status = 'archived'` already set and returns 200 with no error.
- **Immediate response (AC1 NFR):** The archive API completes within 500ms. No background job or async queue.

### Applicable Standards

From `.github/standards/web-ui/core.md`:
- Session tenant context required on all pod operations
- Error responses must be specific (e.g. "Pod not found" vs generic error)
- POST endpoints return the full updated object (e.g. the updated pod row with new status)

### Implementation Specification

**Route handler flow (POST `/api/pods/{podId}/archive`):**
1. Validate tenant context (`req.session.tenantId`)
2. Validate `podId` is present and a valid UUID
3. Query `SELECT * FROM pods WHERE id = ? AND tenant_id = ?`
4. If not found, return 404 `{ error: "Pod not found" }`
5. If `status` is already `'archived'`, return 200 with the pod object (idempotent, no-op)
6. Execute `UPDATE pods SET status = 'archived' WHERE id = ? AND tenant_id = ?`
7. Query the updated row back: `SELECT * FROM pods WHERE id = ? AND tenant_id = ?`
8. Return 200 JSON with the full pod object (including the updated status field)

**Dropdown filter (GET `/api/pods?status=active` or internal filter in `pod-manager.js`):**
1. When rendering the "Assign pod" dropdown, filter the pods list to `WHERE status = 'active'` (or `WHERE status IS NULL OR status = 'active'` if backfill is deferred)
2. For all other queries (historical display, audit, read-for-context), do NOT filter by status — archived pods must be readable

**Pod Manager UI (pods-manager.html):**
1. Archive button appears next to each pod name in the pod list (not in the dropdown, only in Pod Manager)
2. Button text: "Archive"
3. Click triggers `POST /api/pods/{podId}/archive`
4. On success (200): remove the pod from the visible list immediately (or mark it as archived visually), show toast "Pod archived"
5. On failure (404, 500): show error toast with the response error message

### Test Coverage

From test-plan (ep4-s3-test-plan.md):
- **Unit tests (3):** AC1 (archive button + status update), AC2 (dropdown filtering), AC3 (historical data preservation)
- **Integration tests (4):** full end-to-end, tenant isolation, multi-dropdown consistency, pod table durability
- **NFR tests (3):** latency <1s, no-refresh filter, collaborator unchanged
- **Total: 10 tests, all ACs covered**

### NFRs

- Archive action completes within 500ms
- Dropdown filter is applied immediately on list fetch (no client-side re-filtering needed)
- Archived pods remain visible in feature audit and historical queries
- Archive is idempotent — calling twice is safe and returns the same result

### Success Criteria for Definition of Done

- All 3 ACs passing (verified manually and by test suite)
- No unhandled exceptions in server logs during archive operations
- Tenant isolation verified — Tenant A's archived pod does not affect Tenant B
- Archive button appears in Pod Manager; clicking it immediately updates status
- Dropdown shows only active pods on list fetch; archived pods are absent
- Features using archived pods before archival still show members with full attribution
- No rows deleted from `pod_members` or `pod_assignments` during archival

---

## Completion Summary

✅ **READY TO CODE**

All hard blocks pass (20/20). No blocking findings. Oversight level: Low — proceed directly to coding agent.