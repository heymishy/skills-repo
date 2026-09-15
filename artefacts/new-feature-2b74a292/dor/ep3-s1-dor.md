# Definition of Ready — ep3-s1: Request Regression to Earlier Stage

**Feature:** new-feature-2b74a292 (Multi-User Role-Aware Synchronous Collaboration)
**Story:** ep3-s1 — Request Regression to Earlier Stage
**Date:** 2026-09-16
**Status:** Signed Off

---

## Contract Proposal

**What will be built:**
A regression UI flow that allows a team collaborator at any stage to request a backward transition to an earlier stage (e.g., from DoR back to Definition), submit a reason for the regression, have the feature's stage reset to that target stage, and have all downstream stages marked incomplete. The system records the regression reason in decisions.md and preserves all prior approval records (not deletes them) for audit trail purposes.

**What will NOT be built:**
- Approval gates or workflows for regression requests (auto-accept for MVP)
- Partial regression (reverting only some stages while keeping others complete; all-or-nothing per stage)
- Reverting or editing specific individual edits within a stage (stage-level regression only)

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1: Regression UI appears with stage selector and reason field | Unit test on modal trigger; integration test on form presence; E2E browser render | unit + integration + E2E |
| AC2: Stage resets and downstream stages marked incomplete | Unit test on state reset logic; integration test on stage-completion flags | unit + integration |
| AC3: Prior approval records preserved (not deleted) | Integration test on feature_approvals query post-regression; tenant isolation verification | integration |

**Assumptions:**
- The regression target is always a stage earlier than the current stage (no forward regressions)
- All prior approval records remain durable and queryable after regression for audit purposes
- Stage-completion flags can be atomically updated as a set (all downstream together)

**Estimated touch points:**
Files: `src/web-ui/routes/features.js` (new POST `/api/features/{featureId}/regression` handler), `src/web-ui/public/feature-stage-controls.js` (new regression button + modal)
Services: Postgres (`feature_approvals` read/verify), Node.js HTTP server (regression state logic), artefact disk write for decisions.md
APIs: POST `/api/features/{featureId}/regression` (new, submits regression request with targetStage + reason)

---

## Contract Review

**Mismatch check:**
- AC1 (UI appears with stage selector and reason field) → proposed: modal with dropdown pre-populated with all prior stages + textarea for reason ✅
- AC2 (stage resets and downstream marked incomplete) → proposed: feature.stage updated to targetStage, all stages from targetStage onward marked as incomplete ✅
- AC3 (approvals preserved) → proposed: feature_approvals query after regression returns all prior records unchanged ✅

**Result:** ✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks — All Passing ✅

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS (Team collaborator — any role) |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS (3 ACs, all Given/When/Then format) |
| H3 | Every AC has test in test plan | ✅ PASS (10 tests total, all ACs covered) |
| H4 | Out-of-scope section populated | ✅ PASS (3 excluded behaviours named) |
| H5 | Benefit linkage to named metric | ✅ PASS ("Reversibility with audit trail" exists in coverage matrix) |
| H6 | Complexity rated | ✅ PASS (Rating: 2) |
| H7 | No HIGH findings from review | ✅ PASS (Review Run 2: 0 HIGH) |
| H8 | Test plan covers all ACs | ✅ PASS (10 tests, no gaps) |
| H8-ext | Schema dependency check | ✅ PASS (feature_approvals table exists; no upstream dependencies) |
| H9 | Architecture Constraints; no HIGH findings | ✅ PASS (ADR-025 referenced) |
| H-E2E | CSS-layout-dependent check | ✅ PASS (all ACs logic-based) |
| H-NFR | NFR profile or "None" | ✅ PASS ("NFRs: None — reviewed 2026-09-16") |
| H-NFR2 | Compliance NFR sign-off | ✅ PASS (not applicable) |
| H-NFR3 | Data classification | ✅ PASS (not applicable) |
| H-NFR-profile | NFR profile presence | ✅ PASS (no profile required) |
| H-GOV | Approved By in discovery artefact | ✅ PASS (non-blank Approved By section present) |
| H-ADAPTER | Injectable adapter check (D37) | ✅ PASS (no injectable adapters) |
| H-INF | Infra-plan gate | ✅ PASS (not applicable) |
| H-MIG | Migration-review gate | ✅ PASS (not applicable) |

---

## Warnings — None Triggered

All W1–W5 checks pass; no warnings apply to this story.

---

## Oversight Level

**Oversight:** Medium

**Rationale:** State machine for regression (feature.stage reset + downstream marking incomplete), approval record preservation, and decisions.md entry generation are straightforward deterministic operations with low failure risk. No real-time complexity or concurrent constraints. Medium oversight reflects standard delivery complexity.

**Action:** Share the DoR artefact with the tech lead before assigning to the coding agent. No formal sign-off required; awareness is sufficient.

---

## Coding Agent Instructions

You are implementing: **Request Regression to Earlier Stage (ep3-s1)**
**Feature slug:** new-feature-2b74a292
**Oversight level:** Medium (share DoR with tech lead before starting)

### Acceptance Criteria (Binding)

