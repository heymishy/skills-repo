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

| Check | Status | Notes |
|-------|--------|-------|
| Story has a user story in As/Want/So format | ✅ / ❌ | |
| All ACs are in Given/When/Then format | ✅ / ❌ | |
| Every AC is independently testable | ✅ / ❌ | |
| Out of scope is declared (not "N/A") | ✅ / ❌ | |
| Benefit linkage is written and references a metric | ✅ / ❌ | |
| Test plan exists and covers all ACs | ✅ / ❌ | |
| No AC coverage gaps in test plan | ✅ / ❌ | |
| No upstream story dependency is incomplete | ✅ / ❌ | |
| Discovery artefact is approved | ✅ / ❌ | |
| Benefit-metric artefact is active | ✅ / ❌ | |

---

## Warnings
<!-- WARN items allow the story to proceed, but risk must be acknowledged. -->

| Check | Status | Risk if proceeding | Acknowledged by |
|-------|--------|--------------------|-----------------|
| NFRs are identified (or explicitly "None") | ✅ / ⚠️ | Missing NFRs may cause rework post-implementation | |
| Complexity is rated | ✅ / ⚠️ | Unrated complexity makes agent session scoping difficult | |
| Human oversight level is set on parent epic | ✅ / ⚠️ | Coding agent may proceed further than intended | |
| Scope stability is declared | ✅ / ⚠️ | Unstable scope may invalidate test plan mid-implementation | |
| Test plan has no unmitigated gaps | ✅ / ⚠️ | Gaps increase risk of defects reaching PR review | |

---

## Coding Agent Instructions

<!--
  Populated only if all hard blocks pass.
  Specific instructions for the coding agent for this story.
  Overrides or supplements the copilot-instructions.md defaults.
-->

**Proceed:** [Yes / No — if No, list which hard blocks failed]

**Agent instructions:**
- Implement to make the tests in [test plan link] pass — do not add scope
- Human oversight level: [Low / Medium / High — from parent epic]
- [Any story-specific constraints — e.g. "do not modify the auth layer", "use existing CSV util"]
- Open draft PR when tests pass — do not merge

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
