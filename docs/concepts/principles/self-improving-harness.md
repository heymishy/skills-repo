# Self-Improving Harness

## What it is

Every completed feature loop feeds back into the platform that ran it. `/improve` extracts reusable patterns from delivery and writes them to `workspace/learnings.md`, discipline standards, and architecture guardrails — making the next loop start with richer context. In parallel, the improvement agent reads delivery traces, detects failure patterns, proposes SKILL.md diffs, and gates every change on human review. Platform quality compounds across loops: more teams running more features produces more learnings, better skills, and fewer repeated failures. The harness trains itself from real production usage, not synthetic benchmarks.

## Why it exists

A governance platform that does not improve becomes a constraint rather than an asset. As teams deliver more features, they encounter failure patterns that the current skills do not handle well, discover more effective approaches, and accumulate context that should inform future delivery. Without a structured feedback mechanism, these insights dissipate — they remain in retrospective notes or individual memory rather than being incorporated into the platform itself.

The self-improving harness ensures that the platform's quality compounds rather than stagnates. Every feature that runs the pipeline contributes to making the pipeline better for the next feature.

## How it works

There are two improvement pathways:

**Human-driven improvement via `/improve`:** After a PR merges, the operator runs `/improve`, which reads the completed artefact chain for the story or feature, identifies reusable patterns, decisions, and standards that emerged during delivery, and writes them back to the permanent knowledge base — `workspace/learnings.md`, `standards/`, `decisions/`, and `architecture-guardrails.md`. The operator reviews and approves each write.

**Agent-driven improvement via the improvement agent:** The improvement agent runs continuously, reading delivery traces and detecting failure patterns — cases where the same skill failure or delivery gap recurred across multiple features. When it detects a pattern, it generates a proposed SKILL.md diff and flags it for human review. The human can accept, reject, or defer the proposal. No SKILL.md change reaches production without a human approval gate.

Both pathways are subject to the same principle: the platform improves itself using the same governed pipeline that it enforces for all other changes.

## What you do with it

After each feature loop closes (PR merged, DoD confirmed), run `/improve`. This is a lightweight step — usually 5–10 minutes of operator attention — that pays compound interest over the lifetime of the platform. The learnings you write today become the richer skill context that the agent uses on the next story.

When the improvement agent surfaces a proposal, review it seriously. The agent has identified a recurring pattern from real delivery data; the proposal is its best guess at a fix. Your judgment determines whether that fix is correct, appropriately scoped, and safe to apply.

## Further reading

Optional further reading: [Governance traces](../building-blocks/governance-traces.md) — explains how traces are the raw input to the improvement cycle.
Optional further reading: [Eval suite](../primitives/eval-suite.md) — explains the regression suite that guards against improvement proposals introducing regressions.
