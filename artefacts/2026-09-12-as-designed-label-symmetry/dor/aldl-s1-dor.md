# Definition of Ready Checklist

## Definition of Ready: Symmetric "As designed:" / "As-built:" diagram title prefixes

**Story reference:** artefacts/2026-09-12-as-designed-label-symmetry/stories/aldl-s1-symmetric-as-designed-as-built-labels.md
**Test plan reference:** artefacts/2026-09-12-as-designed-label-symmetry/test-plans/aldl-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-12

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "an operator comparing an as-designed diagram against its as-built counterpart" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 5/5 tests map to the 4 ACs |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | Closes `csd-s2`'s own DoD-recorded AC3 deviation and its explicit recommended fix |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — no `/review` run |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — confirmed via code review that the runtime renderer is title-agnostic, so this is purely an instruction-text change |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | Instruction-text-only change, no rendering path affected |
| H-NFR | NFR profile or explicit "None" field | ✅ | All explicitly N/A — instruction-text-only |
| H-NFR2 | Compliance NFR with regulatory clause has sign-off | ✅ N/A | No compliance/regulatory NFR named |
| H-NFR3 | Data classification field not blank | ✅ N/A | No feature-level NFR profile — short-track |
| H-NFR-profile | Feature NFR profile exists if story NFRs are non-blank | ✅ N/A | Short-track |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No adapter involved |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Short-track, no review | — |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Fully covered by automated static-content tests, same pattern already established by `csd-s3`'s own test suite | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | No gaps | — |

---

## Standards injection

**Domain tags:** `[skills-pipeline]`
**Matched standards files:** Platform Change Policy (CLAUDE.md) — `skills/design/SKILL.md` and `skills/definition/SKILL.md` changes require a PR, no direct master commit.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Symmetric "As designed:" / "As-built:" diagram title prefixes — artefacts/2026-09-12-as-designed-label-symmetry/stories/aldl-s1-symmetric-as-designed-as-built-labels.md
Test plan: artefacts/2026-09-12-as-designed-label-symmetry/test-plans/aldl-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- ONLY touch skills/design/SKILL.md and skills/definition/SKILL.md -- instruction-text edits only.
- Do NOT touch src/modules/migration-schema-parser.js, service-call-detector.js, call-graph-extractor.js (as-built side, already correct).
- Do NOT touch src/web-ui/routes/skills.js (runtime renderer, already title-agnostic).
- Use the exact prefix "As designed: " (matching the DoD's own recommended wording) followed by the existing sentence-case noun phrase (e.g. "System architecture", "Data model", "Program design").
- Update both the field-doc instruction text AND each section's worked example so the example doesn't contradict the instruction.
- Re-run tests/check-csd-s3-design-definition-diagram-instructions.js and tests/check-csd-s4-data-model-diagram-instruction.js unmodified -- both must still pass (no existing test hardcodes the pre-fix title string, confirmed at DoR time).
- Open a draft PR when tests pass -- do not mark ready for review.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — small, well-scoped instruction-text change with the exact fix already specified by the originating DoD, operator explicitly requested this backlog item be worked)
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-12

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
