---
name: definition-of-ready
description: >
  Final gate check before a story is handed to the coding agent. Runs hard blocks
  (H1-H8) and warnings (W1-W5), determines oversight level, and produces a coding
  agent instructions block when all hard blocks pass. Blocks are unambiguous — all
  must pass, no exceptions. Warnings require explicit acknowledgement. Use when
  test plan and review are complete and someone says "is this story ready",
  "definition of ready", "ready to code", or moves past /test-plan.
triggers:
  - "is this story ready"
  - "definition of ready"
  - "ready to code"
  - "DoR"
  - "can we start coding"
  - "assign to coding agent"
---

# Definition of Ready Skill

## Entry condition check

Before asking anything, verify:

1. Story artefact exists at `.github/artefacts/[feature]/stories/[story-slug].md`
2. Review report exists showing PASS (no unresolved HIGH findings)
3. Test plan exists at `.github/artefacts/[feature]/test-plans/[story-slug]-test-plan.md`
4. AC verification script exists at `.github/artefacts/[feature]/verification-scripts/[story-slug]-verification.md`

If not met:

> ❌ **Entry condition not met**
> Missing: [specific item]
>
> Run /workflow to see the current pipeline state.

---

## Step 1 — Confirm the story

State what was found:

> **Story loaded:** [story title]
> **Review:** PASS — Run [N], [date]
> **Test plan:** [n] tests covering [n] ACs
> **Verification script:** [n] scenarios
>
> Running definition-of-ready check on this story.
> Reply: go — or name a different story

---

## Hard blocks — H1 to H8

All must pass. No exceptions. Run each check and record PASS or FAIL.

| # | Check | Source |
|---|-------|--------|
| H1 | User story is in As / Want / So format with a named persona | Story |
| H2 | At least 3 ACs in Given / When / Then format | Story |
| H3 | Every AC has at least one test in the test plan | Test plan |
| H4 | Out-of-scope section is populated — not blank or N/A | Story |
| H5 | Benefit linkage field references a named metric | Story |
| H6 | Complexity is rated | Story |
| H7 | No unresolved HIGH findings from the review report | Review |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | Test plan |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | Story + Architecture guardrails |

**If any hard block fails — stop immediately:**

> ❌ **BLOCKED — [n] hard block(s) failed**
>
> [For each failed block:]
> H[n] [Check name]: [specific issue]
> Fix: [exactly what needs to happen]
>
> Resolve these and re-run /definition-of-ready.
> Reply: done — and I'll re-run the check

---

## Warnings — W1 to W5

Warnings do not block. Each requires explicit acknowledgement to proceed.

| # | Check | Source |
|---|-------|--------|
| W1 | NFRs populated or explicitly "None — confirmed" | Story |
| W2 | Scope stability declared | Story |
| W3 | MEDIUM review findings acknowledged in /decisions | Review + Decisions |
| W4 | Verification script reviewed by a domain expert | Verification script |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | Test plan |

If any warnings apply, surface them one at a time:

> ⚠️ **Warning W[n]: [Check name]**
> Risk if proceeding: [what could go wrong]
>
> How do you want to handle this?
> 1. Resolve it now before proceeding
> 2. Acknowledge the risk and proceed (I'll log it in /decisions)
>
> Reply: 1 or 2

---

## Oversight level

Check the parent epic for the oversight level:

**Low** — no sign-off required. Proceed directly to coding agent assignment.

**Medium** — engineering lead awareness required.
Share the DoR artefact before assigning. No formal sign-off needed.
Surface as:
> ⚠️ **Medium oversight** — share the DoR artefact with the engineering lead
> before assigning to the coding agent.
> Confirmed you'll do this?
> Reply: yes

**High** — human sign-off required before assigning.
Surface as:
> 🔴 **High oversight** — named sign-off required.
> Who is signing off on this story?
> Reply: [name and role]
>
> Record their sign-off in the DoR artefact (name + date) before assigning.

---

## Coding agent instructions block

Produced when all hard blocks pass. Written into the DoR artefact.

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

Save DoR artefact to `.github/artefacts/[feature]/dor/[story-slug]-dor.md`
conforming to `.github/templates/definition-of-ready-checklist.md`.

---

## Completion output

> ✅ **Definition of ready: PROCEED — [story title]**
>
> Hard blocks: [n]/[n] passed
> Warnings: [n] acknowledged / [n] resolved
> Oversight: [Low / Medium / High]
>
> [If Low:]
> Assign the story to the coding agent using the instructions block in the DoR artefact.
>
> **Inner coding loop order:**
> 1. /branch-setup — create isolated worktree, verify clean baseline
> 2. /implementation-plan — write bite-sized task plan from this DoR
> 3. /subagent-execution (recommended) or /tdd per task
> 4. /verify-completion — run full test suite + walk through AC verification script
> 5. /branch-complete — open draft PR (never mark ready for review)
>
> Support skills available throughout: /tdd, /systematic-debugging, /implementation-review
>
> [If Medium:]
> Share the DoR artefact with the engineering lead, then begin the inner coding loop above.
>
> [If High:]
> Obtain sign-off from [name], record it in the DoR artefact, then begin the inner coding loop above.
>
> After the PR is merged: run /definition-of-done.
> Reply: understood — or I have a question about the instructions block

---

## What this skill does NOT do

- Does not fix story or test plan artefacts — identifies issues and stops
- Does not assign to the coding agent — that is a human action
- Does not run the coding agent
- Does not approve the PR
- Does not override a BLOCK — all hard blocks must pass

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` in the **project repository** after producing the DoR output, for each story:

- If all hard blocks pass: set `stage: "definition-of-ready"`, `dorStatus: "signed-off"`, `health: "green"`, `updatedAt: [now]`
- If any hard block fails: set `dorStatus: "blocked"`, `health: "red"`, `blocker: "[first failing block description]"`, `updatedAt: [now]`

**Human sign-off note:** DoR requires explicit human sign-off. When a human confirms "Proceed", update `dorStatus: "signed-off"` in the state file if not already set, or run `/workflow` to reconcile.
