# Test Plan: Assign Multiple Pods to a Feature (Subset Selection) — ep4-s1

**Story reference:** artefacts/new-feature-2b74a292/stories/ep4-s1.md
**Epic reference:** artefacts/new-feature-2b74a292/epics/advanced-pod-operations.md
**Domain:** web-ui
**Date:** 2026-09-16

---

## User Story

As a **Product owner or feature lead**,
I want **to assign more than one pod to a feature, and remove individual members from that combined selection for this feature only**,
So that **a feature can pull in people from multiple teams without needing a brand-new pod just for it**.

---

## Acceptance Criteria

**AC1:** Given Feature A2 needs members from both Core Platform Pod and Data Analytics Pod, When a product owner navigates to Feature A2 settings and clicks "Assign pods", Then they see a selector listing all of the organisation's pods, allowing more than one to be selected.

**AC2:** Given both pods have been selected, When the product owner removes Bob from Data Analytics Pod for this feature only, Then Bob is excluded from Feature A2's collaborators while remaining a member of Data Analytics Pod globally, unaffected in the pod itself.

**AC3:** Given the assignment has been saved, When feature_collaborators is inspected, Then it contains exactly the union of both pods' members minus Bob (Hamish, Susan, Darren, Alice).

---

## Test Data Strategy

**Strategy selected:** Synthetic — test data generated in test setup, no real data involved.

**Test data approach:**
- Fixture pods: Core Platform Pod (Hamish conductor, Susan engineer, Darren engineer) and Data Analytics Pod (Alice architect, Bob engineer)
- Fixture feature: Feature A2 with `featureId = 'feat-a2-uuid'`, `tenantId = 'tenant-test-123'`, currently no pod assignments
- Fixture multi-pod selection: both pods selected; Bob removed from Data Analytics Pod for this feature
- No production data required; all test data is synthetic and disposable post-test
- Filesystem: test instance with writable feature settings

**Sensitivity assessment:** Not applicable — no PCI, PHI, or sensitive data involved.

---

## AC Coverage & Test Approach

| AC | Test type | Coverage | Gap? |
|----|-----------|----------|------|
| AC1 | Unit + integration | Multi-pod selector renders and loads all pods | No |
| AC2 | Unit + integration | Per-member removal for this feature only (override logic) | No |
| AC3 | Integration + DB | feature_collaborators correctly reflects union-minus-removal | No |

**Gap table:** None — all ACs have corresponding tests.

---

## Unit Tests

### AC1: Multi-Pod Selector UI Loads and Allows Multiple Selection

**Test name:** `multi-pod.unit.selector-renders-all-pods`

**What it tests:** AC1 — when the pod assignment modal opens, it displays all organisation pods and allows more than one to be selected.

**Setup:**
- Fixture feature A2 with `featureId = 'feat-a2-uuid'`, `tenantId = 'tenant-test-123'`, currently no assignments
- Fixture org pods: Core Platform Pod (3 members), Data Analytics Pod (2 members), Legacy Platform Pod (archived)
- Feature settings page loaded

**Action:**
- Click "Assign pods" button
- Modal appears
- Inspect modal for pod list

**Expected result:**
- Modal title is "Assign pods to this feature"
- Pod list displays exactly 2 active pods (Core Platform Pod, Data Analytics Pod); archived pods are not listed
- Each pod is clickable/checkable (not disabled)
- Both pods can be selected simultaneously (checkboxes support multi-select, not radio buttons)

---

### AC2: Per-Member Removal for This Feature Only

**Test name:** `multi-pod.unit.remove-member-feature-level-only`

**What it tests:** AC2 — removing a member from a selected pod applies only to this feature, not globally.

**Setup:**
- Fixture Data Analytics Pod with Alice (architect), Bob (engineer)
- Multi-pod selector showing Data Analytics Pod selected
- Override table empty (no prior removals for this feature)

**Action:**
- In the modal, expand Data Analytics Pod's member list
- Click the X next to Bob
- Verify Bob is marked as removed for this feature

**Expected result:**
- Bob's row shows a strikethrough or "removed for this feature" indicator
- The removal is a visual/state-only change at this point (not yet persisted)
- A count shows "2 members, 1 removed = 1 active for this feature"
- Alice remains selected/active

---

### AC3: feature_collaborators Union Minus Removal

**Test name:** `multi-pod.unit.feature-collaborators-computed-correctly`

