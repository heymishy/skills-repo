## Definition of Ready: Close the false-wait gap in subagent-execution's Step 3 final-review dispatch

**Story reference:** artefacts/2026-08-24-step3-final-review-false-wait/stories/s3fw-s1-add-missing-background-warning.md
**Test plan reference:** artefacts/2026-08-24-step3-final-review-false-wait/test-plans/s3fw-s1-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-24

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "coding agent dispatching the Step 3 final-review subagent in /subagent-execution" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC4 each covered, 6 tests total including integration + non-regression |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 explicit exclusions, each with a stated reason |
| H5 | Benefit linkage field references a named metric | ✅ | Meta Metric 2 (false-wait incident count), target 0/story, named directly |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — `/review` explicitly skipped |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated; explicitly scopes out touching Steps 2a/2b/2c |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No UI/layout-dependent ACs |
| H-NFR | NFR profile exists (or story has explicit NFR section) | ✅ | Story's own NFR section populated, matches `evcg-s1`/`psms-s1` precedent |
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
| W4 | Verification script reviewed by a domain expert | ✅ N/A | No manual AC verification script exists — every AC is closed entirely by the automated content-assertion test suite, matching `evcg-s1`/`psms-s1`'s precedent | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ N/A | — | — |

---

## Oversight level

**Medium** — matches this session's established precedent for solo-operator short-track stories. Operator confirmed awareness and explicit priority ranking before assignment ("3, 4 then 5").

---

## Standards injection

**Domain tags:** `pipeline-infrastructure`
**Matched standards files:** None — no `pipeline-infrastructure` entry exists in `.github/standards/index.yml`. Expected, matching `evcg-s1`/`psms-s1`'s own precedent.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Close the false-wait gap in subagent-execution's Step 3 final-review dispatch
  — artefacts/2026-08-24-step3-final-review-false-wait/stories/s3fw-s1-add-missing-background-warning.md
Test plan: artefacts/2026-08-24-step3-final-review-false-wait/test-plans/s3fw-s1-test-plan.md

Goal:
Make every test in tests/check-s3fw-s1-final-review-background-warning.js pass.
Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- This is a SKILL.md instruction-text change to skills/subagent-execution/SKILL.md
  (Step 3's dispatch context list only), plus a matching entry update in
  .github/scripts/check-skill-contracts.js — no application code, no CI
  workflow changes
- Do NOT touch Steps 2a/2b/2c's own already-correct warning text — cross-
  reference it, matching the exact pattern 2b/2c already use to reference 2a
- Do NOT audit or modify any other skill's dispatch instructions — explicitly
  out of scope, see the story's own Out of Scope section
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech-lead awareness (no separate tech lead in this solo-operator repo — operator confirmed awareness directly via explicit priority ranking "3, 4 then 5", 2026-08-24)
**Signed off by:** Hamish King (Founder/Operator), 2026-08-24
