---
name: branch-setup
description: >
  Creates an isolated git worktree for a story before any implementation begins.
  Verifies git-ignore safety, installs dependencies, and confirms a clean test
  baseline. Use immediately after DoR sign-off and before writing any code.
  Run when someone says "set up the branch", "start the implementation",
  "create the worktree", or "begin coding".
triggers:
  - "set up the branch"
  - "create the worktree"
  - "start the implementation"
  - "begin coding"
  - "branch setup"
---

# Branch Setup Skill

## Entry condition

DoR artefact with `Proceed: Yes` must exist at:
`artefacts/[feature]/dor/[story-slug]-dor.md`

If not:

> ❌ **DoR artefact not found or not signed off.**
> Run /definition-of-ready first.

---

## Step 1 - Read the DoR

Read the DoR artefact. Extract:

- `[feature-slug]` - from the artefact path
- `[story-slug]` - from the artefact path
- Branch name to create: `feature/[story-slug]`

---

## Step 2 - Locate worktree directory

Check in priority order:

```bash
# bash / Git Bash / WSL
ls -d .worktrees 2>/dev/null
ls -d worktrees 2>/dev/null
```

```powershell
# PowerShell (Windows native)
Test-Path .worktrees
Test-Path worktrees
```

If found: use it. If both exist, `.worktrees/` wins.

If neither exists, ask:

> No worktree directory found. Where should worktrees be created?
>
> 1. `.worktrees/` - project-local, will be git-ignored
> 2. `../worktrees/[project-name]/` - alongside the repo, no gitignore needed
>
> Reply: 1 or 2

For option 1, verify it is git-ignored before creating anything:

```bash
git check-ignore -q .worktrees
```

If NOT ignored:

1. Add `.worktrees/` to `.gitignore`
2. `git add .gitignore && git commit -m "chore: ignore worktree directory"`
3. Proceed

---

## Step 3 - Create worktree

```bash
git worktree add [path]/[story-slug] -b feature/[story-slug]
cd [path]/[story-slug]
```

---

## Step 4 - Install dependencies

Auto-detect project type and run setup:

```bash
# bash / Git Bash / WSL
[ -f package.json ]      && npm install
[ -f Cargo.toml ]        && cargo build
[ -f requirements.txt ]  && pip install -r requirements.txt
[ -f pyproject.toml ]    && poetry install
[ -f go.mod ]            && go mod download
```

```powershell
# PowerShell (Windows native)
if (Test-Path package.json)      { npm install }
if (Test-Path Cargo.toml)        { cargo build }
if (Test-Path requirements.txt)  { pip install -r requirements.txt }
if (Test-Path pyproject.toml)    { poetry install }
if (Test-Path go.mod)            { go mod download }
```

---

## Step 5 - Verify clean baseline

Run the project test suite:

```bash
npm test / cargo test / pytest / go test ./...
```

**If tests fail:**

> ❌ Baseline failing - [N] failures before any code is written.
>
> [Show failures]
>
> Options:
> 1. Investigate and fix pre-existing failures first
> 2. Acknowledge as pre-existing and proceed (will be logged in /decisions)
>
> Reply: 1 or 2

Do not proceed past a failing baseline without explicit acknowledgement.

**If tests pass:**

> ✅ Worktree ready
>
> Path: [full path]
> Branch: feature/[story-slug]
> Baseline: [N] tests, 0 failures
>
> Next: run /implementation-plan to write the task plan.

---

## Red flags

**Never:**

- Create a project-local worktree without verifying it is git-ignored
- Skip the baseline test verification
- Proceed past a failing baseline without explicit acknowledgement

---

## Integration

**Follows:** /definition-of-ready (DoR sign-off)
**Precedes:** /implementation-plan
**Cleanup:** /branch-complete removes the worktree when implementation is done

---

## State update - mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` in the **project repository** when the worktree is created and the clean baseline is confirmed:

- Set feature `stage: "branch-setup"`, `health: "green"`, `updatedAt: [now]`
- Set each story in the feature to `stage: "branch-setup"`, `health: "green"`, `updatedAt: [now]`
- If baseline tests fail: set feature and story `health: "red"`, `blocker: "Baseline tests failing - clean up before implementing"`

**Parent propagation (apply to every inner loop state write):**
- Always update the feature-level `updatedAt: [now]` — the visualiser staleness timer reads this field; if only the story `updatedAt` is written the feature card shows "STALE PROC"
- Recompute the parent epic `status` from its stories: if every story in the epic is done (`dodStatus: "complete"`, `prStatus: "merged"`, or all tasks `tddState: "committed"`), set epic `status: "complete"`; if any story has an active inner loop stage, set `status: "in-progress"`; otherwise `"not-started"`
