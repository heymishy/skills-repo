# Test Plan: Archive a Pod and Preserve Audit Trail — ep4-s3

**Story reference:** artefacts/new-feature-2b74a292/stories/ep4-s3.md
**Epic reference:** artefacts/new-feature-2b74a292/epics/advanced-pod-operations.md
**Domain:** web-ui
**Date:** 2026-09-16

---

## User Story

As a **Organisation administrator**,
I want **to mark a pod as archived instead of deleting it**,
So that **unused pods stop cluttering active dropdowns, without losing the historical record of which features used them**.

---

## Acceptance Criteria

**AC1:** Given the "Legacy Platform Pod" is no longer used, When an org admin navigates to Pod Manager and clicks "Archive" on that pod, Then the action completes immediately (no confirmation dialog required) and the pods.status field is set to "archived".

**AC2:** Given a pod has been archived, When the "Assign pod" dropdown is opened for a new feature assignment, Then archived pods do not appear in the list — only active pods are shown.

**AC3:** Given a feature that was using an archived pod before archival, When that feature's collaborators or audit trail is inspected, Then the archived pod's members are still listed there with full historical attribution — archival does not remove or hide the historical record.

---

## Test Data Strategy

**Strategy selected:** Synthetic — test data generated in test setup, no real data involved.

**Test data approach:**
- Fixture pod: "Legacy Platform Pod" with status initially set to "active", containing 3 members (Alex, Beth, Chris)
- Fixture feature: Feature X1 already assigned to "Legacy Platform Pod" before archival
- Fixture role definitions: standard product/engineer roles
- No production data required; all test data is synthetic and disposable post-test

**Sensitivity assessment:** Not applicable — no PCI, PHI, or sensitive data involved.

---

## AC Coverage & Test Approach

| AC | Test type | Coverage | Gap? |
|----|-----------|----------|------|
| AC1 | Unit | Archival action trigger, status field update | No |
| AC2 | Integration | Dropdown filtering logic, active-pod visibility | No |
| AC3 | Integration | Historical data preservation, feature-level audit trail | No |

**Gap table:** None — all ACs have corresponding tests.

---

## Unit Tests

### AC1: Archival Action Completes Immediately

**Test name:** `archive-pod.unit.archival-completes-immediately`

**What it tests:** AC1 — clicking "Archive" on a pod sets its status to "archived" immediately without a confirmation dialog.

**Setup:**
- Fixture pod: "Legacy Platform Pod" with `podId = 'pod-legacy-uuid'`, `tenantId = 'tenant-test-123'`, `status = 'active'`, containing 3 members
- Pod Manager page loaded; "Legacy Platform Pod" visible in the pod list

**Action:**
- Click "Archive" button on "Legacy Platform Pod"
- Inspect the pods table or pod state

**Expected result:**
- No confirmation dialog appears
- The "Archive" button click is processed immediately
- Querying the pods table shows `status = 'archived'` for this pod
- The UI updates (pod no longer visible in the active pod list, or a visual indicator shows archived status) within 1 second
- No page refresh is required for the UI update to appear

---

### AC2: Archived Pods Filtered from Dropdown

**Test name:** `archive-pod.unit.archived-pods-excluded-from-dropdown`

**What it tests:** AC2 — a dropdown or selector for assigning pods to a new feature excludes archived pods.

**Setup:**
- Fixture pods: "Legacy Platform Pod" (status: archived), "Core Platform Pod" (status: active), "Data Analytics Pod" (status: active)
- Feature creation form open with the "Assign pod" dropdown ready to open
- All three pods exist in the pods table

**Action:**
- Click the "Assign pod" dropdown
- Inspect the list of pods shown

**Expected result:**
- Exactly 2 pods appear in the dropdown: "Core Platform Pod" and "Data Analytics Pod"
- "Legacy Platform Pod" is absent from the list
- No "(archived)" label or visual indicator appears for any pod in the dropdown (they are simply not listed, not grayed out)

---

### AC3: Historical Data Preserved on Archival

**Test name:** `archive-pod.unit.feature-collaborators-unchanged-on-pod-archival`

**What it tests:** AC3 — when a pod is archived, features already using that pod still show its members in their collaborator list.

