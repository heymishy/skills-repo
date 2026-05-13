# T2 — Vague input clarification / claude-sonnet-4-6 / Run 1

**Date:** 2026-05-10
**Model:** claude-sonnet-4-6
**Case:** T2-vague-input-clarification
**Experiment:** EXP-001-discovery-phase4-5
**Status:** CONFOUNDED — model read `product/mission.md`, `product/tech-stack.md`, `product/constraints.md` from this repo; interpreted "new business customers" as skills-platform users. Superseded by run-2 (fresh repo, no product context).

---

## Operator input

Improve the onboarding experience for new business customers.

---

## Model response

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/workspace/state.json#1-1), lines 1 to 60

Read skill [discovery](file:///c%3A/Users/Hamis/code/skills%20repo/.github/skills/discovery/SKILL.md?vscodeLinkType%3Dskill#1-1), lines 1 to 80

Read skill [discovery](file:///c%3A/Users/Hamis/code/skills%20repo/.github/skills/discovery/SKILL.md?vscodeLinkType%3Dskill#80-80), lines 80 to 200

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/product)

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/.github/context.yml#1-1), lines 1 to 30

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/product/tech-stack.md#1-1), lines 1 to 40

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/product/mission.md#1-1), lines 1 to 40

Read [](file:///c%3A/Users/Hamis/code/skills%20repo/product/constraints.md#1-1), lines 1 to 40

**Product context read:**
- Target users: Developers/engineers, tech leads, platform maintainers (primary); product managers, business analysts, UX roles (secondary)
- Known constraints: update channel integrity, POLICY.md floors non-negotiable, human approval gate required for instruction set changes, hash-verified instruction sets
- EA registry: authoritative (`ea_registry_authoritative: true`) — no specific onboarding system registered (new initiative, no blast-radius entry found)

---

Running `/discovery` for your initiative.

Your seed: *"Improve the onboarding experience for new business customers."*

---

**What's actually happening now that shouldn't be — or not happening that should?**

I have your seed topic. To write a sharp problem statement, I need to understand the pain before the solution.

When a new business customer (product manager, business analyst, non-technical decision-maker) arrives at the skills platform today — what breaks down? For example:

- They can't get started without hand-holding from a developer?
- The pipeline language and skill names are opaque to non-engineers?
- There's no guided entry point for someone who doesn't already understand the outer loop?
- They drop off before completing their first discovery artefact?

What's the real failure mode you're seeing?
