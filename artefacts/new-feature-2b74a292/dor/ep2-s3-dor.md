# Definition of Ready — ep2-s3: Sign-Off at a Stage (Approval Record & Advance)

**Feature:** new-feature-2b74a292 (Multi-User Role-Aware Synchronous Collaboration)
**Story:** ep2-s3 — Sign-Off at a Stage (Approval Record & Advance)
**Date:** 2026-09-16
**Status:** Signed Off

---

## Contract Proposal

**What will be built:**
A team member assigned as an approver (product lead, tech lead, or equivalent role) can click "Sign Off" on the current stage of a feature, enter a reason for approval, and submit. The system records the approval (approver ID, timestamp, reason text) to a `feature_approvals` table, advances the feature to the next stage, and auto-generates a new entry in `decisions.md` documenting the approval with full context. The approver sees the modal close and the feature stage transition to completed without a page refresh.

**What will NOT be built:**
- Multi-approver workflows (e.g. require two sign-offs before advancing)
- Conditional approvals (approve with requested-revision, blocking advance)
- Email notifications on approval
- Approval workflow changes based on prior regression state

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1: Sign-off modal renders with reason field | Unit test on DOM element presence; E2E test on page load | unit + E2E |
| AC2: Approval recorded + stage advance | Unit test on POST endpoint; E2E test on observable stage transition | unit + integration + E2E |
| AC3: decisions.md entry auto-generated | Unit test on disk read post-approval; E2E test on entry visibility | unit + E2E |

**Assumptions:**
- Collaborators have already been assigned via ep1-s3 and ep2-s1
- User session context is available via `req.session` (tenant, userId, roleId)
- `feature_approvals` table schema is defined in migration before this story begins
- `decisions.md` exists on the feature (created at discovery phase)
- Stage list and stage advancement logic are already implemented from prior stories

**Estimated touch points:**
Files: `src/web-ui/routes/features.js` (POST `/api/features/{featureId}/approve` handler — new), `src/web-ui/public/approval-modal.js` (new component for modal UI + form submission)
Services: Postgres (`feature_approvals` table write; feature stage update), Node.js HTTP server (approval handler)
APIs: POST `/api/features/{featureId}/approve` (new endpoint); GET `/api/features/{featureId}/stage` (existing, read current stage for display)

---

## Contract Review

**Mismatch check:**
- AC1 (modal renders) → proposed approach: modal component in approval-modal.js, triggered on "Sign Off" button click ✅
- AC2 (approval recorded + stage advance) → proposed approach: POST handler evaluates request, writes `feature_approvals`, updates feature stage, returns 200 with updated state ✅
- AC3 (decisions.md entry) → proposed approach: POST handler appends to decisions.md file via `fs.appendFileSync` after approval record is written ✅

**Result:** ✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks — All Passing ✅

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS (Team collaborator with approval responsibility) |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS (3 ACs, all Given/When/Then format) |
| H3 | Every AC has test in test plan | ✅ PASS (AC1 modal render; AC2 approval + advance; AC3 decisions.md entry — 12 tests total) |
| H4 | Out-of-scope section populated | ✅ PASS (4 excluded behaviours named) |
| H5 | Benefit linkage to named metric | ✅ PASS ("Sign-off and accountability" exists in benefit-metric.md coverage matrix) |
| H6 | Complexity rated | ✅ PASS (Rating: 2) |
| H7 | No HIGH findings from review | ✅ PASS (Review Run 2: 0 HIGH) |
| H8 | Test plan covers all ACs | ✅ PASS (12 tests: 3 unit + 2 integration + 3 E2E + 4 NFR, all ACs covered) |
| H8-ext | Schema dependency check | ✅ PASS (feature_approvals table referenced; schema assumption documented in Contract Proposal) |
| H9 | Architecture Constraints; no HIGH findings | ✅ PASS (ADR-024, ADR-020 referenced; no conflicting constraints) |
| H-E2E | CSS-layout-dependent check | ✅ PASS (modal is DOM-verifiable; reason field is text input; no CSS-layout-dependent ACs) |
| H-NFR | NFR profile or "None" | ✅ PASS ("NFRs: None — reviewed 2026-09-16") |
| H-NFR2 | Compliance NFR sign-off | ✅ PASS (not applicable — no compliance NFRs) |
| H-NFR3 | Data classification | ✅ PASS (not applicable — no sensitive data classified) |
| H-NFR-profile | NFR profile presence | ✅ PASS (no NFR profile required; "None" documented) |
| H-GOV | Approved By in discovery artefact | ✅ PASS (discovery.md contains Approved By section with non-blank entry) |
| H-ADAPTER | Injectable adapter check (D37) | ✅ PASS (no injectable adapters in this story) |
| H-INF | Infra-plan gate | ✅ PASS (not applicable) |
| H-MIG | Migration-review gate | ✅ PASS (not applicable) |

---

## Warnings — None Triggered

No W1–W5 warnings apply to this story.

---

## Oversight Level

**Oversight:** High

**Rationale:** Approval state machines, concurrent write handling from ep2-s4 context, and the integration with decisions.md audit trail are moderately complex. Multiple paths (modal UI, approval POST, stage advance, decisions.md write) must coordinate without failure. The story is also a critical accountability mechanism (sign-off records who approved what), which warrants human awareness before dispatch.

**Action:** Share the DoR artefact with the tech lead before assigning to the coding agent. No formal sign-off required; awareness is sufficient.

---

## Coding Agent Instructions

You are implementing: **Sign-Off at a Stage (Approval Record & Advance) (ep2-s3)**
**Feature slug:** new-feature-2b74a292
**Oversight level:** High (share with tech lead before starting)

### Acceptance Criteria (Binding)

