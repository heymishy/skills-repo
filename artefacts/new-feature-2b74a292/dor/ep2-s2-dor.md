# Definition of Ready — ep2-s2: Filter Stage Visibility by Role

**Feature:** new-feature-2b74a292 (Multi-User Role-Aware Synchronous Collaboration)  
**Story:** ep2-s2 — Filter Stage Visibility by Role  
**Date:** 2026-09-16  
**Status:** Signed Off

---

## Contract Proposal

**What will be built:**
A team collaborator loads a feature and sees the pipeline stages filtered by default to only those relevant to their assigned role (e.g., engineer sees test-plan, review, definition-of-ready, coding; product sees discovery, benefit-metric, definition). A "Show all stages" toggle is available and persists the expanded view for the duration of the session without requiring a page refresh. All 7 stages remain accessible on request; no stages are hidden permanently.

**What will NOT be built:**
- Hiding stages (only filtering the default view)
- Preventing a user from viewing all stages if they click "show all"
- Enforcing role-based access at the backend (client-side filtering only)

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1: Engineer default view (4 stages filtered) | Unit test on GET `/api/features/{featureId}/stages`; assert response includes filtered stages array; E2E test on page load | unit + E2E |
| AC2: Product default view differs (3 stages, different from engineer) | Unit test comparing Susan's (engineer) and Hamish's (product) responses from same endpoint; assert different stage sets | unit + E2E |
| AC3: "Show all stages" toggle reveals all 7 without refresh | Unit test simulating toggle state change; E2E test confirming page does not reload and all 7 stages appear | unit + E2E |

**Assumptions:**
- Feature collaborators have already been assigned via ep1-s3 (pod inheritance at feature creation)
- role_definitions table exists with stageVisibility field populated for each role
- Tenant context is available via `req.session.tenantId` (ADR-025)
- Client-side filtering via JavaScript is acceptable for MVP (no server-side enforcement)

**Estimated touch points:**
Files: `src/web-ui/routes/features.js` (GET `/api/features/{featureId}/stages` handler — modified to filter by role), `src/web-ui/public/stage-list.js` (new component for role-filtered rendering + "Show all" toggle)  
Services: Postgres (`role_definitions` table read), Node.js HTTP server (route handler)  
APIs: GET `/api/features/{featureId}/stages` (modified to include role-filtered stage list), GET `/api/features/{featureId}/role-definitions` (optional, for client-side filtering if preferred)

---

## Hard Blocks — All Passing ✅

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS (3 ACs) |
| H3 | Every AC has test in test plan | ✅ PASS (12 tests total: 3 unit + 2 integration + 3 E2E + 4 NFR) |
| H4 | Out-of-scope section populated | ✅ PASS (3 excluded behaviours named) |
| H5 | Benefit linkage to named metric | ✅ PASS ("Role-filtered visibility") |
| H6 | Complexity rated | ✅ PASS (Rating: 2) |
| H7 | No HIGH findings from review | ✅ PASS (Review Run 2: 0 HIGH) |
| H8 | Test plan covers all ACs | ✅ PASS |
| H8-ext | Schema dependency check | ✅ PASS (role_definitions table exists, already in use) |
| H9 | Architecture Constraints; no HIGH findings | ✅ PASS |
| H-E2E | CSS-layout-dependent check | ✅ PASS (stage list visibility is not layout-dependent; toggle is DOM-verifiable) |
| H-NFR | NFR profile or "None" | ✅ PASS ("NFRs: None — reviewed 2026-09-16") |
| H-NFR2 | Compliance NFR sign-off | ✅ PASS (not applicable — no compliance NFRs) |
| H-NFR3 | Data classification | ✅ PASS (not applicable — no sensitive data) |
| H-NFR-profile | NFR profile presence | ✅ PASS |
| H-GOV | Approved By in discovery artefact | ✅ PASS (discovery.md contains Approved By section) |
| H-ADAPTER | Injectable adapter check (D37) | ✅ PASS (no injectable adapters in this story) |
| H-INF | Infra-plan gate | ✅ PASS (not applicable) |
| H-MIG | Migration-review gate | ✅ PASS (not applicable) |

---

## Warnings — None Triggered

No W1–W5 warnings apply to this story.

---

## Oversight Level

**Oversight:** Medium

**Rationale:** Role-filtered visibility is moderately straightforward (client-side filtering + toggle state management); no real-time or concurrent complexity. The stage list rendering and role resolution are well-defined in the existing codebase (ep2-s1 already established the collaborator pattern).

