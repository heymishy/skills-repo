# Definition of Ready — ep3-s2: Auto-Generate decisions.md Entry on Regression

**Feature:** new-feature-2b74a292 (Multi-User Role-Aware Synchronous Collaboration)
**Story:** ep3-s2 — Auto-Generate decisions.md Entry on Regression
**Date:** 2026-09-16
**Status:** Signed Off

---

## Contract Proposal

**What will be built:**
A system mechanism that automatically appends a new entry to the feature's `decisions.md` file whenever a regression is requested (ep3-s1). The entry captures the date, user identity, regression reason, and target stage, written to disk within 2 seconds of the regression request being processed.

**What will NOT be built:**
- Editing or deleting decisions.md entries (append-only, immutable)
- Approval gates for regression decisions (auto-accept per ep3-s1)
- Notifications or alerts when a regression occurs

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1: Entry appended to decisions.md on regression | Unit test reading file before/after, integration test verifying append-only semantics | unit + integration |
| AC2: All required fields present and non-placeholder | Unit test inspecting parsed entry fields, integration test on full flow with actual regression | unit + integration |
| AC3: Disk write completes within 2s | Integration test measuring elapsed time from regression submission to `fs.writeFileSync` completion | integration |

**Assumptions:**
- The regression handler (ep3-s1) completes state reset before invoking the decisions.md writer (dependencies are in sequence)
- `decisions.md` file already exists on the feature (created at discovery, appended by ep2-s3)
- Tenant isolation is enforced at the route boundary, not within this writer logic

**Estimated touch points:**
Files: `src/regression-handler.js` or equivalent (calls a new `appendRegressionDecision()` module), `src/modules/decisions-writer.js` (new)
Services: Filesystem (`fs.writeFileSync`), feature loader (resolves feature artefact paths)
APIs: POST `/api/features/{featureId}/regression` (existing from ep3-s1; this story adds the decisions.md append side effect)

---

## Contract Review

**Mismatch check:**
- AC1 (Entry appended to decisions.md) → proposed: new entry written to disk, read-back verification shows count +1 ✅
- AC2 (Required fields present and non-placeholder) → proposed: date, session-phase, decision, reason, actor, stageReverted fields all populated from request data, no [TBD] stubs ✅
- AC3 (Disk write within 2s) → proposed: elapsed time from regression POST handler to `fs.writeFileSync` completion measured, ≤2s assertion in test ✅

**Result:** ✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks — All Passing ✅

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS (Audit / compliance — implicit system actor) |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS (3 ACs, all Given/When/Then format) |
| H3 | Every AC has test in test plan | ✅ PASS (10 tests total, all ACs covered) |
| H4 | Out-of-scope section populated | ✅ PASS (2 excluded behaviours named) |
| H5 | Benefit linkage to named metric | ✅ PASS ("Reversibility with audit trail" exists in coverage matrix) |
| H6 | Complexity rated | ✅ PASS (Rating: 1) |
| H7 | No HIGH findings from review | ✅ PASS (Review Run 2: 0 HIGH) |
| H8 | Test plan covers all ACs | ✅ PASS (10 tests, no gaps) |
| H8-ext | Schema dependency check | ✅ PASS (decisions.md is a file artefact; no pipeline-state schema dependency) |
| H9 | Architecture Constraints; no HIGH findings | ✅ PASS (ADR-029 referenced) |
| H-E2E | CSS-layout-dependent check | ✅ PASS (all ACs logic-based) |
| H-NFR | NFR profile or "None" | ✅ PASS ("NFRs: None — reviewed 2026-09-16") |
| H-NFR2 | Compliance NFR sign-off | ✅ PASS (not applicable) |
| H-NFR3 | Data classification | ✅ PASS (not applicable) |
| H-NFR-profile | NFR profile presence | ✅ PASS (no profile required) |
| H-GOV | Approved By in discovery artefact | ✅ PASS (non-blank Approved By section present in discovery.md) |
| H-ADAPTER | Injectable adapter check (D37) | ✅ PASS (no injectable adapters) |
| H-INF | Infra-plan gate | ✅ PASS (not applicable) |
| H-MIG | Migration-review gate | ✅ PASS (not applicable) |

---

## Warnings — None Triggered

All W1–W5 checks pass; no warnings apply to this story.

---

## Oversight Level

**Oversight:** Medium

**Rationale:** File I/O, string formatting, and timestamp recording are straightforward operations with low failure risk. No concurrent complexity or state machines. Medium oversight reflects standard delivery complexity for a post-approval audit trail feature.

**Action:** Share the DoR artefact with the tech lead before assigning to the coding agent. No formal sign-off required; awareness is sufficient.

---

## Coding Agent Instructions

