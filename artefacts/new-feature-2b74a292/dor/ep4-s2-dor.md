# Definition of Ready — ep4-s2: Dynamically Add/Remove Pod Members Mid-Feature (Feature-Level Override)

**Feature:** new-feature-2b74a292 (Multi-User Role-Aware Synchronous Collaboration)
**Story:** ep4-s2 — Dynamically Add/Remove Pod Members Mid-Feature (Feature-Level Override)
**Date:** 2026-09-16
**Status:** Signed Off

---

## Contract Proposal

**What will be built:**
A member picker UI that allows a feature lead or team lead to add any organisation member to a feature's team mid-flight, even if that member is not in any assigned pod. The system creates an override record in `feature_collaborator_overrides`, updates `feature_collaborators` immediately, and broadcasts the new member's presence to all active collaborators via SSE within 30 seconds.

**What will NOT be built:**
- Approval gates for mid-feature member changes (deferred)
- Notifications when newly-added members join (deferred)
- Removal of members mid-feature (add-only for MVP)

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1: Picker UI renders, allows selection | Unit test: modal DOM presence; integration test: member list accuracy against fixture org members | unit + integration |
| AC2: Override record created, Maya added + access granted | Integration test + DB: override record creation + feature_collaborators query + login test for Maya | integration |
| AC3: Presence appears within 30s | Integration test + SSE: monitor Team sidebar updates across 3+ concurrent sessions; timing assertion | integration |

**Assumptions:**
- `feature_collaborators` table exists and has relationship to pods and overrides (seeded by ep4-s1)
- SSE subscription is active in all collaborator sessions (established by ep2-s1)
- Tenant isolation is enforced at the route boundary (ADR-025 already implemented)
- `getFeatureCollaborators()` canonical builder is called to derive the union after add (ADR-026 established by ep4-s1)

**Estimated touch points:**
Files: `src/web-ui/routes/features.js` (modify GET/POST handlers), `src/web-ui/modules/pod-assignment-manager.js` (extend `getFeatureCollaborators()` to apply overrides), `src/web-ui/public/features-settings.html` (add member picker modal)
Services: Postgres (`feature_collaborator_overrides` table), SSE stream (presence broadcast)
APIs: POST `/api/features/{featureId}/collaborators/add` (add override), GET `/api/features/{featureId}/collaborators` (read full list), SSE broadcast on override creation

---

## Contract Review

**Alignment check:**

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks — All Passing ✅

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS |
| H3 | Every AC has test in test plan | ✅ PASS |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage to named metric | ✅ PASS |
| H6 | Complexity rated | ✅ PASS |
| H7 | No HIGH findings from review | ✅ PASS |
| H8 | Test plan covers all ACs | ✅ PASS |
| H8-ext | Schema dependency check | ✅ PASS |
| H9 | Architecture Constraints; no HIGH findings | ✅ PASS |
| H-E2E | CSS-layout-dependent check | ✅ PASS |
| H-NFR | NFR profile or "None" | ✅ PASS |
| H-NFR2 | Compliance NFR sign-off | ✅ PASS |
| H-NFR3 | Data classification | ✅ PASS |
| H-NFR-profile | NFR profile presence check | ✅ PASS |
| H-GOV | Approved By in discovery artefact | ✅ PASS |
| H-ADAPTER | Injectable adapter check (D37) | ✅ PASS |
| H-INF | Infra-plan gate | ✅ PASS |
| H-MIG | Migration-review gate | ✅ PASS |

---

## Warnings — None Triggered

All W1–W5 checks pass; no warnings apply to this story.

---

## Oversight Level

**Oversight:** Low

**Rationale:** Multi-pod addition and per-feature override are extensions of the core MVP model established in ep1-s2 and ep4-s1. State machine is straightforward (add override → recompute collaborators → broadcast presence). No concurrent complexity beyond ep2-s4. Tenant scoping reuses established patterns (ADR-025).

**Action:** No special coordination required before assignment. Proceed directly to coding agent.

---

## Coding Agent Instructions

You are implementing: **Dynamically Add/Remove Pod Members Mid-Feature (Feature-Level Override) — ep4-s2**
**Feature slug:** new-feature-2b74a292
**Oversight level:** Low (direct assignment to coding agent)

### Acceptance Criteria (Binding)

**AC1:** Given Feature A1 is in the discovery stage, When the feature lead clicks "Add team member", Then a picker appears allowing selection of any org member, including those not in Core Platform Pod.

**AC2:** Given the feature lead selects Maya (designer, not in Core Platform Pod) and saves, When the addition completes, Then an override record is created and Maya is added to Feature A1's feature_collaborators, with immediate access to the feature.

**AC3:** Given Maya has been added, When another collaborator views the Team sidebar, Then Maya's presence appears there within 30 seconds of her joining.

### Touch Points (Binding Contract)

