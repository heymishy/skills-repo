# Definition of Ready: Define `workspace/capture-log.md` schema and `/capture` operator command

**Story reference:** artefacts/2026-04-28-inflight-learning-capture/stories/ilc.1.md
**Test plan reference:** artefacts/2026-04-28-inflight-learning-capture/test-plans/ilc.1-test-plan.md
**Verification script:** artefacts/2026-04-28-inflight-learning-capture/verification-scripts/ilc.1-verification.md
**Contract:** artefacts/2026-04-28-inflight-learning-capture/dor/ilc.1-dor-contract.md
**Assessed by:** Copilot / operator
**Date:** 2026-04-28

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a **platform operator**" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs, all GWT |
| H3 | Every AC has at least one test in the test plan | ✅ | 12 tests covering all 6 ACs, 0 gaps |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 5 explicit exclusions listed |
| H5 | Benefit linkage field references a named metric | ✅ | M1 (Signal loss rate) and M2 (In-session agent capture rate) |
| H6 | Complexity is rated | ✅ | Rating: 1 — Well understood, clear path |
| H7 | No unresolved HIGH findings from the review report | ✅ | 0 HIGH — review run 1 PASS |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None upstream — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-011 referenced; no pipeline-state.json schema changes; no new npm deps |
| H-E2E | CSS-layout-dependent AC check | ✅ | No CSS-layout-dependent ACs — not applicable |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-04-28-inflight-learning-capture/nfr-profile.md confirmed |
| H-NFR2 | Compliance NFRs with regulatory clauses have human sign-off | ✅ | No compliance frameworks in scope — not applicable |
| H-NFR3 | Data classification field not blank | ✅ | "Public" — specified in NFR profile |
| H-NFR-profile | Story NFRs populated and NFR profile present | ✅ | NFRs declared; profile confirmed |

**Result: 13/13 hard blocks passed ✅**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ Stable | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | 1 MEDIUM (gitignore AC gap) resolved by AC6 — no unresolved MEDIUMs | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Edge cases may be missed; agent verifies against slightly wrong criteria | Operator, 2026-04-28 |
| W5 | No UNCERTAIN gaps in test plan | ✅ | — | — |

**Standards injection:** No domain tags on story — standards injection not applicable.

---

## Oversight

**Level: Low** — instruction-text-only story, Complexity 1, no regulated data. No sign-off required beyond this DoR.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Define workspace/capture-log.md schema and /capture operator command
Story artefact: artefacts/2026-04-28-inflight-learning-capture/stories/ilc.1.md
Test plan: artefacts/2026-04-28-inflight-learning-capture/test-plans/ilc.1-test-plan.md
Verification script: artefacts/2026-04-28-inflight-learning-capture/verification-scripts/ilc.1-verification.md
Contract: artefacts/2026-04-28-inflight-learning-capture/dor/ilc.1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or structure
beyond what the tests and ACs specify.

What to build:
1. Add a /capture command instruction block to copilot-instructions.md defining:
   - The command invocation: /capture [signal text]
   - File target: workspace/capture-log.md (created if absent; appended if exists)
   - The 5-field schema: date (ISO 8601), session-phase, signal-type, signal-text, source
   - The 6 valid signal-type values: decision / learning / assumption-validated /
     assumption-invalidated / pattern / gap
   - The blank-entry guard: if invoked without signal text, prompt the operator
     before writing — do not write a blank entry
   - The append-only rule: never truncate or overwrite the file
   - The new-session rule: on new-session invocation, append after all existing entries
   - source value for operator-invoked entries: operator-manual
2. Add workspace/capture-log.md to .gitignore (one line addition).

Constraints:
- Touch only: copilot-instructions.md, .gitignore
- Do NOT touch: any SKILL.md file (that is ilc.2), workspace/state.json, package.json,
  pipeline-state.json, or any file under artefacts/
- No new npm dependencies
- No new scripts or tooling — instruction text only
- Architecture standards: read .github/architecture-guardrails.md before implementing.
  ADR-011 compliance is satisfied by this story artefact existing before you merge.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment
  describing the specific blocker and stop — do not improvise a workaround

Implementation order: ilc.1 must be merged before ilc.2 or ilc.3 begin — this story
defines the schema and file convention that ilc.2 and ilc.3 depend on.
```
