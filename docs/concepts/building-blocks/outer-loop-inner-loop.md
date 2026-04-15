# Outer Loop and Inner Loop

## What it is

The platform structures delivery into two distinct loops with separate actors, separate tools, and separate responsibilities.

The **outer loop** is where humans work. It covers the phases from discovery to Definition of Ready: `/discovery`, `/benefit-metric`, `/definition`, `/review`, `/test-plan`, and `/definition-of-ready`. This is where business context, judgment, and scoping decisions live. The outer loop runs in collaborative sessions between operators and AI agents.

The **inner loop** is where the coding agent works. Once a story is ready (signed off at the DoR gate), the story is handed to the Copilot coding agent. The agent runs a sequence of phases — branch setup, implementation, verification — and opens a draft PR. The agent executes within the boundaries the outer loop defined; it does not make scope decisions.

## Why it exists

The separation of loops enforces a structural principle: the agent that defines requirements is not the agent that implements them. Without this separation, a single agent could expand its own mandate mid-story — specifying more than was asked, implementing more than was specified, or making architectural decisions that should have been human judgment calls.

The outer loop / inner loop split is the BMAD (Business, Management, Architecture, and Development) maker/checker separation applied to AI-assisted delivery. It ensures that every story starts with a human-reviewed specification and ends with a human-reviewed PR.

## How it works

The pipeline flows in sequence:

| Loop | Steps | Who acts |
|------|-------|----------|
| Outer loop | `/discovery` → `/definition-of-ready` | Operator + AI agent |
| Inner loop | `/branch-setup` → `/branch-complete` | Coding agent (GitHub Copilot agent mode) |
| Assurance | CI gate → `/definition-of-done` → `/trace` → `/improve` | Automated gate + operator review |

The outer loop produces a DoR-gated work item with a signed-off scope contract. The inner loop consumes that item. The assurance loop closes the cycle and feeds learnings back into the platform.

## What you do with it

In the outer loop, your job is to produce high-quality, complete, unambiguous specifications — stories with clear acceptance criteria, test plans that are already written to fail, and a scope contract that is detailed enough for the coding agent to execute without asking questions.

In the inner loop, your job is to review the agent's draft PR against the specification you produced. If the PR satisfies the acceptance criteria and the assurance gate passes, merge. If not, raise the gap — either as a PR comment (for the agent to address) or as a pipeline issue (if the spec was incomplete).

## Further reading

Optional further reading: [Skills pipeline](skills-pipeline.md) — the full sequence of skills that make up both loops.
Optional further reading: [Definition of Ready](definition-of-ready.md) — the gate between the outer and inner loops.
