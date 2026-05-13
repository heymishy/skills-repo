# Definition of Ready: Add Output 9 — `/discovery` pre-population seed to `/reverse-engineer`

**Story reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/stories/rrc.1-discovery-seed-output.md`
**Test plan reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/test-plans/rrc.1-test-plan.md`
**Verification script:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/verification-scripts/rrc.1-verification.md`
**Review report:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/review/rrc.1-review-1.md`
**Assessed by:** Copilot
**Date:** 2026-04-30

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with a named persona | ✅ PASS | "As a platform maintainer" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS | 5 ACs, all GWT |
| H3 | Every AC has at least one test in the test plan | ✅ PASS | AC1 (T1.1–T1.6), AC2 (T1.7), AC3 (T1.8), AC4 (T1.9–T1.10), AC5 (T1.10) |
| H4 | Out-of-scope section populated — not blank or N/A | ✅ PASS | 3 explicit exclusions listed |
| H5 | Benefit linkage references a named metric | ✅ PASS | MM1 — Discovery pre-population time saved |
| H6 | Complexity is rated | ✅ PASS | Rating 1, Scope stability: Stable |
| H7 | No unresolved HIGH findings | ✅ PASS | 3 LOW findings only (1-L1, 1-L2, 1-L3) |
| H8 | No uncovered ACs | ✅ PASS | All 5 ACs covered; NFR tested as T1.6 |
| H8-ext | Cross-story schema dependency | ✅ PASS | Upstream dependency is a story (rrc.1 base commit), not a schema field — no schemaDepends required |
| H9 | Architecture constraints populated; no Category E HIGH findings | ✅ PASS | 4 constraints listed; review found no E-category findings |
| H-E2E | No CSS-layout-dependent ACs | ✅ PASS | File content assertions only — no E2E tooling needed |
| H-NFR | NFR declaration present | ✅ PASS | Story NFR block present (size, readability, security: None) |
| H-NFR2 | No compliance NFRs with regulatory clauses | ✅ PASS | No regulatory clauses |
| H-NFR3 | Data classification not blank | ✅ PASS | Security: None — Non-sensitive (see nfr-profile.md) |
| H-NFR-profile | NFR profile exists | ✅ PASS | `artefacts/2026-04-30-reverse-engineer-reference-corpus/nfr-profile.md` created 2026-04-30 |
| H-GOV | Discovery Approved By section has ≥1 named non-blank entry | ✅ PASS | "Hamish — Platform maintainer — 2026-04-30" |

---

## Warnings

| # | Check | Status | Risk | Acknowledged by |
|---|-------|--------|------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged in /decisions | ✅ N/A | No MEDIUM findings in rrc.1 review | — |
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
Story: Add Output 9 — /discovery pre-population seed to /reverse-engineer
Story artefact: artefacts/2026-04-30-reverse-engineer-reference-corpus/stories/rrc.1-discovery-seed-output.md
Test plan: artefacts/2026-04-30-reverse-engineer-reference-corpus/test-plans/rrc.1-test-plan.md
Test script: tests/check-rrc1-discovery-seed.js
Verification script: artefacts/2026-04-30-reverse-engineer-reference-corpus/verification-scripts/rrc.1-verification.md

Goal:
Make all 10 tests in tests/check-rrc1-discovery-seed.js pass. Do not add
scope, behaviour, or structure beyond what the tests and ACs specify.

What to implement:
Add Output 9 instruction block to .github/skills/reverse-engineer/SKILL.md only.
Specifically:
1. Add "Output 9 — discovery-seed.md" to the outputs table.
2. Add a format section for discovery-seed.md describing four sections:
   - System name
   - Problem framing (derived from REVIEW-disposition rules and known failure modes)
   - Known constraints (all PARITY REQUIRED rules, using L<layer>-<seq> rule-id format per DEC-001)
   - Personas (user types identified in the system)
3. Add instruction to produce Output 9 at the end of any INITIAL or DEEPEN pass.
4. Add conditional exclusion: Output 9 is NOT produced when Q0 outcome is DEFER.
5. Add VERIFY-pass instruction: if any PARITY REQUIRED rule was added, retired, or
   had its disposition changed since the last pass, instruct the operator to update Output 9.

Constraints:
- SKILL.md-only change: touch only .github/skills/reverse-engineer/SKILL.md
- No code, no scripts, no new npm dependencies
- Do NOT modify: any test files, any other SKILL.md, any artefacts/ files,
  pipeline-state.json, package.json, CHANGELOG.md
- Total line count of /reverse-engineer/SKILL.md must remain ≤ 650 after changes
- Rule-id format must be <layer>-<sequence> (e.g. L1-001) per DEC-001
  (decisions: artefacts/2026-04-30-reverse-engineer-reference-corpus/decisions.md)
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not violate Active ADRs. The check-skill-contracts.js governance
  check must still pass (40 skills, 170 contracts) after your change.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

NFR notes:
- NFR-rrc-size-re: SKILL.md ≤ 650 lines total — tested by T1.6
- NFR-rrc-security: No executable code; check-skill-contracts.js must still report 40 skills

Review LOW findings to be aware of (do not act on — informational only):
- 1-L1: AC3 says "outcome C" but the correct SKILL.md vocabulary is "DEFER" — implement using "DEFER"
- 1-L2: AC5 trigger — implement as "if any PARITY REQUIRED rule was added, retired, or had its
  disposition changed since the last pass" (already encoded in this instruction)
- 1-L3: Line count NFR — already captured as test T1.6

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required
**DoR run date:** 2026-04-30
