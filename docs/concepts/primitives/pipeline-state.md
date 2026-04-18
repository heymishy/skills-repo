# Pipeline State

## What it is

`pipeline-state.json` is the structured state file written at each phase boundary. It is the ground-truth handoff record between sessions and between agents. A new session reads `pipeline-state.json` and resumes without verbal priming — there is no need to re-explain where you are in the pipeline.

The file tracks the current state of every feature in the pipeline: which phases have run, which gates have been passed, which artefacts have been produced, and which humans have approved which decisions.

## Why it exists

Without a persistent state record, every session starts from scratch. The operator must remember (or re-explain) which phase was last completed, what was approved, and what the agent is allowed to do next. As teams grow and features multiply, this becomes unworkable.

Pipeline state solves this by externalising session context into the repository itself. The state file is committed, versioned, and readable by any agent or any team member at any point. It is also the evidence source that the assurance gate and governance checks read — making it both a continuity mechanism and an audit record.

## How it works

Skills write to `pipeline-state.json` at the end of each phase. The write is a mandatory final step of every skill — a skill that does not write state is considered incomplete. The state file's structure is defined by `pipeline-state.schema.json`, which is the contract between skills (writers) and the viz/gate (readers).

Key fields in the state file include:

- `currentPhase`: the active pipeline phase
- `stories[]`: the list of features and their per-phase evidence fields (e.g. `reviewStatus`, `dorStatus`, `dodStatus`)
- `lastUpdated`: ISO 8601 timestamp of the last write

The schema is schema-first: new fields must be added to `pipeline-state.schema.json` before being used by any skill or visualisation tool.

## What you do with it

You do not edit `pipeline-state.json` directly in normal operation — skills write it. If you need to inspect pipeline state, read the file or use the pipeline visualisation tool (`dashboards/pipeline-viz.html`).

If the state file is missing or corrupt, run `/workflow` — it will diagnose the state and tell you how to recover. If a field is absent that you expect to be present, check that the corresponding skill completed its mandatory state write.

## Further reading

Optional further reading: [Governance by demonstration](../principles/governance-by-demonstration.md) — explains why state writes are mandatory and why the file is the source of truth.
Optional further reading: [Skill](skill.md) — explains how skills are the writers of pipeline state.
