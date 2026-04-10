---
applyTo: "**"
---

# Pipeline artefact protection

The `artefacts/` directory contains pipeline inputs — discovery artefacts, stories, test plans, DoR checklists, verification scripts, and review reports. These files are the specification that governs what gets built. They are written by pipeline skills (discovery, definition, test-plan, definition-of-ready) and are read-only inputs for the coding agent.

**Do not create, modify, or delete any file under `artefacts/`.**

**Exception — `benefit-metric.md`:** This file is a living measurement document, not a read-only spec. The coding agent may add fields to the M1 (or other metric) evidence section of `benefit-metric.md` only when the DoR artefact's contract explicitly names the specific section and fields to write. Do not add, alter, or remove any other section of this file.

If an artefact appears incomplete, missing, or contradictory, add a PR comment describing the specific issue and stop. Do not attempt to fix or supplement artefacts inline — that is a pipeline operator action performed via the appropriate skill.

Similarly, do not modify `.github/skills/`, `.github/templates/`, `.github/governance-gates.yml`, or `.github/pipeline-state.schema.json`. These are platform infrastructure files. Changes to these require a deliberate pipeline evolution cycle, not a coding task.

`workspace/state.json` and `.github/pipeline-state.json` may be updated by the coding agent only when explicitly instructed to do so by the DoR artefact's Coding Agent Instructions block.
