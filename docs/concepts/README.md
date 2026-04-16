# Framework Concepts

**Audience:** This guide is written for first-time adopters with no prior session attendance. If you have never used this platform before, start here.

---

## Reading order recommendation

The three sections below are not the file naming order — read them in this sequence:

1. **Building blocks** — the concrete mechanisms you will interact with every day
2. **Principles** — the design decisions behind those mechanisms
3. **Primitives** — the low-level constructs that the building blocks are composed from

---

## Building blocks

The eight building blocks are the runtime concepts of the pipeline. Read them in this order:

1. [Outer loop](building-blocks/outer-loop-inner-loop.md) — the human-paced delivery loop from discovery through story, gate checks, and PR review to merge
2. [Skills pipeline](building-blocks/skills-pipeline.md) — the sequence of skill-driven steps that carries a story from discovery through implementation to merge
3. [Governance traces](building-blocks/governance-traces.md) — the audit trail written at every pipeline transition
4. [Assurance gate](building-blocks/assurance-gate.md) — the automated quality check that runs on every PR
5. [Definition of Ready (DoR)](building-blocks/definition-of-ready.md) — the entry contract for the coding agent
6. [Definition of Done (DoD)](building-blocks/definition-of-done.md) — the exit verification after a PR merges
7. [Watermark gate](building-blocks/watermark-gate.md) — the test-count floor that prevents suite regression
8. [Benefit metrics](building-blocks/benefit-metrics.md) — the measurable outcomes each feature is tracked against

---

## Principles

The six principles explain why the platform is designed the way it is:

- [Adapter-isolated surface concerns](principles/adapter-isolated-surface-concerns.md)
- [Governance by demonstration](principles/governance-by-demonstration.md)
- [Human approval at every gate](principles/human-approval-at-every-gate.md)
- [Self-improving harness](principles/self-improving-harness.md)
- [Spec immutability](principles/spec-immutability.md)
- [The subset is the on-ramp](principles/the-subset-is-the-on-ramp.md)

---

## Primitives

The six primitives are the low-level constructs that building blocks are composed from:

- [Assurance gate](primitives/assurance-gate.md)
- [Eval suite](primitives/eval-suite.md)
- [Learnings log](primitives/learnings-log.md)
- [Pipeline state](primitives/pipeline-state.md)
- [Skill](primitives/skill.md)
- [Surface adapter](primitives/surface-adapter.md)
