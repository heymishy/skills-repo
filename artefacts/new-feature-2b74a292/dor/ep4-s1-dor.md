# Definition of Ready — ep4-s1: Assign Multiple Pods to a Feature (Subset Selection)

**Feature:** new-feature-2b74a292 (Multi-User Role-Aware Synchronous Collaboration)
**Story:** ep4-s1 — Assign Multiple Pods to a Feature (Subset Selection)
**Date:** 2026-09-16
**Status:** Signed Off

---

## Contract Proposal

**What will be built:**
A UI modal that allows a product owner or feature lead to select multiple pods for a feature and remove individual members from the combined selection for that feature only. The system persists these assignments in the `pod_assignments` table and derives `feature_collaborators` from the union of all assigned pods minus explicitly removed members.

**What will NOT be built:**
- Creating a new pod as part of this story (create via ep1-s1)
- Dynamically changing pod members mid-feature (deferred to ep4-s2)

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1: Multi-pod selector renders and loads all pods | Unit test: modal DOM presence; integration test: pod list accuracy against fixture pods table | unit + integration |
| AC2: Per-member removal for this feature only (override logic) | Unit test: removal state tracking; integration test: override record creation + feature_collaborators query | unit + integration |
| AC3: feature_collaborators contains union-minus-removal | Integration test + DB query: row count and content verification against expected set | integration |

**Assumptions:**
- The pods and pod_members tables already exist and are populated (seeded by ep1-s1)
- The feature_collaborators table has been created and has a foreign-key relationship to pod_assignments
- The feature being assigned already exists in the database (seeded by ep1-s3)
- Tenant isolation is enforced at the route boundary, not within the multi-pod assignment handler logic

**Estimated touch points:**
Files: `src/web-ui/routes/features.js` (modify feature settings GET/POST handlers), `src/web-ui/modules/pod-assignment-manager.js` (new — handles multi-pod selection and override logic), `src/web-ui/public/features-settings.html` (modify to include multi-pod selector modal)
Services: Postgres (pod, pod_members, pod_assignments, feature_collaborators tables), feature_presence (session-scoped)
APIs: POST `/api/features/{featureId}/pods` (assign pods), GET `/api/features/{featureId}/pods` (read assignments), DELETE `/api/features/{featureId}/pods/{podId}/members/{userId}` (remove member for this feature)

---

## Contract Review

**Mismatch check:**
- AC1 (Multi-pod selector renders) → proposed: modal loads on button click, lists all active pods, allows checkboxes for multi-select ✅
- AC2 (Per-member removal for this feature only) → proposed: per-pod member list expands, removal creates override record without touching pod_members ✅
- AC3 (Union-minus-removal result) → proposed: query feature_collaborators after save returns exactly the expected set ✅

**Result:** ✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks — All Passing ✅

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS (Product owner or feature lead) |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS (3 ACs, all Given/When/Then format) |
| H3 | Every AC has test in test plan | ✅ PASS (9 tests total from test-plan.md, all ACs covered) |
| H4 | Out-of-scope section populated | ✅ PASS (2 excluded behaviours named) |
| H5 | Benefit linkage to named metric | ✅ PASS ("Synchronous team access" exists in benefit-metric.md coverage matrix) |
| H6 | Complexity rated | ✅ PASS (Rating: 2) |
| H7 | No HIGH findings from review | ✅ PASS (Review Run 2 ep4-s1: 0 HIGH) |
| H8 | Test plan covers all ACs | ✅ PASS (9 tests, no gaps) |
| H8-ext | Schema dependency check | ✅ PASS (pod_assignments, feature_collaborators already exist from prior stories; no new schema fields required for this story) |
| H9 | Architecture Constraints; no HIGH findings | ✅ PASS (Architecture Constraints section populated; ADR-026 canonical builder referenced) |
| H-E2E | CSS-layout-dependent check | ✅ PASS (all ACs are logic/DB-based, no CSS-layout dependencies) |
| H-NFR | NFR profile or "None" | ✅ PASS ("NFRs: None — reviewed 2026-09-16") |
| H-NFR2 | Compliance NFR sign-off | ✅ PASS (not applicable) |
| H-NFR3 | Data classification | ✅ PASS (not applicable) |
| H-NFR-profile | NFR profile presence check | ✅ PASS (story NFR section is "None", no profile required) |
| H-GOV | Approved By in discovery artefact | ✅ PASS (discovery.md contains non-blank Approved By section) |
| H-ADAPTER | Injectable adapter check (D37) | ✅ PASS (no injectable adapters introduced) |
| H-INF | Infra-plan gate | ✅ PASS (not applicable) |
| H-MIG | Migration-review gate | ✅ PASS (not applicable) |

---

## Warnings — None Triggered

All W1–W5 checks pass; no warnings apply to this story.

---

## Oversight Level

**Oversight:** Low

**Rationale:** Multi-pod assignment extends the single-pod model established in ep1-s2 with a straightforward selector pattern. The override removal logic (ep4-s2 feature-level member removal) is deferred; this story handles only pod-level selection and removal. State machine complexity is low; tenant scoping reuses existing patterns. No concurrent complexity or architectural unknowns.

**Action:** No special coordination required before assignment. Proceed directly to coding agent.

---

## Coding Agent Instructions

You are implementing: **Assign Multiple Pods to a Feature (Subset Selection) — ep4-s1**
**Feature slug:** new-feature-2b74a292
**Oversight level:** Low (direct assignment to coding agent)

### Acceptance Criteria (Binding)

