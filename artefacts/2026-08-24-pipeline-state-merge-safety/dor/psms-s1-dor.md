## Definition of Ready: Close the silent tasks[] data-loss gap in pipeline-state.json checkpoint writes

**Story reference:** artefacts/2026-08-24-pipeline-state-merge-safety/stories/psms-s1-explicit-local-first-merge.md
**Test plan reference:** artefacts/2026-08-24-pipeline-state-merge-safety/test-plans/psms-s1-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-24

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "coding agent writing a pipeline-state.json checkpoint during the inner coding loop" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC5 each covered, 9 tests total including integration + non-regression |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 explicit exclusions, each with a stated reason |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track feature, no benefit-metric artefact — matches `evcg-s1`/`rcfc-s1` precedent |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — `/review` explicitly skipped |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated; explicitly scopes out a shared-script refactor as a rejected alternative, with reasoning |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No UI/layout-dependent ACs |
| H-NFR | NFR profile exists (or story has explicit NFR section) | ✅ | Story's own NFR section populated, matches `evcg-s1`'s precedent for instruction-only changes |
| H-GOV | Governance approval | ✅ N/A | No discovery artefact exists for this short-track feature — operator directly reviewing in-session |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No new injectable adapter introduced |
| H-INF / H-MIG | Infra-plan / migration-review gates | ✅ N/A | Neither track flag set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified (or explicitly "None — confirmed") | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No review report exists (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | No manual AC verification script exists — every AC is closed entirely by the automated content-assertion test suite, matching `evcg-s1`'s precedent | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ N/A | — | — |

---

## Oversight level

**Medium** — matches this session's established precedent for solo-operator short-track stories. Operator confirmed awareness and explicit priority ranking before assignment ("of those 7 which are biggest impact to fix" → this item ranked #1 → "Yes please").

---

## Standards injection

**Domain tags:** `pipeline-infrastructure`
**Matched standards files:** None — no `pipeline-infrastructure` entry exists in `.github/standards/index.yml`. No standards text is injected; expected for a pipeline-infrastructure-only change with no application-code surface, matching `evcg-s1`'s own precedent.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Close the silent tasks[] data-loss gap in pipeline-state.json checkpoint writes
  — artefacts/2026-08-24-pipeline-state-merge-safety/stories/psms-s1-explicit-local-first-merge.md
Test plan: artefacts/2026-08-24-pipeline-state-merge-safety/test-plans/psms-s1-test-plan.md

Goal:
Make every test in tests/check-psms-s1-pipeline-state-merge-safety.js pass.
Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- This is a SKILL.md instruction-text change to 4 files (implementation-plan,
  subagent-execution, branch-complete, verify-completion), plus a matching
  entry update in .github/scripts/check-skill-contracts.js — no application
  code, no new dependencies, no CI workflow changes
- Do NOT touch subagent-execution/SKILL.md's already-correct "fetch at
  checkpoints, not per-task" scoping rule from the 2026-08-23 fix — only add
  the missing local-first-merge instruction on top of it
- Do NOT convert this into a shared, executable pipeline-state-merge helper
  script — explicitly out of scope, see the story's own Out of Scope section
- The 4 files' new instructions must consistently describe the same merge
  direction: local entry → onto fetched master's OTHER entries, never the
  reverse
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech-lead awareness (no separate tech lead in this solo-operator repo — operator confirmed awareness directly via explicit priority ranking and "Yes please", 2026-08-24)
**Signed off by:** Hamish King (Founder/Operator), 2026-08-24
