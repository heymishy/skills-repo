# Test Plan: Request Regression to Earlier Stage (ep3-s1)

**Story reference:** artefacts/new-feature-2b74a292/stories/ep3-s1.md
**Epic reference:** artefacts/new-feature-2b74a292/epics/reversibility-audit-trail.md
**Domain:** web-ui
**Date:** 2026-09-16

---

## User Story
As a **Team collaborator (any role)**,
I want **to send the feature back to an earlier stage with a reason**,
So that **the team can revisit and fix something without losing the audit trail of what was already approved**.

---

## Acceptance Criteria

**AC1:** Given Susan is at the DoR stage of Feature A1, When she clicks "Request Regression", Then she is presented with a stage selector and a reason field, and submits her choice ("definition") with a reason.

**AC2:** Given the regression request has been submitted, When it is processed, Then the feature's stage resets to "definition" and every stage between definition and DoR (inclusive of DoR) is marked "incomplete".

**AC3:** Given the feature has regressed, When feature_approvals is inspected, Then the approval records for DoR and the stages after it still exist (not deleted) — preserved for audit even though those stages are now marked incomplete.

---

## Test Data Strategy

**Strategy selected:** Synthetic — test data generated in test setup, no real data involved.

**Test data approach:**
- Fixture feature: Feature A1 with `featureId = 'feat-a1-uuid'`, `tenantId = 'tenant-test-123'`, current stage: "dor"
- Fixture approvals: Two approval records already exist in feature_approvals (discovery signed off by Hamish, dor signed off by Susan)
- Two collaborator sessions: Susan (userId = 'user-susan', roleId = 'engineer'), Hamish (userId = 'user-hamish', roleId = 'conductor')
- No production data required; all test data is synthetic and disposable post-test
- Database: test instance or in-memory mock with feature_approvals table

**Sensitivity assessment:** Not applicable — no PCI, PHI, or sensitive data involved.

---

## AC Coverage & Test Approach

| AC | Test type | Coverage | Gap? |
|----|-----------|----------|------|
| AC1 | Unit + integration + E2E | Regression UI trigger; stage selector populated; reason field captures text | No |
| AC2 | Unit + integration | Stage reset logic; downstream stage marking as incomplete | No |
| AC3 | Integration | Prior approvals preserved in database; not deleted on regression | No |

**Gap table:** None — all ACs have corresponding tests.

---

## Unit Tests

### AC1: Regression UI Trigger

**Test name:** `regression.ui.request-regression-button-opens-modal`

**What it tests:** AC1 — clicking "Request Regression" displays a modal with stage selector and reason field.

**Setup:**
- Fixture feature A1 at DoR stage
- Susan logged in as collaborator
- Feature page loaded and rendered

**Action:**
- Locate and click "Request Regression" button on the feature page
- Capture modal content

**Expected result:**
- Modal appears within 500ms
- Modal contains a stage dropdown pre-populated with all prior stages (discovery, benefit-metric, definition, test-plan, review)
- Modal contains a text area or input field labelled "Reason for regression"
- Modal has "Submit" and "Cancel" buttons

---

### AC2a: Stage Reset Logic

**Test name:** `regression.logic.stage-reset-to-target`

**What it tests:** AC2 (part 1) — when regression is submitted, the feature's stage field is updated to the target stage.

**Setup:**
- Feature A1 at DoR stage (stage = "dor")
- Fixture approval records exist for discovery and DoR
- Regression request prepared: targetStage = "definition", reason = "Definition needs revision"

**Action:**
- Call regression handler with targetStage = "definition"
- Query feature state after regression completes
- Check feature.stage value

**Expected result:**
- feature.stage is "definition" (not "dor")
- No error thrown; regression completes within 1s

---

### AC2b: Downstream Stages Marked Incomplete

**Test name:** `regression.logic.downstream-stages-incomplete`

**What it tests:** AC2 (part 2) — all stages between target and current (inclusive of current) are marked incomplete.

**Setup:**
- Feature A1 at DoR stage
- Current stages marked as complete: discovery, benefit-metric, definition, test-plan, review, dor
- Regression target: definition

**Action:**
- Call regression handler with targetStage = "definition"
- Query feature state; inspect stage-completion status for each stage

**Expected result:**
- Stages discovery, benefit-metric: remain complete (before target)
- Stages definition, test-plan, review, dor: all marked incomplete (target through current, inclusive)
- No other fields altered

---

### AC3: Approvals Preserved

