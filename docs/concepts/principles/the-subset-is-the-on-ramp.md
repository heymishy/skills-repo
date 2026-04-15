# The Subset Is the On-Ramp

## What it is

Teams do not adopt all platform capabilities at once. The platform is designed so that a team can start with the disciplines and skills that are relevant to their current delivery context and expand progressively. Progressive skill disclosure loads skills at the phase boundary where they are needed, keeping context overhead manageable as team scope expands.

## Why it exists

A platform that requires full adoption before delivering any value will not be adopted. Early platform versions that imposed the full pipeline on all teams regardless of their readiness created friction without corresponding benefit, driving teams back to ad hoc processes. The subset-is-the-on-ramp principle makes initial adoption low-cost while keeping the full pipeline available for teams ready to use it.

## How it works

Skills are loaded individually at the phase boundary where they are needed. A team starting out might only run `/discovery`, `/definition`, and the inner coding loop. They gain the benefit of those phases without needing to configure the assurance gate, fleet registry, or improvement agent on day one. As their maturity grows — and as their delivery produces more traces — more capabilities become valuable and can be enabled incrementally.

The pipeline state file (`pipeline-state.json`) tracks which phases have run for each feature, so the platform always knows where a team is in the process even if they have not run all phases.

## What you do with it

Start with the phases that are most valuable for your current context. The minimum viable sequence is: `/discovery` → `/definition` → inner coding loop → `/definition-of-done`. Everything else is an enhancement.

When the team is ready to add more governance — more assurance, more traceability, more cross-team coordination — the additional skills are available and integrate with the state you have already built up.

## Further reading

Optional further reading: [Skills pipeline](../building-blocks/skills-pipeline.md) — explains the full pipeline structure and which steps are available.
