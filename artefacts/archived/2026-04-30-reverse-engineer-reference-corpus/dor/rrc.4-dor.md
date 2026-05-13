# Definition of Ready: Create `/reference-corpus-update` companion skill

**Story reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/stories/rrc.4-reference-corpus-update-skill.md`
**Test plan reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/test-plans/rrc.4-test-plan.md`
**Verification script:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/verification-scripts/rrc.4-verification.md`
**Review report:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/review/rrc.4-review-1.md`
**Assessed by:** Copilot
**Date:** 2026-04-30

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with a named persona | ✅ PASS | "As a platform maintainer" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS | 6 ACs, all GWT |
| H3 | Every AC has at least one test in the test plan | ✅ PASS | AC1 (T4.1–T4.2), AC2 (T4.3–T4.5), AC3 (T4.6–T4.8), AC4 (T4.9–T4.10), AC5 (T4.11–T4.13), AC6 (T4.14), NFR (T4.14) |
| H4 | Out-of-scope section populated — not blank or N/A | ✅ PASS | 4 explicit exclusions listed |
| H5 | Benefit linkage references a named metric | ✅ PASS | MM3 — Reference corpus continuity across delivery cycles |
| H6 | Complexity is rated | ✅ PASS | Rating 1, Scope stability: Stable |
| H7 | No unresolved HIGH findings | ✅ PASS | 1 MEDIUM (4-M1 — resolved by DEC-001), 2 LOW; no HIGH |
| H8 | No uncovered ACs | ✅ PASS | All 6 ACs covered; NFR tested as T4.14 |
| H8-ext | Cross-story schema dependency | ✅ PASS | Upstream dependency is rrc.2 (a story), not a schema field — no schemaDepends required |
| H9 | Architecture constraints populated; no Category E HIGH findings | ✅ PASS | 5 constraints listed including platform change policy (PR required); review found no E-category findings |
| H-E2E | No CSS-layout-dependent ACs | ✅ PASS | File content assertions only — no E2E tooling needed |
| H-NFR | NFR declaration present | ✅ PASS | Story NFR block present (size ≤ 100 lines, readability, security: None) |
| H-NFR2 | No compliance NFRs with regulatory clauses | ✅ PASS | No regulatory clauses |
| H-NFR3 | Data classification not blank | ✅ PASS | Security: None — Non-sensitive (nfr-profile.md) |
| H-NFR-profile | NFR profile exists | ✅ PASS | `artefacts/2026-04-30-reverse-engineer-reference-corpus/nfr-profile.md` exists |
| H-GOV | Discovery Approved By section has ≥1 named non-blank entry | ✅ PASS | "Hamish — Platform maintainer — 2026-04-30" |

---

## Dependency note

rrc.4 declares a dependency on rrc.2 for the rule-id format used in `corpus-state.md`. This format is now canonically defined by DEC-001 (`L<layer>-<seq>`) and is encoded directly in the Coding Agent Instructions below — the agent does not need rrc.2's SKILL.md to be merged before implementing rrc.4. rrc.4 can be dispatched in parallel with rrc.1 and rrc.2. The 41-skill governance check assertion (T4.1) is validated against the implementation branch, not master baseline (per finding 4-L2 / test plan note).

---

## Warnings

| # | Check | Status | Risk | Acknowledged by |
|---|-------|--------|------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM finding 4-M1 acknowledged in /decisions | ✅ | Resolved by DEC-001 (rule-id format `L<layer>-<seq>`) — 4-M1 is the same root cause as 2-M1 | Hamish — DEC-001, 2026-04-30 |
| W4 | Verification script reviewed by domain expert | ⚠️ RISK-ACCEPT | Scenario wording may miss edge case; low risk — SKILL.md-only change with automated test complement | Hamish — DEC-003, 2026-04-30 |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table states "None" | — |

---

## Oversight Level

**Level:** Low (from parent epic rrc-epic-2)
**Sign-off required:** No — proceed directly to coding agent assignment.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Create /reference-corpus-update companion skill
Story artefact: artefacts/2026-04-30-reverse-engineer-reference-corpus/stories/rrc.4-reference-corpus-update-skill.md
Test plan: artefacts/2026-04-30-reverse-engineer-reference-corpus/test-plans/rrc.4-test-plan.md
Test script: tests/check-rrc4-corpus-update-skill.js
Verification script: artefacts/2026-04-30-reverse-engineer-reference-corpus/verification-scripts/rrc.4-verification.md

Goal:
Make all 14 tests in tests/check-rrc4-corpus-update-skill.js pass. Do not add
scope, behaviour, or structure beyond what the tests and ACs specify.

What to implement:
Create a new file: .github/skills/reference-corpus-update/SKILL.md

The file must:
1. Contain all 4 required contract markers: name:, description:, triggers:, and an
   outputs section (## Output or outputs:).
2. Skill name: reference-corpus-update (kebab-case, matching directory name).
3. Description: describe the skill purpose accurately — update reference corpus after
   a feature delivery touching a legacy-adjacent system, produce scoped DEEPEN scope.
4. Triggers: include phrases matching "update corpus", "corpus refresh", and
   "did this feature break legacy rules" (or close approximations).
5. Corpus-state.md input: the skill asks for the path to corpus-state.md and the
   list of changed source files (not the full report).
6. DEEPEN scope output: a list of rule IDs (format L<layer>-<seq> per DEC-001) from
   corpus-state.md whose source-file matches a changed file, with change type noted.
7. No-match message: if no rules match any changed file, report
   "No corpus rules affected by these changes — corpus remains current".
8. lastRunAt instruction: after completing, instruct the operator to update
   corpus-state.md with lastRunAt=today and a brief changeNote.
9. Total file size: ≤ 100 lines.

Constraints:
- Create ONLY: .github/skills/reference-corpus-update/SKILL.md
- Do NOT modify: .github/skills/reverse-engineer/SKILL.md, any other SKILL.md,
  any artefacts/ files, pipeline-state.json, package.json, CHANGELOG.md, test files
- No code, no scripts, no new npm dependencies
- Per platform change policy: this change must go through a draft PR (see Architecture
  Constraints in story). Do NOT commit directly to master.
- After your implementation: check-skill-contracts.js must report 41 skills (up from 40)
  with all contract markers intact. This is verified on the implementation branch.
- Rule-id format: L<layer>-<seq> (e.g. L1-001) per DEC-001
  (decisions: artefacts/2026-04-30-reverse-engineer-reference-corpus/decisions.md)
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not violate Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

NFR notes:
- NFR-rrc-size-rcu: SKILL.md ≤ 100 lines total — tested by T4.14
- NFR-rrc-readability-rcu: DEEPEN scope output must be human-readable plain markdown list
- NFR-rrc-security: No executable code; 41-skill governance check must pass on branch

Review findings to be aware of (informational only — do not act on LOW findings):
- 4-M1 (MEDIUM): rule-id format cross-story consistency — RESOLVED by DEC-001 (encoded above)
- 4-L1 (LOW): AC6 verification method — implemented via trigger-phrase assertions in T4.14
- 4-L2 (LOW): 41-skill count is branch-scoped, not master baseline — noted above

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required
**DoR run date:** 2026-04-30
