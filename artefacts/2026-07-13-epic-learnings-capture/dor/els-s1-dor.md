## Definition of Ready: Capture delivery-pattern learnings from the beta-readiness-infra and team-identity-roles epics

**Story reference:** artefacts/2026-07-13-epic-learnings-capture/stories/els-s1-capture-epic-delivery-learnings.md
**Test plan reference:** artefacts/2026-07-13-epic-learnings-capture/test-plans/els-s1-capture-epic-delivery-learnings-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-07-13

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ N/A (documented) | See dor-contract |
| H6 | Complexity is rated | ✅ | |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | No /review run, single-story short-track |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | |

Full detail (including H-NFR, H-GOV, H-ADAPTER, H-INF, H-MIG): see `els-s1-dor-contract.md`.

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | | |
| W2 | Scope stability is declared | ✅ | | |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | | |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | Acknowledged — proceed (see dor-contract) |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ N/A | | |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Capture delivery-pattern learnings from the beta-readiness-infra and team-identity-roles epics — artefacts/2026-07-13-epic-learnings-capture/stories/els-s1-capture-epic-delivery-learnings.md
Test plan: artefacts/2026-07-13-epic-learnings-capture/test-plans/els-s1-capture-epic-delivery-learnings-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- CommonJS only, no Express, no TypeScript.
- Only touch CLAUDE.md, .github/architecture-guardrails.md, a new
  workspace/proposals/ file, and one new test file. No src/ changes.
- Do NOT edit skills/discovery/SKILL.md or skills/definition/SKILL.md
  directly for AC5 -- write a proposal file only, per /improve's own
  rule that SKILL.md files require PR-based human review, not direct
  agent edits.
- The proposal file must include all 8 required front-matter fields:
  evidence, proposed_diff, confidence, anti_overfitting_gate,
  status: pending_review, created_at, skill_target, source: improve.
- Match the existing Anti-Patterns table's exact 3-column format
  (Anti-pattern | Reason | Approved alternative) when adding the new row.
- This story is delivered via a short-lived branch + PR, not a direct
  commit to master, per the Platform Change Policy governing CLAUDE.md
  and architecture-guardrails.md changes.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Low — content-only change to governed instruction
files, no application code.
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required — operator directly requested this capture in-session
