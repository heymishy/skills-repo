---
name: subagent-execution
description: >
  Executes an implementation plan by dispatching a fresh subagent per task,
  with two-stage review after each task: spec compliance first, then code
  quality. Fresh context per subagent prevents confusion and keeps tasks focused.
  Use when the implementation plan exists and subagents are available.
  If no subagents are available, use /tdd task-by-task instead.
triggers:
  - "execute the plan"
  - "dispatch the subagents"
  - "implement using subagents"
  - "subagent execution"
  - "run the plan"
---

# Subagent Execution Skill

## Entry condition

1. Implementation plan at `artefacts/[feature]/plans/[story-slug]-plan.md`
2. Worktree exists and baseline is clean (run /branch-setup if not)

If not met:

> ❌ Entry condition not met.
> Missing: [list what is missing]

---

## Core principle

Fresh subagent per task + two-stage review (spec compliance → code quality) = high quality, fast iteration.

**Why fresh subagents:**
You delegate each task to an agent with precisely constructed context.
They inherit nothing from this session — you give them exactly what they need.
This prevents context pollution and keeps each task focused.

The reviewer subagents also receive precisely constructed context — not your session history.
This keeps reviewers objective.

---

## Policy overlays (embedded)

Read `.github/context.yml` at start of execution.

- If `optimization.routing` exists: choose implementer/reviewer model class from
  policy first, then fall back to the default model-selection table below
- If `optimization.token_policy` exists: keep task prompts minimal and only pass
  task-local context, not full session history
- If `mapping.stage_aliases` exists: include org-stage labels in progress updates
  while keeping canonical stage names for state updates

---

## Step 1 — Read the plan and initialise state

Read `artefacts/[feature]/plans/[story-slug]-plan.md` fully.

Extract all tasks:
- Task number and title
- Full task text (every step, all code, expected outputs)
- Adjacent context (what was built before, what comes next)

> ⚠️ **Before writing pipeline-state.json:** fetch from `origin/master` first — see **Pipeline-state write safety** in the State update section below.

**Immediately write the `tasks` array to `pipeline-state.json` before dispatching any subagent.**
This is not a "final step" — it must happen here so the visualiser shows task progress live.
Set story `stage: "subagent-execution"`, `health: "green"`, `updatedAt: [now]`, and initialise all tasks:
```json
{
  "id": 1,
  "name": "<task title from plan>",
  "tddState": "not-started",
  "file": "artefacts/[feature-slug]/plans/[story-slug]-plan.md"
}
```
All tasks in a story share the same plan `file` path. The visualiser renders each task name as a clickable link to that file.

Create a todo list tracking all tasks.

---

## Step 2 — Per-task loop

For each task:

### 2a — Dispatch implementer subagent

Construct context for the subagent:

- Full task text (copy verbatim from the plan — do not paraphrase or summarise)
- Scene-setting context: what has been built so far, where this task fits in the plan
- Constraints from the DoR: architecture guardrails, out-of-scope items
- Test command
- Instruction: "Follow /tdd. RED—GREEN—REFACTOR. Commit after each test passes."
- **Mandatory, every dispatch:** "You have no mechanism to be notified when a background/detached process you start completes — only the orchestrating session that dispatched you receives that notification, never a subagent. Run every command, including long-running ones like a full test suite, in the foreground within this same turn and wait for your own tool call to return. Do not spawn a background process and report that you will wait for it to finish; that wait will never end." (Source: `2026-08-14-subagent-execution-improve-proposal.md`, `wugs-s8` Task 4 — a structurally inevitable failure mode, not a probabilistic one; confirmed to recur categorically across multiple later stories including `vrne-s1`, three times in one story, before this instruction was added here.)
- If the task is framed as a removal/deletion (deleting a route, table, identifier, or dead code path): also instruct the implementer to grep `tests/e2e/*.spec.js` for any dangling literal reference to what's being removed, not just `src/` and `tests/*.js` — this is the exact blind spot an automated grep-based lock-in test also cannot see (source: same proposal, `wugs-s11` finding — a real regression shipped past two review rounds and was only caught by CI's own post-merge gate).

