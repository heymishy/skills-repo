# Skills Pipeline

## What it is

The skills pipeline is the full sequence of skills that govern delivery from idea to merged, traced, and assured PR. Each skill governs one phase of delivery. Skills chain together: the output of one phase (an artefact written to the repository) is the input to the next.

The pipeline has 38 skills across four groups: outer loop skills (discovery through DoR), inner loop skills (branch setup through branch complete), post-merge and observability skills (DoD, trace, improve), and platform governance skills.

## Why it exists

Without a pipeline, delivery is ad hoc — each story is structured differently, each agent run produces artefacts in a different format, and there is no structural connection between what was specified and what was delivered. The skills pipeline provides a consistent, governed path from idea to implementation that is repeatable across teams, surfaces, and delivery contexts.

The pipeline also makes delivery auditable. Because each phase produces structured artefacts and writes state, the full delivery history of any story is visible in the repository — without depending on memory, verbal handoffs, or external tracking tools.

## How it works

The pipeline flows in this sequence:

**Outer loop (human + AI agent):**
`/discovery` → `/benefit-metric` → `/definition` → `/review` → `/test-plan` → `/definition-of-ready`

**Inner loop (coding agent):**
`/branch-setup` → `/implementation-plan` → implementation (TDD) → `/verify-completion` → `/branch-complete`

**Post-merge:**
CI assurance gate → `/definition-of-done` → `/trace` → `/improve`

Each step has entry conditions (what must be true to start) and exit conditions (what must be produced to complete). The DoR gate is the boundary between outer and inner loops — a story cannot enter the inner loop without a human-approved DoR artefact.

## What you do with it

Start with `/workflow` — it reads `pipeline-state.json` and tells you where you are in the pipeline and what runs next. You never need to remember the sequence manually; the platform surfaces it.

For a brand-new team, the minimum viable path is: `/discovery` → `/definition` → inner loop → `/definition-of-done`. Add more phases as your governance needs grow.

Run `/workflow` whenever you are unsure of the next step. It is always safe to run and will not advance your pipeline state — it only reports it.

## Further reading

Optional further reading: [Outer loop and inner loop](outer-loop-inner-loop.md) — the structural separation between specification and implementation.
Optional further reading: [Definition of Ready](definition-of-ready.md) — the gate that separates the two loops.
