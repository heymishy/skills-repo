# Governance by Demonstration

## What it is

Every governed action in the platform commits a structured trace entry to the repository, recording a verifiable instruction set hash alongside the artefacts produced at that phase. Governance is evidenced from the artefact chain — not recalled from memory, not attested by a participant, not inferred from a status field someone set manually.

## Why it exists

Audits and retrospectives that rely on participant recall are unreliable. Memory fades, people leave teams, and "we followed the process" cannot be demonstrated after the fact. By treating every pipeline phase as a write operation — committing a trace that includes what instruction set was used, when, and what was produced — the platform makes governance a structural property of the repository rather than a social contract.

## How it works

When a skill completes a phase, it writes a state update to `pipeline-state.json` and a trace entry to `workspace/traces/`. Each trace includes:

- The instruction set hash (verifying which version of the skill was used)
- The phase boundary timestamp
- Links to the artefacts produced
- The human or agent identity that triggered the phase

The assurance gate CI check reads these entries on every PR and verifies that the chain is complete before allowing merge.

## What you do with it

You don't need to write trace entries manually — the skills write them. Your role is to not skip steps. If a skill asks you to approve before proceeding, approve it in the platform (not by editing a file directly). If you bypass a step, the assurance gate will detect the gap in the trace and block the PR.

When something goes wrong, the trace is where you look first. It tells you exactly which phase ran, with which instruction set version, producing which artefacts — making root-cause investigation structural rather than conversational.

## Further reading

Optional further reading: [Self-improving harness](self-improving-harness.md) — explains how traces feed back into platform improvement.
