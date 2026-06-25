# Definition of Ready — sri.1: Add git fetch timeout and fallback in inner-loop skills

**Date:** 2026-06-25
**Assessor:** Claude Sonnet 4.6
**Story:** artefacts/2026-05-18-skill-robustness-improvements/stories/sri.1.md
**Review:** artefacts/2026-05-18-skill-robustness-improvements/review/sri.1-review-1.md — PASS Run 1
**Test plan:** artefacts/2026-05-18-skill-robustness-improvements/test-plans/sri.1-test-plan.md — 13 tests, 5 ACs
**Verification script:** artefacts/2026-05-18-skill-robustness-improvements/verification-scripts/sri.1-verification.md — 6 scenarios

---

## Hard Block Results

| Block | Check | Result |
|-------|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS — 5 ACs |
| H3 | Every AC has ≥1 test | ✅ PASS |
| H4 | Out-of-scope populated | ✅ PASS — 4 items |
| H5 | Benefit linkage references named metric | ✅ PASS — M1 |
| H6 | Complexity rated | ✅ PASS — 1 |
| H7 | No unresolved HIGH findings | ✅ PASS — 0 HIGH |
| H8 | No uncovered ACs | ✅ PASS |
| H8-ext | Cross-story schema dependency | ✅ PASS — Dependencies: None; schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ PASS |
| H-E2E | No CSS-layout-dependent ACs | ✅ PASS |
| H-NFR | NFR profile exists | ✅ PASS |
| H-NFR2 | No regulatory clause NFRs | ✅ PASS |
| H-NFR3 | Data classification not blank | ✅ PASS — "Not applicable — SKILL.md text changes" |
| H-NFR-profile | NFR profile present (story declares NFRs) | ✅ PASS |
| H-GOV | Discovery Approved By populated | ✅ PASS — "Platform Operator — 2026-05-18" |
| H-ADAPTER | No injectable adapters introduced | ✅ PASS |
| H-INF | Infra-plan gate | ✅ SKIP — hasInfraTrack absent |
| H-MIG | Migration-review gate | ✅ SKIP — hasMigrationTrack absent |

**Hard blocks: 17/17 passed (2 skipped as not applicable)**

---

## Warnings

| Warning | Status |
|---------|--------|
| W1 — NFRs populated | ✅ Populated (Performance: 5s timeout; Security: no credentials in warning) |
| W2 — Scope stability declared | ✅ Stable |
| W3 — MEDIUM findings acknowledged | ✅ 0 MEDIUM findings |
| W4 — Verification script reviewed by domain expert | RISK-ACCEPT — solo operator posture per architecture-guardrails.md; W4 is standard posture for this repo |
| W5 — No UNCERTAIN gaps | ✅ No UNCERTAIN items; regression guards documented in-test |

---

## Oversight

**Medium** — per epic (sri-phase1-inner-loop-reliability). Platform change policy requires PR review before merge. Coding agent implements and opens draft PR; human reviews before merge.

---

## Verdict: PROCEED ✅

---

## Coding Agent Instructions

**Story:** sri.1 — Add git fetch timeout and fallback in inner-loop skills
**Feature:** 2026-05-18-skill-robustness-improvements
**Complexity:** 1 | **Scope stability:** Stable | **Oversight:** Medium

### What to build

Add a 5-second timeout and fallback path around `git fetch origin master` in three SKILL.md files. When the fetch fails or times out, the skill logs a plain-text warning (no remote URL, no error output) and falls back to the local branch copy of `pipeline-state.json`.

**Files to modify (ONLY these three — no other files):**
- `skills/branch-complete/SKILL.md`
- `skills/implementation-plan/SKILL.md`
- `skills/subagent-execution/SKILL.md`

**Test file to create (failing before SKILL.md changes — must pass after):**
- `tests/check-sri1-fetch-timeout.js`

**No other files.** No schema changes, no scripts, no server code.

### Task sequence

**Task 1 — Write the test file (red phase)**
Create `tests/check-sri1-fetch-timeout.js` implementing tests T1–T13 from the test plan. Run `node tests/check-sri1-fetch-timeout.js` — T1–T9 must fail; T10, T11, T12, T13 may pass (regression guards).

**Task 2 — Modify `skills/branch-complete/SKILL.md` (green phase)**
Locate the `git fetch origin master` instruction near line 268. Wrap it with a 5-second timeout pattern. Add instruction text describing: (a) the timeout (5 seconds), (b) the fallback to local branch copy or worktree file on failure, (c) a warning message — "origin not reachable — using local copy" — that does NOT include the remote URL or the fetch error output. The warning is conditional: only shown when fallback activates.

**Task 3 — Modify `skills/implementation-plan/SKILL.md` (green phase)**
Same changes as Task 2. Target line is near line 177 in current file.

**Task 4 — Modify `skills/subagent-execution/SKILL.md` (green phase)**
Same changes as Task 2. Target line is near line 233 in current file.

**Task 5 — Run tests (green phase)**
Run `node tests/check-sri1-fetch-timeout.js`. All 13 tests must pass. If any fail, diagnose and fix before proceeding.

**Task 6 — Run full suite**
Run `npm test`. All checks must pass with 0 failures. Specifically confirm `check-skill-contracts.js` and `check-pipeline-artefact-paths.js` pass — SKILL.md changes may affect skill contract checks.

### Constraints (non-negotiable)

- Only the three named SKILL.md files and the test file are touched. No other files.
- The warning message must not log the remote URL, the authentication error, or the full `git fetch` stderr output.
- The primary `git fetch origin master` instruction must remain — the fix wraps it, not removes it.
- Must not change the behaviour of the fetch step in any other skill not listed above.
- Platform change policy: open as a draft PR, do not mark ready for review without human approval.

### AC → test mapping

| AC | Tests |
|----|-------|
| AC1 — branch-complete graceful fallback | T1, T2, T3 |
| AC2 — implementation-plan graceful fallback | T4, T5, T6 |
| AC3 — subagent-execution graceful fallback | T7, T8, T9 |
| AC4 — 5-second timeout | T1 (timeout text check), T4, T7 |
| AC5 — no change when origin healthy | T10 (regression guard) |
| NFR-SEC — no credentials in warning | T11, T12, T13 (regression guards) |
