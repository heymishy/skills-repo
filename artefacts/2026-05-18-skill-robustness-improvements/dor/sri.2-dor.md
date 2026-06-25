# Definition of Ready — sri.2: Expand DoD entry condition message with actionable guidance

**Date:** 2026-06-25
**Assessor:** Claude Sonnet 4.6
**Story:** artefacts/2026-05-18-skill-robustness-improvements/stories/sri.2.md
**Review:** artefacts/2026-05-18-skill-robustness-improvements/review/sri.2-review-1.md — PASS Run 1
**Test plan:** artefacts/2026-05-18-skill-robustness-improvements/test-plans/sri.2-test-plan.md — 5 tests, 5 ACs
**Verification script:** artefacts/2026-05-18-skill-robustness-improvements/verification-scripts/sri.2-verification.md — 5 scenarios

---

## Hard Block Results

| Block | Check | Result |
|-------|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS — 5 ACs |
| H3 | Every AC has ≥1 test | ✅ PASS |
| H4 | Out-of-scope populated | ✅ PASS — 3 items |
| H5 | Benefit linkage references named metric | ✅ PASS — M2 |
| H6 | Complexity rated | ✅ PASS — 1 |
| H7 | No unresolved HIGH findings | ✅ PASS — 0 HIGH |
| H8 | No uncovered ACs | ✅ PASS |
| H8-ext | Cross-story schema dependency | ✅ PASS — Dependencies: None; schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ PASS |
| H-E2E | No CSS-layout-dependent ACs | ✅ PASS |
| H-NFR | NFR profile exists | ✅ PASS |
| H-NFR2 | No regulatory clause NFRs | ✅ PASS |
| H-NFR3 | Data classification not blank | ✅ PASS — "Not applicable — SKILL.md text changes" |
| H-NFR-profile | NFR profile present; story NFRs are "None" — consistent | ✅ PASS |
| H-GOV | Discovery Approved By populated | ✅ PASS — "Platform Operator — 2026-05-18" |
| H-ADAPTER | No injectable adapters introduced | ✅ PASS |
| H-INF | Infra-plan gate | ✅ SKIP — hasInfraTrack absent |
| H-MIG | Migration-review gate | ✅ SKIP — hasMigrationTrack absent |

**Hard blocks: 17/17 passed (2 skipped as not applicable)**

---

## Warnings

| Warning | Status |
|---------|--------|
| W1 — NFRs populated | ✅ "None" confirmed for all 4 NFR categories — correct for text-only change |
| W2 — Scope stability declared | ✅ Stable |
| W3 — MEDIUM findings acknowledged | ✅ 0 MEDIUM findings |
| W4 — Verification script reviewed by domain expert | RISK-ACCEPT — solo operator posture per architecture-guardrails.md |
| W5 — No UNCERTAIN gaps | ✅ No gaps |

---

## Oversight

**Medium** — per epic. Coding agent implements and opens draft PR; human reviews before merge.

---

## Verdict: PROCEED ✅

---

## Coding Agent Instructions

**Story:** sri.2 — Expand DoD entry condition message with actionable guidance
**Feature:** 2026-05-18-skill-robustness-improvements
**Complexity:** 1 | **Scope stability:** Stable | **Oversight:** Medium

### What to build

Expand the entry condition block in `skills/definition-of-done/SKILL.md` to include three elements: (a) how to check PR merge status, (b) next steps to reach merge, (c) why the gate exists. All three in a single readable block.

**File to modify (ONLY this one):**
- `skills/definition-of-done/SKILL.md`

**Test file to create:**
- `tests/check-sri2-dod-entry-condition.js`

**No other files.**

### Task sequence

**Task 1 — Write the test file (red phase)**
Create `tests/check-sri2-dod-entry-condition.js` implementing T1–T5 from the test plan. Run it — T1–T4 must fail; T5 (regression guard) must pass.

**Task 2 — Modify `skills/definition-of-done/SKILL.md` (green phase)**
Locate the `## Entry condition check` section (around line 33). Expand the early-exit error block — the text shown when PR is not yet merged — to include all three required elements in a single readable message:

(a) PR status check: a `gh pr view` command or equivalent instruction for checking whether the PR is merged.
(b) Next steps: the sequence — mark PR ready for review → obtain approval → merge → re-run `/definition-of-done`.
(c) Gate rationale: a brief explanation — "DoD validates what has actually shipped, not what is proposed in an open PR."

Do NOT change the logic that determines when the entry condition fires. Do NOT change any section after the entry condition block.

**Task 3 — Run tests**
Run `node tests/check-sri2-dod-entry-condition.js`. All 5 tests must pass.

**Task 4 — Run full suite**
Run `npm test`. All checks must pass. Confirm `check-skill-contracts.js` passes.

### Constraints

- Only `skills/definition-of-done/SKILL.md` and the test file are touched.
- The logic determining when the entry condition fires is unchanged.
- The post-merge flow (Steps 1–7) is untouched.
- Platform change policy: open as draft PR; human review before merge.

### AC → test mapping

| AC | Tests |
|----|-------|
| AC1 — PR status check in message | T1 |
| AC2 — next steps in message | T2 |
| AC3 — gate rationale in message | T3 |
| AC4 — all three in single block | T4 |
| AC5 — guidance absent post-merge | T5 (regression guard) |
