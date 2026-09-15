# Test Plan: Load Feature with Pod Collaborators and Present Presence Sidebar (ep2-s1)

**Story reference:** artefacts/new-feature-2b74a292/stories/ep2-s1.md
**Epic reference:** artefacts/new-feature-2b74a292/epics/feature-collaboration-sign-off.md
**Domain:** web-ui
**Date:** 2026-09-16

---

## User Story
As a **Team collaborator (any role)**, I want **to see who else is actively working on this feature, and their role**, So that **I know who's involved before I start contributing**.

---

## Acceptance Criteria

**AC1:** Given Hamish is logged in and loads Feature A1, When the page renders, Then a "Team" sidebar appears listing every collaborator on the feature (Hamish, Susan, Darren) with their role.

**AC2:** Given the Team sidebar is showing Darren as online, When Darren's session goes 30+ seconds without a heartbeat, Then the sidebar updates Darren's status to offline within the next presence broadcast, without a page refresh.

**AC3:** Given Darren's status has changed to offline, When Hamish views the sidebar, Then it shows "Darren (engineer, offline — last seen 10m ago)" with a live-updating last-seen timestamp.

---

## Test Data Strategy

**Strategy selected:** Synthetic — test data generated in test setup, no real data involved.

**Test data approach:**
- Fixture feature: Feature A1 with `featureId = 'feat-a1-uuid'`, `tenantId = 'tenant-test-123'`
- Fixture collaborators: Hamish (conductor), Susan (engineer), Darren (engineer) — pre-populated in feature_collaborators table via ep1-s3 setup
- Fixture pod: Core Platform Pod with all 3 members already assigned to Feature A1
- Session contexts: Three mocked sessions for each collaborator with `req.session.userId` and `req.session.tenantId`
- Feature presence table: Pre-seeded with active sessions for Hamish and Susan; Darren's entry marked with stale heartbeat (>30s old)
- No production data required; all data is disposable post-test
- Database: test instance or in-memory mock

**Sensitivity assessment:** Not applicable — no PCI, PHI, or sensitive data involved.

---

## AC Coverage & Test Approach

| AC | Test type | Coverage | Gap? |
|----|-----------|----------|------|
| AC1 | Unit + E2E | Sidebar renders with all collaborators + roles | No |
| AC2 | Integration + E2E | Heartbeat timeout detection; status transition to offline | No |
| AC3 | Integration + E2E | Last-seen timestamp display and live update | No |

**Gap table:** None — all ACs have corresponding tests.

---

## Unit Tests

### AC1: Team Sidebar Renders with All Collaborators and Roles

**Test name:** `presence.sidebar.collaborators-render-all`

**What it tests:** AC1 — sidebar displays every collaborator on the feature with correct roles

**Setup:**
- Mock tenant context: `{ tenantId: 'tenant-test-123', userId: 'user-hamish' }`
- Fixture feature: Feature A1 with 3 collaborators (Hamish: conductor, Susan: engineer, Darren: engineer)
- Feature_collaborators pre-populated with all 3
- Mocked SSE stream ready to emit presence updates

**Action:**
- Call GET `/api/features/{featureId}` with full collaborator context
- Parse response for `collaborators` field
- Render sidebar component with the response data

**Expected result:**
- HTTP 200 response
- Response includes `{ collaborators: [{ userId: "...", name: "Hamish", role: "conductor", status: "online" }, { userId: "...", name: "Susan", role: "engineer", status: "online" }, { userId: "...", name: "Darren", role: "engineer", status: "online" }] }`
- Sidebar renders exactly 3 list items
- Each item displays name and role correctly (no truncation, no missing role labels)

---

### AC2: Heartbeat Timeout Triggers Offline Transition

**Test name:** `presence.heartbeat.timeout-after-30s`

**What it tests:** AC2 — when a collaborator's heartbeat is missing for >30s, status transitions to offline

**Setup:**
- Same as AC1 setup
- Darren's session in feature_presence table has `lastHeartbeat = now() - 35 seconds`
- Hamish is viewing Feature A1 with SSE stream active

**Action:**
1. Load feature page with SSE stream connected
2. Trigger a presence-update broadcast from the server (simulated heartbeat check)
3. Observe sidebar state before and after the broadcast

**Expected result:**
- Before broadcast: Darren shows as "online" (stale heartbeat not yet detected on the client)
- Server-side presence check identifies Darren's heartbeat is >30s stale
- Server broadcasts a presence-update event via SSE
- After the SSE message arrives: Darren's status changes to "offline" on Hamish's view
- No page refresh required; DOM updates via the SSE event handler

---

### AC3: Last-Seen Timestamp Display and Live Update

**Test name:** `presence.timestamp.last-seen-live-update`

**What it tests:** AC3 — offline collaborators show last-seen timestamp that updates live

