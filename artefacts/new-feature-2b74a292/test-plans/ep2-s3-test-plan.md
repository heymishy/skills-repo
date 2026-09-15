# Test Plan: Sign-Off at a Stage (Approval Record & Advance) (ep2-s3)

**Story reference:** artefacts/new-feature-2b74a292/stories/ep2-s3.md
**Epic reference:** artefacts/new-feature-2b74a292/epics/feature-collaboration-sign-off.md
**Domain:** web-ui
**Date:** 2026-09-16

---

## User Story
As a **Team collaborator with approval responsibility (product lead for discovery, tech lead for DoR, etc.)**,
I want **to formally sign off my stage of the feature with a reason**,
So that **there's a clear, attributable record of who approved what, and the feature advances**.

---

## Acceptance Criteria

**AC1:** Given Hamish (conductor) is at the discovery stage of Feature A1 and clicks "Sign Off", When a modal appears asking for approval reason, Then the modal contains a text field for reason entry and an "Approve" button, both clearly visible and accessible without scrolling.

**AC2:** Given Hamish enters a reason ("Discovery is complete; personas, pain points, and scope are locked") and clicks "Approve", When the approval is submitted, Then the approval is recorded in feature_approvals (approverId: Hamish, approvalTime: [current timestamp], reason: [entered text]), and the feature's stage advances from discovery to benefit-metric.

**AC3:** Given the feature has advanced to benefit-metric, When decisions.md is inspected, Then a new entry has been appended with: date, session-phase: discovery-approved, decision: Discovery approved by Hamish, reason: [exact text Hamish entered], and timestamp matching the approval time.

---

## Test Data Strategy

**Strategy selected:** Synthetic — test data generated in test setup, no real data involved.

**Test data approach:**
- Fixture feature: Feature A1 with `featureId = 'feat-a1-uuid'`, `tenantId = 'tenant-test-123'`, current stage = "discovery"
- Fixture collaborator: Hamish (userId = 'user-hamish', roleId = 'conductor'), assigned to Feature A1
- Session context: `{ tenantId: 'tenant-test-123', userId: 'user-hamish', roleId: 'conductor' }`
- Feature stage list: all 7 stages present in underlying data
- No production data required; all data is disposable post-test
- Database: test instance or in-memory mock

**Sensitivity assessment:** Not applicable — no PCI, PHI, or sensitive data involved.

---

## AC Coverage & Test Approach

| AC | Test type | Coverage | Gap? |
|----|-----------|----------|------|
| AC1 | Unit + E2E | Sign-off modal renders with reason field and button | No |
| AC2 | Unit + E2E | Approval recorded + feature advances to next stage | No |
| AC3 | Unit + E2E | decisions.md entry auto-generated with full context | No |

**Gap table:** None — all ACs have corresponding tests.

---

## Unit Tests

### AC1: Sign-Off Modal Renders with Reason Field

**Test name:** `approval.modal.sign-off-modal-renders-with-reason-field`

**What it tests:** AC1 — sign-off modal appears on click with required UI elements

**Setup:**
- Mock session context: `{ tenantId: 'tenant-test-123', userId: 'user-hamish', roleId: 'conductor' }`
- Fixture feature: Feature A1, stage = "discovery", Hamish assigned as conductor
- Feature page loaded, feature stage panel rendered

**Action:**
- Locate "Sign Off" button on the discovery stage panel
- Click "Sign Off"
- Query the DOM for a modal element with id or class matching approval modal pattern
- Verify text field presence and button presence

**Expected result:**
- Modal element appears (not hidden, display !== 'none', visibility !== 'hidden')
- Text input field is present with placeholder or label "Reason for approval" or equivalent
- "Approve" button is present and enabled (not disabled)
- Modal is visible without page scroll (all elements within viewport or scrollable parent)

---

### AC2: Approval Recorded and Feature Advances

**Test name:** `approval.submission.approval-recorded-feature-advances`