**Files you MUST modify:**
- `src/web-ui/routes/features.js` (existing feature settings handlers) — add POST `/api/features/{featureId}/collaborators/add` handler to create override record and recompute feature_collaborators
- `src/web-ui/modules/pod-assignment-manager.js` (extend existing) — extend `getFeatureCollaborators()` to apply overrides (union of pod members + manual adds)
- `src/web-ui/public/features-settings.html` (existing) — add "Add team member" button and member picker modal

**Files you MUST NOT modify:**
- Pod creation or assignment logic (ep4-s1) — no changes to pod_members or pod_assignments
- Feature presence sidebar core (ep2-s1) — no changes to SSE heartbeat or online/offline logic
- Pod membership tables — do not alter pod_members rows; overrides only

### Architecture Constraints

- **Member picker UI:** Modal listing all org members except those already in feature_collaborators. Checkboxes for single or multi-select (MVP: single-select acceptable).
- **Override table:** Each override row: `{ featureId, userId, action: 'add', timestamp }`. No `podId` field (indicates override, not pod-sourced).
- **Collaborators derivation:** `getFeatureCollaborators(featureId, tenantId)` — (a) union all pod_members for all pods in pod_assignments, (b) add all `feature_collaborator_overrides` with `action: 'add'`, (c) subtract all with `action: 'remove'`. Result is the effective team.
- **Tenant scoping (ADR-025):** All queries and writes scoped by `tenantId` from session.
- **Canonical builder (ADR-026):** `getFeatureCollaborators()` is the single source of truth — called from feature load, override creation, and ep2-s1 sidebar render. Do not re-derive elsewhere.
- **Presence broadcast:** On override creation, emit SSE event to all active sessions on this feature. Existing heartbeat logic will add Maya to feature_presence on her next page load.

### Applicable Standards

From `.github/standards/web-ui/core.md`:
- Session tenant context required on all override operations
- Error responses must be specific (name the invalid member or duplicate, not generic "failure")
- POST endpoints must return the full updated collaborators list, not just success flag

From web-ui patterns:
- Modal structure: title, member list (scrollable), Cancel + Save buttons
- Member list formatting: "Name (Role)" in `(<role>)` parentheses
- Form feedback: inline error if member is already assigned; success toast on save

### Implementation Specification

**Route handler flow (`POST /api/features/{featureId}/collaborators/add`):**
1. Validate tenant context (`req.session.tenantId`)
2. Validate `featureId` and `userId` are present and valid UUIDs
3. Query `feature_collaborators` — if `userId` already present, return 400 "User is already a collaborator on this feature"
4. Insert into `feature_collaborator_overrides`: `{ featureId, userId, action: 'add', timestamp: now }`
5. Call `getFeatureCollaborators(featureId, tenantId)` to get the updated list
6. Emit SSE event to all sessions subscribed to this feature's presence channel
7. Return 200 JSON: `{ collaborators: [...], newMemberAdded: userId }`

**Member picker modal (`features-settings.html`):**
1. "Add team member" button → modal with org member list
2. Fetch `GET /api/org/members` (or equivalent; filters to exclude already-assigned)
3. On Save: POST to `/api/features/{featureId}/collaborators/add` with `{ userId }`
4. On response: update the Team sidebar immediately (no page refresh)

**Pod-assignment-manager.js extension:**
- `getFeatureCollaborators()` signature: `(featureId, tenantId) → Promise<Array<collaborator>>`
- Steps:
  1. Query `pod_assignments` for this feature
  2. For each pod, query `pod_members`; build union by userId
  3. Query `feature_collaborator_overrides` with `action: 'add'` for this feature; add those users
  4. Query `feature_collaborator_overrides` with `action: 'remove'` for this feature; subtract those users
  5. Return the final set with `{ userId, role, source: 'pod' | 'override' }`

### Test Coverage

From test-plan (`test-plans/ep4-s2-test-plan.md`):
- **Unit tests (3):** AC1 (picker renders all org members, excluding already-assigned), AC2 (override record created), AC3 (presence broadcast within 30s)
- **Integration tests (4):** full flow end-to-end, duplicate prevention, tenant isolation, SSE stream reliability (5+ concurrent tabs)
- **NFR tests (3):** picker load ≤1s, presence updates ≤30s, override persistence across session restart
- **Total: 10 tests, all ACs covered**

### NFRs

- Member addition is visible in Team sidebar within 30s (SSE broadcast)
- Removed members lose access immediately (session invalidation on next request)
- Picker loads within 1s
- Override records persist across session restart

### Success Criteria for Definition of Done

- All 3 ACs passing (verified manually and by test suite)
- No unhandled exceptions in server logs during add-member operations
- Tenant isolation verified — Tenant A's override does not affect Tenant B
- Picker modal loads in <1s; save completes in <2s
- SSE broadcast reaches all 5+ concurrent subscribers within 30s
- Override record written to DB; `getFeatureCollaborators()` returns union correctly (verified row-by-row)
- Member added to feature_collaborators can log in and access the feature
- `feature_collaborators` query validates canonical builder was called

---

## Completion Summary

✅ **READY TO CODE**

All hard blocks pass (20/20). No blocking findings. Oversight level: Low — proceed directly to coding agent.