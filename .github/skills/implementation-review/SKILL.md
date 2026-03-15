---
name: implementation-review
description: >
  Reviews implementation work in two stages: spec compliance (does the code
  match the story ACs?) then code quality (is it well-built?). Critical issues
  block progress. Important issues should be fixed before opening a PR.
  Use between task batches, before /verify-completion, or when something feels
  off during implementation.
triggers:
  - "review this implementation"
  - "code review"
  - "review before the PR"
  - "check the implementation"
  - "implementation review"
---

# Implementation Review Skill

## When to use

- After completing a group of related tasks
- Before opening a PR
- When something feels off but you are not sure what
- Before handing to /verify-completion

---

## Step 1 — Prepare diff context

```bash
# Use base branch from context.yml (source_control.base_branch), default: main
BASE_SHA=$(git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null)
HEAD_SHA=$(git rev-parse HEAD)
git diff $BASE_SHA $HEAD_SHA
```

Also gather:
- ACs from the story artefact
- Test plan

---

## Stage 1 — Spec compliance

Review the diff against each AC:

| Check | Pass condition |
|-------|----------------|
| Every AC has corresponding implementation | Code behaviour matches the AC exactly |
| No extra behaviour not in any AC | No scope beyond what ACs require |
| Every test in the test plan is present | No tests deleted or skipped |
| Tests test real behaviour | Tests would catch a regression, not just mock calls |

Report using the Stage 1 — Spec compliance section from `templates/implementation-review.md`.

**If ❌ or ⚠️ items exist:** fix these before proceeding to code quality.

---

## Stage 2 — Code quality

Review the implementation for quality. Assign severity:

| Finding | Severity |
|---------|---------|
| Code will crash or throw in normal use | Critical |
| Security concern (unvalidated input at boundary, hardcoded secret, injection risk) | Critical |
| Tests do not verify the behaviour they claim to | Critical |
| Logic error causing incorrect output | Important |
| Naming that obscures intent | Important |
| Duplication that makes future changes risky | Important |
| Magic numbers or strings without named constants | Minor |
| Minor style inconsistency with the codebase | Minor |

Report using the Stage 2 — Code quality section from `templates/implementation-review.md`.

**Critical** → must fix before proceeding
**Important** → must fix before opening a PR
**Minor** → note and proceed

---

## Completion

When all Critical fixed and Important fixed (or acknowledged):

> ✅ **Implementation review passed**
>
> Spec compliance: [N] ACs confirmed
> Code quality: [summary of findings]
> Status: ready for /verify-completion
>
> Next: run /verify-completion.

---

## Integration

**Use after:** each task batch in /tdd, or after /subagent-execution final review
**Precedes:** /verify-completion
**Note:** /subagent-execution dispatches spec compliance and code quality as separate reviewer subagents internally — use this skill for manual or non-subagent code review

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` in the **project repository** after producing the review report:

- Set story `stage: "implementation-review"`, `updatedAt: [now]`
- If critical issues found: set `health: "red"`, `blocker: "[summary of critical issue]"`
- If important issues found (no criticals): set `health: "amber"`
- If clean: set `health: "green"`, clear `blocker`

**Human review note:** If a human performs a code review outside a skill session and resolves findings, update `health` and clear `blocker` manually in `pipeline-state.json`, or run `/workflow` to reconcile.