**Setup:**
- Same as AC2 (Darren is offline)
- Current time is `2026-09-16T14:00:00Z`
- Darren's last heartbeat was `2026-09-16T13:45:00Z` (15 minutes ago)

**Action:**
1. Load feature page and confirm Darren is offline
2. Query the sidebar for Darren's status text
3. Wait 1 minute (test clock advances to `2026-09-16T14:01:00Z`)
4. Re-query the sidebar for Darren's status text without page refresh

**Expected result:**
- Initial status text: "Darren (engineer, offline — last seen 15m ago)"
- After 1 minute: "Darren (engineer, offline — last seen 16m ago)"
- Timestamp is computed relative to current time, not stored as a fixed string
- No explicit update trigger required; display is based on live calculation (last-seen = now() - lastHeartbeat)

---

## Integration Tests

### Feature Load with Presence Sidebar — Full Path

**Test name:** `presence.integration.feature-load-with-sidebar-full-path`

**What it tests:** Complete feature load flow; verifies all three ACs' data flow together

**Setup:**
- Tenant context: `{ tenantId: 'tenant-test-123', userId: 'user-hamish' }`
- Feature A1 with 3 collaborators (Hamish, Susan, Darren)
- Feature_presence table has: Hamish (online, last heartbeat 5s ago), Susan (online, last heartbeat 8s ago), Darren (offline, last heartbeat 35s ago)
- SSE stream endpoint ready

**Action:**
1. Call GET `/api/features/{featureId}` with session context
2. Parse collaborators array from response
3. For each collaborator, verify presence status in feature_presence
4. Compute last-seen timestamp for offline collaborators
5. Render sidebar with all computed data

**Expected result:**
- Collaborators response has all 3 users
- Hamish and Susan show status "online" (heartbeat <30s)
- Darren shows status "offline" (heartbeat ≥30s)
- Darren's last-seen is computed as "15m ago" (or similar, relative to current time)
- Every cross-reference (featureId → userId → presence status) is valid and consistent

---

### Presence Isolation by Tenant

**Test name:** `presence.integration.presence-isolation-by-tenant`

**What it tests:** ADR-025 — presence data is tenant-scoped; one tenant's feature presence does not leak to another

**Setup:**
- Tenant A: Feature A1 with Hamish (online), Susan (online)
- Tenant B: Feature A1 (same name, different tenant) with different collaborators
- Session context: `{ tenantId: 'tenant-a', userId: 'user-hamish-a' }`

**Action:**
- Load Feature A1 under Tenant A
- Query feature_presence for that feature
- Verify the collaborators returned belong to Tenant A only

**Expected result:**
- Tenant A's feature shows Hamish and Susan
- Tenant B's data is completely inaccessible (not filtered, not visible, not returned)

---

## E2E Tests (Browser)

### AC1: Sidebar Renders on Real Page Load

**Test name:** `presence.e2e.sidebar-renders-on-page-load`

**Setup:**
- Auth bypass fixture (NODE_ENV=test guard) with synthetic session for Hamish
- Feature A1 fully set up with 3 collaborators in database
- Feature_presence entries for all 3

**Action:**
- Open `http://localhost:3000/features/{featureId}` in browser
- Wait for page to render
- Locate the Team sidebar element

**Expected result:**
- Sidebar element is present in the DOM
- Contains exactly 3 list items
- Each item shows name + role: "Hamish (conductor)", "Susan (engineer)", "Darren (engineer)"
- Sidebar is visible and not hidden behind a menu or modal

---

### AC2: Offline Status Updates via SSE (No Refresh)

**Test name:** `presence.e2e.offline-status-updates-via-sse`

**Setup:**
- Same as AC1 E2E setup
- SSE stream endpoint mocked to emit a presence-update event after 2 seconds of page load
- Darren's presence entry marked stale (lastHeartbeat >30s)

**Action:**
1. Load feature page
2. Confirm Darren shows as "online" initially
3. Wait for SSE presence-update event to arrive (2 seconds)
4. Observe sidebar without manual refresh

**Expected result:**
- Darren's status changes from "online" to "offline" on the sidebar
- Change is visible without page refresh
- Sidebar remains visible and interactive throughout

---

### AC3: Last-Seen Timestamp Live Calculation

**Test name:** `presence.e2e.last-seen-timestamp-live-calculation`

**Setup:**
- Same as AC2 E2E setup
- Darren is offline

**Action:**
1. Load page and note Darren's last-seen text (e.g., "last seen 15m ago")
2. Wait 2 minutes without refreshing
3. Re-read Darren's last-seen text

**Expected result:**
- Initial text: "last seen 15m ago"
- After 2 minutes: "last seen 17m ago" (updated without page refresh)
- Update mechanism: either SSE-triggered re-render or JavaScript `setInterval` updating the display