**What it tests:** AC2 — approval submission records the entry and advances the feature stage

**Setup:**
- Same as AC1 setup
- Modal is open and ready for input
- `feature_approvals` table is empty for this feature

**Action:**
1. Enter text "Discovery is complete; personas, pain points, and scope are locked" in the reason field
2. Click "Approve"
3. Wait for HTTP response and state update
4. Query `feature_approvals` for a record matching `featureId = 'feat-a1-uuid'`
5. Query feature's current stage from the state

**Expected result:**
- HTTP 200 response from approval endpoint
- `feature_approvals` contains exactly one new record with:
  - `featureId = 'feat-a1-uuid'`
  - `stageId = 'discovery'`
  - `approverId = 'user-hamish'`
  - `approvalTime` is a valid timestamp within the last 5 seconds
  - `reason = 'Discovery is complete; personas, pain points, and scope are locked'`
- Feature's current stage has advanced to "benefit-metric"
- Modal has closed (no longer visible in DOM)

---

### AC3: decisions.md Entry Auto-Generated

**Test name:** `approval.decisions.decisions-md-entry-created-on-approval`

**What it tests:** AC3 — decisions.md entry is appended with full approval context

**Setup:**
- Same as AC2
- Approval has just completed and feature has advanced
- `decisions.md` file for Feature A1 exists and is accessible

**Action:**
1. Read `artefacts/new-feature-2b74a292/decisions.md` from disk (via test utility)
2. Parse the last entry in the file
3. Verify required fields are present

**Expected result:**
- Last entry in decisions.md contains:
  - `date: 2026-09-16` (current date, in YYYY-MM-DD format)
  - `session-phase: discovery-approved`
  - `decision: Discovery approved by Hamish (conductor)`
  - `reason: Discovery is complete; personas, pain points, and scope are locked`
  - `timestamp: [ISO 8601 timestamp matching approval time within 1 second]`
- Entry was appended (not inserted in middle; previous entries, if any, remain unchanged)
- No placeholder or "TODO" text in the entry

---

## Integration Tests

### Approval + Stage Advance + Audit Trail Full Path

**Test name:** `approval.integration.full-approval-path-modal-to-dod`

**What it tests:** Complete approval flow — modal appears, user fills it, approval records, feature advances, decisions.md updates, all in one end-to-end sequence

**Setup:**
- Tenant context: `{ tenantId: 'tenant-test-123' }`
- Feature A1, stage = "discovery", Hamish assigned as conductor
- Feature page fully loaded
- `feature_approvals` empty, `decisions.md` has discovery phase already (not empty, but no approval entry yet)

**Action:**
1. Click "Sign Off" button on discovery stage panel
2. Wait for modal to appear (up to 1s)
3. Enter reason "Personas and pain points confirmed"
4. Click "Approve" button
5. Wait for feature state to update (up to 2s)
6. Query `feature_approvals` for the new record
7. Read `decisions.md` and parse the last entry
8. Verify stage has advanced

**Expected result:**
- All AC2 and AC3 expectations met in a single, coordinated sequence
- No orphaned records (approval without stage advance, or stage advance without approval record)
- Feature state, database, and disk are all consistent

---

### Approval Isolation by Tenant

**Test name:** `approval.integration.approval-isolation-by-tenant`

**What it tests:** ADR-025 — approval records are tenant-scoped; one tenant's approvals do not affect another's

**Setup:**
- Tenant A: Feature A1, stage = "discovery", Hamish assigned, `feature_approvals` empty
- Tenant B: Feature A1 (same slug, different tenant), different user "Alice" assigned, `feature_approvals` empty
- Session context for Tenant A: `{ tenantId: 'tenant-a', userId: 'user-hamish-a' }`

**Action:**
1. Load Feature A1 under Tenant A as Hamish
2. Click "Sign Off", enter reason, approve
3. Query `feature_approvals` for Tenant A's Feature A1
4. Verify Tenant B's data is not returned
5. Switch to Tenant B context
6. Verify Tenant B's Feature A1 still has empty `feature_approvals`