**What it tests:** AC3 — after assignment save, feature_collaborators contains the exact set (union of pods minus the removed members).

**Setup:**
- Fixture: Core Platform Pod (Hamish, Susan, Darren) + Data Analytics Pod (Alice, Bob)
- Assignment: both pods selected, Bob removed
- Awaiting save action

**Action:**
- Click "Save" in the modal
- Query feature_collaborators for Feature A2

**Expected result:**
- feature_collaborators contains exactly 4 rows: Hamish, Susan, Darren, Alice
- Bob is absent (not a row with `active: false`, but genuinely not in the result set)
- Each collaborator row has `podId` referencing either Core Platform Pod or Data Analytics Pod
- Hamish, Susan, Darren reference Core Platform Pod; Alice references Data Analytics Pod

---

## Integration Tests

### Full Multi-Pod Assignment End-to-End

**Test name:** `multi-pod.integration.assign-multiple-pods-end-to-end`

**What it tests:** Complete flow — open modal, select both pods, remove Bob, save, verify feature_collaborators and pod_assignments.

**Setup:**
- Feature A2 at feature settings page
- Both source pods exist with their members

**Action:**
1. Click "Assign pods"
2. Select Core Platform Pod (checkmark)
3. Select Data Analytics Pod (checkmark)
4. Expand Data Analytics Pod; remove Bob
5. Click "Save"
6. Query pod_assignments for Feature A2
7. Query feature_collaborators for Feature A2

**Expected result:**
- pod_assignments has 2 rows (one per selected pod) with `featureId = 'feat-a2-uuid'`
- feature_collaborators has 4 rows (union minus Bob)
- UI message on return: "Assigned pods: Core Platform Pod (3 members), Data Analytics Pod (1 member, 1 removed for this feature)"

---

### Archived Pods Not Selectable

**Test name:** `multi-pod.integration.archived-pods-filtered-from-selector`

**What it tests:** Archived pods do not appear in the selector, preventing accidental assignment to inactive teams.

**Setup:**
- Org has 3 pods: Core Platform (active), Data Analytics (active), Legacy Platform (archived status = "archived")
- Feature A2 settings open

**Action:**
1. Click "Assign pods"
2. Count pods in the selector list

**Expected result:**
- Exactly 2 pods shown (Core Platform, Data Analytics)
- Legacy Platform Pod is absent from the list
- No "show archived" toggle or similar option in the MVP selector

---

### Per-Feature Removal Does Not Affect Pod Membership Globally

**Test name:** `multi-pod.integration.removal-feature-scoped`

**What it tests:** Removing Bob from Data Analytics Pod for Feature A2 does not change Bob's membership in the pod globally or his assignment to other features using Data Analytics Pod.

**Setup:**
- Bob is in Data Analytics Pod (pod_members entry exists)
- Data Analytics Pod is also assigned to Feature A1 (created earlier in the test suite)
- Feature A2 is being configured with Data Analytics Pod, and Bob is removed

**Action:**
1. Assign Feature A2 to Data Analytics Pod
2. Remove Bob for Feature A2 only
3. Save
4. Query pod_members for Data Analytics Pod
5. Query feature_collaborators for Feature A1
6. Query feature_collaborators for Feature A2

**Expected result:**
- pod_members still shows Bob as an active member of Data Analytics Pod (unchanged)
- Feature A1's collaborators still include Bob (if it uses Data Analytics Pod)
- Feature A2's collaborators exclude Bob
- Override record in feature_collaborator_overrides shows: `featureId = 'feat-a2-uuid'`, `userId = 'bob'`, `action = 'remove'`

---

### Tenant Isolation on Multi-Pod Assignment

**Test name:** `multi-pod.integration.tenant-isolation-multi-pod`

**What it tests:** ADR-025 — multi-pod assignment for Tenant A does not affect Tenant B's feature or pod list.

**Setup:**
- Tenant A: Core Platform Pod, Data Analytics Pod, Feature A2 (no assignments yet)
- Tenant B: different set of pods, Feature B1 (no assignments yet)
- Multi-pod assignment requested for Tenant A's Feature A2

**Action:**
1. Assign Tenant A Feature A2 to both Tenant A pods
2. Remove Bob from Tenant A's Data Analytics Pod for this feature
3. Save
4. Query Tenant A's pod_assignments
5. Query Tenant B's pod_assignments for Feature B1
6. Query Tenant B's pod_collaborators