**Test name:** `regression.preservation.approvals-not-deleted`

**What it tests:** AC3 — approval records for the current and subsequent stages remain in feature_approvals.

**Setup:**
- feature_approvals contains 2 records:
  - Record 1: approver = Hamish, stage = discovery, approvalTime = [past], reason = "Discovery complete"
  - Record 2: approver = Susan, stage = dor, approvalTime = [recent], reason = "Ready to code"
- Regression request: targetStage = "definition"

**Action:**
- Call regression handler
- Query feature_approvals after regression
- Count records and inspect their content

**Expected result:**
- Exactly 2 records remain in feature_approvals (Record 1 and Record 2)
- Both records have identical content to before regression (no mutation, no deletion)
- No new approval records are created by the regression itself

---

## Integration Tests

### Full Regression Flow: Modal → Submit → State Update

**Test name:** `regression.integration.full-regression-flow-end-to-end`

**What it tests:** Complete regression flow — open modal, select stage, enter reason, submit, verify state change and audit preservation.

**Setup:**
- Feature A1 at DoR stage
- Susan logged in
- Feature page loaded
- feature_approvals table with 2 records (see AC3 setup)

**Action:**
1. Click "Request Regression" button
2. Modal opens; select "definition" from stage dropdown
3. Enter reason: "Definition missing architecture details"
4. Click "Submit"
5. Wait for completion (up to 2s)
6. Query feature stage
7. Query feature_approvals
8. Verify feature-state page is updated or refreshed to show new stage

**Expected result:**
- AC1 conditions met: modal appeared with correct fields
- AC2 conditions met: feature.stage = "definition"; stages test-plan, review, dor marked incomplete
- AC3 conditions met: prior approval records preserved
- No errors in console or server logs
- Feature page reflects new stage immediately or after auto-refresh

---

### Tenant Isolation on Regression

**Test name:** `regression.integration.tenant-isolation-on-regression`

**What it tests:** ADR-025 — regression is tenant-scoped; one tenant's regression does not affect another's features.

**Setup:**
- Tenant A: Feature A1 at DoR stage
- Tenant B: Feature A1 (same slug, different tenant) at DoR stage
- Susan assigned to Tenant A only
- feature_approvals rows tagged with tenantId

**Action:**
1. Susan (Tenant A context) submits regression on Tenant A's Feature A1 to "definition"
2. Query Tenant A's Feature A1 stage
3. Query Tenant B's Feature A1 stage (from Tenant B context)
4. Inspect feature_approvals for both tenants

**Expected result:**
- Tenant A's Feature A1 stage = "definition" (regressed)
- Tenant B's Feature A1 stage = "dor" (unchanged)
- Tenant B's feature_approvals unchanged
- All queries enforce tenantId scoping

---

### Edge Case: Regression to Earliest Stage

**Test name:** `regression.integration.regression-to-discovery`

**What it tests:** Regression works correctly when targeting the earliest stage (discovery).

**Setup:**
- Feature A1 at coding stage (6+ stages complete)
- Regression request: targetStage = "discovery"

**Action:**
- Call regression handler with targetStage = "discovery"
- Query feature state

**Expected result:**
- feature.stage = "discovery"
- All stages from discovery onward (test-plan, review, dor, coding, etc.) are marked incomplete
- No error; handles correctly

---

## E2E Tests (Browser)

### AC1: Regression UI in Browser

**Test name:** `regression.e2e.regression-modal-in-browser`

**Setup:**
- Auth bypass fixture (NODE_ENV=test) with Susan's session
- Feature A1 loaded in browser at DoR stage
- Base feature page HTML rendered

**Action:**
- Click "Request Regression" button
- Wait for modal to animate in
- Inspect modal DOM

**Expected result:**
- Modal is visible in the DOM
- Stage dropdown contains at least discovery, benefit-metric, definition, test-plan, review
- Reason textarea is present and focusable
- Modal has visible Submit and Cancel buttons

---

### AC2 + AC3: Regression Submitted → State Updated in Browser

**Test name:** `regression.e2e.full-regression-browser-flow`

**Setup:**
- Auth bypass fixture (NODE_ENV=test)
- Feature A1 at DoR stage, loaded in browser
- feature_approvals pre-populated with 2 records

**Action:**
1. Click "Request Regression"
2. Modal appears
3. Select "definition" from dropdown
4. Type reason: "Missing details"
5. Click "Submit"
6. Wait up to 2s for modal to close
7. Inspect page — stage display should update
8. (Operator-only) Query feature_approvals to verify preservation

