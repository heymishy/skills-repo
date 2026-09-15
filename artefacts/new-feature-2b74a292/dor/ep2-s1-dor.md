# Definition of Ready — ep2-s1: Load Feature with Pod Collaborators and Present Presence Sidebar

**Feature:** new-feature-2b74a292 (Multi-User Role-Aware Synchronous Collaboration)  
**Story:** ep2-s1 — Load Feature with Pod Collaborators and Present Presence Sidebar  
**Date:** 2026-09-16  
**Status:** Signed Off

---

## Contract Proposal

**What will be built:**
When a team collaborator loads a feature that has pod members assigned (via ep1-s3), the feature page will render a "Team" sidebar immediately, listing every collaborator with their assigned role. The sidebar will connect to a server-sent events (SSE) stream to monitor presence — tracking active sessions via a `feature_presence` table with a 30-second heartbeat timeout. When a collaborator's heartbeat goes stale (≥30s), the sidebar updates their status to offline without a page refresh and displays a live-updating "last seen X minutes ago" timestamp.

**What will NOT be built:**
- Presence-based locking (preventing edits if another user is editing the same artefact)
- Notifications when a team member comes online
- Do-Not-Disturb or custom status per user

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1: Sidebar renders with all collaborators + roles | Unit test on GET `/api/features/{featureId}`; assert response includes collaborators array with name + role; E2E test on page load | unit + E2E |
| AC2: Offline status transition within 30s | Integration test on heartbeat timeout; assert SSE broadcast triggers status change; E2E without page refresh | integration + E2E |
| AC3: Last-seen timestamp live update | Integration test computing last-seen relative to current time; E2E waiting 1+ minute confirming timestamp advances | integration + E2E |

**Assumptions:**
- Feature collaborators have already been assigned via ep1-s3 (pod inheritance at feature creation)
- SSE stream endpoint is available at `/api/features/{featureId}/presence`
- Heartbeat is sent from the client every 10–15 seconds; server-side timeout is 30 seconds
- Tenant context is available via `req.session.tenantId` (ADR-025)
- Collaborators can load features they are assigned to without additional permission checks (RBAC deferred to future stories)

**Estimated touch points:**
Files: `src/web-ui/routes/features.js` (GET `/api/features/{featureId}` handler), `src/web-ui/modules/presence-manager.js` (new SSE client handler), `src/web-ui/public/presence-sidebar.js` (new sidebar component)  
Services: Postgres (`feature_presence` table read/write), Node.js HTTP server (SSE stream)  
APIs: GET `/api/features/{featureId}` (modified to include collaborators + initial presence), GET `/api/features/{featureId}/presence` (new SSE stream endpoint), POST `/api/features/{featureId}/heartbeat` (new heartbeat ping)

---

## Hard Blocks — All Passing ✅

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS (3 ACs) |
| H3 | Every AC has test in test plan | ✅ PASS (12 tests total) |
| H4 | Out-of-scope section populated | ✅ PASS (3 excluded behaviours) |
| H5 | Benefit linkage to named metric | ✅ PASS ("Synchronous team access") |
| H6 | Complexity rated | ✅ PASS (Rating: 2) |
| H7 | No HIGH findings from review | ✅ PASS (Review Run 2: 0 HIGH) |
| H8 | Test plan covers all ACs | ✅ PASS |
| H8-ext | Schema dependency check | ✅ PASS |
| H9 | Architecture Constraints; no HIGH findings | ✅ PASS |
| H-E2E | CSS-layout-dependent check | ✅ PASS |
| H-NFR | NFR profile or "None" | ✅ PASS |
| H-NFR2 | Compliance NFR sign-off | ✅ PASS |
| H-NFR3 | Data classification | ✅ PASS |
| H-NFR-profile | NFR profile presence | ✅ PASS |
| H-GOV | Approved By in discovery artefact | ✅ PASS |
| H-ADAPTER | Injectable adapter check (D37) | ✅ PASS |
| H-INF | Infra-plan gate | ✅ PASS |
| H-MIG | Migration-review gate | ✅ PASS |

---

## Warnings — None Triggered

No W1–W5 warnings apply to this story.

---

## Oversight Level

**Oversight:** High

**Rationale:** Real-time presence, SSE heartbeat handling, concurrent session tracking, and absence-detection logic are moderately complex. The sidebar rendering is straightforward, but the presence state machine (online ↔ offline transitions based on heartbeat timeout) and the SSE stream lifecycle introduce async concerns that warrant tech lead awareness.