**Expected result:**
- Tenant A's pod_assignments has 2 rows (both pods assigned to Feature A2)
- Tenant B's pod_assignments unchanged
- Tenant B's Feature B1 remains unaffected
- Multi-pod assignment appears only in Tenant A records

---

## NFR Tests

### NFR-Perf-1: Multi-Pod Assignment UI Loads Within 1 Second

**Test name:** `multi-pod.nfr.selector-load-time-under-1s`

**Setup:** Feature A2 settings page; org has 20 active pods (stress case).

**Action:** Click "Assign pods"; measure time from click to modal fully rendered with all pods listed.

**Expected result:** ≤1s

---

### NFR-Perf-2: feature_collaborators Recalculated Within 2 Seconds of Save

**Test name:** `multi-pod.nfr.recalculation-latency-under-2s`

**Setup:** Multi-pod assignment with 10 members selected, 2 removed; save action triggered.

**Action:** Measure time from "Save" click to feature_collaborators query returning the updated 8-member set.

**Expected result:** ≤2s

---

### NFR-Completeness: All Pod Members Carried Over Unless Explicitly Removed

**Test name:** `multi-pod.nfr.union-completeness`

**Setup:** Core Platform Pod (5 members), Data Analytics Pod (4 members), no removals specified.

**Action:** Assign both pods to a feature without removing any members; query feature_collaborators.

**Expected result:** Exactly 9 rows (5 + 4, no duplicates); all members from both pods present.

---

## Test Summary

- **Unit tests:** 3 (AC1 selector, AC2 per-member removal, AC3 feature_collaborators union)
- **Integration tests:** 3 (full flow, archived filtering, per-feature removal scope, tenant isolation)
- **NFR tests:** 3 (selector load time ≤1s, recalculation ≤2s, union completeness)
- **Total:** 9 tests
- **All ACs covered:** Yes
- **Test data gaps:** None
- **Gaps in AC coverage:** None

---

# AC Verification Script: Assign Multiple Pods to a Feature (ep4-s1)

**Setup:** You have two active pods — "Core Platform Pod" (Hamish conductor, Susan engineer, Darren engineer) and "Data Analytics Pod" (Alice architect, Bob engineer). You are about to assign Feature A2 to both pods and remove Bob from the Data Analytics Pod assignment for this feature only.

---

### Scenario AC1: Selector Renders All Pods

**Expected outcome:** The pod assignment modal lists all active pods and allows multi-select.

1. Navigate to Feature A2 settings.
2. Click "Assign pods" button.
3. A modal titled "Assign pods to this feature" appears.
4. **Verify:** The modal lists exactly two pods: "Core Platform Pod (3 members)" and "Data Analytics Pod (2 members)".
5. **Verify:** Each pod has a checkbox (or equivalent multi-select control), not a radio button.
6. **Verify:** Both pods can be checked simultaneously (no "uncheck one when you check another" behaviour).
7. Close or leave the modal open for the next scenario.

---

### Scenario AC2: Remove Bob for This Feature Only

**Expected outcome:** Removing Bob from Data Analytics Pod applies only to Feature A2, not globally.

1. From the modal open above, check "Core Platform Pod".
2. Check "Data Analytics Pod".
3. Expand the "Data Analytics Pod" section (if collapsed) to show its member list: Alice (architect), Bob (engineer).
4. Click the remove/X icon next to Bob.
5. **Verify:** Bob's row now shows a strikethrough, or a label like "removed for this feature".
6. **Verify:** A summary line shows "Data Analytics Pod: 2 members, 1 removed = 1 active for this feature" (or equivalent wording).
7. **Verify:** Alice remains checked/active.
8. Click "Save".

---

### Scenario AC3: feature_collaborators Contains Union Minus Bob

**Expected outcome:** After saving, Feature A2's team list contains Hamish, Susan, Darren, and Alice — but not Bob.

1. After the save completes, navigate to Feature A2's Team sidebar or collaborators panel (or query the database if testing at DB level).
2. **Verify:** The collaborator list shows exactly 4 people: Hamish, Susan, Darren, Alice.
3. **Verify:** Bob is absent (no row for Bob at all; not marked inactive, but genuinely not in the list).
4. **Verify:** Hamish, Susan, Darren are labelled or grouped as "Core Platform Pod"; Alice is labelled or grouped as "Data Analytics Pod".
5. If you added Darren to Feature A1 earlier (as a presence test), verify that Feature A1 still shows Darren and Bob — the removal is only for Feature A2.

---