**Setup:**
- Fixture pod: "Legacy Platform Pod" (status: active) with members Alex, Beth, Chris
- Fixture feature: Feature X1 with `podAssignments: ['Legacy Platform Pod']` and `feature_collaborators` pre-populated with Alex, Beth, Chris
- Archive the pod (status becomes "archived")

**Action:**
- Query feature_collaborators for Feature X1
- Inspect the audit trail or historical record for this feature

**Expected result:**
- feature_collaborators for Feature X1 still contains Alex, Beth, Chris
- Each collaborator's record still references "Legacy Platform Pod" as the source
- No rows are deleted from feature_collaborators
- No rows are deleted from pod_members or pod_assignments

---

## Integration Tests

### Full Archival End-to-End

**Test name:** `archive-pod.integration.archival-end-to-end`

**What it tests:** Complete flow — archive a pod, verify it is hidden from new assignments, verify existing features are unaffected.

**Setup:**
- Fixture pods: "Legacy Platform Pod" (active, 3 members), "Core Platform Pod" (active, 3 members)
- Fixture features: Feature A (using Legacy), Feature B (using Core)
- Pod Manager page loaded; Pod list visible

**Action:**
1. Click "Archive" on "Legacy Platform Pod"
2. Verify the pod's status is now archived
3. Navigate to feature creation and open "Assign pod" dropdown
4. Verify "Legacy Platform Pod" is not in the list
5. Navigate to Feature A's collaborators view
6. Verify all 3 members of "Legacy Platform Pod" are still listed with full attribution

**Expected result:**
- Pod archival completes within 1 second
- Dropdown filters correctly (Legacy excluded, Core visible)
- Feature A's collaborators unchanged (all 3 members still present)
- Feature A's audit trail shows no modification (no "archived pod" flag or timestamp change on Feature A)

---

### Tenant Isolation on Pod Archival

**Test name:** `archive-pod.integration.tenant-isolation-pod-archival`

**What it tests:** ADR-025 — archiving a pod in Tenant A does not affect Tenant B's pods or features.

**Setup:**
- Tenant A: "Legacy Platform Pod" (active, 3 members), Feature X assigned to it
- Tenant B: "Legacy Platform Pod" (active, 3 members), Feature Y assigned to it
- Tenants are isolated at the session/auth level

**Action:**
1. Log in as Tenant A org admin
2. Archive Tenant A's "Legacy Platform Pod"
3. Query Tenant A's pod list (status = archived)
4. Log in as Tenant B org admin
5. Query Tenant B's pod list

**Expected result:**
- Tenant A's "Legacy Platform Pod" is archived
- Tenant B's "Legacy Platform Pod" remains active (unaffected)
- Tenant B's pod dropdown still shows its own "Legacy Platform Pod"
- No cross-tenant data leakage

---

### Archived Pod Hidden from Multiple Dropdowns

**Test name:** `archive-pod.integration.archived-pod-hidden-from-all-assignment-flows`

**What it tests:** Archived pods are consistently hidden from dropdowns in all assignment workflows (new feature, multi-pod override, etc.).

**Setup:**
- Fixture pods: "Legacy Platform Pod" (archived), "Core Platform Pod" (active)
- Multiple assignment workflows open (new feature creation, feature settings, pod override)

**Action:**
1. Open the "Assign pod" dropdown in feature creation
2. Verify "Legacy Platform Pod" is absent
3. Open the pod selector in Feature A settings (multi-pod assignment)
4. Verify "Legacy Platform Pod" is absent
5. Open the pod selector in Feature A's override workflow
6. Verify "Legacy Platform Pod" is absent

**Expected result:**
- In every dropdown/selector checked, "Legacy Platform Pod" does not appear
- No duplication or inconsistency in filtering logic across different assignment flows

---

### Direct Pod Query After Archival

**Test name:** `archive-pod.integration.pod-table-shows-archived-status`

**What it tests:** A direct query to the pods table confirms the archived status is durable.

**Setup:**
- Fixture pod: "Legacy Platform Pod" created and archived in the same session

**Action:**
1. Archive the pod via the UI
2. Query the pods table directly for this pod
3. Inspect the status field
4. Verify the pod is not deleted, just marked archived

**Expected result:**
- Query returns 1 row for "Legacy Platform Pod"
- The `status` field is "archived"
- The `podId`, `tenantId`, `name`, `createdBy`, `createdAt` fields are all unchanged
- No NULL or empty fields

---

