## Story: Design governance package manifest and lockfile format

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4-opus/epics/e2-distribution-zero-commit-install.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

## User Story

As a **tech lead at work (Craig's context)**,
I want to **have a defined manifest format that declares what a governance package contains and a lockfile format that records the installed version with per-file hashes**,
So that **the install and sync tooling has a stable contract to build against, and consumers can verify the integrity of their installed governance package (M1)**.

## Benefit Linkage

**Metric moved:** M1 (Distribution sync — zero-commit install and sync success rate)
**How:** The manifest is the contract between the publisher and the consumer. Without a defined format, every install/sync operation is ad hoc and fragile. A well-designed manifest directly supports the ≥90% sync success rate target by making the package contents explicit and verifiable.

## Architecture Constraints

- **MC-CORRECT-02 / ADR-003 (schema-first):** The manifest and lockfile formats must be defined as schemas before any tooling is built against them
- **C5 (hash-verified skill files):** The lockfile must include per-file hashes — this is the mechanism by which hash verification works at the consumer side
- **ADR-004 (context.yml single config source):** The manifest must declare its relationship to `context.yml` — e.g. does the package include a default `context.yml` template, or is seeding a separate concern?
- **ADR-012 (platform-agnostic):** Manifest format must not depend on any platform-specific packaging system (e.g. npm's `package.json`)

## Dependencies

- **Upstream:** Spike C must have a PROCEED verdict — the distribution model determines what the manifest describes
- **Downstream:** implement-zero-commit-install, implement-sync-command, implement-lockfile-hash-verification all build against this manifest format

## Acceptance Criteria

**AC1:** Given the governance package boundary from Spike A and the distribution model from Spike C, When the manifest format is defined, Then it is a schema (JSON Schema or YAML schema) that declares: (a) package name and version, (b) the list of included files with relative paths, (c) the upstream source reference, and (d) the minimum pipeline version compatibility.

**AC2:** Given the manifest format from AC1, When the lockfile format is defined, Then it is a schema that records: (a) the installed manifest version, (b) per-file SHA-256 hashes for every file in the package, (c) the installation timestamp, and (d) the upstream source reference at time of install.

**AC3:** Given both schemas from AC1 and AC2, When I validate them against the existing repo structure (the current `.github/skills/`, `.github/templates/`, `scripts/`, and `standards/` directories), Then the manifest can describe the current governance package contents without requiring structural changes to the repo.

## Out of Scope

- Implementing the install or sync commands — those are separate stories
- Implementing hash verification tooling — that is a separate story
- Defining the publishing pipeline (CI/CD that publishes the manifest) — that is part of Spike C's distribution model
- `context.yml` seeding logic — that is a separate story

## NFRs

- **Security:** Manifest and lockfile schemas must not include fields for credentials or tokens (MC-SEC-02)
- **Performance:** None
- **Accessibility:** None

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — conditioned on Spike C PROCEED

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/stories/design-package-manifest.md |
| run_timestamp | 2026-04-19T18:52:00Z |

> **Security note:** `model_label` is a descriptive string only (MC-SEC-02).

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 3 |
| constraints_inferred_count | 4 |
| intermediates_prescribed | 1 |
| intermediates_produced | 1 |

**files_referenced:**

- artefacts/2026-04-19-skills-platform-phase4/discovery.md
- artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

### Fidelity self-report

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| AC coverage | 5 | 3 ACs: manifest schema, lockfile schema, compatibility with existing repo structure |
| Scope adherence | 5 | Schema definitions only — no install/sync implementation |
| Context utilisation | 5 | Schema-first constraint (MC-CORRECT-02), C5 hash verification, ADR-004 all incorporated |

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
