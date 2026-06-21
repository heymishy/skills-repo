# Definition of Ready — sdg.2

**Story:** sdg.2 — Reference file persistence in journey state
**Feature:** 2026-06-21-strategy-and-data-hub
**Status:** SIGNED OFF
**Date:** 2026-06-21

## Contract Proposal

**What will be built:**
A journey state persistence layer that records uploaded reference files in `journey.referenceFiles[]` and makes them available to downstream skill sessions via the `buildSystemPrompt()` call. Journey state is updated when files are uploaded and persists across session interruptions.

**What will NOT be built:**
- Automatic file freshness checks or staleness warnings
- Versioning or historical tracking of prior uploads
- Automatic cleanup of old files
- Syncing reference files across multiple journeys

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Journey state records file list | Unit: mock upload, verify `journey.referenceFiles` populated | unit |
| AC2 | Reference files available to skill sessions | Integration: call `buildSystemPrompt()` with referenceFiles, verify param present | integration |
| AC3 | Journey resume preserves reference files | Integration: simulate session interruption, verify referenceFiles unchanged | integration |
| AC4 | Re-upload updates journey state | Integration: navigate backward, upload new files, verify state updated | integration |
| AC5 | Multiple files tracked independently | Unit: upload 3 files, verify all 3 entries present with distinct metadata | unit |

## Hard Blocks Assessment

| Block | Check | Result |
|-------|-------|--------|
| H1 | User story format | ✅ PASS |
| H2 | AC count and format | ✅ PASS — 5 ACs, all Given/When/Then |
| H3 | Test coverage per AC | ✅ PASS — all ACs covered in test plan |
| H4 | Out-of-scope section | ✅ PASS — 4 items listed |
| H5 | Benefit linkage | ✅ PASS — references M2 (adoption), M5 (rework reduction) |
| H6 | Complexity rating | ✅ PASS — rated as 1 (well-understood) |
| H7 | Review findings | ✅ PASS — no HIGH findings |
| H8 | Test plan coverage | ✅ PASS — no gaps |
| H8-ext | Schema dependencies | ✅ PASS — no upstream dependencies |
| H9 | Architecture constraints | ✅ PASS — NFR profile populated |
| H-E2E | CSS-layout ACs | ✅ PASS — none present |
| H-NFR | NFR profile | ✅ PASS — exists and complete |
| H-NFR2 | Compliance sign-off | ✅ PASS — no compliance NFRs |
| H-NFR3 | Data classification | ✅ PASS — populated in profile |
| H-GOV | Governance approval | ✅ PASS — `Approved By: Hamish King — 2026-06-04` |

**Result: ALL HARD BLOCKS PASSED ✅**

## Warnings Assessment

| Warning | Status |
|---------|--------|
| W1 — NFRs | ✅ Populated (file I/O, persistence, atomicity) |
| W2 — Scope stability | ✅ Stable (no upstream code dependencies) |
| W3 — MEDIUM findings | ✅ None present |
| W4 — Verification review | ✅ N/A (unit/integration tests, not manual script) |
| W5 — UNCERTAIN items | ✅ None in test plan |

**All warnings acknowledged ✅**

## Oversight

**Level:** Medium

**Action:** Share DoR artefact with tech lead before assigning to coding agent.

## Coding Agent Instructions

### What you are building

A journey state persistence layer that records uploaded reference files in a `journey.referenceFiles[]` array and exposes that array to downstream skill sessions.

### Key Acceptance Criteria

- Journey state includes `referenceFiles` array with `{path, uploadedAt, sizeBytes}` entries
- Files available to skill sessions via `buildSystemPrompt(..., {referenceFiles})`
- Journey resume (browser close/reopen) preserves reference files
- Re-upload updates journey state with new file list
- Multiple files tracked independently

### Architecture Constraints

- Node.js built-ins only (`fs`, `path`, `os`)
- File write and journey state update are atomic (both succeed or both fail)
- `buildSystemPrompt()` signature must accept `referenceFiles` parameter
- Journey state schema consistent across all code paths

### Test References

**Test plan:** `artefacts/2026-06-21-strategy-and-data-hub/test-plans/sdg.2-test-plan.md`
**Verification:** `artefacts/2026-06-21-strategy-and-data-hub/verification-scripts/sdg.2-verification.md`

### Next Steps

1. Run `/branch-setup` to create isolated worktree
2. Run `/implementation-plan` to write task list
3. Run `/tdd` or `/subagent-execution` per task
4. Run `/verify-completion` before opening PR
5. Run `/branch-complete` to open draft PR (never ready-for-review)
6. After merge: run `/definition-of-done`