---

## NFR Tests

### NFR-Perf-1: Sidebar Load Latency

**Test name:** `presence.nfr.sidebar-load-latency`

**Setup:** Same as AC1 unit test

**Action:** Call GET `/api/features/{featureId}`, measure response time

**Expected result:** Response time ≤ 500ms (sidebar renders quickly enough to appear with initial page load)

---

### NFR-Perf-2: Presence Update SSE Latency

**Test name:** `presence.nfr.sse-presence-update-latency`

**Setup:** Same as AC2 unit test

**Action:** Trigger presence-update broadcast, measure time from server event to client sidebar update

**Expected result:** Status change visible on client within 500ms of SSE message arrival

---

### NFR-Data-1: Collaborators List Completeness

**Test name:** `presence.nfr.collaborators-list-completeness`

**Setup:** Feature with 3 collaborators

**Action:** Load feature, count sidebar items, verify count = feature_collaborators row count

**Expected result:** Count = 3; no missing collaborators, no phantom entries

---

### NFR-A11y-1: Sidebar Keyboard Navigation

**Test name:** `presence.nfr.sidebar-keyboard-navigation`

**Setup:** Feature page with Team sidebar rendered

**Action:** Use Tab key to navigate to each collaborator item in the sidebar

**Expected result:** Every item is reachable via keyboard; no items skipped; focus indicator visible

---

## Test Summary

- **Unit tests:** 3 (AC1 sidebar render, AC2 heartbeat timeout, AC3 timestamp update)
- **Integration tests:** 2 (full-path presence load, tenant isolation)
- **E2E tests:** 3 (sidebar render on page load, offline status SSE update, last-seen live calculation)
- **NFR tests:** 4 (load latency, SSE latency, completeness, a11y)
- **Total:** 12 tests
- **All ACs covered:** Yes
- **Test data gaps:** None
- **Gaps in AC coverage:** None

---

# AC Verification Script: Load Feature with Pod Collaborators and Present Presence Sidebar (ep2-s1)

**Setup:** You are logged in as Hamish and can access Feature A1 at `http://localhost:3000/features/feature-a1-uuid`. Feature A1 has three collaborators: Hamish (conductor), Susan (engineer), and Darren (engineer), all assigned from Core Platform Pod.

---

### Scenario AC1: Team Sidebar Renders with All Collaborators

**Expected outcome:** When you load Feature A1, a Team sidebar immediately shows all three collaborators with their roles.

1. Navigate to Feature A1's main page: `http://localhost:3000/features/feature-a1-uuid`.
2. **Verify:** The page renders completely, including a sidebar on the left or right labeled "Team" or "Collaborators".
3. **Verify:** The sidebar lists exactly three names: Hamish, Susan, Darren.
4. **Verify:** Each name is displayed with a role label in parentheses:
   - "Hamish (conductor)"
   - "Susan (engineer)"
   - "Darren (engineer)"
5. **Verify:** No additional names appear; no names are missing.
6. **Verify:** The sidebar is visible without clicking any menu or toggle (it is not hidden behind a collapsed section).

---

### Scenario AC2: Offline Status Appears After Heartbeat Timeout

**Expected outcome:** When a team member's session goes inactive, their status changes to offline within 30 seconds, visible in the sidebar without page refresh.

1. From Feature A1's page (Scenario AC1), observe the Team sidebar.
2. Ask Darren to step away from his computer (or simulate session inactivity by stopping his heartbeat in the test).
3. **Note the current time** (e.g., 2:00 PM).
4. Wait 35 seconds (to exceed the 30-second heartbeat timeout).
5. **Verify:** Without refreshing the page, Darren's entry in the Team sidebar has changed to show an offline indicator (e.g., a greyed-out name, an "offline" label, or a different color).
6. **Verify:** Hamish's and Susan's entries remain showing as online (they are actively engaged).
7. **Verify:** The page did NOT refresh on its own; you can still see any edits or unsaved work you were making.

---

### Scenario AC3: Last-Seen Timestamp Updates Live

**Expected outcome:** Darren's offline status shows when he was last active, and that timestamp updates without a page refresh.

1. From Scenario AC2, Darren is now showing as offline.
2. **Verify:** Darren's sidebar entry shows a timestamp indicating when he was last seen (e.g., "offline — last seen 2 minutes ago").
3. **Note the time:** Record the exact last-seen text (e.g., "last seen 2m ago").
4. Wait 1 minute without refreshing the page.
5. **Verify:** Re-read Darren's last-seen text. It should now say "last seen 3m ago" (or equivalent, updating automatically).
6. **Verify:** No page refresh occurred; the timestamp updated on its own.
7. **Verify:** If you hover over or interact with Darren's entry, the timestamp is still visible and still updating (not static or cached).

---