## NFR Tests

### NFR-1: Archival Completes Within 1 Second

**Test name:** `archive-pod.nfr.archival-latency-under-1s`

**Setup:** Pod Manager page loaded with "Legacy Platform Pod" visible.

**Action:** Click "Archive" button. Measure time from click to status update visible in the UI.

**Expected result:** ≤1s

---

### NFR-2: Archived Pod Not Visible in Dropdown Without Refresh

**Test name:** `archive-pod.nfr.dropdown-filter-no-refresh`

**Setup:** Pod Manager open. "Assign pod" dropdown open showing "Legacy Platform Pod" (active).

**Action:** In a separate browser tab or process, archive the pod. Return to the dropdown without refreshing the page.

**Expected result:** On next dropdown open (or immediate refresh if dropdown is still open), "Legacy Platform Pod" is not in the list. No page refresh is required.

---

### NFR-3: Feature Collaborators Persist Without Modification

**Test name:** `archive-pod.nfr.feature-collaborators-unchanged`

**Setup:** Feature X1 using "Legacy Platform Pod" (active, 3 members).

**Action:** Archive the pod. Immediately query Feature X1's feature_collaborators.

**Expected result:** All 3 collaborators remain present with identical `userId`, `role`, `podId` values. No `modifiedAt` timestamp is updated on the feature or its collaborators.

---

## Test Summary

- **Unit tests:** 3 (AC1 archival action, AC2 dropdown filter, AC3 historical preservation)
- **Integration tests:** 4 (full end-to-end, tenant isolation, multi-dropdown consistency, pod table query)
- **NFR tests:** 3 (latency <1s, no-refresh filter, collaborator durability)
- **Total:** 10 tests
- **All ACs covered:** Yes
- **Test data gaps:** None
- **Gaps in AC coverage:** None

---

# AC Verification Script: Archive a Pod and Preserve Audit Trail — ep4-s3

**Setup:** You are an organisation administrator. A pod named "Legacy Platform Pod" exists with 3 members. At least one feature (Feature X) is already using this pod. The pod is currently active.

---

### Scenario AC1: Archival Action Completes Immediately

**Expected outcome:** Archival happens instantly with no confirmation dialog.

1. Navigate to Pod Manager.
2. Locate "Legacy Platform Pod" in the pod list.
3. Click the "Archive" button beside it.
4. **Verify:** No confirmation dialog appears — the action processes immediately.
5. **Verify:** Within 1 second, the UI updates — "Legacy Platform Pod" is no longer listed in the active pods, or a visual indicator (greyed out, "(archived)" label) shows its new status.
6. **Verify:** If you navigate away and return to Pod Manager, "Legacy Platform Pod" is still shown as archived — the status persists.

---

### Scenario AC2: Archived Pod Hidden from Assignment Dropdown

**Expected outcome:** A dropdown for assigning pods to a new feature shows only active pods.

1. Start creating a new feature.
2. When prompted to assign pods, click the "Assign pod" dropdown or selector.
3. **Verify:** The dropdown shows all active pods (e.g., "Core Platform Pod", "Data Analytics Pod").
4. **Verify:** "Legacy Platform Pod" does NOT appear in the list.
5. **Verify:** No "(archived)" label or greyed-out entry for "Legacy Platform Pod" — it is simply absent.
6. If you proceed to create the feature without selecting a pod (or selecting a different one), confirm that "Legacy Platform Pod" is not auto-selected or forced as a default.

---

### Scenario AC3: Historical Collaborators Preserved After Archival

**Expected outcome:** Features that were already using the archived pod still show its members.

1. Navigate to Feature X (the feature that was assigned to "Legacy Platform Pod" before archival).
2. Open the Team sidebar or Collaborators section.
3. **Verify:** All 3 members of "Legacy Platform Pod" are still listed (e.g., Alex, Beth, Chris).
4. **Verify:** Each member's role is shown correctly (e.g., conductor, engineer, engineer).
5. **Verify:** The pod name "Legacy Platform Pod" is still visible in the attribution (e.g., "From Legacy Platform Pod") or in the historical record.
6. Open Feature X's audit trail or decisions.md.
7. **Verify:** No entry appears indicating the pod was archived or the team was modified — archival does not trigger an automatic audit entry for unrelated features.

---

Test plan saved for ep4-s3. Start a new session for the next story.