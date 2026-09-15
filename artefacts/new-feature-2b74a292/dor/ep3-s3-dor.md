# Definition of Ready — ep3-s3: Re-Sign-Off After Regression (Approval Record with Prior Context)

**Feature:** new-feature-2b74a292 (Multi-User Role-Aware Synchronous Collaboration)
**Story:** ep3-s3 — Re-Sign-Off After Regression (Approval Record with Prior Context)
**Date:** 2026-09-16
**Status:** Signed Off

---

## Contract Proposal

**What will be built:**
A system mechanism that records a new approval when a team member re-approves a stage after regression, linking the new approval to the original via a `reApprovalOf` field. The feature then advances to the next stage. A new entry is simultaneously appended to `decisions.md` documenting the re-approval, distinct from the prior regression entry.

**What will NOT be built:**
- Requiring a different approver for re-approval (same approver as original is acceptable for MVP)
- Approval workflow changes based on prior regression (re-approval uses identical flow as first approval)
- Complex approval gates or conditional re-approval logic

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1: New approval record created with reApprovalOf link | Unit test reading feature_approvals before/after; integration test verifying link matches original approval id | unit + integration |
| AC2: Feature stage advances on re-approval | Unit test confirming stage transition; integration test end-to-end | unit + integration |
| AC3: decisions.md entry appended (distinct from regression entry) | Integration test + file I/O verifying entry count +1 and content distinct from prior entry | integration |

**Assumptions:**
- The regression handler (ep3-s1) completes state reset before the re-approval is processed
- `decisions.md` file already exists on the feature (created at discovery, appended by ep3-s2)
- Tenant isolation is enforced at the route boundary, not within the re-approval handler logic

**Estimated touch points:**
Files: `src/web-ui/routes/approval.js` (modify sign-off handler to detect and link prior approvals), `src/web-ui/modules/approval-recorder.js` (new — handles reApprovalOf linking and decisions.md append)
Services: Filesystem (`fs.appendFileSync` for decisions.md), feature_approvals table query (fetch prior approval to link)
APIs: POST `/api/features/{featureId}/approvals` (existing sign-off endpoint; enhanced to detect re-approval scenario)

---

## Contract Review

**Mismatch check:**
- AC1 (New approval record with reApprovalOf) → proposed: query feature_approvals for prior approval at same stage, store its id in new record's reApprovalOf field, verify on read ✅
- AC2 (Feature stage advances) → proposed: stage advance uses identical logic as first approval (no conditional branching on reApprovalOf presence) ✅
- AC3 (decisions.md entry distinct) → proposed: append new entry with session-phase: re-approval, entries remain separate (no merge or overwrite) ✅

**Result:** ✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks — All Passing ✅

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS (Team collaborator with approval responsibility) |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS (3 ACs, all Given/When/Then format) |
| H3 | Every AC has test in test plan | ✅ PASS (11 tests total from test-plan.md, all ACs covered) |
| H4 | Out-of-scope section populated | ✅ PASS (2 excluded behaviours named) |
| H5 | Benefit linkage to named metric | ✅ PASS ("Reversibility with audit trail" exists in benefit-metric.md coverage matrix) |
| H6 | Complexity rated | ✅ PASS (Rating: 1) |
| H7 | No HIGH findings from review | ✅ PASS (Review Run 2 ep3-s3: 0 HIGH) |
| H8 | Test plan covers all ACs | ✅ PASS (11 tests, no gaps) |
| H8-ext | Schema dependency check | ✅ PASS (reApprovalOf is feature_approvals field, already in schema via ep2-s3; decisions.md is file artefact) |
| H9 | Architecture Constraints; no HIGH findings | ✅ PASS (Architecture Constraints section populated; reApprovalOf linking and decisions.md append pattern documented) |
| H-E2E | CSS-layout-dependent check | ✅ PASS (all ACs are logic-based, no CSS-layout dependencies) |
| H-NFR | NFR profile or "None" | ✅ PASS ("NFRs: None — reviewed 2026-09-16") |
| H-NFR2 | Compliance NFR sign-off | ✅ PASS (not applicable) |
| H-NFR3 | Data classification | ✅ PASS (not applicable) |
| H-NFR-profile | NFR profile presence check | ✅ PASS (story NFR section is "None", no profile required) |
| H-GOV | Approved By in discovery artefact | ✅ PASS (discovery.md contains non-blank Approved By section) |
| H-ADAPTER | Injectable adapter check (D37) | ✅ PASS (no injectable adapters introduced) |
| H-INF | Infra-plan gate | ✅ PASS (not applicable) |
| H-MIG | Migration-review gate | ✅ PASS (not applicable) |

---

## Warnings — None Triggered

All W1–W5 checks pass; no warnings apply to this story.

---

## Oversight Level

**Oversight:** Low

**Rationale:** Re-approval follows the identical flow as first-time approval (no conditional complexity); the only addition is a reApprovalOf field link and a separate decisions.md entry. State machine logic, audit trail updates, and file I/O are straightforward and low-risk. No concurrent complexity or architectural unknowns.

**Action:** No special coordination required before assignment. Proceed directly to coding agent.