Wait for the implementer to return one of four statuses:

| Status | Meaning | Your action |
|--------|---------|-------------|
| `DONE` | Task complete, committed | Proceed to spec review (Step 2b) |
| `DONE_WITH_CONCERNS` | Complete but flagged doubts | Read concerns. If correctness/scope issue: address before review. If observational: note and proceed. |
| `NEEDS_CONTEXT` | Missing information | Provide the missing context and re-dispatch |
| `BLOCKED` | Cannot complete task | See escalation path below |

**Escalation path for `BLOCKED`:**

1. Context problem → provide more context and re-dispatch
2. Task requires more reasoning → re-dispatch with a more capable model
3. Task too large → break into smaller pieces and re-dispatch
4. Plan itself is wrong → escalate to human and stop

Never force the same model to retry without changes. Never ignore an escalation.

### 2b/2c — Dispatch both reviewers concurrently

Construct context for BOTH reviewers and dispatch them together, in the same turn (same message, same batch of tool calls) — not sequentially. Each reviewer still receives its own precisely constructed context:

- **Spec compliance reviewer:** full task text from the plan, git diff since the task started (`git diff [start-sha] HEAD`), ACs from the story artefact this task covers, instruction "Review ONLY for spec compliance. Does the implementation match the spec? Nothing extra, nothing missing."
- **Code quality reviewer:** git diff for the task, codebase conventions from the active agent instruction file (e.g. `copilot-instructions.md` or `AGENTS.md` — see `context.yml: agent.instruction_file`) and `.github/architecture-guardrails.md`, instruction "Review for code quality: naming, structure, test quality, YAGNI, DRY. Report Critical / Important / Minor issues."
- Both reviewers also receive the same background-process warning as 2a, and — if the task under review is a removal/deletion — the same `tests/e2e/*.spec.js` dangling-reference scanning instruction as before.

Once both results are back, translate each reviewer's verdict into the exact shape `scripts/lib/review-outcome.js` requires: `{status: 'pass'}` for an approval (✅ spec compliant / ✅ approved), or `{status: 'fix-required'}` for issues found. Call `decideReviewOutcome(specResult, qualityResult)`:

- `{action: 'accept-both'}` — both passed clean. Mark the task complete (proceed to Step 2d) with both results as-is.
- `{action: 'redispatch-quality', discard: 'quality'}` — spec-compliance required a fix (or both did, in which case spec takes priority since its fix changes the code quality was evaluated against anyway). Dispatch the implementer (same subagent, updated context) to fix. Once the implementer reports the fix is done, update `specResult` to `{status: 'pass'}` — the implementer addressed the reviewer's named findings, and the original spec reviewer is not re-dispatched for this same complaint. Separately, discard the code-quality result (it was evaluated against pre-fix code, which has now changed) and re-dispatch code-quality review against the post-fix code; call the fresh result `postFixResult`. Feed the updated `specResult` and `postFixResult` into another `decideReviewOutcome` call. **Never reuse the original, stale `specResult` object in this or any later round — always replace it with the updated `{status: 'pass'}` value once the fix is confirmed done.**
- `{action: 'redispatch-spec', discard: 'spec'}` — the symmetric case: code-quality required a fix while spec-compliance already passed. Dispatch the implementer to fix. Once the implementer reports the fix is done, update `qualityResult` to `{status: 'pass'}` for the same reason as above. Discard the spec-compliance result and re-dispatch spec-compliance review against the post-fix code; call the fresh result `postFixResult`. Feed the updated `qualityResult` and `postFixResult` into another `decideReviewOutcome` call. **Never reuse the original, stale `qualityResult` object.**

Repeat the fix-and-redispatch cycle, calling `decideReviewOutcome` again each time with the updated results, until it returns `{action: 'accept-both'}`. Because the triggering side is always updated to `{status: 'pass'}` as soon as its fix is confirmed done (never left stale), this loop is guaranteed to terminate once both sides genuinely pass — it does not depend on re-reviewing the side that already named the issue, only on refreshing the side whose verdict the code change invalidated.

