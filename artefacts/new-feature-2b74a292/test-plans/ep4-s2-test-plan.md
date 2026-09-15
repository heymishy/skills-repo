# Test Plan: Dynamically Add/Remove Pod Members Mid-Feature (Feature-Level Override) — ep4-s2

**Story reference:** artefacts/new-feature-2b74a292/stories/ep4-s2.md
**Epic reference:** artefacts/new-feature-2b74a292/epics/advanced-pod-operations.md
**Domain:** web-ui
**Date:** 2026-09-16

---

## User Story

As a **Feature lead or team lead**,
I want **to add someone to the feature's team mid-flight, even if they aren't in any assigned pod**,
So that **the team can adapt as the feature's needs change, without having to restructure a pod**.

---

## Acceptance Criteria

**AC1:** Given Feature A1 is in the discovery stage, When the feature lead clicks "Add team member", Then a picker appears allowing selection of any org member, including those not in Core Platform Pod.

**AC2:** Given the feature lead selects Maya (designer, not in Core Platform Pod) and saves, When the addition completes, Then an override record is created and Maya is added to Feature A1's feature_collaborators, with immediate access to the feature.

**AC3:** Given Maya has been added, When another collaborator views the Team sidebar, Then Maya's presence appears there within 30 seconds of her joining.

---

## Test Data Strategy

**Strategy selected:** Synthetic — test data generated in test setup, no real data involved.

**Test data approach:**
- Fixture feature: Feature A1 with `featureId = 'feat-a1-uuid'`, `tenantId = 'tenant-test-123'`, assigned to Core Platform Pod (Hamish, Susan, Darren)
- Fixture org members: Core Platform Pod members (3) + external members including Maya (designer)
- Fixture override table: empty at test start
- Fixture presence store: Core Platform Pod members online
- No production data required; all test data is synthetic and disposable post-test

**Sensitivity assessment:** Not applicable — no PCI, PHI, or sensitive data involved.

---

## AC Coverage & Test Approach

| AC | Test type | Coverage | Gap? |
|----|-----------|----------|------|
| AC1 | Unit + integration | Picker UI renders with all org members, excluding already-assigned | No |
| AC2 | Integration + DB | Override record created; feature_collaborators updated; access granted | No |
| AC3 | Integration + SSE | Presence broadcasts to other collaborators within 30s | No |

**Gap table:** None — all ACs have corresponding tests.

---

## Unit Tests

### AC1: Picker UI Renders with All Org Members

**Test name:** `mid-feature-add.unit.picker-renders-all-org-members`

**What it tests:** AC1 — when the "Add team member" button is clicked, a picker modal appears listing all organisation members except those already assigned to this feature.

**Setup:**
- Fixture feature A1 with collaborators Hamish, Susan, Darren (from Core Platform Pod)
- Fixture org with 10 total members: 3 in Core Platform Pod + 7 external (including Maya)
- Feature settings panel loaded; Team sidebar showing current collaborators

**Action:**
- Click "Add team member" button
- Wait for picker modal to appear
- Inspect member list

**Expected result:**
- Modal title is "Add team member to Feature A1"
- Modal lists exactly 7 external org members (the 10 minus the 3 already assigned)
- Maya is present in the list with her role (designer)
- No duplicate entries
- List is scrollable if >10 items (stress case)

---

### AC2: Override Record Created on Add

**Test name:** `mid-feature-add.unit.override-record-created`

**What it tests:** AC2 — selecting a member and saving creates an override record and updates feature_collaborators.

**Setup:**
- Fixture feature A1 with existing collaborators (3)
- Override table empty at test start
- Picker modal open with Maya selected

**Action:**
- Click "Save" in the picker
- Inspect feature_collaborator_overrides table
- Query feature_collaborators for Feature A1

**Expected result:**
- A new row in feature_collaborator_overrides: `{ featureId: 'feat-a1-uuid', userId: 'maya-id', action: 'add', reason: null, timestamp: <now> }`
- feature_collaborators now contains 4 rows (original 3 + Maya)
- Maya's row has `podId: null` (indicating override, not pod-sourced)
- Timestamp is current (within 1 second of the save action)

---

### AC3: Presence Broadcasts within 30s

