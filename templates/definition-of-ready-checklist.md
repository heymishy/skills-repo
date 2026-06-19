# Definition of Ready Checklist

<!--
  USAGE: Final gate before a story is assigned to the coding agent.
  Produced by the /definition-of-ready skill.
  A story that fails any HARD BLOCK item does not proceed.
  A story that fails a WARNING item proceeds with the risk noted.

  To evolve this checklist: update this file, open a PR, 
  tag engineering lead + QA lead + BA lead.
-->

## Definition of Ready: [Story Title]

**Story reference:** [Link]
**Test plan reference:** [Link]
**Assessed by:** [Copilot / human]
**Date:** [YYYY-MM-DD]

---

## Hard Blocks
<!-- Any FAIL here stops the story. Do not assign to coding agent. -->

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ / ❌ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ / ❌ | |
| H3 | Every AC has at least one test in the test plan | ✅ / ❌ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ / ❌ | |
| H5 | Benefit linkage field references a named metric | ✅ / ❌ | |
| H6 | Complexity is rated | ✅ / ❌ | |
| H7 | No unresolved HIGH findings from the review report | ✅ / ❌ | |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ / ❌ | |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ / ❌ | |
| H-E2E | If any AC is typed `CSS-layout-dependent` AND no E2E tooling configured AND no `RISK-ACCEPT` recorded — block sign-off | ✅ / ❌ | |

---

## Warnings
<!-- WARN items allow the story to proceed, but risk must be acknowledged. -->

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly “None — confirmed”) | ✅ / ⚠️ | Missing NFRs may cause rework post-implementation | |
| W2 | Scope stability is declared | ✅ / ⚠️ | Unstable scope may invalidate test plan mid-implementation | |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ / ⚠️ | Unacknowledged medium findings increase review rework risk at PR | |
| W4 | Verification script reviewed by a domain expert | ✅ / ⚠️ | Unreviewed script may miss edge cases; agent may verify against wrong criteria | |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ / ⚠️ | Gaps increase risk of defects reaching PR review | |

---

## Coding Agent Instructions

<!--
  Populated only if all hard blocks pass.
  Specific instructions for the coding agent for this story.
  Overrides or supplements the copilot-instructions.md defaults.
-->

```
## Coding Agent Instructions

Proceed: Yes
Story: [story title] — [path to story artefact]
Test plan: [path to test plan artefact]

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- [Language, framework, and conventions from copilot-instructions.md]
- [Files, layers, or components explicitly out of scope for this story]
- Architecture standards: read `.github/architecture-guardrails.md` before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs. If the file does not exist,
  note this in a PR comment.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: [Low / Medium / High]
```

---

## Sign-off

<!--
  For High oversight stories: human sign-off required before assigning to agent.
  For Medium: engineering lead awareness required.
  For Low: no sign-off required — proceed directly.
-->

**Oversight level:** [Low / Medium / High]
**Sign-off required:** [Yes / No]
**Signed off by:** [Name / "Not required"]
