# Definition of Ready: Integrate `constraint-index.md` reading into `/discovery`

**Story reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/stories/rrc.3-discovery-integration.md`
**Test plan reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/test-plans/rrc.3-test-plan.md`
**Verification script:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/verification-scripts/rrc.3-verification.md`
**Review report:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/review/rrc.3-review-2.md`
**Assessed by:** Copilot
**Date:** 2026-04-30

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with a named persona | ✅ PASS | "As a platform maintainer" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS | 5 ACs, all GWT |
| H3 | Every AC has at least one test in the test plan | ✅ PASS | AC1 (T3.1–T3.3), AC2 (T3.4–T3.5), AC3 (T3.6–T3.7), AC4 (T3.8), AC5 (T3.9) |
| H4 | Out-of-scope section populated — not blank or N/A | ✅ PASS | 3 explicit exclusions listed |
| H5 | Benefit linkage references a named metric | ✅ PASS | MM1 — Discovery pre-population time saved |
| H6 | Complexity is rated | ✅ PASS | Rating 1, Scope stability: Stable |
| H7 | No unresolved HIGH findings | ✅ PASS | 3-H1 CLOSED in Run 2 (H-DEP gate added to story); 2 LOW findings carry forward |
| H8 | No uncovered ACs | ✅ PASS | All 5 ACs covered in test plan |
| H8-ext | Cross-story schema dependency | ✅ PASS | Upstream dependency is story/commit (not schema field) — H-DEP gate enforces it |
| H9 | Architecture constraints populated; no Category E HIGH findings | ✅ PASS | 4 constraints listed including conditional check requirement; no E-category findings |
| H-E2E | No CSS-layout-dependent ACs | ✅ PASS | File content assertions only |
| H-NFR | NFR declaration present | ✅ PASS | Story NFR block: size (~15–20 lines), Security: None |
| H-NFR2 | No compliance NFRs with regulatory clauses | ✅ PASS | No regulatory clauses |
| H-NFR3 | Data classification not blank | ✅ PASS | Security: None — Non-sensitive (nfr-profile.md) |
| H-NFR-profile | NFR profile exists | ✅ PASS | `artefacts/2026-04-30-reverse-engineer-reference-corpus/nfr-profile.md` exists |
| H-GOV | Discovery Approved By section has ≥1 named non-blank entry | ✅ PASS | "Hamish — Platform maintainer — 2026-04-30" |
| **H-DEP** | **Upstream dependency gate** | **❌ FAIL — BLOCKED** | **rrc.1 and rrc.2 SKILL.md additions must both be merged before rrc.3 is dispatched (DEC-002). Neither PR has been opened yet.** |

---

## H-DEP Gate — BLOCKED

**Gate:** rrc.1 and rrc.2 must both have merged PRs before rrc.3 can be dispatched to the coding agent.

**Reason (DEC-002):** `/discovery` must be instructed to read `discovery-seed.md` (Output 9, defined by rrc.1) and `constraint-index.md` (Output 10, defined by rrc.2). If either format is undefined in the `/reverse-engineer` SKILL.md when rrc.3 is implemented, the coding agent cannot implement the integration step correctly.

**Current status:** rrc.1 and rrc.2 are at DoR signed-off but PRs have not yet been opened. H-DEP cannot be cleared until both PRs merge.

**How to unblock:**
1. Dispatch and merge rrc.1 (Add Output 9 — discovery-seed.md to `/reverse-engineer`).
2. Dispatch and merge rrc.2 (Add Output 10 — constraint-index.md to `/reverse-engineer`).
3. Re-run this DoR checklist — remove the H-DEP FAIL row and proceed to Coding Agent Instructions.

---

## Warnings

| # | Check | Status | Risk | Acknowledged by |
|---|-------|--------|------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM / HIGH findings acknowledged | ✅ | 3-H1 CLOSED Run 2; no unresolved MEDIUM findings | — |
| W4 | Verification script reviewed by domain expert | ⚠️ RISK-ACCEPT | Scenario wording may miss edge case; low risk — SKILL.md-only change with automated test complement | Hamish — DEC-003, 2026-04-30 |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table states "None" | — |

---

## Coding Agent Instructions

**BLOCKED — do not dispatch.**

The H-DEP gate above must be cleared before issuing these instructions. Once both rrc.1 and rrc.2 PRs are merged, update this DoR to remove the H-DEP FAIL row and uncomment the instructions below, then re-issue.

```
## Coding Agent Instructions (PENDING — H-DEP not cleared)

Proceed: BLOCKED
Story: Integrate constraint-index.md reading into /discovery
Blocker: rrc.1 and rrc.2 PRs must be merged before this story can be dispatched (DEC-002).
Re-issue instructions once H-DEP gate is cleared.

Goal (for reference — do not implement yet):
Make all 9 tests in tests/check-rrc3-discovery-integration.js pass. Do not add
scope, behaviour, or structure beyond what the tests and ACs specify.

What to implement (once unblocked):
Add a reference corpus check step to .github/skills/discovery/SKILL.md only.
Specifically:
1. In Step 1 (Reference materials scan): add a conditional check —
   IF artefacts/[system-slug]/reference/discovery-seed.md exists:
   - Read it and pre-populate problem framing, known constraints, and personas
     in the draft discovery artefact.
2. If artefacts/[system-slug]/reference/constraint-index.md exists:
   - Populate the Constraints section of the discovery artefact with entries
     from constraint-index.md, prefixed with source note (constraint-index.md / extraction date).
   - Do NOT create a new "Known legacy constraints" section heading —
     use the existing Constraints section.
3. If system slug is not known at session start: ask the operator which system
   the feature will touch before attempting to locate reference corpus files.
4. If neither file exists: proceed with standard discovery flow — no error,
   no warning, no reference to a missing corpus.
5. If the operator overrides pre-populated constraints: accept the override and proceed.
6. check-skill-contracts.js must still pass (40 skills) after your change.
7. /discovery SKILL.md additions: ~15–20 lines maximum.

Constraints:
- SKILL.md-only change: touch only .github/skills/discovery/SKILL.md
- No code, no scripts, no new npm dependencies
- Do NOT modify: reverse-engineer/SKILL.md, any artefacts/ files,
  pipeline-state.json, package.json, CHANGELOG.md, test files
- The integration check must be conditional — /discovery must not fail
  when no reference corpus exists
- Open a draft PR when tests pass — do not mark ready for review

NFR notes:
- NFR-rrc-size-disc: /discovery SKILL.md additions ≤ 15–20 lines — tested by T3.9
- NFR-rrc-security: No executable code; governance check must still pass (40 skills)

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**DoR outcome:** BLOCKED — H-DEP gate not cleared (rrc.1 and rrc.2 not yet merged)
**dorStatus:** blocked
**DoR run date:** 2026-04-30
