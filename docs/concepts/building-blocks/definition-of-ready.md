# Definition of Ready

## What it is

The Definition of Ready (DoR) is the gate that separates the outer loop from the inner loop. Before a story can be handed to the coding agent, it must pass the DoR gate: a checklist of hard blocks (H1–H9) and warnings (W1–W5) that verify the story is complete, unambiguous, and ready for implementation without further clarification.

A signed-off DoR artefact includes:
- The acceptance criteria (ACs) for the story
- A test plan (already written to fail)
- A scope contract listing the exact files the coding agent may touch
- A Coding Agent Instructions block with all context the agent needs
- The human approver's identity and timestamp

## Why it exists

Handing an incomplete or ambiguous story to a coding agent produces implementation that may look correct but does not match what was actually needed — or that requires the agent to make judgment calls that should have been human decisions. The cost of an ambiguous story is paid in rework, in out-of-scope changes, and in scope drift that is hard to detect at PR review.

The DoR gate is a forcing function: it makes incompleteness visible before coding starts, when the cost of correction is low (rewrite a sentence in a story) rather than after (revert a PR).

## How it works

The `/definition-of-ready` skill runs a checklist:

**Hard blocks (all must pass before sign-off):**
- H1: Story has a clear user goal
- H2: Acceptance criteria are testable and specific
- H3: A test plan exists with tests already written to fail
- H4: Scope contract lists exact file touchpoints
- H5: Out-of-scope constraints are explicit
- H6: No unresolved dependencies or blockers
- H7: Standards injection completed
- H8: No ambiguity the coding agent would have to resolve by guessing
- H9: Architecture guardrails reviewed and no conflicts

**Warnings (must be acknowledged):**
- W1–W5: scope risk, estimate uncertainty, complexity flags

The approved DoR artefact is written to `artefacts/[feature-slug]/dor/[story-slug]-dor.md`. After sign-off, the scope contract is immutable (see [Spec immutability](../principles/spec-immutability.md)).

## What you do with it

Run `/definition-of-ready` after the test plan is written and reviewed. Work through the hard blocks — if any fail, fix the story (or the test plan or the scope contract) before running again. Do not bypass hard blocks.

After sign-off, hand the story to the coding agent via `/branch-setup` or `/issue-dispatch`. The agent will read the DoR artefact as its primary work specification.

## How it relates to

- [Spec immutability](../principles/spec-immutability.md) — the principle that makes the signed-off DoR immutable
- [Definition of Done](definition-of-done.md) — the post-merge confirmation that the story satisfied its ACs
- [Outer loop and inner loop](outer-loop-inner-loop.md) — the DoR is the gate between the two loops
