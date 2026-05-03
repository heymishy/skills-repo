---
name: implementation-plan
description: >
  Produces a bite-sized, task-by-task implementation plan from a DoR artefact
  and test plan. Every task has exact file paths, complete code, TDD steps,
  run commands with expected output, and a commit message. Assumes the
  implementing agent has zero codebase context. Use after branch setup and
  before subagent-execution or task-by-task TDD. Run when someone says
  "write the implementation plan", "plan the tasks", "break this into tasks",
  or "task plan".
triggers:
  - "write the implementation plan"
  - "implementation plan"
  - "plan the tasks"
  - "break this into tasks"
  - "task plan"
---

# Implementation Plan Skill

## Entry condition

1. DoR artefact at `artefacts/[feature]/dor/[story-slug]-dor.md` with `Proceed: Yes`
2. Test plan at `artefacts/[feature]/test-plans/[story-slug]-test-plan.md`
3. Worktree exists — run /branch-setup first if not

If not met:

> ❌ Entry condition not met.
> Missing: [list what is missing]
> Run /workflow to see your current pipeline state.

---

## Step 1 — Load inputs

Read:

1. DoR coding agent instructions block (goal, constraints, oversight level)
2. Test plan — all ACs and their test cases
3. AC verification script
4. Architecture constraints from the story artefact

State what was loaded:

> **Loaded:** [story title]
> ACs: [N] | Tests: [N] | Arch constraints: [summary or "None specified"]
>
> Building implementation plan.

---

## Step 1.5 — Apply context policy overlays

Before planning tasks, read `.github/context.yml` and apply:

- `optimization.token_policy.*`: keep the plan concise by default; include full
  code blocks only where needed for execution clarity
- `optimization.routing.*`: annotate each task with recommended model class
  (`fast/cheap`, `balanced`, or `deep-reasoning`) for /subagent-execution
- `mapping.stage_aliases` and `mapping.artefact_aliases`: include org-specific
  labels in section headings (keep canonical pipeline names in parentheses)

If no context values exist, use canonical names and default verbosity.

---

## Step 2 — Map file structure

Before writing tasks, identify every file to be created or modified.

Rules:
- One clear responsibility per file
- Test files mirror source files (e.g. `src/foo.ts` → `tests/foo.test.ts` for TypeScript, `src/foo.py` → `tests/test_foo.py` for Python, etc.)
- Follow existing patterns in the codebase — do not restructure unilaterally
- Files that change together live together
- Prefer smaller, focused files over large files that do too much

Output a file map using the `## File map` section from `templates/implementation-plan.md`.

Ask for confirmation before writing tasks:

> **File map above.** Does this look right, or should I adjust anything?
> Reply: looks good — or describe the change

---

## Step 3 — Write the plan

Conforms to `.github/templates/implementation-plan.md`.
Save to `artefacts/[feature]/plans/[story-slug]-plan.md`.

Populate one Task block per AC (or per logical behaviour if an AC is broad).
Follow the file map produced in Step 2. Every task must have:
- Exact file paths (no `[placeholder]` remaining in paths)
- Complete code in Step 3 (not "add validation here")
- A failing test written before the implementation step
- Expected output for every run command
- A commit message in imperative mood

**Task granularity rules:**

- Each task = 2–5 minutes of focused work
- One AC per task (or one logical behaviour if an AC is broad)
- Never "implement X" — show the actual code
- Never "run tests" without showing the expected output

---

## Step 4 — Self-review checklist

After writing the plan, check each task:

- [ ] Exact file paths (no `[placeholder]` remaining in paths)
- [ ] Complete code in Step 3 (not "add validation here")
- [ ] Failing test written before implementation step
- [ ] Expected output for every run command
- [ ] Commit message in imperative mood
- [ ] No scope beyond the relevant AC

Fix any issues before saving.

---

## Step 5 — Save and hand off

Save to `artefacts/[feature]/plans/[story-slug]-plan.md`.

**Before reporting completion, write pipeline-state.json** (see State update below).
This must happen as part of this step — not deferred to "after we start coding".
The visualiser shows tasks as soon as the plan is saved; if you skip this write, the viz shows 0 tasks throughout execution.

> ✅ **Implementation plan saved**
>
> Path: `artefacts/[feature]/plans/[story-slug]-plan.md`
> Tasks: [N]
> ACs covered: [N]/[N]
> pipeline-state.json: tasks array written ✅
>
> **Next step:**
> 1. Subagents available → run /subagent-execution (recommended)
> 2. Single session → use /tdd task by task
>
> Reply: 1 or 2

---

## Red flags

- Plan shows "implement X" rather than actual code → fill it in
- Tasks longer than 5 minutes → split them
- ACs not covered by any task → add a task or note the gap in a PR comment
- Scope beyond the DoR → remove it

---

## Integration

**Reads:** DoR artefact, test plan, AC verification script, story artefact
**Produces:** `artefacts/[feature]/plans/[story-slug]-plan.md`
**Follows:** /branch-setup
**Precedes:** /subagent-execution or /tdd (task by task)

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

**Pipeline-state write safety — fetch from master before every write:**

Fan-out concurrent worktrees each hold a stale copy of `pipeline-state.json` from branch-creation time. Writing to that stale copy silently overwrites every other story's updates that merged while this branch was open. Always fetch from `origin/master` immediately before writing — never from the worktree's disk copy.

```js
const { execSync } = require('child_process');
execSync('git fetch origin master');
const masterSha = execSync('git rev-parse origin/master').toString().trim();
const s = JSON.parse(execSync('git show origin/master:.github/pipeline-state.json').toString());
console.log(`[pipeline-state] read from master @ ${masterSha}`);
// --- apply only this story's fields to s ---
require('fs').writeFileSync('.github/pipeline-state.json', JSON.stringify(s, null, 2) + '\n', 'utf8');
```

**Rule (five steps, no exceptions):**
1. `git fetch origin master` — sync remote refs first
2. Read from `git show origin/master:.github/pipeline-state.json` — not from the worktree file
3. Log the SHA — one-line audit trail enabling post-hoc reconstruction of any merge inconsistency
4. Apply only this story's fields to the fetched state
5. Write back — the worktree file is now current-master + this story's update

This applies even when the worktree copy appears current — always fetch immediately before the write, not at branch-creation time.

Update `.github/pipeline-state.json` in the **project repository** when the implementation plan is saved:

- Set the story `stage: "implementation-plan"`, `health: "green"`, `updatedAt: [now]`
- Populate the story `tasks` array from the plan. Each task entry:
  ```json
  {
    "id": "task-1",
    "name": "Short task title",
    "tddState": "not-started",
    "file": "artefacts/[feature-slug]/plans/[story-slug]-plan.md"
  }
  ```
  Set `file` to the path of the plan artefact (all tasks in a story share the same plan file). The visualiser will render each task name as a clickable link to the plan markdown.

**Parent propagation (apply to every inner loop state write):**
- Always update the feature-level `updatedAt: [now]` — the visualiser staleness timer reads this field; if only the story `updatedAt` is written the feature card shows "STALE PROC"
- Recompute the parent epic `status` from its stories: if every story in the epic is done (`dodStatus: "complete"`, `prStatus: "merged"`, or all tasks `tddState: "committed"`), set epic `status: "complete"`; if any story has an active inner loop stage, set `status: "in-progress"`; otherwise `"not-started"`
