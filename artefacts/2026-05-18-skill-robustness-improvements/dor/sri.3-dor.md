# Definition of Ready — sri.3: Add measurement-ready gate to DoD Step 6 for infrastructure stories

**Date:** 2026-06-25
**Assessor:** Claude Sonnet 4.6
**Story:** artefacts/2026-05-18-skill-robustness-improvements/stories/sri.3.md
**Review:** artefacts/2026-05-18-skill-robustness-improvements/review/sri.3-review-1.md — PASS Run 1
**Test plan:** artefacts/2026-05-18-skill-robustness-improvements/test-plans/sri.3-test-plan.md — 8 tests, 5 ACs
**Verification script:** artefacts/2026-05-18-skill-robustness-improvements/verification-scripts/sri.3-verification.md — 6 scenarios

---

## Hard Block Results

| Block | Check | Result |
|-------|-------|--------|
| H1 | User story As/Want/So with named persona | ✅ PASS |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS — 5 ACs |
| H3 | Every AC has ≥1 test | ✅ PASS |
| H4 | Out-of-scope populated | ✅ PASS — 4 items |
| H5 | Benefit linkage references named metric | ✅ PASS — M3 |
| H6 | Complexity rated | ✅ PASS — 1 |
| H7 | No unresolved HIGH findings | ✅ PASS — 0 HIGH |
| H8 | No uncovered ACs | ✅ PASS (NFR-PERF covered by manual Scenario 5; acknowledged gap) |
| H8-ext | Cross-story schema dependency | ✅ PASS — Dependencies: None; schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ PASS |
| H-E2E | No CSS-layout-dependent ACs | ✅ PASS |
| H-NFR | NFR profile exists | ✅ PASS |
| H-NFR2 | No regulatory clause NFRs | ✅ PASS |
| H-NFR3 | Data classification not blank | ✅ PASS — "Not applicable — SKILL.md text changes" |
| H-NFR-profile | NFR profile present; story declares Performance + Audit NFRs | ✅ PASS |
| H-GOV | Discovery Approved By populated | ✅ PASS — "Platform Operator — 2026-05-18" |
| H-ADAPTER | No injectable adapters introduced | ✅ PASS |
| H-INF | Infra-plan gate | ✅ SKIP — hasInfraTrack absent |
| H-MIG | Migration-review gate | ✅ SKIP — hasMigrationTrack absent |

**Hard blocks: 17/17 passed (2 skipped as not applicable)**

---

## Warnings

| Warning | Status |
|---------|--------|
| W1 — NFRs populated | ✅ Performance (<30s on not-yet-measured path) + Audit (evidence note in artefact) |
| W2 — Scope stability declared | ✅ Stable |
| W3 — MEDIUM findings acknowledged | ✅ 0 MEDIUM findings |
| W4 — Verification script reviewed by domain expert | RISK-ACCEPT — solo operator posture per architecture-guardrails.md |
| W5 — No UNCERTAIN gaps | ✅ NFR-PERF runtime gap acknowledged in test plan gap table; manual Scenario 5 🔴 covers it |

---

## Oversight

**Medium** — per epic. Coding agent implements and opens draft PR; human reviews before merge.

---

## Verdict: PROCEED ✅

---

## Coding Agent Instructions

**Story:** sri.3 — Add measurement-ready gate to DoD Step 6 for infrastructure stories
**Feature:** 2026-05-18-skill-robustness-improvements
**Complexity:** 1 | **Scope stability:** Stable | **Oversight:** Medium

### What to build

Add a measurement-ready gate question as the first question in Step 6 of `skills/definition-of-done/SKILL.md`. Operators who answer "not yet" are prompted for a brief evidence note, then the skill moves to the next story. The "yes" path and the normal signal-capture flow are unchanged.

**File to modify (ONLY this one):**
- `skills/definition-of-done/SKILL.md`

**Test file to create:**
- `tests/check-sri3-dod-step6-gate.js`

**No other files.** No schema changes, no new pipeline-state fields.

### Task sequence

**Task 1 — Write the test file (red phase)**
Create `tests/check-sri3-dod-step6-gate.js` implementing T1–T8 from the test plan. Run it — T1, T2, T3, T4, T5, T7 must fail; T6 and T8 (regression guards) must pass.

**Task 2 — Modify `skills/definition-of-done/SKILL.md` Step 6 (green phase)**
Locate the `## Step 6` section (currently titled "Metric signal", around line 157). Add the measurement-ready gate as the FIRST question in the per-story loop:

> "Is measurement possible yet for this story? (yes / not yet)"

If the operator answers **"not yet"**:
- Record `not-yet-measured` as the outcome for this story.
- Prompt for a brief evidence note (e.g. "no user-facing features shipped yet — infrastructure only").
- Move on to the next story in Step 6. Do NOT ask for a metric signal, trend, or rating.

If the operator answers **"yes"**:
- Proceed with the existing signal-capture flow unchanged — on-track / at-risk / off-track / not-yet-measured options, signal quality, notes.

Also update the state-write / artefact-write instruction in or near Step 6 to specify that the DoD artefact records `not-yet-measured` alongside the operator-supplied evidence note (not blank, not "N/A").

**Task 3 — Run tests**
Run `node tests/check-sri3-dod-step6-gate.js`. All 8 tests must pass.

**Task 4 — Run full suite**
Run `npm test`. All checks must pass.

### Constraints

- Only `skills/definition-of-done/SKILL.md` and the test file are touched.
- The gate question is the FIRST thing asked per-story in Step 6 — not a sub-question or footnote.
- The "yes" path and normal signal options (on-track, at-risk, off-track) are completely unchanged.
- No new `measurementReady` field is added to story artefacts or pipeline-state.json.
- Do not change any other Step in the DoD skill.
- Platform change policy: open as draft PR; human review before merge.

### AC → test mapping

| AC | Tests |
|----|-------|
| AC1 — gate question first in Step 6 | T1 (gate question present), T2 (gate question precedes signal prompt) |
| AC2 — "not yet" records not-yet-measured + evidence note, moves on | T3 (not-yet-measured label), T4 (evidence note), T5 (moves on) |
| AC3 — "yes" preserves normal flow | T6 (regression guard — on-track/at-risk/off-track still present) |
| AC4 — artefact records not-yet-measured with evidence note | T7 |
| AC5 — stories processed independently | T8 (regression guard — per-story loop) |
| NFR-PERF (<30s) | Manual Scenario 5 🔴 in verification script |
| NFR-AUDIT — evidence note in artefact | T7 |
