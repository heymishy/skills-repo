# Story: Define experiment workspace structure and manifest format

**Epic reference:** artefacts/2026-04-18-skill-performance-capture/epics/e1-skill-performance-capture.md
**Discovery reference:** artefacts/2026-04-18-skill-performance-capture/discovery.md
**Benefit-metric reference:** artefacts/2026-04-18-skill-performance-capture/benefit-metric.md

## User Story

As a **operator running a comparison experiment**,
I want a defined directory structure and manifest file for each experiment run,
So that when I run the same scenario twice with different models I have a consistent location to find results and a record of what each run was.

## Benefit Linkage

**Metric moved:** MM1 — Context breadth; MM2 — Constraint inference rate; MM3 — Artefact linkage richness
**How:** The experiment directory is where the operator reads capture blocks side by side and records the comparison. Without a defined structure, there is no governed location for the output — operators cannot reliably find or compare results across runs, and the meta-metrics cannot be evaluated.

## Architecture Constraints

- C11 (product/constraints.md): capture data lives in the repo as files, not external services — `workspace/experiments/` is the correct root
- MC-SEC-02: No credentials or tokens in committed files — the manifest file must not record API keys; `model_label` and `cost_tier` are descriptive strings only
- Artefacts directory is read-only by pipeline convention — experiment output goes in `workspace/`, not `artefacts/`

## Dependencies

- **Upstream:** spc.1 — `experiment_id` from `context.yml` determines the directory name (`workspace/experiments/[experiment_id]/`)
- **Downstream:** None — this story has no stories that depend on it within this feature

## Acceptance Criteria

**AC1:** Given the feature documentation (or a README in `workspace/experiments/`), When I follow the defined structure, Then each experiment lives at `workspace/experiments/[experiment-id]/` and contains: a `manifest.md` file (run metadata), one subdirectory per model run named `[model-label]/`, and within each model run directory an `artefacts/` subfolder where the operator copies or links the artefact files produced during that run.

**AC2:** Given a `manifest.md` file at `workspace/experiments/[experiment-id]/manifest.md`, When I inspect it, Then it contains: `experiment_id`, `scenario_description` (what outer loop scenario was run), `runs[]` (array of: `model_label`, `cost_tier`, `run_date`, `artefact_paths[]`), and a `comparison_notes` section for operator observations post-run.

**AC3:** Given a `workspace/experiments/` directory with one or more experiment subdirectories, When I run `npm test`, Then the test suite does not fail or warn because of files in `workspace/experiments/` — the directory is excluded from governance checks by `.gitignore` or test filter (experiment output is operator working data, not governed pipeline artefacts).

**AC4:** Given the `contexts/personal.yml` template (updated in spc.1), When I read the instrumentation block comment, Then it references `workspace/experiments/[experiment-id]/` as the output location for experiment results — the path is documented alongside the config that drives it.

## Out of Scope

- Automatically creating the experiment directory or manifest during a session — the operator creates these manually before or after the run
- Copying artefact files into the experiment directory — the operator does this manually as part of running the experiment
- Any CI check on the contents of `workspace/experiments/` — this is operator working data

## NFRs

- **Security:** `manifest.md` must not record API keys, tokens, or credentials — `model_label` and `cost_tier` fields are descriptive strings only; a comment in the manifest template must state this
- **Consistency:** The `experiment_id` field in the manifest must match the `experiment_id` used in the `context.yml` instrumentation block and the directory name — three-way consistency is the operator's responsibility, documented in the manifest template

## Complexity Rating

**Rating:** 1 — well understood; defines a directory convention and a Markdown template
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
