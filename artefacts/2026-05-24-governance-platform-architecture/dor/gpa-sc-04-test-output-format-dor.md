# Definition of Ready Checklist

## Definition of Ready: Write test output format standards document (SC-04)

**Story reference:** `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-04-test-output-format.md`
**Test plan reference:** `artefacts/2026-05-24-governance-platform-architecture/test-plans/gpa-sc-04-test-output-format-test-plan.md`
**Verification script:** `artefacts/2026-05-24-governance-platform-architecture/verification-scripts/gpa-sc-04-test-output-format-verification.md`
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-25

---

## Contract Proposal

**What will be built:**
A new file `standards/governance/test-output-format.md` documenting the `[suite-name] Results: N passed, N failed` output convention. The document will contain: (a) the required output format, (b) the exact regex used by assurance-gate.yml to parse it (quoted verbatim from source), (c) at least one labelled conforming example and one labelled non-conforming example with explanation, (d) a clear statement that non-conforming output is silently skipped by the gate, and (e) a reference to the trw.1 prefix fix as historical context.

**What will NOT be built:**
- No changes to assurance-gate.yml parsing logic or the regex itself
- No new or modified governance check scripts
- No changes to the output format of any existing check script
- No changes to CONTRIBUTING.md (AC2 is a regression check only)

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — four required elements present in document | T1 (file exists), T2 (regex quoted verbatim), T3 (silent-skip statement), T4 (labelled conforming + non-conforming examples) | unit |
| AC2 — npm test regression passes | T5 (npm test exit code 0) | integration |
| AC3 — trw.1 reference with explanation | T6 (grep for trw reference + explanation content) | unit |
| AC4 — labelled examples with bracket format | T4 (already covers conforming), T7 (bracket format in conforming example) | unit |

**Assumptions:**
The canonical regex lives in `.github/scripts/run-assurance-gate.js` and will be read at the time of document authorship to ensure verbatim accuracy. The NFR-T1 test will read the regex from the source file at test runtime to catch future drift.

**Estimated touch points:**
Files: `standards/governance/test-output-format.md` (new)
Services: none. APIs: none.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs. Documentation-only story. AC4 was rewritten from its original (untestable) form to its current testable form (labelled examples), confirmed in the test plan. No enforcement module changes. Contract matches Out of Scope section exactly.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a platform operator" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs, all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1→T1-T4, AC2→T5, AC3→T6, AC4→T4+T7 |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 items explicitly listed |
| H5 | Benefit linkage field references a named metric | ✅ | M1 and M3 referenced |
| H6 | Complexity is rated | ✅ | Rating: 1, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | reviewStatus: passed; MEDIUM finding resolved by AC4 rewrite |
| H8 | Test plan has no uncovered ACs | ✅ | All 4 ACs covered |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-011 referenced; documentation-only; no guardrail violation |
| H-E2E | No CSS-layout-dependent ACs without RISK-ACCEPT | ✅ | No CSS-layout ACs — not applicable |
| H-NFR | NFR profile exists; story has NFR section | ✅ | nfr-profile.md exists; story has Accuracy and No new npm deps NFRs |
| H-NFR2 | Compliance NFRs with regulatory clauses have human sign-off | ✅ | No regulatory compliance clause for SC-04 — not applicable |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | Data classification: Internal |
| H-NFR-profile | NFR profile present (story has non-None NFRs) | ✅ | `artefacts/2026-05-24-governance-platform-architecture/nfr-profile.md` exists |
| H-GOV | Approved By section in discovery artefact has ≥1 non-blank named entry | ✅ | `Hamis — 2026-05-24` present in discovery.md |
| H-ADAPTER | Injectable adapter wiring check | ✅ | SC-04 is documentation-only; no injectable adapters introduced |

**Hard blocks: 17/17 passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | Original MEDIUM finding (AC4 untestable) was fully resolved by rewriting AC4 — not just acknowledged. Test plan reflects the revised AC4. No residual risk. | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Solo developer context: agent-authored script aligned to test plan. All verification steps are mechanical command runs. Risk low. | Hamis — 2026-05-25 |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | No uncertain items — not applicable | — |

---

## Oversight Level

**Oversight:** Low
**Rationale:** SC-04 is a documentation-only story per parent epic gpa-epic-01-governance-foundation. Low oversight confirmed in the epic artefact.
**Sign-off required:** No (Low oversight)
**Signed off by:** Not required

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Write test output format standards document — artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-04-test-output-format.md
Test plan: artefacts/2026-05-24-governance-platform-architecture/test-plans/gpa-sc-04-test-output-format-test-plan.md
Verification script: artefacts/2026-05-24-governance-platform-architecture/verification-scripts/gpa-sc-04-test-output-format-verification.md

Goal:
Make every test in tests/check-gpa-sc04-test-output-format.js pass. Do not add scope,
behaviour, or structure beyond what the tests and ACs specify.

What to build:
1. Create standards/governance/test-output-format.md containing:
   (a) The required output prefix format: [suite-name] Results: N passed, N failed
   (b) The exact regex from .github/scripts/run-assurance-gate.js (read it from source
       at implementation time — quote it verbatim). The NFR-T1 test reads this at runtime
       to verify verbatim accuracy.
   (c) A clear statement that non-conforming output is SILENTLY SKIPPED by the gate
       (this is the most important consequence for a contributor to know).
   (d) At least one labelled conforming example showing the full bracket format, and at
       least one labelled non-conforming example with explanation of why it fails.
   (e) A reference to the trw.1 prefix fix: what the incorrect prefix was, why it caused
       silent skip, what fix was applied.
2. Create tests/check-gpa-sc04-test-output-format.js (test file, RED first then GREEN).
   IMPORTANT: the NFR-T1 test must read the regex dynamically from
   .github/scripts/run-assurance-gate.js at test runtime to verify the document quotes
   it verbatim.

Files to create:
- standards/governance/test-output-format.md (new)
- tests/check-gpa-sc04-test-output-format.js (new test file)

Constraints:
- Do NOT change assurance-gate.yml or run-assurance-gate.js — read only
- Do NOT change the output format of any existing check script
- No new npm dependencies
- Architecture standards: read .github/architecture-guardrails.md before implementing
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter ambiguity not covered by the ACs or tests: add a PR comment

Test output format (mandatory):
  [gpa-sc04] Results: N passed, 0 failed

Oversight level: Low
```
