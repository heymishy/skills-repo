# Test Plan: Re-Sign-Off After Regression (Approval Record with Prior Context) — ep3-s3

**Story reference:** artefacts/new-feature-2b74a292/stories/ep3-s3.md
**Epic reference:** artefacts/new-feature-2b74a292/epics/reversibility-audit-trail.md
**Domain:** web-ui
**Date:** 2026-09-16

---

## User Story

As a **Team collaborator with approval responsibility (same role as original sign-off)**,
I want **to re-approve a stage after revising it post-regression, with the record linked to the original approval**,
So that **the audit trail shows the full regress → revise → re-approve cycle, not just a fresh unrelated approval**.

---

## Acceptance Criteria

**AC1:** Given Susan has regressed Feature A1 to definition (ep3-s1) and made her revisions, When she clicks "Sign Off" at the definition stage, Then a new approval record is created in feature_approvals with reApprovalOf pointing at the original approval's id.

**AC2:** Given the re-approval has been recorded, When the feature's stage is checked, Then it has advanced past the definition stage again — the same state transition a first-time approval would trigger.

**AC3:** Given the re-approval is complete, When decisions.md is inspected, Then a new entry has been appended describing the re-approval and what changed, distinct from (not overwriting) the original regression entry.

---

## Test Data Strategy

**Strategy selected:** Synthetic — test data generated in test setup, no real data involved.

**Test data approach:**
- Fixture feature: Feature A1 with `featureId = 'feat-a1-uuid'`, `tenantId = 'tenant-test-123'`, current stage: "definition" (post-regression per ep3-s1)
- Fixture prior approval: Original approval record in feature_approvals for definition stage (approverId: 'user-susan', approvalTime: '2026-09-16T10:00:00Z', id: 'approval-original-uuid')
- Fixture re-approval request: `{ approverId: 'user-susan', reason: 'Definition revised: architecture constraints for multi-tenancy added', timestamp: '2026-09-16T14:23:00Z' }`
- Fixture decisions.md: Contains regression entry from ep3-s2; re-approval entry will be appended
- No production data required; all test data is synthetic and disposable post-test
- Filesystem: test instance with writable `artefacts/` directory

**Sensitivity assessment:** Not applicable — no PCI, PHI, or sensitive data involved.

---

## AC Coverage & Test Approach

| AC | Test type | Coverage | Gap? |
|----|-----------|----------|------|
| AC1 | Unit + integration | New approval record created with reApprovalOf link | No |
| AC2 | Unit + integration | Feature stage advances correctly post re-approval | No |
| AC3 | Integration + file I/O | decisions.md entry appended with re-approval context | No |

**Gap table:** None — all ACs have corresponding tests.

---

## Unit Tests

### AC1: Re-Approval Record Created with reApprovalOf Link

**Test name:** `reapproval.unit.approval-record-created-with-link`

**What it tests:** AC1 — when re-approval is submitted, a new approval record is created in feature_approvals with reApprovalOf field pointing to the original approval's id.

**Setup:**
- Fixture feature A1 with `featureId = 'feat-a1-uuid'`, `tenantId = 'tenant-test-123'`, stage: "definition"
- Fixture prior approval: `{ id: 'approval-original-uuid', featureId: 'feat-a1-uuid', stageId: 'definition', approverId: 'user-susan', approvalTime: '2026-09-16T10:00:00Z', decision: 'approved', reason: 'Definition complete' }` already in feature_approvals
- Re-approval request prepared: `{ approverId: 'user-susan', stageId: 'definition', reason: 'Definition revised: architecture constraints added', timestamp: '2026-09-16T14:23:00Z' }`

**Action:**
- Call approval handler with the re-approval request
- Wait for completion (up to 2s)
- Query feature_approvals for records with featureId 'feat-a1-uuid' and stageId 'definition'
- Inspect the newest (most recent by approvalTime) record

**Expected result:**
- feature_approvals now contains 2 records for this feature+stage (original + re-approval)
- The new record has `reApprovalOf: 'approval-original-uuid'` (exact match to original id)
- The new record has `approverId: 'user-susan'`, `timestamp: '2026-09-16T14:23:00Z'`, and `reason: 'Definition revised: architecture constraints added'`
- Prior approval record is unchanged

---

### AC2: Feature Stage Advances on Re-Approval

**Test name:** `reapproval.unit.stage-advance-on-reapproval`

**What it tests:** AC2 — when re-approval is submitted, the feature's stage advances past definition, same as a first-time approval would.

**Setup:**
- Fixture feature A1 with stage: "definition"
- Prior approval exists in feature_approvals
- Re-approval request prepared

**Action:**
- Note the feature's current stage: "definition"
- Call approval handler with re-approval request
- Wait for completion
- Query the feature's stage

**Expected result:**
- Feature's stage has advanced to the next stage after definition (benefit-metric)
- The advance is not conditional on the reApprovalOf link — the state transition is identical to a first-time approval

---

