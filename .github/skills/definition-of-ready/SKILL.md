---
name: definition-of-ready
description: >
  Pre-coding gate. Validates that a story has everything the coding agent needs before work begins.
  Runs hard-block checks (story format, AC coverage, test plan completeness, review pass) and
  soft-warning checks (NFRs, scope stability, oversight level). Produces a DoR artefact with
  a PASS or FAIL verdict. Use when someone says "is this ready", "definition of ready",
  "check if ready to code", "DoR", or moves past /test-plan. Requires story + passed review
  + test plan + verification script.
triggers:
  - "is this ready"
  - "definition of ready"
  - "check if ready to code"
  - "DoR"
  - "ready to assign"
  - "can we start coding"
---

# Definition of Ready Skill

## Entry condition check

Verify before proceeding:

1. Story artefact exists at `.github/artefacts/[feature]/stories/[story-slug].md`
2. Review report exists for this story showing PASS (no unresolved HIGH findings)
3. Test plan exists at `.github/artefacts/[feature]/test-plans/[story-slug]-test-plan.md`
4. AC verification script exists at `.github/artefacts/[feature]/verification-scripts/[story-slug]-verification.md`

If any condition is not met:

> [FAIL] **Entry condition not met**
> Definition of ready requires: story + passed review + test plan + verification script.
> Missing: [specific item]
> Run `/workflow` to see current pipeline state.

---

## Checklist -- hard blocks

Hard blocks must all pass before proceeding. No exceptions.

Run each check against the story and test plan artefacts. Record [PASS] or [FAIL] with a specific note.

| # | Check | Source |
|---|-------|--------|
| H1 | User story is in As / Want / So format with a named persona | Story |
| H2 | At least 3 ACs in Given / When / Then format | Story |
| H3 | Every AC has at least one test in the test plan | Test plan |
| H4 | Out-of-scope section is populated -- not blank or N/A | Story |
| H5 | Benefit linkage field references a named metric | Story |
| H6 | Complexity is rated | Story |
| H7 | No unresolved HIGH findings from the review report | Review report |
| H8 | Test plan has no uncovered ACs (or gaps are explicitly acknowledged) | Test plan |

If any hard block is [FAIL]:

> [FAIL] **BLOCK -- do not assign to coding agent**
> [n] hard block(s) failed:
> - H[n] [Check name]: [Specific issue] -- [What needs to happen to resolve it]
>
> Resolve these items and re-run `/definition-of-ready`.

---

## Checklist -- warnings

Warnings do not block but require explicit acknowledgement before proceeding.

| # | Check | Source |
|---|-------|--------|
| W1 | NFRs section is populated or explicitly states "None -- confirmed" | Story |
| W2 | Scope stability is declared | Story |
| W3 | Any MEDIUM findings from the review report are acknowledged in /decisions | Review + Decisions log |
| W4 | Verification script has been reviewed by a domain expert | Verification script |
| W5 | No [UNCERTAIN] items in the test plan gap table left unaddressed | Test plan |

If any warnings are [WARNING]:

> [WARNING] **[n] warning(s) -- acknowledge to proceed**
> - W[n] [Check name]: [Risk if proceeding without resolving]
>
> Acknowledge these risks to continue, or resolve them first.

---

## Oversight level

Check the parent epic for the human oversight level. This determines sign-off requirements.

**Low** -- no sign-off required. Proceed directly to coding agent assignment.

**Medium** -- engineering lead awareness required. Share the DoR artefact before assigning. No formal sign-off needed.

**High** -- human sign-off required. Record reviewer name and date in the sign-off field of the DoR artefact before assigning.

---

## Coding agent instructions block

When all hard blocks pass, produce this block in the DoR artefact. Be specific -- vague instructions produce scope drift.

```
## Coding Agent Instructions

Proceed: Yes
Story: [story title] -- [link to story artefact]
Test plan: [link to test plan artefact]

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- [Language, framework, and conventions from copilot-instructions.md]
- [Any files, layers, or components explicitly out of scope for this story]
- Open a draft PR when tests pass -- do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: [Low / Medium / High]
```

---

## DoR artefact

Save to `.github/artefacts/[feature]/dor/[story-slug]-dor.md`.
Conforms to `.github/templates/definition-of-ready-checklist.md`.

All checklist fields must be populated -- no blank rows.

---

## Completion statement

> "[PASS] Definition of ready complete for [story title].
>
> Outcome: PROCEED
> Hard blocks: [n]/[n] passed
> Warnings: [n] acknowledged / [n] resolved
> Oversight level: [Low / Medium / High]
>
> [If Low:] Assign the story to the coding agent using the instructions block in the DoR artefact.
> [If Medium:] Share the DoR artefact with the engineering lead, then assign to the coding agent.
> [If High:] Obtain sign-off, record in the DoR artefact, then assign to the coding agent.
>
> After the PR is merged, run `/definition-of-done`."

---

## What this skill does NOT do

- Does not fix story or test plan artefacts -- identifies what needs fixing and stops
- Does not assign the story to the coding agent -- that is a human action
- Does not run the coding agent
- Does not approve the PR -- that is a human review action
- Does not override a BLOCK outcome -- all hard blocks must pass

