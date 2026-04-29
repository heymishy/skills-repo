# Definition of Ready: Add Output 10 — Constraint index to `/reverse-engineer`

**Story reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/stories/rrc.2-constraint-index-output.md`
**Test plan reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/test-plans/rrc.2-test-plan.md`
**Verification script:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/verification-scripts/rrc.2-verification.md`
**Review report:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/review/rrc.2-review-1.md`
**Assessed by:** Copilot
**Date:** 2026-04-30

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with a named persona | ✅ PASS | "As a tech lead" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS | 5 ACs, all GWT |
| H3 | Every AC has at least one test in the test plan | ✅ PASS | AC1 (T2.1–T2.7), AC2 (T2.8), AC3 (T2.9), AC4 (T2.10), AC5 (T2.11), DEC-001 (T2.12), NFR (T2.13) |
| H4 | Out-of-scope section populated — not blank or N/A | ✅ PASS | 3 explicit exclusions listed |
| H5 | Benefit linkage references a named metric | ✅ PASS | MM2 — Constraint index coverage in story DoR artefacts |
| H6 | Complexity is rated | ✅ PASS | Rating 1, Scope stability: Stable |
| H7 | No unresolved HIGH findings | ✅ PASS | 1 MEDIUM (2-M1 — resolved by DEC-001), 2 LOW; no HIGH |
| H8 | No uncovered ACs | ✅ PASS | All 5 ACs covered; DEC-001 rule-id format tested as T2.12; NFR as T2.13 |
| H8-ext | Cross-story schema dependency | ✅ PASS | Upstream dependency is a story/commit, not a schema field — no schemaDepends required |
| H9 | Architecture constraints populated; no Category E HIGH findings | ✅ PASS | 4 constraints listed; review found no E-category findings |
| H-E2E | No CSS-layout-dependent ACs | ✅ PASS | File content assertions only |
| H-NFR | NFR declaration present | ✅ PASS | Story NFR block present (size ≤ 650, readability, security: None) |
| H-NFR2 | No compliance NFRs with regulatory clauses | ✅ PASS | No regulatory clauses |
| H-NFR3 | Data classification not blank | ✅ PASS | Security: None — Non-sensitive (nfr-profile.md) |
| H-NFR-profile | NFR profile exists | ✅ PASS | `artefacts/2026-04-30-reverse-engineer-reference-corpus/nfr-profile.md` exists |
| H-GOV | Discovery Approved By section has ≥1 named non-blank entry | ✅ PASS | "Hamish — Platform maintainer — 2026-04-30" |

---

## Warnings

| # | Check | Status | Risk | Acknowledged by |
|---|-------|--------|------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM finding 2-M1 acknowledged in /decisions | ✅ | Resolved by DEC-001 (rule-id format `L<layer>-<seq>`) — recorded 2026-04-30 | Hamish — DEC-001, 2026-04-30 |
| W4 | Verification script reviewed by domain expert | ⚠️ RISK-ACCEPT | Scenario wording may miss edge case; low risk — SKILL.md-only change with automated test complement | Hamish — DEC-003, 2026-04-30 |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table states "None" | — |

---

## Oversight Level

**Level:** Low (from parent epic rrc-epic-1)
**Sign-off required:** No — proceed directly to coding agent assignment.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add Output 10 — Constraint index to /reverse-engineer
Story artefact: artefacts/2026-04-30-reverse-engineer-reference-corpus/stories/rrc.2-constraint-index-output.md
Test plan: artefacts/2026-04-30-reverse-engineer-reference-corpus/test-plans/rrc.2-test-plan.md
Test script: tests/check-rrc2-constraint-index.js
Verification script: artefacts/2026-04-30-reverse-engineer-reference-corpus/verification-scripts/rrc.2-verification.md

Goal:
Make all 13 tests in tests/check-rrc2-constraint-index.js pass. Do not add
scope, behaviour, or structure beyond what the tests and ACs specify.

What to implement:
Add Output 10 instruction block to .github/skills/reverse-engineer/SKILL.md only.
Specifically:
1. Add "Output 10 — constraint-index.md" to the outputs table.
2. Add a format description: one header row (rule-id | source-file | confidence |
   disposition | summary) followed by one data row per PARITY REQUIRED and
   MIGRATION CANDIDATE rule in the corpus.
3. Rule-id format must be <layer>-<sequence> (e.g. L1-001) per DEC-001. This is the
   canonical format shared with corpus-state.md.
4. When a PARITY REQUIRED rule has a [CHANGE-RISK] flag in the corpus, the summary
   column must append "[CHANGE-RISK]" (bracketed, uppercase).
5. Add production instruction: produce Output 10 at end of any INITIAL or DEEPEN pass.
6. Add DEFER conditional: when Q0 outcome is DEFER, Output 10 is NOT produced.
7. Add VERIFY-pass update instruction: after a VERIFY pass, update constraint-index.md
   to reflect any rules whose disposition changed or were retired.

Constraints:
- SKILL.md-only change: touch only .github/skills/reverse-engineer/SKILL.md
- No code, no scripts, no new npm dependencies
- Do NOT modify: any test files, any other SKILL.md, any artefacts/ files,
  pipeline-state.json, package.json, CHANGELOG.md
- Combined rrc.1 + rrc.2 additions must keep total SKILL.md ≤ 650 lines
- Rule-id format must be <layer>-<sequence> (e.g. L1-001) per DEC-001
  (decisions: artefacts/2026-04-30-reverse-engineer-reference-corpus/decisions.md)
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. check-skill-contracts.js must still pass (40 skills) after your change.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

NFR notes:
- NFR-rrc-size-re: combined rrc.1 + rrc.2 additions keep SKILL.md ≤ 650 lines — tested by T2.13
- NFR-rrc-readability-idx: constraint-index.md format must be a human-readable pipe table
- NFR-rrc-security: No executable code; governance check must still pass

Review findings to be aware of (informational only — do not act on the LOW findings):
- 2-M1 (MEDIUM): rule-id format was unspecified — RESOLVED by DEC-001 (encoded above)
- 2-L1 (LOW): CHANGE-RISK notation exact string — implemented above as "[CHANGE-RISK]"
- 2-L2 (LOW): joint line-count budget ambiguity — monitor combined line count stays ≤ 650

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required
**DoR run date:** 2026-04-30