**Test name:** `mid-feature-add.unit.presence-broadcasts-new-member`

**What it tests:** AC3 — a newly added member's presence is broadcast to the feature within 30 seconds.

**Setup:**
- Fixture feature A1 loaded in two concurrent browser tabs (Hamish's, Susan's)
- Maya has just been added (AC2 complete)
- SSE subscription active in both tabs
- feature_presence table at baseline

**Action:**
- In a third tab, log in as Maya and load Feature A1
- Trigger presence heartbeat (automatic on page load)
- Monitor SSE stream in Hamish's and Susan's tabs for presence updates

**Expected result:**
- Within 30 seconds, both Hamish's and Susan's Team sidebars update to show Maya as online
- Maya's presence row appears in feature_presence table with current timestamp
- No page refresh required in either tab

---

## Integration Tests

### Full Add-Member End-to-End

**Test name:** `mid-feature-add.integration.add-member-end-to-end`

**What it tests:** Complete flow — load feature, click Add, select Maya, save, verify presence updates, verify override persists.

**Setup:**
- Feature A1 loaded; Team sidebar shows Hamish, Susan, Darren
- Core Platform Pod unmodified
- SSE stream active

**Action:**
1. Click "Add team member"
2. Select Maya from picker
3. Click "Save"
4. Wait 30s for SSE broadcast
5. Query feature_collaborators
6. Check feature_collaborator_overrides
7. Refresh page; verify Maya persists (disk/DB, not session-only)

**Expected result:**
- Picker closes; Team sidebar updates within 2s to show Maya
- feature_collaborators has 4 rows: Hamish (core-pod), Susan (core-pod), Darren (core-pod), Maya (override)
- feature_collaborator_overrides has 1 row with action: add
- After page refresh, Maya is still present (not lost on reload)
- Core Platform Pod's pod_members is unchanged (Maya not added to pod globally)

---

### Adding Member Already in Another Assigned Pod

**Test name:** `mid-feature-add.integration.add-member-already-in-pod`

**What it tests:** If a feature has two pods assigned and a member is in one, attempting to add them again is rejected or handled gracefully.

**Setup:**
- Feature A2 assigned to both Core Platform Pod and Data Analytics Pod (Alice is in Data Analytics Pod)
- feature_collaborators already contains Alice via pod assignment
- Picker open; showing org members

**Action:**
- Scroll to find Alice in the member list
- Attempt to select Alice

**Expected result:**
- Alice is either grayed out / disabled in the picker, OR
- Clicking Alice shows a message "Alice is already a collaborator on this feature (via Data Analytics Pod)"
- Save button does not activate
- No duplicate entry created

---

### Tenant Isolation on Member Add

**Test name:** `mid-feature-add.integration.tenant-isolation-member-add`

**What it tests:** ADR-025 — adding a member to a feature in Tenant A does not expose members from Tenant B or modify Tenant B's features.

**Setup:**
- Tenant A: Feature A1 with 3 collaborators
- Tenant B: Feature B1 with different team, different org members
- Tenants are isolated at the session/auth level

**Action:**
1. Log in as Tenant A feature lead
2. Add Maya to Feature A1
3. Query Tenant B's feature_collaborators
4. Log in as Tenant B operator; check Feature B1's team

**Expected result:**
- Tenant A Feature A1's feature_collaborators has 4 rows (+ Maya)
- Tenant B Feature B1's feature_collaborators unchanged (still 3)
- feature_collaborator_overrides scoped by tenantId; Tenant B has zero rows for Feature A1

---

### SSE Stream Reliability on Member Add

**Test name:** `mid-feature-add.integration.sse-stream-broadcasts-reliably`

**What it tests:** SSE broadcasts work even with 5+ concurrent subscribers (stress case for presence updates).

**Setup:**
- Feature A1 open in 6 concurrent tabs (feature lead, 5 other collaborators)
- All have active SSE subscriptions
- Maya is about to be added

**Action:**
1. Feature lead adds Maya
2. Wait 30s; monitor all 6 tabs' Team sidebars
3. Count how many updated within 30s

**Expected result:**
- All 6 tabs update within 30s
- No dropped broadcasts
- Order of updates is deterministic (all within broadcast window)