Build the task's final review record via `buildFinalRecord(specResult, qualityResult, decision, postFixResult)` using the FINAL round's values (the round where `decideReviewOutcome` returned `accept-both`) — this retains only the post-fix result on whichever side was redispatched; the pre-fix result never appears in the final record.

**Both reviews must each independently reach approval before the task is marked complete** — this replaces the old "spec compliance must be ✅ before starting code quality review" ordering constraint; the two reviews now run concurrently instead of gating each other, with `decideReviewOutcome` handling whichever one (or both) comes back needing a fix.

### 2d — Mark task complete

- Check off the task in the implementation plan file
- Record the ending git SHA for this task
- **Write `pipeline-state.json` locally now, but do not commit it per task** (see "State-write cadence vs. commit cadence" below): set this task's `tddState: "committed"`, run the task's own targeted test file(s) (see "Test run scope per task" below), set `testPlan.passing` to the current count, update story `updatedAt` — write these fields to the local file only.
- **Commit `pipeline-state.json` in a batch** at the next natural checkpoint (end of `/implementation-plan`, then covering all tasks together at `/verify-completion`) — not after every individual task. This halves the commit count on multi-task stories without losing resumability: the local file already carries every task's true state within the same worktree session.
- Also append this task's timing record now (see "Timing instrumentation" in the State update section below) — this is a per-task write, not deferred to story end.

**Why this distinction exists (2026-08-23 clarification):** full-history commit-density analysis across ~30 stories found this step's earlier wording ("update pipeline-state.json now... fetch from origin/master first... then set this task's tddState") was read literally by some sessions as "commit after every task," producing 2.5–2.8 commits/task on affected stories versus 1.3–2.0 on stories that batched instead — with zero evidence the extra commits caught anything the batched pattern missed. See `artefacts/2026-08-23-inner-loop-ceremony-optimisation/loop-design.md` for the full evidence base and the commits-per-task target this change is measured against.

### Test run scope per task

Run the task's own targeted test file(s) after each task — this is the fast, precise signal for the specific change and should always happen. Do **not** additionally re-run the full suite as a matter of course after every task: CI already re-runs the full suite, in parallel, on the PR regardless, making a sequential local re-run after each task mostly redundant with what CI will do anyway. Reserve full local full-suite runs for: `/branch-setup`'s baseline, `/verify-completion`'s evidence gate (non-negotiable), `/branch-complete`'s pre-push confirmation, and any individual task where you judge the change touches widely-shared code (e.g. a shared middleware file many routes depend on) — that judgement call is the orchestrating session's to make per-task, not a blanket rule.

---

## Step 3 — Final review

After all tasks complete:

Dispatch a final reviewer subagent with:

