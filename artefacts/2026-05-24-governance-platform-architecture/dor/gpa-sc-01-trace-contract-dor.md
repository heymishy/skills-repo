# Definition of Ready Checklist

## Definition of Ready: Write trace contract standards document (SC-01)

**Story reference:** `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-01-trace-contract.md`
**Test plan reference:** `artefacts/2026-05-24-governance-platform-architecture/test-plans/gpa-sc-01-trace-contract-test-plan.md`
**Verification script:** `artefacts/2026-05-24-governance-platform-architecture/verification-scripts/gpa-sc-01-trace-contract-verification.md`
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-25

---

## Contract Proposal

**What will be built:**
A new file `standards/governance/trace-contract.md` documenting all 15 design principles P01-P15 identified in the architecture discovery. Each principle entry contains four fields: (a) the principle statement, (b) the enforcement module where it is implemented, (c) the field or observable behaviour it governs, and (d) a canonical source cross-reference (ADR number, copilot-instructions.md rule name, or code module path). Principle P02 will include the exact path traversal validation pattern (`path.resolve(inputPath).startsWith(repoRoot + path.sep)`) and its source obligation. A reference to `standards/governance/trace-contract.md` will be added to `CONTRIBUTING.md`.

**What will NOT be built:**
- No changes to any enforcement module (assurance-gate.yml, run-assurance-gate.js, governance-package.js, journey.js)
- No test plans or DoR artefacts for any story referenced in the document
- No principles beyond P01-P15 as defined in discovery
- No non-governance-path principles (viz rendering, CSS)

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — file contains all 15 principles with 4-field depth | T1 (file exists), T2 (grep P01-P15 heading count), T3 (spot-check 4-field depth P01/P02/P08) | unit |
| AC2 — CONTRIBUTING.md references trace-contract.md | T5 (grep for file path in CONTRIBUTING.md) | unit |
| AC3 — no test regression | T6 (npm test exit code 0) | integration |
| AC4 — P02 has exact validation pattern and source citation | T7 (pattern string + copilot-instructions.md source present in document) | unit |

**Assumptions:**
The `standards/governance/` directory will be created by the coding agent as needed. All module paths referenced in P01-P15 will be real files at commit time (verified by NFR-T1 in the test plan).

**Estimated touch points:**
Files: `standards/governance/trace-contract.md` (new), `CONTRIBUTING.md` (modified to add reference)
Services: none. APIs: none.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs. Documentation-only story; no enforcement module changes; contract matches the story's Out of Scope section exactly.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a story author (or future coding agent)" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs, all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1→T1-T4, AC2→T5, AC3→T6, AC4→T7 |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 items explicitly listed |
| H5 | Benefit linkage field references a named metric | ✅ | M1 — Architecture documentation coverage |
| H6 | Complexity is rated | ✅ | Rating: 1, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | reviewStatus: passed in pipeline-state.json |
| H8 | Test plan has no uncovered ACs | ✅ | All 4 ACs covered |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-011 referenced; documentation-only; no guardrail violation |
| H-E2E | No CSS-layout-dependent ACs without RISK-ACCEPT | ✅ | No CSS-layout ACs — not applicable |
| H-NFR | NFR profile exists; story has NFR section | ✅ | nfr-profile.md exists; story has Documentation quality, Accuracy, No new npm deps |
| H-NFR2 | Compliance NFRs with regulatory clauses have human sign-off | ✅ | No regulatory compliance clause for SC-01 — not applicable |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | Data classification: Internal |
| H-NFR-profile | NFR profile present (story has non-None NFRs) | ✅ | `artefacts/2026-05-24-governance-platform-architecture/nfr-profile.md` exists |
| H-GOV | Approved By section in discovery artefact has ≥1 non-blank named entry | ✅ | `Hamis — 2026-05-24` present in discovery.md |
| H-ADAPTER | Injectable adapter wiring check | ✅ | SC-01 is documentation-only; no injectable adapters introduced |

**Hard blocks: 17/17 passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | No MEDIUM findings for SC-01 — not applicable | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Solo developer context: agent-authored verification script aligned directly to test plan. Risk is low — all steps are mechanically verifiable by running the named commands. | Hamis — 2026-05-25 |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | No uncertain items — not applicable | — |

---

## Oversight Level

**Oversight:** Low
**Rationale:** SC-01 is a documentation-only story per parent epic gpa-epic-01-governance-foundation. No enforcement module changes, no shared state mutations, no CI configuration changes. Low oversight confirmed in the epic artefact.
**Sign-off required:** No (Low oversight)
**Signed off by:** Not required

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Write trace contract standards document — artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-01-trace-contract.md
Test plan: artefacts/2026-05-24-governance-platform-architecture/test-plans/gpa-sc-01-trace-contract-test-plan.md
Verification script: artefacts/2026-05-24-governance-platform-architecture/verification-scripts/gpa-sc-01-trace-contract-verification.md

Goal:
Make every test in tests/check-gpa-sc01-trace-contract.js pass. Do not add scope,
behaviour, or structure beyond what the tests and ACs specify.

What to build:
1. Create standards/governance/trace-contract.md with all 15 principles P01-P15.
   Each principle entry must have FOUR fields:
   (a) principle statement
   (b) the module in the enforcement path where it is implemented
   (c) the field or observable behaviour it governs
   (d) a cross-reference to the canonical source (copilot-instructions.md rule name,
       ADR number, or code module path)
   P02 MUST include the exact validation pattern:
     path.resolve(inputPath).startsWith(repoRoot + path.sep)
   and cite source: copilot-instructions.md "Path traversal guard for disk writes (ougl)"
2. Add a reference to standards/governance/trace-contract.md in CONTRIBUTING.md as the
   canonical first stop for governance principle questions.

Files to create/modify:
- standards/governance/trace-contract.md (new)
- CONTRIBUTING.md (add reference)
- tests/check-gpa-sc01-trace-contract.js (new — test file must be created RED first)

Constraints:
- Plain markdown only — no code blocks or tooling required to interpret the document
- All module path cross-references must resolve to real files at commit time
- No new npm dependencies
- No changes to any enforcement module (assurance-gate.yml, run-assurance-gate.js,
  governance-package.js, journey.js)
- Architecture standards: read .github/architecture-guardrails.md before implementing
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter ambiguity not covered by the ACs or tests: add a PR comment
  describing the ambiguity and do not mark ready for review

Test output format (mandatory):
  [gpa-sc01] Results: N passed, 0 failed

Oversight level: Low
```
