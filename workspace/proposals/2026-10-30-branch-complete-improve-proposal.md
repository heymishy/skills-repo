---
evidence: >
  The same class of main-checkout-vs-feature-branch drift bug recurred twice
  in one epic (test-fixture-hardening-continuation, 2026-10-30), each time
  for a different artefact file. (1) tfhc-s1: decisions.md RISK-ACCEPT
  entries written during /subagent-execution Task 2 and Task 3 (while the
  orchestrating session's cwd had drifted back to the main checkout) were
  committed to master directly, never to the feature branch -- caught by
  the mandatory final cross-cutting reviewer subagent before PR open, fixed
  by a one-off sync commit on the branch (7aebed4c). (2) tfhc-s2: after
  /branch-complete opened draft PR #1043, the operator reported "Has merge
  conflicts". Root cause: the feature branch's pipeline-state.json copy had
  been synced to master once already (at the /verify-completion checkpoint,
  commit 47130a5a -> 2d65d44d), but /branch-complete's own subsequent
  pipeline-state write to master (3d0e79bd, setting prStatus=draft + prUrl)
  was never re-synced back onto the branch -- a real textual conflict on
  the SAME story's JSON entry (two overlapping hunks: stage/health block,
  verifyStatus/prStatus/prUrl block), not a trivial auto-mergeable diff.
  Fixed with a second sync commit (acc3997a) after the operator flagged the
  conflict; PR then went mergeable/clean. Both occurrences share the same
  shape: the orchestrating session performs ALL pipeline-state.json and
  artefact writes from the main checkout per this repo's own established
  "bookkeeping doesn't need a feature-branch PR" convention, but a
  feature-branch worktree created earlier in the same story's lifecycle
  does not automatically receive any of those main-checkout writes --
  each one requires its own explicit re-sync, and the existing skill
  instructions only name ONE sync point (at /subagent-execution or
  /verify-completion), not "after every subsequent master-side write
  to this story's entry, for the rest of this story's lifecycle until
  the branch is merged or deleted."
proposed_diff: >
  Two additions, one at the CLAUDE.md guardrail level and one in
  skills/branch-complete/SKILL.md directly. (1) Extend CLAUDE.md's existing
  "Verify the target checkout before editing files once an inner-loop
  worktree exists" guardrail (currently scoped to Edit/Write calls on
  arbitrary files) with an explicit, separate paragraph for
  pipeline-state.json and any other artefact file the orchestrating session
  writes directly to master as bookkeeping: state plainly that EVERY master-
  side write to a story's own entry, for as long as that story's feature
  branch/worktree still exists, must be mirrored onto the branch before the
  next action that depends on the branch being in sync with master (merge-
  conflict check, PR open, or PR merge) -- not just once, at whichever
  single checkpoint a given skill's own SKILL.md happens to name. (2) Add an
  explicit step to skills/branch-complete/SKILL.md's own Step 4 (PR open),
  immediately after creating the draft PR: fetch origin master, diff this
  story's own pipeline-state.json entry between the feature branch and
  master, and if they differ, sync the branch's copy from master's current
  state before considering /branch-complete finished -- catching this
  exact drift at the one point in the inner loop where it is cheapest to
  fix (before the PR accumulates reviewer attention or CI runs against a
  stale tree), rather than relying on the operator noticing a merge-conflict
  banner on GitHub afterward.
confidence: high
anti_overfitting_gate: >
  Two independent occurrences in the same epic, for two different artefact
  file types (decisions.md, pipeline-state.json), both traced to the exact
  same structural cause (a main-checkout write made after a worktree's last
  sync point, never re-synced) rather than a one-off mistake specific to
  either file's content -- this is why the fix is proposed at the general
  CLAUDE.md guardrail level, not as a file-specific patch. The second
  occurrence happened despite the first having already been caught and
  fixed earlier in the very same session, which rules out "the operator
  just didn't know about this failure mode yet" as the explanation --
  the existing skill instructions genuinely do not name a sync point late
  enough in the inner loop to catch a write that happens at
  /branch-complete itself, which is why proposed_diff's second change
  targets that exact gap rather than only restating the general rule.
status: pending_review
created_at: 2026-10-30
skill_target: branch-complete
source: improve
---

# Proposal: Pipeline-state (and other artefact) syncs to a feature branch must be repeated after every subsequent master-side write, not just once

## Context

This repo's established convention has the orchestrating session perform all `pipeline-state.json` writes from the main checkout, committing and pushing them directly to master as bookkeeping (per CLAUDE.md's "State and artefact updates — no standalone PR required" rule). When an inner-loop worktree/feature branch exists for a story, that branch's own copy of `pipeline-state.json` is necessarily stale relative to master from the moment the worktree was created — existing skill instructions (`subagent-execution`, `verify-completion`) name ONE sync point to catch this (typically right before a checkpoint commit), but neither names a *final* sync point covering writes that happen after that checkpoint, specifically the write `/branch-complete` itself makes when it records `prStatus: draft` + `prUrl`.

## What happened

**tfhc-s1 (decisions.md):** A RISK-ACCEPT entry written mid-task while the session's cwd had drifted to the main checkout landed on master but never on the feature branch. Caught by the mandatory final cross-cutting reviewer subagent, before the PR was even opened — no user-visible impact.

**tfhc-s2 (pipeline-state.json):** The feature branch was synced once, at `/verify-completion`. `/branch-complete` then wrote `prStatus`/`prUrl` to master *after* opening the draft PR, and that write was never mirrored back onto the branch. This time nothing in-session caught it — the gap surfaced as a real GitHub merge-conflict banner, reported by the operator after the fact, on a PR that had already passed all 8 CI checks once.

## Why this belongs in the skill (and CLAUDE.md), not just an operator-side fix

Both times, the fix was applied ad hoc, after the fact, once something downstream (a reviewer subagent, or the operator reading GitHub's UI) surfaced the symptom. Neither fix was written back into the instructions that would prevent the *next* story in this epic (or any future epic) from hitting the identical gap a third time. The existing CLAUDE.md guardrail already covers the Edit/Write-call case for code and `pipeline-state.json`; this proposal closes the specific sub-case it doesn't cover — a write made *by the orchestrating session itself, from the main checkout, after the worktree's own last sync point* — and gives `/branch-complete` a concrete, cheap checkpoint (immediately after PR creation, before considering the skill done) to catch it before it ever reaches GitHub's merge-conflict UI.