---

## Coding Agent Instructions

You are implementing: **Re-Sign-Off After Regression (Approval Record with Prior Context) — ep3-s3**
**Feature slug:** new-feature-2b74a292
**Oversight level:** Low (direct assignment to coding agent)

### Acceptance Criteria (Binding)

**AC1:** Given Susan has regressed Feature A1 to definition (ep3-s1) and made her revisions, When she clicks "Sign Off" at the definition stage, Then a new approval record is created in feature_approvals with reApprovalOf pointing at the original approval's id.

**AC2:** Given the re-approval has been recorded, When the feature's stage is checked, Then it has advanced past the definition stage again — the same state transition a first-time approval would trigger.

**AC3:** Given the re-approval is complete, When decisions.md is inspected, Then a new entry has been appended describing the re-approval and what changed, distinct from (not overwriting) the original regression entry.

### Touch Points (Binding Contract)

**Files you MUST modify:**
- `src/web-ui/routes/approval.js` (existing sign-off handler) — add query to detect prior approval at same stage; if found, populate `reApprovalOf` in new approval record
- `src/web-ui/modules/approval-recorder.js` (new) — implement approval record creation with optional reApprovalOf linking; handle decisions.md append with re-approval context

**Files you MUST NOT modify:**
- Feature regression logic (ep3-s1) — this story does not change regression behaviour
- Stage advance logic — re-approval uses identical stage-advance path as first approval
- Test fixtures or test setup files

### Architecture Constraints

- **reApprovalOf field:** New field on feature_approvals table. When present, it contains the UUID/id of the prior approval at the same stage being re-approved. Nullable (first approvals have NULL).
- **Stage advance identity:** Re-approval triggers identical stage-advance logic as first approval — no branching on reApprovalOf presence.
- **Decisions.md:** New entry uses `session-phase: re-approval` (distinct from `regression` from ep3-s2). All prior entries remain unchanged (append-only).
- **Tenant scoping (ADR-025):** Re-approval handler validates tenant context; all queries scoped by tenantId.

### Applicable Standards

From `.github/standards/web-ui/core.md`:
- Session tenant context required on all approval operations
- Error responses must be specific (name the issue, not generic "failure")

From web-ui patterns:
- Timestamp format: ISO 8601 (e.g. `2026-09-16T14:23:00Z`)
- User identity: `{ userId, login, role }` tuple from session
- Approval flow: modal → reason input → "Approve" button → record + advance + decisions.md update

### Implementation Specification

**Approval handler flow (modify `routes/approval.js`):**
1. Receive approval POST request with `{ featureId, reason }`
2. Query `feature_approvals` for the most recent approval at this feature's current stage (ORDER BY approvalTime DESC LIMIT 1)
3. If found: store its `id` in `reApprovalOf` field of new record; otherwise leave `reApprovalOf` NULL
4. Call `approval-recorder.js` module to create the new record and advance stage
5. Return success with new approval id

**Approval recorder module (new file `modules/approval-recorder.js`):**

Implement `recordApproval(featureId, tenantId, userId, userRole, reason, reApprovalOfId)` function:
- Validate inputs (featureId, tenantId, userId required)
- Create approval record with optional reApprovalOf link
- Write to feature_approvals
- Advance feature stage (identical path to first approval)
- Append decisions.md entry with `session-phase: re-approval` (or `approval` if first)
- Return approval record

### Test Coverage

From the test-plan artefact (`artefacts/new-feature-2b74a292/test-plans/ep3-s3-test-plan.md`):

- **Unit tests (3):** AC1 (reApprovalOf link created), AC2 (stage advance), AC3 (decisions.md entry appended)
- **Integration tests (3):** Full end-to-end flow, original approval preserved, tenant isolation
- **E2E tests (2):** Modal + advance, decisions.md entry within 2s
- **NFR tests (3):** Latency ≤2s, record completeness, approval linkage integrity
- **Total: 11 tests; all ACs covered**

### NFRs

- Re-approval completes within 2s (from modal submission to decisions.md write)
- Re-approval record has all required fields (id, reApprovalOfId, approverId, approvalTime, reason, decision)
- reApprovalOfId is not null and matches an existing approval id (when re-approving; NULL for first approval)
- Stage advance is identical to first approval (no conditional branching)
- Prior approval and re-approval are both visible in feature_approvals (append semantics, not replace)

### Success Criteria for Definition of Done

- All 3 ACs passing (verified by manual test: trigger re-approval, inspect feature_approvals, read decisions.md from disk)
- No unhandled exceptions in server logs
- Tenant isolation verified (all queries include tenantId filter)
- Re-approval record has all 6 required fields populated (id, reApprovalOfId, approverId, approvalTime, reason, decision)
- reApprovalOfId correctly points to prior approval id
- Prior approval record remains unchanged post re-approval
- Decisions.md entry created with correct fields and distinct from prior regression entry
- Stage advance latency ≤2s (measured in integration test)

---

## Completion Summary

✅ **READY TO CODE**

All hard blocks pass (20/20). No blocking findings. Oversight level: Low — proceed directly to coding agent.