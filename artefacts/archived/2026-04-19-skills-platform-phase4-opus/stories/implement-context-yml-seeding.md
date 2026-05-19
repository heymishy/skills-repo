## Story: Implement context.yml seeding on first install

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4-opus/epics/e2-distribution-zero-commit-install.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

## User Story

As a **tech lead setting up a new consumer repo (Craig's context)**,
I want to **have `context.yml` automatically seeded with sensible defaults on first install, with clear comments indicating which fields I should customise**,
So that **I can start using the pipeline immediately without reading the full `context.yml` documentation or guessing which fields are required (M1)**.

## Benefit Linkage

**Metric moved:** M1 (Distribution sync — zero-commit install and sync success rate)
**How:** If the install completes but the consumer cannot run the pipeline because `context.yml` is missing or misconfigured, the install has functionally failed. Seeding with annotated defaults turns install into a working state, directly supporting the M1 success rate.

## Architecture Constraints

- **ADR-004 (context.yml single config source):** `context.yml` is the single source of truth for all pipeline configuration. Seeding must create this file in the correct location (`.github/context.yml`) with the correct structure.
- **C1 (update channel never severed):** Seeded `context.yml` must include the `skills_upstream` block with the upstream source reference pre-populated from the install command's parameters
- **Consumer customisation boundary:** Seeded fields must be clearly divided into "governed defaults" (should not be changed) and "consumer settings" (should be changed). This division must be visible in the seeded file via comments, not just documentation.

## Dependencies

- **Upstream:** implement-zero-commit-install — seeding runs as part of or immediately after the install process
- **Downstream:** None directly; but validate-install-sync-e2e tests the seeded `context.yml`

## Acceptance Criteria

**AC1:** Given the install command has completed successfully, When `context.yml` is inspected, Then it exists at `.github/context.yml` and contains: (a) the `skills_upstream` block with the upstream reference, (b) the `instrumentation` block with defaults, (c) the `tools` block with placeholder entries, and (d) the `architecture` block with defaults.

**AC2:** Given the seeded `context.yml`, When I read the file, Then every governed default field has a comment explaining its purpose, and every consumer-customisable field has a comment starting with `# CUSTOMISE:` indicating the consumer should set it.

**AC3:** Given a consumer repo where `context.yml` already exists (e.g. from a previous install), When the install command runs, Then seeding is skipped for `context.yml` — the existing consumer-customised file is not overwritten.

## Out of Scope

- Full `context.yml` documentation — this story seeds defaults with inline comments, not a reference guide
- Validation that the seeded `context.yml` is complete for a specific pipeline phase — validation is a separate concern
- Sync behaviour for `context.yml` — the sync story explicitly preserves consumer-modified files; seeding only runs on first install

## NFRs

- **Security:** Seeded `context.yml` must not include tokens, API keys, or credentials in default values (MC-SEC-02)
- **Performance:** None — seeding is a single file write
- **Accessibility:** None — file content, not UI

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable — ADR-004 and the existing `context.yml` structure define the target clearly

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

---

## Capture Block

### Metadata

| Field | Value |
|-------|-------|
| experiment_id | exp-phase4-sonnet-vs-opus-20260419 |
| model_label | claude-opus-4-6 |
| cost_tier | high |
| skill_name | definition |
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/stories/implement-context-yml-seeding.md |
| run_timestamp | 2026-04-19T18:52:00Z |

> **Security note:** `model_label` is a descriptive string only (MC-SEC-02).

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 3 |
| constraints_inferred_count | 3 |
| intermediates_prescribed | 1 |
| intermediates_produced | 1 |

**files_referenced:**

- artefacts/2026-04-19-skills-platform-phase4/discovery.md
- artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

### Fidelity self-report

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| AC coverage | 5 | 3 ACs: seeded content, inline documentation, existing-file guard |
| Scope adherence | 5 | Seeding only — no validation, no sync, no full documentation |
| Context utilisation | 5 | ADR-004 central; C1 upstream reference in seeded file; consumer customisation boundary clearly defined |

### Backward references

- target: artefacts/2026-04-19-skills-platform-phase4/discovery.md
  accurate: yes

### Operator review

| Field | Value |
|-------|-------|
| context_score | |
| linkage_score | |
| notes | |
| reviewed_by | |