**Expected result:**
- Tenant A's approval is recorded only for Tenant A's Feature A1
- Tenant B's Feature A1 is unaffected
- Query filtering by `tenantId` is enforced

---

## E2E Tests (Browser)

### AC1: Sign-Off Modal Renders on Page Load

**Test name:** `approval.e2e.sign-off-modal-renders-on-page-load`

**Setup:**
- Auth bypass fixture (NODE_ENV=test guard) with synthetic session for Hamish (conductor)
- Feature A1 fully set up with stage = "discovery" in database
- Feature page URL: `http://localhost:3000/features/feat-a1-uuid`

**Action:**
- Open feature page in browser
- Wait for page to fully render (up to 3s)
- Locate the discovery stage panel
- Locate and click "Sign Off" button

**Expected result:**
- Page renders completely without errors
- Discovery stage panel is visible and contains a "Sign Off" button
- Clicking "Sign Off" causes a modal to appear with:
  - Title or heading indicating approval
  - Text input field for reason
  - "Approve" button clearly visible
  - Modal is not hidden, scrolled off-screen, or behind other elements

---

### AC2: Approval Submission Advances Feature Without Page Refresh

**Test name:** `approval.e2e.approval-submission-advances-feature`

**Setup:**
- Same as AC1 E2E
- Modal is open and ready for input

**Action:**
1. Type reason "Discovery complete" into reason field
2. Click "Approve" button
3. Observe page state without manual refresh
4. Locate the next stage (benefit-metric) panel to confirm navigation

**Expected result:**
- After "Approve" click: page does NOT refresh (if there was unsaved work elsewhere, it persists)
- Within 2s: discovery stage panel transitions to a "completed" or "passed" state, or is no longer marked as current
- benefit-metric stage panel is now indicated as current or active
- No error messages or exceptions in browser console

---

### AC3: decisions.md Entry Visible After Approval

**Test name:** `approval.e2e.decisions-md-entry-visible-post-approval`

**Setup:**
- Same as AC2 E2E, approval has just completed

**Action:**
1. Locate a "View decisions" link or section on the feature page (or navigate to decisions.md directly)
2. Open decisions.md for Feature A1
3. Scroll to the end of the file
4. Locate the most recent entry

**Expected result:**
- decisions.md loads without errors
- Most recent entry contains:
  - Date matching approval date
  - Approval decision text
  - Reason text matching what was entered
  - Timestamp present and readable

---

## NFR Tests

### NFR-Perf-1: Modal Appearance Latency

**Test name:** `approval.nfr.modal-appearance-latency`

**Setup:** Same as AC1 unit test

**Action:** Click "Sign Off" button, measure time from click to modal element appearing in DOM

**Expected result:** Modal appears within 500ms of click (user-perceived responsiveness threshold)

---

### NFR-Perf-2: Approval Submission Latency

**Test name:** `approval.nfr.approval-submission-latency`

**Setup:** Modal is open with reason entered

**Action:** Click "Approve", measure time from click to feature stage updating in state

**Expected result:** Feature stage updates within 2s of approval click (from AC2: "completes within 2s")

---

### NFR-A11y-1: Modal Keyboard Navigation

**Test name:** `approval.nfr.modal-keyboard-navigation`

**Setup:** Feature page loaded, "Sign Off" button present

**Action:** Use Tab key to navigate to "Sign Off" button, press Enter to trigger modal; use Tab to navigate to reason field and "Approve" button within modal; press Enter to submit

**Expected result:** All modal elements are reachable via Tab; no elements skipped; focus indicator visible; Enter key activates buttons (not click-only)

---

### NFR-A11y-2: Modal Accessible Text and Labels

**Test name:** `approval.nfr.modal-accessible-labels`

**Setup:** Modal is open