**Expected result:**
- Modal closes after submission
- Feature page updates to show stage = "definition" (or shows loading spinner then updates)
- No error message appears
- Browser console has no unhandled errors
- feature_approvals records remain intact (verified by operator query)

---

## NFR Tests

### NFR-Perf-1: Regression Completes Within 1 Second

**Test name:** `regression.nfr.regression-latency-under-1s`

**Setup:** Feature A1 at DoR stage; regression request ready to submit.

**Action:** Submit regression request; measure elapsed time from submission to stage-update completion.

**Expected result:** ≤1s

---

### NFR-Perf-2: Stage-Incomplete Marking Accurate

**Test name:** `regression.nfr.stage-incomplete-marking-correct`

**Setup:** Feature A1 at coding stage (6 stages complete: discovery, benefit-metric, definition, test-plan, review, dor, coding).

**Action:** Regress to "test-plan"; inspect stage-completion status for all stages.

**Expected result:** Stages discovery, benefit-metric marked complete; stages test-plan, review, dor, coding marked incomplete. (Note: coding is an example stage; adjust to actual stage list.)

---

## Test Summary

- **Unit tests:** 3 (AC1 UI trigger, AC2a stage reset, AC2b downstream incomplete marking, AC3 approvals preserved)
- **Integration tests:** 3 (full flow, tenant isolation, edge case early-stage regression)
- **E2E tests:** 2 (AC1 modal in browser, AC2+AC3 full flow in browser)
- **NFR tests:** 2 (latency ≤1s, stage-incomplete marking accuracy)
- **Total:** 10 tests
- **All ACs covered:** Yes
- **Test data gaps:** None
- **Gaps in AC coverage:** None

---

# AC Verification Script: Request Regression to Earlier Stage (ep3-s1)

**Setup:** You are Susan (engineer) and Hamish (conductor), both assigned to Feature A1. The feature is currently at the DoR stage. Prior approvals exist for discovery (Hamish) and DoR (Susan).

---

### Scenario AC1: Regression UI Opens Correctly

**Expected outcome:** When Susan clicks "Request Regression", a modal appears with a stage selector and reason field.

1. Navigate to Feature A1 in your browser.
2. **Verify:** The feature's current stage is displayed as "Definition of Ready" (or "DoR").
3. Look for a button or action menu labeled "Request Regression" or similar.
4. Click it.
5. **Verify:** A modal or dialog appears within 1 second.
6. **Verify:** The modal contains a dropdown or list of stages to regress to — at minimum: Discovery, Benefit-Metric, Definition, Test-Plan, Review.
7. **Verify:** The modal contains a text field or textarea labelled "Reason for regression" or similar.
8. **Verify:** The modal has a "Submit" (or "Confirm" / "Proceed") button and a "Cancel" button.

---

### Scenario AC2: Stage Resets and Downstream Marks Incomplete

**Expected outcome:** After Susan submits a regression request to "Definition", the feature's stage is reset to Definition and stages between Definition and DoR are marked incomplete.

1. From Scenario AC1, the modal is still open.
2. **From the stage dropdown, select "Definition"** (or whichever stage Susan wants to regress to).
3. **In the reason field, type:** "Definition is missing architecture details for multi-tenancy."
4. Click "Submit".
5. **Verify:** The modal closes within 2 seconds.
6. **Verify:** The feature's displayed stage updates to "Definition" (no page refresh required).
7. **Verify:** Any stages between Definition and DoR (e.g., Test-Plan, Review, DoR) now show a status of "Incomplete" or "Not Started" — not "Complete".
8. **(Operator-only verification)** Query the database or backend to confirm: feature.stage = "definition" and the stages list shows test-plan, review, dor marked as incomplete (not complete).

---

### Scenario AC3: Approval Records Preserved

**Expected outcome:** Prior approval records for the current and regressed stages remain in the audit log after regression.

1. From Scenario AC2, the regression has just completed.
2. **(Operator-only verification)** Query the feature_approvals table or audit log for Feature A1.
3. **Verify:** Two approval records exist (or at least the one for DoR — signed by Susan):
   - One record for "Discovery" stage, approved by Hamish
   - One record for "DoR" stage, approved by Susan
4. **Verify:** Both records still have their original approval reason text intact (e.g., "Ready to code" for DoR).
5. **Verify:** The timestamp for each approval is unchanged from before the regression.
6. **Verify:** No new approval record has been created for the regression itself — the regression is a state change, not a new approval.

---