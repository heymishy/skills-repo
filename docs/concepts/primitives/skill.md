# Skill

## What it is

A SKILL.md file encoding a complete delivery phase or discipline practice as a natural language instruction set. Each skill is versioned and hash-verified, and is loaded progressively at the phase boundary where it is needed. Skills are the building blocks of the pipeline: the `/discovery` skill governs the discovery phase, the `/definition` skill governs story decomposition, and so on.

## Why it exists

Without structured instruction sets, an AI agent working on delivery would operate from its general training — making up workflows, missing governance steps, and producing artefacts that differ in structure from run to run. By encoding each phase as a skill, the platform ensures that every run of `/discovery` follows the same process, produces artefacts in the same format, and writes state updates in a way the next phase can rely on.

Skills also make governance auditable: because each skill has a version and a hash, the trace entry for a phase records exactly which instruction set was used. If a skill is updated between two runs, the difference is visible in the trace.

## How it works

Each skill lives in `.github/skills/[skill-name]/SKILL.md`. When an operator invokes a skill (e.g. `/discovery`), the agent loads that skill file and follows its instructions for the session. The skill file specifies:

- Entry conditions (what must be true before the skill runs)
- The sequence of steps to execute
- The artefacts to produce and where to save them
- The mandatory state write at the end of the phase
- Exit conditions (what must be true before the skill is considered complete)

The hash of the SKILL.md content at the time of use is recorded in the trace, providing a verifiable link between the instruction set and the outcomes produced.

## What you do with it

As an operator, you invoke skills by name in the Copilot Chat panel (e.g. `/discovery`, `/definition`). You do not edit SKILL.md files as part of normal delivery — they are platform infrastructure. If you believe a skill needs to change, raise it through the improvement cycle (`/improve` or the improvement agent) so the change is reviewed and governed.

If you are extending the platform, a new capability that governs a delivery phase should be implemented as a new SKILL.md file, not as ad hoc instructions.

## Further reading

Optional further reading: [Skills pipeline](../building-blocks/skills-pipeline.md) — explains how skills chain together across the full delivery pipeline.