### AC3: decisions.md Entry Appended with Re-Approval Context

**Test name:** `reapproval.unit.decisions-entry-appended`

**What it tests:** AC3 — when re-approval completes, a new entry is appended to decisions.md describing the re-approval.

**Setup:**
- Fixture feature A1 with decisions.md containing the regression entry from ep3-s2
- Prior approval exists in feature_approvals
- Re-approval request prepared

**Action:**
- Read decisions.md before re-approval
- Note the entry count
- Call approval handler with re-approval request
- Wait for completion
- Read decisions.md after re-approval
- Parse the newest (last) entry
- Inspect its fields

**Expected result:**
- decisions.md entry count increased by 1
- New entry contains fields: `date: '2026-09-16'`, `session-phase: 're-approval'` (or equivalent), `decision: 'Definition re-approved'` (or similar), `reason: 'Definition revised: architecture constraints added'` (exact match from request), `actor: 'Susan (engineer)'`, `stageReverted: 'definition'` or `stage: 'definition'`
- No field is empty, null, or placeholder
- Entry is distinct from the prior regression entry (does not overwrite or merge with it)

---

## Integration Tests

### Full Re-Approval Flow End-to-End

**Test name:** `reapproval.integration.reapproval-and-stage-advance-end-to-end`

**What it tests:** Complete flow — re-approval is submitted, approval record is created with link, stage advances, and decisions.md entry is written — all coordinated.

**Setup:**
- Feature A1 at definition stage post-regression
- Original approval record exists
- decisions.md exists with regression entry
- Re-approval request: `{ approverId: 'user-susan', reason: 'Definition revised: architecture constraints for multi-tenancy added' }`

**Action:**
1. Call approval handler with re-approval request
2. Wait for completion (up to 2s)
3. Query feature_approvals for the new record
4. Query feature.stage
5. Read decisions.md
6. Parse new entry
7. Cross-check: new approval's reApprovalOf matches original approval's id, new entry references the same stage, and stage advance is consistent

**Expected result:**
- feature_approvals has new record with reApprovalOf = original approval id
- feature.stage = next stage after definition (e.g., "benefit-metric")
- decisions.md has new entry with reason matching the request, distinct from regression entry
- No errors in logs

---

### Re-Approval Does Not Delete or Overwrite Original Approval

**Test name:** `reapproval.integration.original-approval-preserved`

**What it tests:** AC1 ensures the original approval record remains intact; re-approval creates a new record, not a replacement.

**Setup:**
- Original approval record stored with id 'approval-original-uuid'
- Re-approval request prepared

**Action:**
1. Query feature_approvals and store original record (id, approverId, timestamp, reason)
2. Call approval handler with re-approval request
3. Wait for completion
4. Query feature_approvals again for the original record's id
5. Compare content hash before and after

**Expected result:**
- Original record is still present with identical content (id, approverId, timestamp, reason unchanged)
- New record appears alongside it with a different id and reApprovalOf pointing to the original
- Total record count for this feature+stage is now 2

---

### Tenant Isolation on Re-Approval

**Test name:** `reapproval.integration.tenant-isolation-reapproval`

**What it tests:** ADR-025 — re-approval for Tenant A does not affect Tenant B's feature or approval records.

**Setup:**
- Tenant A: Feature A1 at definition stage, original approval exists
- Tenant B: Feature A1 (same slug, different tenant) at benefit-metric stage, no prior approval at definition
- Re-approval request for Tenant A only

**Action:**
1. Call approval handler for Tenant A's Feature A1 with re-approval request
2. Wait for completion
3. Query Tenant A's feature_approvals for definition-stage approvals
4. Query Tenant B's feature_approvals for definition-stage approvals
5. Query both tenants' feature.stage

**Expected result:**
- Tenant A's feature_approvals has 2 definition-stage records (original + re-approval)
- Tenant B's feature_approvals still has 0 definition-stage records (unchanged)
- Tenant A's feature.stage advanced to next stage; Tenant B's stage unchanged
- Re-approval appears only in Tenant A's records

---

## E2E Tests (Browser)

### AC1 + AC2: Re-Approval Modal and Stage Advance (E2E)

**Test name:** `reapproval.e2e.reapproval-modal-and-advance`

**Setup:**
- Auth bypass fixture (NODE_ENV=test) with Susan's session
- Feature A1 loaded in browser at definition stage (post-regression from ep3-s1)
- Original approval record visible in approval history panel (if available in UI)

**Action:**
1. Click "Sign Off" button at definition stage
2. Approval modal appears
3. Type reason: "Definition revised: architecture constraints for multi-tenancy added"
4. Click "Approve"
5. Wait up to 2s for modal to close
6. Inspect feature page: stage should now show the next stage (e.g. "benefit-metric")
7. (Operator-only) Query feature_approvals to verify reApprovalOf link

**Expected result:**
- Modal closes after submission
- Feature page updates to show stage = next stage (not "definition" anymore)
- (Operator verification) New approval record in feature_approvals has reApprovalOf pointing to original approval id