**AC1:** Given Hamish (conductor) is at the discovery stage of Feature A1 and clicks "Sign Off", When a modal appears asking for approval reason, Then the modal contains a text field for reason entry and an "Approve" button, both clearly visible and accessible without scrolling.

**AC2:** Given Hamish enters a reason ("Discovery is complete; personas, pain points, and scope are locked") and clicks "Approve", When the approval is submitted, Then the approval is recorded in feature_approvals (approverId: Hamish, approvalTime: [current timestamp], reason: [entered text]), and the feature's stage advances from discovery to benefit-metric.

**AC3:** Given the feature has advanced to benefit-metric, When decisions.md is inspected, Then a new entry has been appended with: date, session-phase: discovery-approved, decision: Discovery approved by Hamish, reason: [exact text Hamish entered], and timestamp matching the approval time.

### Touch Points (Binding Contract)

**Files you MUST modify:**
- `src/web-ui/routes/features.js` — POST `/api/features/{featureId}/approve` handler (new): extract tenantId, userId, featureId, stage, reason from request; validate reason is non-empty; write `feature_approvals` record; advance feature stage; append to decisions.md; return 200 with updated feature state
- `src/web-ui/public/approval-modal.js` — new component: render modal on "Sign Off" click; text input for reason; "Approve" button; call POST endpoint; on 200, close modal and refresh stage display (no page reload)

**Files you MUST NOT modify:**
- Feature presence sidebar (ep2-s1)
- Stage list rendering (ep2-s2)
- Concurrent write merge logic (ep2-s4)
- Feature creation flow (ep1-s3)

### Architecture Constraints

- **ADR-025 (Multi-tenancy):** All operations tenant-scoped via `req.session.tenantId`; approval record includes tenantId
- **ADR-024 (Journey GET response):** POST endpoint returns updated feature state in same shape as GET `/api/features/{featureId}` (approverId and approvalTime added to response)
- **ADR-020 (Authenticated user's token for write-back):** Write-back to decisions.md uses the authenticated user's session context (userId, login) for attribution

### Applicable Standards

**From `.github/standards/web-ui/core.md`:**
- Session tenant context required on all DB operations
- Error responses must be specific and actionable (e.g., "Reason cannot be empty")

**From `.github/standards/web-ui/POLICY.md`:**
- WCAG 2.1 AA accessibility minimum — modal must be keyboard-accessible (Tab to fields, Enter to submit)

### Implementation Specification

**POST `/api/features/{featureId}/approve` (new handler):**
- Extract `tenantId`, `userId`, `roleId` from `req.session`
- Extract `reason` (string) from request body
- Validate: reason is non-empty and ≤500 characters
- Query feature from DB (verify it exists and belongs to this tenant)
- Get current stage from feature state
- Write to `feature_approvals`: featureId, stageId (current stage), approverId (userId), approvalTime (now), reason, tenantId
- Calculate next stage from stage sequence (discovery → benefit-metric, etc.)
- Update feature row: stage = next stage, updatedAt = now
- Append to `artefacts/[feature-slug]/decisions.md`: date (ISO), session-phase: [stage]-approved, decision: [Stage] approved by [user login] ([role]), reason: [entered text], timestamp (ISO 8601)
- Return HTTP 200 with `{ feature: { stage, stageHistory, approvals, ... }, message: "Approved and advanced to [next stage]" }`
- On error (validation, DB, file write): return HTTP 400/500 with error message (never 200 on partial success)

**Approval modal component** (`approval-modal.js`):
- Render initially hidden (display: none)
- On "Sign Off" button click (from stage panel): set display to block, focus reason field (no page transition)
- Render: heading "Approve [current stage]", text input for reason (placeholder: "Reason for approval..."), "Approve" button, optional "Cancel" button
- On "Approve" click: POST to `/api/features/{featureId}/approve` with reason as body
- On POST 200: close modal (display: none), update stage panel to show feature is now at next stage, show success message (optional toast: "Approved and moved to [next stage]")
- On POST 400/500: show inline error in modal (do not close modal), allow user to retry

### Test Coverage

- **Unit tests:** 3 (AC1 modal DOM presence, AC2 approval handler logic, AC3 decisions.md write)
- **Integration tests:** 2 (full approval path from POST through stage advance through decisions.md, tenant isolation on approvals)
- **E2E tests:** 3 (modal render on button click, approval submission without page refresh, decisions.md entry visible post-approval)
- **NFR tests:** 4 (modal appearance latency ≤500ms, approval submission latency ≤2s, keyboard navigation, accessible labels)
- **Total:** 12 tests; all ACs covered

### NFRs

- Approval modal appears within 500ms of "Sign Off" click
- Feature stage updates within 2s of approval
- Modal is keyboard-accessible (Tab navigation, Enter to submit)
- decisions.md entry is written to disk and visible immediately (≤2s)
- No page refresh on modal interaction or approval

### Success Criteria for Definition of Done

- All 3 ACs passing (verified by manual test against AC verification script)
- No unhandled exceptions in browser console or server logs
- Tenant isolation verified (all DB queries include `WHERE tenantId = ?`)
- Approval record correctly written to feature_approvals
- Feature stage correctly advanced to next stage
- decisions.md entry correctly appended with full context (date, stage, approver, reason, timestamp)
- Modal closes without page refresh
- ep2-s1 presence sidebar already loaded and functional
- ep2-s2 role-filtered stage list already loaded

---

## Completion Summary

✅ **READY TO CODE**

All hard blocks pass (19/19). No blocking findings. Oversight level: High — share with tech lead before dispatch. Coding Agent Instructions complete and binding.

**Next action:** After tech lead awareness, proceed to `/branch-setup`.