**Action:** Share the DoR artefact with the tech lead before assigning to the coding agent. No formal sign-off required; awareness is sufficient.

---

## Coding Agent Instructions

You are implementing: **Load Feature with Pod Collaborators and Present Presence Sidebar (ep2-s1)**  
**Feature slug:** new-feature-2b74a292  
**Oversight level:** High (share with tech lead before starting)

### Acceptance Criteria (Binding)

**AC1:** Given Hamish is logged in and loads Feature A1, When the page renders, Then a "Team" sidebar appears listing every collaborator on the feature (Hamish, Susan, Darren) with their role.

**AC2:** Given the Team sidebar is showing Darren as online, When Darren's session goes 30+ seconds without a heartbeat, Then the sidebar updates Darren's status to offline within the next presence broadcast, without a page refresh.

**AC3:** Given Darren's status has changed to offline, When Hamish views the sidebar, Then it shows "Darren (engineer, offline — last seen 10m ago)" with a live-updating last-seen timestamp.

### Touch Points (Binding Contract)

**Files you MUST modify:**
- `src/web-ui/routes/features.js` — GET `/api/features/{featureId}` handler: add logic to fetch feature collaborators and presence status
- `src/web-ui/modules/presence-manager.js` — new file: SSE client handler
- `src/web-ui/public/presence-sidebar.js` — new file: sidebar component
- `src/db/migrations/` — ensure `feature_presence` table exists

**Files you MUST NOT modify:**
- Pod creation (ep1-s1)
- Product default pod assignment (ep1-s2)
- Feature creation flow (ep1-s3)
- Feature page template structure (only add sidebar)

### Architecture Constraints

- **ADR-025 (Multi-tenancy):** All operations tenant-scoped via `req.session.tenantId`
- **ADR-026 (Canonical builders):** First consumer of collaborators; builder extraction deferred

### Applicable Standards

**From `.github/standards/web-ui/core.md`:**
- Session tenant context required on all DB operations
- Error responses must be specific and actionable
- SSE streams must gracefully degrade

**From `.github/standards/web-ui/POLICY.md`:**
- WCAG 2.1 AA accessibility minimum — keyboard-navigable sidebar

### Implementation Specification

**GET `/api/features/{featureId}` (modified):**
- Extract `tenantId`, `userId` from `req.session`
- Query `feature_collaborators` and `feature_presence` for this feature
- Compute `lastSeenAgo` for offline collaborators
- Return HTTP 200 with collaborators array including status and timestamp

**SSE stream endpoint: GET `/api/features/{featureId}/presence`:**
- Validate tenant/feature access
- Open SSE stream; emit `presence-update` event immediately
- Server-side interval (every 15s): re-query presence; emit broadcast
- On heartbeat timeout (server-side ≥30s): mark user offline; include in next broadcast
- On client disconnect: remove session from `feature_presence`

**Heartbeat endpoint: POST `/api/features/{featureId}/heartbeat`:**
- Upsert `feature_presence` row: set `lastHeartbeat = now()`, `status = "online"`
- Return HTTP 204

**Sidebar component** (`presence-sidebar.js`):
- Render initial collaborators from GET response
- Open SSE stream; on `presence-update`: re-render
- Every 1s: update `lastSeenAgo` timestamps for offline collaborators
- On SSE close: gracefully degrade to last-known state

### Test Coverage

- **Unit tests:** 3 (sidebar render, heartbeat timeout, timestamp update)
- **Integration tests:** 2 (full-path load, tenant isolation)
- **E2E tests:** 3 (sidebar on page load, SSE update, live calculation)
- **NFR tests:** 4 (latency, completeness, a11y)
- **Total:** 12 tests; all ACs covered

### NFRs

- Presence updates within 30s heartbeat timeout
- Sidebar load latency ≤ 500ms
- SSE update latency ≤ 500ms
- Collaborators list completeness (no missing, no phantom entries)
- Sidebar always visible
- Keyboard-navigable

### Success Criteria for Definition of Done

- All 3 ACs passing
- No unhandled exceptions in browser console or server logs
- Tenant isolation verified (all queries include `WHERE tenantId = ?`)
- SSE stream handles disconnection gracefully
- Presence updates within 30s of heartbeat timeout
- ep1-s3 feature creation and collaborator pre-population already complete

---

## Completion Summary

✅ **READY TO CODE**

All hard blocks pass (19/19). No blocking findings. Oversight level: High — share with tech lead before dispatch. Coding Agent Instructions complete and binding.

**Next action:** After tech lead awareness, proceed to `/branch-setup`.