---

## NFR Tests

### NFR-Perf-1: Add Member UI Loads Within 1 Second

**Test name:** `mid-feature-add.nfr.picker-load-time-under-1s`

**Setup:** Feature A1 settings page; org has 50 members (stress case).

**Action:** Click "Add team member"; measure time from click to picker fully rendered.

**Expected result:** ≤1s

---

### NFR-Perf-2: Presence Updates within 30 Seconds

**Test name:** `mid-feature-add.nfr.presence-broadcast-latency-under-30s`

**Setup:** Feature A1 open in 3 concurrent tabs; Maya just added; SSE subscriptions active.

**Action:** Measure time from add-save completion to presence update appearing in all 3 tabs.

**Expected result:** ≤30s (measured at the 95th percentile across 10 runs)

---

### NFR-Completeness: Override Record Persists Across Session

**Test name:** `mid-feature-add.nfr.override-persistence`

**Setup:** Maya added to Feature A1; page refreshed; new session opened for same feature.

**Action:** Verify Maya is still a collaborator after session restart.

**Expected result:** feature_collaborators still contains Maya; feature_collaborator_overrides row intact with original timestamp.

---

## Test Summary

- **Unit tests:** 3 (AC1 picker, AC2 override record, AC3 presence broadcast)
- **Integration tests:** 4 (full flow, duplicate prevention, tenant isolation, SSE stress)
- **NFR tests:** 3 (picker load ≤1s, presence ≤30s, override persistence)
- **Total:** 10 tests
- **All ACs covered:** Yes
- **Test data gaps:** None
- **Gaps in AC coverage:** None

---

# AC Verification Script: Dynamically Add/Remove Pod Members Mid-Feature (ep4-s2)

**Setup:** Feature A1 is in the discovery stage with 3 collaborators from Core Platform Pod (Hamish conductor, Susan engineer, Darren engineer). You are about to add Maya (designer, not in any assigned pod) to the feature team mid-flight.

---

### Scenario AC1: Picker Renders All Org Members

**Expected outcome:** A modal picker lists all organisation members except those already assigned.

1. Navigate to Feature A1 settings.
2. Click "Add team member" button.
3. A modal titled "Add team member to Feature A1" appears.
4. **Verify:** The modal lists all org members — look for Maya in the list with her role "designer" beside her name.
5. **Verify:** Hamish, Susan, and Darren are NOT in the list (already assigned).
6. **Verify:** The list shows approximately 7 external members plus the 3 from Core Platform Pod, with the 3 already assigned filtered out.
7. Close or leave the modal open for the next scenario.

---

### Scenario AC2: Override Record Created and Access Granted

**Expected outcome:** After selecting and saving, Maya is added to the feature team with an override record created.

1. From the modal open above, scroll to find Maya.
2. Click Maya's name to select her.
3. Click "Save".
4. The modal closes and you return to Feature A1 settings.
5. **Verify:** The Team section now shows 4 collaborators: Hamish, Susan, Darren, and Maya (new).
6. **Verify:** Maya's role is shown as "designer".
7. If you can access the database or check the backend: query `feature_collaborator_overrides` and confirm a row exists with `userId = 'maya-id'`, `action: 'add'`, and `featureId = 'feat-a1-uuid'`.
8. Open a new browser tab and log in as Maya. Navigate to Feature A1. **Verify:** Maya has access to the feature (no permission denied).

---

### Scenario AC3: Presence Updates within 30 Seconds

**Expected outcome:** After Maya joins, her presence appears in the Team sidebar of other collaborators within 30 seconds.

1. After the save completes (AC2), open Feature A1 in a second browser tab while logged in as Hamish (or any other current collaborator).
2. In Hamish's tab, check the Team sidebar — it should show Hamish, Susan, Darren, and Maya as offline (since Maya hasn't accessed the feature yet).
3. Now, in a third browser tab, log in as Maya and navigate to Feature A1.
4. **Verify:** Within 30 seconds, Hamish's Team sidebar updates to show Maya as **online** (without needing a page refresh).
5. **Verify:** The "last seen" timestamp for Maya is current (not a stale entry from a prior session).

---