**Action:** Use screen reader or inspect HTML for aria-label, label elements, and semantic markup on text field and button

**Expected result:**
- Reason field has a visible or aria-labeled description (e.g., "Reason for approval")
- "Approve" button has clear, descriptive text
- Modal has a title or role="dialog" attribute

---

## Test Summary

- **Unit tests:** 3 (AC1 modal render, AC2 approval + advance, AC3 decisions.md entry)
- **Integration tests:** 2 (full approval path, tenant isolation)
- **E2E tests:** 3 (modal render on page load, approval submission without refresh, decisions.md visible post-approval)
- **NFR tests:** 4 (modal latency, submission latency, keyboard navigation, accessible labels)
- **Total:** 12 tests
- **All ACs covered:** Yes
- **Test data gaps:** None
- **Gaps in AC coverage:** None

---

# AC Verification Script: Sign-Off at a Stage (Approval Record & Advance) (ep2-s3)

**Setup:** You are logged in as Hamish (conductor role) with access to Feature A1. The feature is currently at the discovery stage. You have full visibility to all stages and can approve.

---

### Scenario AC1: Sign-Off Modal Appears

**Expected outcome:** When Hamish clicks "Sign Off" at the discovery stage, a modal appears with a reason field and approval button.

1. Navigate to Feature A1's main page.
2. **Verify:** The page renders completely.
3. Locate the discovery stage panel on the left or in the main navigation.
4. **Verify:** A "Sign Off" button or link is visible on the discovery stage panel.
5. Click "Sign Off".
6. **Verify:** A modal dialog appears (not a page navigation or redirect).
7. **Verify:** The modal contains:
   - A text input field with a label or placeholder indicating "Reason for approval" or similar
   - An "Approve" button clearly labeled
   - Optional: a "Cancel" button to close without approving
8. **Verify:** The modal is fully visible without scrolling (all elements on screen or in a scrollable modal body).

---

### Scenario AC2: Approval Advances Feature

**Expected outcome:** When Hamish enters a reason and clicks "Approve", the feature advances to the next stage and the approval is recorded.

1. From Scenario AC1, the modal is open.
2. Click in the reason text field.
3. Type: "Discovery is complete; personas, pain points, and scope are locked".
4. **Verify:** The text appears in the field as you type.
5. Click the "Approve" button.
6. **Verify:** The modal closes (no longer visible).
7. **Verify:** The page does NOT refresh (any scroll position or unsaved work elsewhere on the page is preserved).
8. **Verify:** The discovery stage panel transitions to a "completed" or "passed" state — it may change color, show a checkmark, or move to a "completed" section.
9. **Verify:** The benefit-metric stage panel is now marked as current or active (highlighted, in focus, or indicated as the next stage).

---

### Scenario AC3: decisions.md Entry Created

**Expected outcome:** After approval, a new entry is automatically added to decisions.md recording the approval.

1. From Scenario AC2, the feature has advanced to benefit-metric.
2. Navigate to the decisions.md file for Feature A1 (e.g., `artefacts/new-feature-2b74a292/decisions.md` or via a "View decisions" link on the feature page).
3. **Verify:** The file loads without errors.
4. Scroll to the end of the file (the most recent entry).
5. **Verify:** The last entry contains:
   - **Date:** Today's date in YYYY-MM-DD format (e.g., 2026-09-16)
   - **Phase indicator:** "discovery-approved" or similar, showing this is an approval decision
   - **Decision text:** "Discovery approved by Hamish (conductor)" or similar, naming the approver and their role
   - **Reason:** The exact text you entered: "Discovery is complete; personas, pain points, and scope are locked"
   - **Timestamp:** A timestamp matching the time you clicked "Approve" (within 1 minute)
6. **Verify:** No placeholder text like "TODO" or "[FILL IN]" appears in the entry.
7. **Verify:** If there were prior entries in decisions.md before this approval, they are still present (the new entry was appended, not inserted in the middle, not overwriting previous entries).

---