---
evidence: >
  A session checkpoint (workspace/state.json) recorded a story's progress
  as 3 of 7 implementation tasks complete. A background implementer
  subagent had, unattended, continued working past the point the checkpoint
  was written — completing all 7 tasks plus a full round of review-driven
  security hardening (CSRF, tenant-scope, path-allowlist, conflict
  handling), all sitting correctly in the worktree, none of it committed,
  pushed, or reflected in the checkpoint. Resuming correctly required two
  independent checks that neither alone would have sufficed for: comparing
  the implementation plan's task list against `git log --oneline` in the
  worktree (to find completed-but-unrecorded tasks), and separately
  checking `git status` (to find completed-but-uncommitted work).
  Discovered while resuming from this exact checkpoint (wugs-s6, DoD
  Observation #1, web-ui-guardrails-standards-surface, 2026-08-13).
proposed_diff: >
  Add an explicit resume instruction to skills/checkpoint/SKILL.md (and/or
  skills/branch-setup/SKILL.md's own resume path, since branch-setup is
  often the entry point when resuming mid-story work): when resuming a
  session where a background agent may have continued working past the
  last checkpoint write, do not trust the checkpoint's own recorded
  task-count as sufficient ground truth. Instead, re-derive actual task
  state by (1) comparing the implementation plan's task list against
  `git log --oneline` in the relevant worktree to find any completed tasks
  the checkpoint doesn't yet reflect, and (2) separately running `git
  status` in that same worktree to find any completed-but-uncommitted work.
  Both checks are required — checking only one misses the other category
  of drift (task log vs. checkpoint disagreement catches completed-and-
  committed-but-unrecorded work; git status catches completed-but-never-
  committed work; neither substitutes for the other).
confidence: medium
anti_overfitting_gate: >
  Single occurrence in the evidence base. The underlying mechanism (a
  background agent continuing to work after a checkpoint write, with no
  automatic mechanism to update the checkpoint when that happens) is
  structurally plausible to recur any time a background-dispatched agent's
  work outlives the session's own checkpoint cadence, but this proposal is
  based on one confirmed instance, not a repeated pattern. Recommend
  treating this as medium- rather than high-confidence until a second
  occurrence (in this or another feature) confirms the fix generalizes
  rather than being specific to this one story's particular background-
  agent timing.
status: pending_review
created_at: 2026-08-14
skill_target: checkpoint
source: improve
---

# Proposal: Checkpoint resume instructions should require re-deriving task state from git, not trusting the checkpoint's own count

## Context

`skills/checkpoint/SKILL.md` governs the mid-session and end-of-session state write to `workspace/state.json`, including the `resumeInstruction` field a future session reads to pick up where the prior one left off. Currently there is no explicit instruction to independently verify the checkpoint's own recorded progress against the real git state before trusting it.

## What happened

A checkpoint recorded a story at 3 of 7 tasks complete. In reality, a background-dispatched implementer had continued working unattended past the checkpoint write and completed all 7 tasks, plus additional review-driven hardening work — none of which the checkpoint reflected, since it was written before that work finished. Resuming the session on the strength of the checkpoint's own numbers alone would have led to redundant or conflicting work being dispatched for tasks that were, in reality, already done.

## Proposed change

Add an explicit instruction to the checkpoint skill's own resume-guidance: never trust a checkpoint's own task-count as sufficient ground truth when resuming after a background agent may have continued working. Re-derive actual state from `git log` and `git status` in the relevant worktree, both independently, before proceeding — detailed in `proposed_diff` above.

## Why this belongs in the skill (not just an operator-side fix)

Checkpoints exist specifically to let a session resume correctly after an interruption — but a checkpoint that can silently understate progress (because a background agent kept working after the write) is not a reliable resume mechanism on its own. Encoding "verify against git, don't just trust the checkpoint" directly in the skill's own resume instructions means every future session that resumes from a checkpoint inherits this verification step automatically, rather than depending on whoever is resuming happening to think to check independently.