**AC1:** Given Feature A2 needs members from both Core Platform Pod and Data Analytics Pod, When a product owner navigates to Feature A2 settings and clicks "Assign pods", Then they see a selector listing all of the organisation's pods, allowing more than one to be selected.

**AC2:** Given both pods have been selected, When the product owner removes Bob from Data Analytics Pod for this feature only, Then Bob is excluded from Feature A2's collaborators while remaining a member of Data Analytics Pod globally, unaffected in the pod itself.

**AC3:** Given the assignment has been saved, When feature_collaborators is inspected, Then it contains exactly the union of both pods' members minus Bob (Hamish, Susan, Darren, Alice).

### Touch Points (Binding Contract)

**Files you MUST modify:**
- `src/web-ui/routes/features.js` (existing feature settings handlers) — add GET endpoint to load current pod assignments, add POST endpoint to save multi-pod assignments with per-member removals
- `src/web-ui/modules/pod-assignment-manager.js` (new) — implement multi-pod selection logic, override tracking, and feature_collaborators derivation
- `src/web-ui/public/features-settings.html` (existing) — add multi-pod selector modal with checkbox list and per-pod expandable member lists

**Files you MUST NOT modify:**
- Pod creation logic (ep1-s1) — this story does not change pod creation or pod_members management
- Feature creation logic (ep1-s3) — default pod assignment remains unchanged
- Feature presence sidebar (ep2-s1) — no changes to how collaborators are displayed in the sidebar

### Architecture Constraints

- **Multi-pod selector UI:** Modal with active-pods-only list (archived pods filtered out). Each pod is a checkbox. Both can be checked simultaneously (not radio buttons).
- **Per-member removal:** Each pod section can expand to show members. An X icon next to a member marks them removed for this feature only (visual indicator: strikethrough or "removed for this feature" label).
- **feature_collaborators derivation:** After save, query `pod_assignments` for this feature, get union of all assigned pods' members via `pod_members`, subtract any rows in `feature_collaborator_overrides` with `action: remove` for this feature. Result is the effective collaborators list.
- **Tenant scoping (ADR-025):** All queries scoped by `tenantId`. Route must validate tenant context before processing.
- **Canonical builder pattern (ADR-026):** `getFeatureCollaborators()` is the single builder for the effective collaborator set — do not re-derive it in multiple places.

### Applicable Standards

From `.github/standards/web-ui/core.md`:
- Session tenant context required on all pod assignment operations
- Error responses must be specific (name the issue, not generic "failure")
- POST endpoints must return the full updated resource state, not just a success flag

From web-ui patterns:
- Modal structure: title, content area with scrollable pod list, action buttons (Cancel, Save)
- Checkbox states: checked = assigned, unchecked = not assigned; removal X button is independent of checkbox state
- Form feedback: inline error messages for validation failures, success toast on save

### Implementation Specification

**Route handler flow (modify `routes/features.js`):**
1. `GET /api/features/{featureId}/pods` — receive request with `featureId`
2. Validate tenant context (req.session.tenantId)
3. Query `pod_assignments` for this feature; query all active pods from `pods` table
4. For each assigned pod, query `pod_members` to get member count
5. Return JSON: `{ assignedPods: [...], allActivePods: [...], currentCollaborators: [...] }`
6. `POST /api/features/{featureId}/pods` — receive request with `{ selectedPodIds: [...], removals: { podId: [userIds] } }`
7. Delete existing `pod_assignments` for this feature (or upsert — design choice; document in decisions.md if upsert)
8. Insert new `pod_assignments` rows for each selected pod
9. For each removal, upsert `feature_collaborator_overrides` with `action: remove`
10. Recompute `feature_collaborators` via `getFeatureCollaborators(featureId, tenantId)`
11. Return the updated collaborators list and success response

**Pod assignment manager module (new file `modules/pod-assignment-manager.js`):**

Implement `getFeatureCollaborators(featureId, tenantId)` function:
- Query `pod_assignments` for this feature
- For each assigned pod, query `pod_members` to get all members
- Compute union of all members (by userId)
- Query `feature_collaborator_overrides` for this feature with `action: remove`
- Subtract removed users from the union
- Return array of collaborators with their roles and pod source
- This function is the single canonical builder — called from multiple places (feature load, pod assignment save, ep2-s1 sidebar render)

### Test Coverage

From the test-plan artefact:

- **Unit tests (3):** AC1 (selector renders all pods, multi-select), AC2 (per-member removal), AC3 (feature_collaborators union-minus-removal)
- **Integration tests (3):** full end-to-end flow, archived pods filtered, per-feature removal scoped (no global pod impact), tenant isolation
- **NFR tests (3):** selector load ≤1s, collaborators recalculation ≤2s, union completeness (all members carried over)
- **Total: 9 tests; all ACs covered**

### NFRs

- Multi-pod assignment UI loads within 1 second
- feature_collaborators is recalculated and visible within 2 seconds of save
- All pod members are included in feature_collaborators unless explicitly removed
- Archived pods do not appear in the selector dropdown

### Success Criteria for Definition of Done

- All 3 ACs passing (verified manually and by test suite)
- No unhandled exceptions in server logs during pod assignment operations
- Tenant isolation verified — Tenant A's pod assignment does not affect Tenant B's features
- Selector modal renders in <1s; save completes in <2s
- Archived pods filtered from selector list
- Per-member removal does not modify the global pod_members table
- feature_collaborators query returns exactly the union minus removals (verified row-by-row)
- Canonical builder `getFeatureCollaborators()` is the single source of truth — all callers use it

---

## Completion Summary

✅ **READY TO CODE**

All hard blocks pass (20/20). No blocking findings. Oversight level: Low — proceed directly to coding agent.