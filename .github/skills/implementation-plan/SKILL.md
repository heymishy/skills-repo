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

1. DoR artefact at `.github/artefacts/[feature]/dor/[story-slug]-dor.md` with `Proceed: Yes`
2. Test plan at `.github/artefacts/[feature]/test-plans/[story-slug]-test-plan.md`
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

## Step 2 — Map file structure

Before writing tasks, identify every file to be created or modified.

Rules:
- One clear responsibility per file
- Test files mirror source files (e.g. `src/foo.ts` → `tests/foo.test.ts`)
- Follow existing patterns in the codebase — do not restructure unilaterally
- Files that change together live together
- Prefer smaller, focused files over large files that do too much

Output a file map:

```
## File map

Create:
  src/[path]/[name].[ext]    — [one-line responsibility]
  tests/[path]/[name].[ext]  — [what it tests]

Modify:
  src/[path]/[existing].[ext] — [what changes and why]
```

Ask for confirmation before writing tasks:

> **File map above.** Does this look right, or should I adjust anything?
> Reply: looks good — or describe the change

---

## Step 3 — Write the plan

Plan header (copy verbatim into plan file):

```markdown
# [Story Title] — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** [One sentence from DoR instructions block]
**Branch:** feature/[story-slug]
**Worktree:** [path]
**Test command:** [e.g. `npm test` / `pytest` / `go test ./...`]

---
```

Repeat for each AC → test group:

````markdown
### Task N: [What this builds — one clear noun phrase]

**Files:**
- Create: `exact/path/to/file.ts`
- Test: `tests/exact/path/to/file.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
test('[AC description in plain language]', () => {
  // arrange
  const input = ...;
  // act
  const result = functionUnderTest(input);
  // assert
  expect(result).toBe(expected);
});
```

- [ ] **Step 2: Run test — must fail**

```bash
[test command] tests/path/to/file.test.ts
```

Expected output: `FAIL — [function name] is not defined` (or equivalent)

- [ ] **Step 3: Write minimal implementation**

```typescript
// Complete implementation — not a stub or reference
export function functionUnderTest(input: Type): ReturnType {
  return ...;
}
```

- [ ] **Step 4: Run test — must pass**

```bash
[test command] tests/path/to/file.test.ts
```

Expected output: `PASS`

- [ ] **Step 5: Run full suite — no regressions**

```bash
[test command]
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add exact/path/to/file.ts tests/exact/path/to/file.test.ts
git commit -m "feat: [what was implemented in imperative mood]"
```
````

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

Save to `.github/artefacts/[feature]/plans/[story-slug]-plan.md`.

> ✅ **Implementation plan saved**
>
> Path: `.github/artefacts/[feature]/plans/[story-slug]-plan.md`
> Tasks: [N]
> ACs covered: [N]/[N]
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
**Produces:** `.github/artefacts/[feature]/plans/[story-slug]-plan.md`
**Follows:** /branch-setup
**Precedes:** /subagent-execution or /tdd (task by task)

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` in the **project repository** when the implementation plan is saved:

- Set the story `stage: "implementation-plan"`, `health: "green"`, `updatedAt: [now]`
- Populate the story `tasks` array from the plan. Each task entry:
  ```json
  {
    "id": "task-1",
    "name": "Short task title",
    "tddState": "not-started",
    "file": ".github/artefacts/[feature-slug]/plans/[story-slug]-plan.md"
  }
  ```
  Set `file` to the path of the plan artefact (all tasks in a story share the same plan file). The visualiser will render each task name as a clickable link to the plan markdown.