- Full diff from first task to last: `git diff [first-sha] HEAD`
- All ACs from the story artefact
- Instruction: "Review the complete implementation against all ACs. Confirm nothing is missing or extra."
- **Mandatory, every dispatch:** the same background-process warning as 2a/2b/2c (psms-s1: this step was the one dispatch site in this skill missing the warning, and confirmed to recur here specifically — `rcfc-s1`'s own Step 3 dispatch hit the false-wait trap even with the warning present verbatim at every other dispatch site in the same run, because it was never added here in the first place). A cross-cutting final-review subagent that runs a verification command (e.g. the full test suite) has the identical no-notification failure mode as a per-task implementer or reviewer — nothing about reviewing the *whole* diff instead of one task's diff changes that.

If issues found: address before proceeding.

---

## Step 4 — Hand off

> ✅ **All [N] tasks complete.**
>
> Final review: PASSED
>
> Next: run /verify-completion to confirm all ACs are satisfied before opening a PR.

---

## Model selection

Use context policy first (`optimization.routing`). If not configured, use the
least capable model that can handle each role to conserve cost:

| Role | Recommended model |
|------|------------------|
| Mechanical implementation (1—2 files, clear spec) | Fast/cheap model |
| Integration task (multi-file, pattern matching) | Standard model |
| Architecture, review, final review | Most capable available |

---

## Red flags

**Never:**

- Start implementation on main/master without explicit consent
- Skip spec compliance review
- Skip code quality review
- Start code quality review before spec compliance is ✅
- Move to the next task while either review has open issues
- Let the implementer's self-review replace the reviewer subagent
- Dispatch multiple implementer subagents in parallel (causes conflicts)
- Make subagents read the plan file themselves — provide full task text

---

## Integration

**Reads:** implementation plan, DoR artefact, story artefact, architecture guardrails
**Subagents use:** /tdd (per task)
**Follows:** /implementation-plan
**Precedes:** /verify-completion
**If no subagents available:** use /tdd task-by-task instead

---

## State update — mandatory final step

**Timing instrumentation:** After each task's dispatch round completes, append one record to `.github/pipeline-timings.jsonl` via `scripts/lib/pipeline-timings.js`'s `appendTimingRecord({skill: 'subagent-execution', featureSlug, storySlug, stage: 'subagent-execution', dispatchCount})` — `dispatchCount` is the number of subagent dispatches issued for that task (implementer + reviewer(s), counting any re-dispatch). `featureSlug`/`storySlug` are the same `[feature]`/`[story-slug]` values already used throughout this skill's own artefact path references — known from the active story/worktree this session is executing, not something this skill resolves separately. A write failure here is non-fatal and must not block this skill's own completion.

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

**Pipeline-state write safety — fetch from master before writing at a checkpoint, not before every local task-state update:**

Fan-out concurrent worktrees each hold a stale copy of `pipeline-state.json` from branch-creation time. Writing to that stale copy silently overwrites every other story's updates that merged while this branch was open — but this risk is real specifically at points where this branch's own data might collide with a *different* branch's concurrent merge, not for every single local task-state write within one worktree's own uninterrupted session.

**Scope this correctly (2026-08-23 clarification, added after this exact ambiguity caused a real data-loss bug on `vrne-s1`):** if this branch has not yet pushed/merged anything, and no other worktree is concurrently modifying *this same story's* entry, writing to the **local worktree file directly** (no fetch) is correct and safe for the per-task writes described in Step 2d above — `origin/master` does not have this branch's own unmerged task data yet, so fetching from it and overwriting the local file with that stale copy is not a safety measure, it is the bug. Fetch from `origin/master` immediately before writing specifically when: (a) this write is happening at a checkpoint commit that will be pushed shortly after, or (b) you have concrete reason to believe a *different* branch working on a *different* story in the same feature merged since this worktree was created. Do not fetch reflexively before every local, uncommitted, same-session write.

```js
const { execSync } = require('child_process');
// Wrap fetch in try/catch with a 5-second timeout. If origin is not reachable,
// fall back to the local branch copy of pipeline-state.json and warn the operator.
let usingLocalCopy = false;
try {
  execSync('git fetch origin master', { timeout: 5000 });
} catch (_) {
  console.warn('[pipeline-state] WARNING: origin not reachable — falling back to local branch copy. Verify state accuracy before merging.');
  usingLocalCopy = true;
}
const masterSha = usingLocalCopy
  ? execSync('git rev-parse HEAD').toString().trim()
  : execSync('git rev-parse origin/master').toString().trim();
const s = usingLocalCopy
  ? JSON.parse(require('fs').readFileSync('.github/pipeline-state.json', 'utf8'))
  : JSON.parse(execSync('git show origin/master:.github/pipeline-state.json').toString());
console.log(`[pipeline-state] read from ${usingLocalCopy ? 'local worktree file' : 'master'} @ ${masterSha}`);
// psms-s1: read this story's own CURRENT entry from the LOCAL worktree file
// on disk (not from memory, not reconstructed from only this step's new
// outputs) -- this is the accumulated source of truth for every field this
// branch has already written locally this session (tasks[], testPlan.passing,
// etc.). The fetched master copy `s` above has none of this branch's own
// unmerged local writes -- it is only the source of truth for every OTHER
// story/feature.
const localNow = JSON.parse(require('fs').readFileSync('.github/pipeline-state.json', 'utf8'));
const localStoryEntry = /* find this story's own entry in localNow.features[...].stories[...] */;
// --- merge localStoryEntry's fields onto s's corresponding story entry ---
// (never the reverse: s's own version of this story's entry, from the
// fetched master, must never replace what has already accumulated locally)
require('fs').writeFileSync('.github/pipeline-state.json', JSON.stringify(s, null, 2) + '\n', 'utf8');
```

**Rule for checkpoint writes (Step 1's initial write, and the batched commit points in Step 2d) — six steps, no exceptions:**
1. `git fetch origin master` with a 5-second timeout — if origin is not reachable, warn and fall back to the local branch copy
2. Read from `git show origin/master:.github/pipeline-state.json` (or the local worktree file on fallback) — not from the stale worktree file unless origin is unreachable
3. Log the SHA — one-line audit trail enabling post-hoc reconstruction of any merge inconsistency
4. **Separately, read this story's own current entry from the local worktree file on disk** (`fs.readFileSync`, not from memory) — this is the accumulated source of truth for every field already written locally this session, not the fetched master copy's version of this story, and not a reconstruction from only this step's own new outputs (psms-s1, closing the residual gap the 2026-08-23 fix above did not — see `workspace/dod-backlog-findings.md`)
5. Merge that local entry's fields onto the fetched master copy's corresponding story entry
6. Write back — the worktree file is now current-master (for every other story/feature) + this story's own locally-accumulated update

This applies at Step 1's initial write and at each batched commit point. It does **not** apply to Step 2d's per-task local-only writes (see the scoping clarification above) — those write directly to the worktree's own local file, no fetch.

Update `.github/pipeline-state.json` in the **project repository** progressively during execution:

- **At Step 1 (before the loop):** set story `stage: "subagent-execution"`, `health: "green"`, `updatedAt: [now]`, and initialise the `tasks` array — one entry per task with `tddState: "not-started"` and `file` set to the plan path (see Step 1 above)
- **At Step 2d (after each task, local file only):** set that task's `tddState: "committed"`, update `testPlan.passing`, update story `updatedAt` — write locally; commit in a batch at the next checkpoint, not per task (see Step 2d above)
- As each task moves through TDD, update its `tddState`:
  - Failing test written: `"red"` → minimal implementation passes: `"green"` → refactor done: `"refactor"` → committed: `"committed"`
- At any point that the running test count is known, keep `testPlan.passing` current — the visualiser reads this live
- If a task is stuck or a subagent fails a review: set story `health: "amber"`, note the task in `blocker`
- When all tasks complete and two-stage review passes: set `health: "green"`, clear `blocker`
- If a critical issue blocks progress: set `health: "red"`, `blocker: "[issue description]"`

**Parent propagation (apply to every inner loop state write):**
- Do **not** bump the feature-level `updatedAt` from this per-story write. Only a genuine feature-level milestone (`/discovery`, `/benefit-metric`, `/definition`) bumps it, via a `feature.<field>=...` argument to `bin/skills advance`/`gate-advance` — that is the only write path that touches `feature.updatedAt`. `bin/skills advance` stamps this story's own `updatedAt` automatically; you do not need to pass it explicitly. Unconditionally bumping `feature.updatedAt` on every per-story write was the root cause of concurrent same-feature stories colliding on that one shared JSON line — see `artefacts/2026-07-11-pipeline-conflict-reduction/decisions.md` (pcr-s1, AC3/AC4).
- Recompute the parent epic `status` from its stories: if every story in the epic is done (`dodStatus: "complete"`, `prStatus: "merged"`, or all tasks `tddState: "committed"`), set epic `status: "complete"`; if any story has an active inner loop stage, set `status: "in-progress"`; otherwise `"not-started"`
