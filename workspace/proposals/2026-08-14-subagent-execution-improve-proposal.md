---
evidence: >
  Two distinct dispatch-instruction gaps found during a 12-story feature's
  implementation-loop execution. (1) A dispatched implementer subagent
  spawned its own background process (a full test suite run) and reported
  it would "wait for the background task to complete on its own" before
  continuing — it never could, since only the orchestrating session receives
  background-task completion notifications; a dispatched subagent has no
  channel to learn a self-spawned background process finished (wugs-s8 Task
  4, web-ui-guardrails-standards-surface, 2026-08-13). Recovered by checking
  the worktree's actual git status/git diff directly rather than waiting
  further; no work was lost, but the same class of gap could silently stall
  a dispatch indefinitely in a less-observed session. (2) Two independent
  removal-story code-review rounds (spec-compliance + code-quality reviewer
  dispatches, both written by the orchestrating session each time) missed a
  real regression because neither reviewer's dispatch prompt instructed
  checking tests/e2e/*.spec.js for dangling literal route/table-name
  references — the review prompts' own scope focused on src/ and
  tests/*.js, mirroring the same blind spot as the automated grep-based
  lock-in test those same tasks had just added (wugs-s11, both review
  rounds across all 3 tasks passed clean or found only cosmetic issues; the
  regression was caught by CI's own cross-tenant-isolation gate instead,
  after merge... corrected before merge once the operator flagged the CI
  failure).
proposed_diff: >
  Add to skills/subagent-execution/SKILL.md's own dispatch-instruction
  template: (1) An explicit prohibition on a dispatched implementer
  launching its own background/detached processes — all commands, including
  long-running ones like a full test suite run, must execute in the
  foreground within the single dispatch turn that started them, since a
  subagent cannot receive completion notifications for background work it
  spawns itself (this is distinct from the orchestrating session's own use
  of background tasks, which IS notified correctly). (2) For any task
  touching a removal/deletion-framed story, add a standard clause to both
  the spec-compliance and code-quality reviewer dispatch prompts:
  explicitly instruct the reviewer to check tests/e2e/*.spec.js for any
  literal reference to the removed route paths, table names, or
  identifiers — not just src/ and tests/*.js for identifier-name matches —
  since this is exactly the class of dangling reference an automated
  grep-based lock-in test cannot see either.
confidence: high
anti_overfitting_gate: >
  Finding (1) is a single occurrence but represents a structurally
  inevitable failure mode (any subagent that spawns its own background
  process WILL hit this, given how background-task notification routing
  works) rather than a probabilistic one that might not recur — the fix is
  categorical (forbid the action entirely) rather than probabilistic, so a
  single clean occurrence is sufficient evidence to justify a categorical
  rule. Finding (2) occurred on the one removal-story in this feature that
  had review-dispatch prompts written without this instruction; the
  companion story (wugs-s12) that followed immediately after, where the
  orchestrating session manually added tests/e2e/ awareness to its own
  investigation (not yet to the dispatch prompts themselves), did not
  recur — suggesting the fix, once made explicit in the skill's own
  template, should generalize cleanly rather than needing story-specific
  tuning.
status: pending_review
created_at: 2026-08-14
skill_target: subagent-execution
source: improve
---

# Proposal: Dispatch instructions should forbid subagent self-spawned background processes, and require tests/e2e scanning for removal-story reviews

## Context

`skills/subagent-execution/SKILL.md` governs how implementer and reviewer subagents are dispatched during the inner coding loop. Two gaps in its own dispatch-instruction templates were found this session, both traced to the orchestrating session having to independently rediscover a fix each time rather than the skill itself encoding the rule.

## What happened

**Background-process deadlock (wugs-s8):** A dispatched implementer, partway through its task, ran the full test suite as a background command it spawned itself, then reported it would wait for that background task to finish before completing its work and reporting back. It never received any signal that the background process finished — only the orchestrating session (not a dispatched subagent) is notified when a background task it started completes. The dispatch effectively stalled until the orchestrating session directly inspected the worktree's git state and completed the remaining verification/commit itself.

**Removal-story review blind spot (wugs-11):** Both the spec-compliance and code-quality reviewer dispatch prompts for a removal story's 3 tasks were scoped (by the orchestrating session, ad hoc, each time) to check `src/` and `tests/*.js` for dangling references to removed code — mirroring exactly the same blind spot the automated AC4 grep-based lock-in test already had. Neither review round caught a real regression sitting in `tests/e2e/*.spec.js`, which was instead caught by a CI gate after the PR was opened.

## Proposed change

Two additions to the skill's own dispatch-instruction template, detailed in `proposed_diff` above: a categorical prohibition on subagent-spawned background processes, and a standard tests/e2e-scanning clause added to review-dispatch prompts specifically for removal/deletion-framed tasks.

## Why this belongs in the skill (not just an operator-side fix)

Both fixes were applied ad hoc by the orchestrating session in the moment they were needed, but neither was written back into the dispatch-instruction template itself — meaning the next feature's own removal story, or the next subagent that happens to spawn a background process, would hit the identical gap again unless whoever is orchestrating that future session happens to remember this session's own experience. Encoding both fixes directly in the skill's dispatch template means every future dispatch inherits the fix automatically.