---

### AC3: Re-Approval Entry in decisions.md (E2E)

**Test name:** `reapproval.e2e.reapproval-decisions-entry`

**Setup:**
- Auth bypass fixture, Feature A1 at definition stage
- decisions.md pre-populated with regression entry from ep3-s2
- Start timer

**Action:**
1. Trigger re-approval (submit modal from above)
2. Wait for completion
3. (Operator) read decisions.md immediately
4. Locate the newest (last) entry
5. Check timestamp

**Expected result:**
- Operator can confirm new entry is present at the end of decisions.md
- Entry describes the re-approval (not a duplicate of regression entry)
- Timestamp is within 2 seconds of the approval submit time

---

## NFR Tests

### NFR-Perf-1: Re-Approval Completes Within 2 Seconds

**Test name:** `reapproval.nfr.reapproval-latency-under-2s`

**Setup:** Feature A1 at definition stage; original approval exists; re-approval request ready.

**Action:** Submit re-approval request; measure elapsed time from submission to completion (when handler returns, approval record is written, stage is advanced, and decisions.md entry is appended).

**Expected result:** ≤2s

---

### NFR-Completeness: Re-Approval Record Has All Required Fields

**Test name:** `reapproval.nfr.reapproval-record-complete`

**Setup:** Feature A1; re-approval processed; new record in feature_approvals.

**Action:** Parse the new approval record; inspect for presence of: id, reApprovalOf, approverId, approvalTime (or timestamp), reason, decision (or decision field defaulting to "approved").

**Expected result:** All required fields present and non-empty; reApprovalOf is not null and matches an existing approval id.

---

### NFR-Audit: Re-Approval and Original Approval Remain Linked

**Test name:** `reapproval.nfr.approval-linkage-integrity`

**Setup:** Original approval exists with id 'X'; re-approval completed with reApprovalOf: 'X'.

**Action:** Query both records; verify the link is bidirectional (or at least forward-linkable): new record.reApprovalOf == original record.id.

**Expected result:** Link is intact and consistent; no dangling references.

---

## Test Summary

- **Unit tests:** 3 (AC1 link created, AC2 stage advance, AC3 decisions entry)
- **Integration tests:** 3 (full flow end-to-end, original approval preserved, tenant isolation)
- **E2E tests:** 2 (modal + advance, decisions entry within 2s)
- **NFR tests:** 3 (latency ≤2s, record completeness, approval linkage integrity)
- **Total:** 11 tests
- **All ACs covered:** Yes
- **Test data gaps:** None
- **Gaps in AC coverage:** None

---

# AC Verification Script: Re-Sign-Off After Regression (ep3-s3)

**Setup:** Susan has regressed Feature A1 from DoR back to definition (per ep3-s1) and made her revisions to the definition. The regression entry is already in decisions.md from ep3-s2. The original definition-stage approval is still in feature_approvals. You now want to verify that re-signing off completes the regression cycle correctly.

---

### Scenario AC1: New Approval Record Created with reApprovalOf Link

**Expected outcome:** A new approval record appears in feature_approvals, linked to the original.

1. Before Susan re-signs off, note the id of the original definition-stage approval in feature_approvals (e.g. 'approval-original-uuid').
2. Susan clicks "Sign Off" at the definition stage, enters her reason ("Definition revised: architecture constraints for multi-tenancy added"), and submits.
3. **Verify:** In feature_approvals, a new record has been created with `reApprovalOf: 'approval-original-uuid'` (exact match to the original id).
4. **Verify:** The new record contains Susan's reason and today's timestamp.
5. **Verify:** The original record still exists unchanged.

---

### Scenario AC2: Feature Stage Advances

**Expected outcome:** The feature's stage advances past definition to the next stage.

1. Before re-signing off, note the feature's stage: "definition".
2. Susan re-signs off (see Scenario AC1 setup).
3. **Verify:** The feature page refreshes or updates, and the stage now shows the next stage (e.g. "benefit-metric" or "coding", depending on the pipeline order).
4. **Verify:** The stage change is the same as if Susan had signed off for the first time — the reApprovalOf link does not block or delay the advance.

---

### Scenario AC3: decisions.md Entry Appended (Distinct from Regression Entry)

**Expected outcome:** A new entry appears in decisions.md describing the re-approval, separate from the regression entry.

1. Open `artefacts/new-feature-2b74a292/decisions.md`.
2. **Verify:** The file contains at least 2 entries — the regression entry from ep3-s2, plus a new entry at the bottom.
3. **Verify:** The new entry is distinct (does not overwrite or merge with the regression entry). Both entries are present.
4. **Verify:** The new entry describes Susan's re-approval (e.g. "Definition re-approved by Susan (engineer) — reason: Definition revised: architecture constraints for multi-tenancy added").
5. **Verify:** The entry is date-stamped today and appears as the last (most recent) entry.

---