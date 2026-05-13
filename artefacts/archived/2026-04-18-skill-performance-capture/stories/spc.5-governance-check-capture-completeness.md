# Story: Governance check — validate capture block completeness

**Epic reference:** artefacts/2026-04-18-skill-performance-capture/epics/e1-skill-performance-capture.md
**Discovery reference:** artefacts/2026-04-18-skill-performance-capture/discovery.md
**Benefit-metric reference:** artefacts/2026-04-18-skill-performance-capture/benefit-metric.md

## User Story

As a **operator running a comparison experiment**,
I want a script I can run against a completed experiment run that reports which expected capture blocks are present and fully populated,
So that I can confirm M1 (capture block completeness rate) before drawing any comparison conclusions.

## Benefit Linkage

**Metric moved:** M1 — Capture block completeness rate
**How:** This story provides the measurement tool for M1. Without a check script, the operator must manually inspect every artefact to count blocks — error-prone and not repeatable. The script makes M1 measurable in the precise sense the benefit-metric artefact defines: "operator manually checks each phase output artefact after the run; counts blocks present vs. expected."

## Architecture Constraints

- Scripts pattern: plain Node.js, no TypeScript, no transpilation, no external npm dependencies (pre-commit scripts use Node.js built-ins only) — architecture-guardrails.md
- MC-CORRECT-02: Any field written to `pipeline-state.json` by a script must exist in the schema — this script does not write to state, only reads artefact files
- MC-SEC-02: Script must not read or log credentials — it reads Markdown artefact files only

## Dependencies

- **Upstream:** spc.2 must be complete — the script validates presence of the required fields defined in the capture block schema
- **Upstream:** spc.1 must be complete — the script reads `context.yml` to determine which artefacts were expected to receive capture blocks
- **Downstream:** None within this feature

## Acceptance Criteria

**AC1:** Given a Node.js script at `scripts/check-capture-completeness.js`, When I run `node scripts/check-capture-completeness.js --artefact-dir artefacts/[feature-slug]`, Then the script scans all phase output artefacts in the directory, identifies which contain a `## Capture Block` section, reports a count of expected vs found blocks, and exits with code 0 if completeness is ≥ 80% and code 1 if below.

**AC2:** Given a phase output artefact with a capture block, When the script evaluates it, Then it checks for the presence of each required metadata field (`experiment_id`, `model_label`, `cost_tier`, `skill_name`, `artefact_path`, `run_timestamp`) and reports any missing fields as warnings in the output.

**AC3:** Given a phase output artefact without a capture block, When the script evaluates it, Then it is counted as a missing block and listed in the output with its file path, so the operator knows exactly which artefacts need capture blocks added or re-run.

**AC4:** Given `context.yml` with `instrumentation.enabled: false` (or no instrumentation block), When I run the script, Then it exits with code 0 immediately and outputs: "Instrumentation not enabled in context.yml — capture check skipped."

**AC5:** Given the script at `scripts/check-capture-completeness.js`, When I inspect `package.json`, Then the script is not added to the `npm test` chain — it is a manual operator tool, not a CI gate (experiment completeness is operator-managed, not a pipeline requirement).

## Out of Scope

- Adding the check to the `npm test` CI chain — this is an operator tool, not a pipeline governance gate
- Validating the content of the `fidelity_self_report` or `operator review` sections — those are free-text and not machine-checkable
- Cross-run comparison — the script checks one run's artefacts; comparison is manual operator work

## NFRs

- **Security:** The script reads Markdown artefact files only — it must not read, log, or output any file contents beyond field presence/absence reporting
- **Performance:** Script completes in under 5 seconds for a typical outer loop artefact set (5–15 files)

## Complexity Rating

**Rating:** 2 — similar to existing governance check scripts in `scripts/`; reads Markdown files, parses headings, reports findings
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
