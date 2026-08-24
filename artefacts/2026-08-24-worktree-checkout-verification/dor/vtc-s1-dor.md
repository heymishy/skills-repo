## Definition of Ready: Add an explicit checkout-verification rule to close the recurring wrong-checkout edit gap

**Story reference:** artefacts/2026-08-24-worktree-checkout-verification/stories/vtc-s1-verify-target-checkout-before-edit.md
**Test plan reference:** artefacts/2026-08-24-worktree-checkout-verification/test-plans/vtc-s1-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-24

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "agent editing files in this repo when an inner-loop worktree exists for the active story" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC4 each covered, 5 tests total including non-regression |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 explicit exclusions, each with a stated reason |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track feature, no benefit-metric artefact — directly closes a named `workspace/capture-log.md` finding instead |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — `/review` explicitly skipped |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated; explicitly notes `check-skill-contracts.js` does not cover `CLAUDE.md` and why that's correct, not a gap |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No UI/layout-dependent ACs |
| H-NFR | NFR profile exists (or story has explicit NFR section) | ✅ | Story's own NFR section populated, matches `evcg-s1`/`psms-s1`/`s3fw-s1` precedent |
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
| W4 | Verification script reviewed by a domain expert | ✅ N/A | No manual AC verification script exists — every AC is closed entirely by the automated content-assertion test suite, matching established precedent | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ N/A | — | — |

---

## Oversight level

**Medium** — matches this session's established precedent for solo-operator short-track stories. Operator confirmed awareness and explicit priority ranking before assignment ("3, 4 then 5").

---

## Standards injection

**Domain tags:** `pipeline-infrastructure`
**Matched standards files:** None — no `pipeline-infrastructure` entry exists in `.github/standards/index.yml`. Expected, matching `evcg-s1`/`psms-s1`/`s3fw-s1`'s own precedent.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Add an explicit checkout-verification rule to close the recurring wrong-checkout edit gap
  — artefacts/2026-08-24-worktree-checkout-verification/stories/vtc-s1-verify-target-checkout-before-edit.md
Test plan: artefacts/2026-08-24-worktree-checkout-verification/test-plans/vtc-s1-test-plan.md

Goal:
Make every test in tests/check-vtc-s1-worktree-checkout-verification.js pass.
Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- This is a CLAUDE.md instruction-text change (During a session section) --
  no application code, no SKILL.md changes, no check-skill-contracts.js entry
  (that script is explicitly scoped to SKILL.md files only)
- Do NOT touch the existing "Verify coding-agent dispatch completion
  independently" rule immediately preceding the new one -- insert after it,
  do not rewrite it
- Do NOT modify workspace/capture-log.md's existing entries -- historical
  record, read-only for this story
- Do NOT build any automated wrong-checkout detection tooling -- explicitly
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