You are implementing: **Auto-Generate decisions.md Entry on Regression (ep3-s2)**
**Feature slug:** new-feature-2b74a292
**Oversight level:** Medium (share DoR with tech lead before starting)

### Acceptance Criteria (Binding)

**AC1:** Given Susan requests a regression (ep3-s1), When the regression is processed, Then a new entry is appended to artefacts/[feature]/decisions.md.

**AC2:** Given the entry has been appended, When it is inspected, Then it contains date, session-phase: regression, decision, reason, actor, and stageReverted fields, all populated from the actual regression request (not placeholders).

**AC3:** Given the regression has just completed, When decisions.md is read from disk, Then the new entry is present within 2 seconds of the regression completing — no delayed/batched write.

### Touch Points (Binding Contract)

**Files you MUST modify:**
- `src/regression-handler.js` (or equivalent route handler for POST `/api/features/{featureId}/regression` from ep3-s1) — add call to `appendRegressionDecision()` after state reset completes
- `src/modules/decisions-writer.js` (new) — implement `appendRegressionDecision(featureId, tenantId, userId, targetStage, reason, timestamp)` function

**Files you MUST NOT modify:**
- Request/response contract for the regression endpoint (ep3-s1 contract)
- Feature loader or tenant resolution logic
- Test fixtures or test setup files (tests/e2e/ and test utilities)

### Architecture Constraints

- **ADR-029 (Disk canonical):** decisions.md content on disk is the durable record. No in-memory state, no caching. Write to disk immediately; read back to verify for tests.
- **Tenant scoping:** `tenantId` is passed from the regression handler; all file operations use tenant-scoped artefact paths.
- **Append-only semantics:** No truncation, no line editing. Every write is an append at the end of the file.

### Applicable Standards

**From `.github/standards/web-ui/core.md`:**
- Session tenant context required on all operations
- Error responses must be specific (e.g., "Failed to write regression entry to decisions.md: [OS error]")

**From web-ui patterns:**
- Timestamp format: ISO 8601 (e.g. `2026-09-16T14:23:00Z`)
- User identity: `{ userId, login, role }` tuple from session

### Implementation Specification

**`appendRegressionDecision(featureId, tenantId, userId, userRole, targetStage, reason, timestamp)` function:**

- **Input validation:** featureId, tenantId non-empty; reason ≥5 chars; targetStage matches pipeline stage enum
- **File path resolution:** `artefacts/${featureId}/decisions.md` relative to repo root; resolve using tenant-scoped path (if applicable per ADR-025)
- **Entry format:** YAML-like structure matching existing entries in the file (see test-plan artefact for example format):
  ```
  - date: [YYYY-MM-DD from timestamp]
    session-phase: regression
    decision: Regress to [stageReverted]
    reason: [reason from request]
    actor: [login] ([role])
    stageReverted: [targetStage]
    timestamp: [ISO 8601]
  ```
- **File write:** Use `fs.appendFileSync()` (blocking, simpler) or `fs.promises.appendFile()` (async, if the regression handler is async). Measure elapsed time; assert ≤2s in test.
- **Error handling:** If the file does not exist or write fails, return an error object `{ success: false, error: "..." }`. The regression handler must check this and either retry or log a critical alert. Do NOT silently swallow write failures.
- **Return value:** `{ success: true, entryRef: { date, actor, stageReverted } }` on success for the regression handler to confirm.

### Test Coverage

From the test-plan artefact (artefacts/new-feature-2b74a292/test-plans/ep3-s2-test-plan.md):

- **Unit tests:** AC1 (entry appended, count +1), AC2a/2b (required fields present and non-placeholder), AC3 (latency ≤2s)
- **Integration tests:** Full flow end-to-end, prior entries preserved (append-only check), tenant isolation
- **E2E tests:** (via ep3-s1 integration) regression modal → entry write → disk read
- **Total:** 10 tests; all ACs covered

### NFRs

- Entry is written to disk within 2s of regression
- Entry is immediately visible in decisions.md without refresh (read-back confirmation in test)
- Prior entries are never modified (append-only)

### Success Criteria for Definition of Done

- All 3 ACs passing (verified by manual test: trigger regression, read decisions.md from disk, inspect new entry)
- No unhandled exceptions in server logs
- Tenant isolation verified (all path operations use tenant-scoped artefact root)
- Regression entry has all 6 required fields populated (date, session-phase, decision, reason, actor, stageReverted), zero placeholders
- Prior entries remain unchanged post-regression
- Disk write latency ≤2s (measured in integration test)
- `appendRegressionDecision()` returns success/error object for handler to check

---

## Completion Summary

✅ **READY TO CODE**

All hard blocks pass (20/20). No blocking findings. Oversight level: Medium — share DoR with tech lead before dispatch. Coding Agent Instructions complete and binding.

**Next action:** After tech lead awareness, proceed to `/branch-setup`.