**Action:** Share the DoR artefact with the tech lead before assigning to the coding agent. No formal sign-off required; awareness is sufficient.

---

## Coding Agent Instructions

You are implementing: **Filter Stage Visibility by Role (ep2-s2)**  
**Feature slug:** new-feature-2b74a292  
**Oversight level:** Medium (share with tech lead before starting)

### Acceptance Criteria (Binding)

**AC1:** Given Susan (engineer) loads Feature A1, When the stage list renders, Then Susan sees by default only "test-plan", "review", "definition-of-ready", "coding" (her role's stageVisibility).

**AC2:** Given Hamish (product) loads the same Feature A1, When the stage list renders, Then Hamish sees by default only "discovery", "benefit-metric", "definition" (his role's stageVisibility) — a different default view from Susan's, from the same underlying data.

**AC3:** Given either collaborator's filtered default view, When they click "Show all stages", Then every stage in the pipeline becomes visible, and no previously-visible stage is hidden as a result of toggling.

### Touch Points (Binding Contract)

**Files you MUST modify:**
- `src/web-ui/routes/features.js` — GET `/api/features/{featureId}/stages` handler: add role filtering logic; fetch role_definitions for the requesting user's role; filter stage list before response
- `src/web-ui/public/stage-list.js` — new file: component rendering stage list with "Show all stages" toggle; client-side toggle state management (no page refresh)

**Files you MUST NOT modify:**
- Pod creation (ep1-s1)
- Pod assignment (ep1-s2)
- Feature creation (ep1-s3)
- Presence sidebar (ep2-s1)
- Feature page layout (only add toggle button)

### Architecture Constraints

- **ADR-025 (Multi-tenancy):** All operations tenant-scoped via `req.session.tenantId`
- **ADR-027 (Live SaaS mechanism is ordinary app code, not a SKILL.md skill):** This is a live feature for authenticated users, not an agent-driven pipeline mechanism
- **Client-side filtering only:** No backend enforcement; all stages always readable if "Show all" is clicked

### Applicable Standards

**From `.github/standards/web-ui/core.md`:**
- Session tenant context required on all DB operations
- Error responses must be specific and actionable

**From `.github/standards/web-ui/POLICY.md`:**
- WCAG 2.1 AA accessibility minimum — toggle button must be keyboard-accessible

### Implementation Specification

**GET `/api/features/{featureId}/stages` (modified):**
- Extract `tenantId`, `userId` from `req.session`
- Query `role_definitions` for the user's role, fetch `stageVisibility` array
- Query feature's full stage list (all 7 stages)
- Filter stages: include only those in `stageVisibility`
- Return HTTP 200 with `{ stages: [filtered list], allStages: [full list], userRole: [role], allStagesCount: 7 }`

**Stage list component** (`stage-list.js`):
- Render initial filtered stage list from GET response
- Render "Show all stages" toggle button
- On toggle click: set `showAll = true` in component state (localStorage for session persistence)
- When `showAll` is true: render all 7 stages
- When `showAll` is false: render only filtered stages
- No page refresh on toggle (client-side state change only)
- Visibility transition should be immediate (≤200ms)

### Test Coverage

- **Unit tests:** 3 (AC1 engineer view, AC2 product view differs, AC3 toggle reveals all)
- **Integration tests:** 2 (multi-role full-path load, tenant-scoped role isolation)
- **E2E tests:** 3 (engineer default on page load, product default differs, toggle without refresh)
- **NFR tests:** 4 (load latency ≤500ms, toggle latency ≤200ms, keyboard navigation, toggle accessibility)
- **Total:** 12 tests; all ACs covered

### NFRs

- Role-filtered default view is applied on page load (no separate click needed)
- "Show all stages" toggle persists for the user's current session (localStorage OK)
- Toggle response time ≤200ms (client-side state change, no server call)
- All 7 stages accessible via toggle without page refresh
- Toggle button keyboard-accessible (Tab + Enter to activate)

### Success Criteria for Definition of Done

- All 3 ACs passing
- No unhandled exceptions in browser console or server logs
- Tenant isolation verified (all queries include `WHERE tenantId = ?`)
- Role filtering correctly produces different stage lists for different roles
- Toggle works without page refresh; previously-visible stages remain (union, not replacement)
- ep1-s3 feature creation already populates role assignments
- ep2-s1 presence sidebar already loaded

---

## Completion Summary

✅ **READY TO CODE**

All hard blocks pass (19/19). No blocking findings. Oversight level: Medium — share with tech lead before dispatch. Coding Agent Instructions complete and binding.

**Next action:** After tech lead awareness, proceed to `/branch-setup`.