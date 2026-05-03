# Fix note: pipeline-state.json write safety — read from master before every write

**Date:** 2026-05-03
**Type:** Platform skill fix (behavioural change to three inner-loop skills)
**Affected skills:** `/subagent-execution`, `/branch-complete`, `/implementation-plan`
**Root cause classification:** Structural (fan-out overwrite) + compliance (mandatory step skipped)

---

## Root cause

### Problem 1 — Fan-out branch overwrite (structural)

When multiple stories are dispatched concurrently, each worktree is created from the same master snapshot at dispatch time (T0). Every worktree's copy of `pipeline-state.json` reflects the state of all other stories at T0 — before any of the sibling stories have merged.

When stories merge sequentially (story A merges → master@T1 with A's state; story B then merges), the merge mechanism compares base→ours→theirs. For a squash merge, the diff is branch-base→branch-tip applied on top of current master. If the agent wrote pipeline-state.json relative to T0 (the worktree's copy), and other stories merged their state between T0 and branch-tip, the squash may apply a diff that reverts those other stories' merged state back to the T0 values.

**Observed consequence:** wuce.2–wuce.8 and wuce.12 (8 stories) all merged with their PRs but pipeline-state.json showed `prStatus: none, stage: definition-of-ready` for all of them. The agents wrote state from the worktree's T0 copy or didn't write at all.

### Problem 2 — Agents skipping the mandatory write (compliance)

The skills say "mandatory final step" in the state-update section but nothing enforces it. An agent that finishes code implementation and opens a PR without writing pipeline-state.json leaves the entry at the dispatch-time defaults forever. The structural fix below partially addresses this: if the agent must read from master to get the base state, it must engage with the file and is prompted to write.

---

## Fix applied

**Rule added to all three inner-loop skill state-update sections:**

Before writing `.github/pipeline-state.json`, always fetch the current master version — never write based on the worktree's disk copy:

```js
const { execSync } = require('child_process');
execSync('git fetch origin master');
const masterSha = execSync('git rev-parse origin/master').toString().trim();
const s = JSON.parse(execSync('git show origin/master:.github/pipeline-state.json').toString());
console.log(`[pipeline-state] read from master @ ${masterSha}`);
// --- apply only this story's fields to s ---
require('fs').writeFileSync('.github/pipeline-state.json', JSON.stringify(s, null, 2) + '\n', 'utf8');
```

**Five-step rule:**
1. `git fetch origin master` — sync remote refs first
2. Read from `git show origin/master:.github/pipeline-state.json` — not the worktree file
3. Log the master SHA — one-line audit trail for post-hoc reconstruction
4. Apply only this story's fields to the fetched state
5. Write back — the worktree file is now current-master + this story's update

**Why the SHA log matters:** It gives a traceable record of what pipeline state the agent saw before making its update. If a future merge inconsistency appears, you can compare the logged SHA against the merge history to identify exactly which stories' state was and wasn't visible to the writing agent.

**The structural guarantee:** Because every write starts from current master (not branch-creation-time), sibling stories that merged after this branch was created are always included in the written state. The race window collapses from "entire branch lifetime" to "git fetch latency" (seconds).

---

## Files modified

| File | Change |
|------|--------|
| `.github/skills/subagent-execution/SKILL.md` | Safety rule added to State update section; inline callouts added at Step 1 write and Step 2d write |
| `.github/skills/branch-complete/SKILL.md` | Safety rule added to State update section |
| `.github/skills/implementation-plan/SKILL.md` | Safety rule added to State update section |

---

## Porting note

This fix is safe to port to any repository using these skills. The only requirement is that the repository has an `origin` remote pointing to the canonical master branch — which is true of any repository set up via `/bootstrap`. The `git show origin/master:...` command works in any git worktree regardless of the worktree's checked-out branch.

If a repository uses a different default branch name (e.g. `main`), replace `origin/master` with `origin/main` throughout. The `source_control.base_branch` field in `context.yml` is the canonical reference — skills that read `context.yml` should derive the branch name from that field rather than hardcoding `master`.

---

## Verification

After porting, the next inner-loop run should produce a `[pipeline-state] read from master @ <sha>` line in the agent's output whenever it writes pipeline-state.json. Absence of that line means the agent did not execute the fetch-before-write step and the worktree's stale copy was used.