**AC1:** Given Susan is at the DoR stage of Feature A1, When she clicks "Request Regression", Then she is presented with a stage selector (pre-populated with all prior stages: discovery, benefit-metric, definition, test-plan, review) and a reason field, and can submit her choice ("definition") with a reason.

**AC2:** Given the regression request has been submitted, When it is processed, Then the feature's stage resets to "definition" (the target stage) and every stage between definition and DoR (inclusive of DoR: definition, test-plan, review, dor) is marked "incomplete".

**AC3:** Given the feature has regressed, When feature_approvals is inspected, Then the approval records for all stages (including DoR and any later stages) still exist (not deleted) — preserved for audit even though those stages are now marked incomplete.

### Touch Points (Binding Contract)

**Files you MUST modify:**
- `src/web-ui/routes/features.js` — new POST `/api/features/{featureId}/regression` handler; accepts targetStage and reason; resets feature.stage, marks downstream stages incomplete, verifies prior approvals remain
- `src/web-ui/public/feature-stage-controls.js` — new "Request Regression" button on the feature detail page; opens modal with stage dropdown + reason textarea

**Files you MUST NOT modify:**
- Feature presence sidebar (ep2-s1)
- Role-filtered stage list (ep2-s2)
- Sign-off/approval modal (ep2-s3)
- Concurrent merge logic (ep2-s4)
- Pod creation or assignment flow (ep1-s1 through ep1-s3)

### Architecture Constraints

- **ADR-025 (Multi-tenancy):** Regression is tenant-scoped via `req.session.tenantId`; all queries enforce tenant boundaries
- **Stage-reset atomicity:** feature.stage and all downstream stage-incomplete flags must be updated together (no partial regressions)
- **Approval preservation:** feature_approvals records are READ ONLY during regression — no delete, no update, only read to verify they exist

### Applicable Standards

**From `.github/standards/web-ui/core.md`:**
- Session tenant context required on all DB operations
- Error responses must be specific and actionable (e.g., "Target stage must be earlier than current stage")
- Concurrent requests must not produce silent data loss

**From `.github/standards/web-ui/POLICY.md`:**
- All data writes are durable (written to database before response sent to client)
- Session ownership/tenant guard required on all feature-scoped reads and writes

### Implementation Specification

**POST `/api/features/{featureId}/regression` handler:**
- Extract `tenantId`, `userId` from `req.session`
- Extract `targetStage`, `reason` from request body
- Validate: targetStage must be a valid earlier stage (not current or later); reason must be non-empty
- Query current feature.stage from database (guard: verify feature belongs to this tenant)
- If targetStage is not earlier than current stage, return HTTP 400: "Target stage must be earlier than current stage"
- Query feature_approvals for this feature; verify at least one record exists (sanity check)
- Update feature.stage to targetStage in database
- Mark all stages from targetStage onward as incomplete (e.g. update stage-completion flags in pipeline-state or equivalent)
- Write regression entry to decisions.md on disk: date, user, reason, targetStage
- Return HTTP 200 with updated feature state

**Modal UI (`feature-stage-controls.js`):**
- Trigger: "Request Regression" button visible only when current stage is not the first stage
- Dropdown: list all stages from discovery up to (but not including) current stage
- Reason textarea: required field, min 5 characters
- Submit button: disabled until both fields are populated
- Cancel button: closes modal without action

**Feature stage-incomplete marking:**
Current stage AND all downstream stages are marked incomplete. Example: if current stage is "dor" and target is "definition", then definition, test-plan, review, and dor are all marked incomplete (not discovery or benefit-metric).

### Test Coverage

- **Unit tests:** 3 (AC1 modal trigger and stage selector population, AC2 stage reset logic, AC3 approvals query)
- **Integration tests:** 3 (full regression flow endpoint-to-database, tenant isolation on regression, edge case: regression to earliest stage)
- **E2E tests:** 2 (AC1 modal in browser, AC2 state update visible post-regression)
- **NFR tests:** 2 (regression latency ≤1s, stage-incomplete marking accurate across all stages)
- **Total:** 10 tests; all ACs covered

### NFRs

- Regression completes within 1s
- Prior approvals are preserved (not deleted)
- Stage marks are immediately updated (no refresh needed)

### Success Criteria for Definition of Done

- All 3 ACs passing (verified by manual test against AC verification script)
- No unhandled exceptions in browser console or server logs
- Tenant isolation verified (all DB queries include `WHERE tenantId = ?`)
- Regression endpoint rejects regression to non-earlier stage with HTTP 400
- feature_approvals records remain unchanged post-regression (READ-ONLY operation)
- feature.stage correctly reset to targetStage
- All downstream stages correctly marked incomplete
- decisions.md entry auto-generated with date, user, reason, target stage
- Prior stages remain unchanged (discovery/benefit-metric not marked incomplete if they are before target)

---

## Completion Summary

✅ **READY TO CODE**

All hard blocks pass (20/20). No blocking findings. Oversight level: Medium — share DoR with tech lead before dispatch. Coding Agent Instructions complete and binding.

**Next action:** After tech lead awareness, proceed to `/branch-setup`.