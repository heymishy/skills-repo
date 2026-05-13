# DoR Contract: Define experiment workspace structure and manifest format

**Story:** spc.4-experiment-workspace-structure
**Feature:** 2026-04-18-skill-performance-capture
**Approved:** 2026-04-18
**RISK-ACCEPT 1-M8 in effect:** AC1 deliverable is `workspace/experiments/README.md` specifically.

---

## What will be built

`workspace/experiments/README.md` documenting the experiment directory structure (`workspace/experiments/[experiment-id]/` with `manifest.md` and per-model subdirectories). Includes a manifest template with all required fields. A comment addition to `contexts/personal.yml` referencing the output path. Test exclusion verified/added for `workspace/experiments/`.

## What will NOT be built

- No automated experiment directory or manifest creation
- No CI checks on workspace/experiments/ contents
- No artefact copying tooling

## AC verification mapping

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Read workspace/experiments/README.md, assert structure description present | Unit (file inspection) — per RISK-ACCEPT 1-M8 |
| AC2 | Inspect README manifest template, assert all fields present | Unit (file inspection) |
| AC3 | Read package.json, assert workspace/experiments/ not scanned | Unit (package.json inspection) |
| AC4 | Read contexts/personal.yml, assert output path reference in comment | Unit (file inspection) |

## Assumptions

- workspace/experiments/ does not yet exist; agent creates it
- contexts/personal.yml update is a comment addition only
- Existing test globs likely already exclude workspace/

## schemaDepends

`schemaDepends: []` — upstream dependency is on context.yml field name `experiment_id` (spc.1), not on pipeline-state.json fields.

## Estimated touch points

Files: `workspace/experiments/README.md` (new), `contexts/personal.yml` (comment addition), `package.json` or `.gitignore` (only if exclusion needed). Services: none. APIs: none.
