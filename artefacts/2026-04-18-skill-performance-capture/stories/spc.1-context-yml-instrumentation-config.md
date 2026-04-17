# Story: Define `context.yml` instrumentation config schema

**Epic reference:** artefacts/2026-04-18-skill-performance-capture/epics/e1-skill-performance-capture.md
**Discovery reference:** artefacts/2026-04-18-skill-performance-capture/discovery.md
**Benefit-metric reference:** artefacts/2026-04-18-skill-performance-capture/benefit-metric.md

## User Story

As a **platform maintainer tuning skills**,
I want to add an `instrumentation:` block to `context.yml` with a documented schema,
So that I can enable capture for a specific experiment without modifying any governed skill files.

## Benefit Linkage

**Metric moved:** M1 — Capture block completeness rate
**How:** This story establishes the opt-in config shape that spc.3 reads to decide whether to append capture blocks. Without a validated schema, agents cannot reliably detect whether instrumentation is enabled — completeness cannot be measured.

## Architecture Constraints

- Config reading in skills: all config lives in `context.yml` — no hardcoded values (architecture-guardrails.md, Approved Patterns)
- MC-SEC-02: No credentials or tokens in committed files — the `model_label` and `cost_tier` fields must record only descriptive strings, not API keys
- Skill and template files: changes to `.github/context.yml` schema must be described in documentation, not just inferred

## Dependencies

- **Upstream:** None — this is the first story in risk-order
- **Downstream:** spc.2 (capture block schema references the `experiment_id` field), spc.3 (agent instructions read the `enabled` flag)

## Acceptance Criteria

**AC1:** Given `contexts/personal.yml` (the canonical personal-project context template), When I inspect it, Then it contains an `instrumentation:` block (commented out / disabled by default) with the following documented fields: `enabled` (boolean, default false), `experiment_id` (string, required when enabled), `model_label` (string, required when enabled), `cost_tier` (string, one of `standard` | `premium`, required when enabled).

**AC2:** Given a `context.yml` with `instrumentation.enabled: true` and all required fields present, When a skill reads context.yml, Then the instrumentation block is parseable and all four fields are accessible without error.

**AC3:** Given a `context.yml` with `instrumentation.enabled: true` but missing `experiment_id`, When the skill reads config, Then the missing field is detectable (the field is absent or null) — confirmed by a governance check script in spc.5.

**AC4:** Given a `context.yml` with `instrumentation.enabled: false` (or no instrumentation block), When the outer loop runs, Then no capture blocks are expected and a completeness check skips without error.

**AC5:** Given the `contexts/personal.yml` template, When an operator copies it to `.github/context.yml`, Then the instrumentation block is off by default and the operator can enable it by uncommenting and filling in the three required fields — this workflow is documented in a comment in the template file.

## Out of Scope

- Validating the content of `model_label` or `cost_tier` against an allowed-values list — operators provide these as free-text descriptors
- Reading the instrumentation block in any skill logic — that is spc.3
- Creating the experiment workspace directory — that is spc.4

## NFRs

- **Security:** `model_label` and `cost_tier` fields must be descriptive strings only — no API keys, tokens, or credentials
- **Consistency:** MC-CONSIST-02 — if this schema is read by a new governance check script (spc.5), the field names used in the script must match the names defined here exactly

## Complexity Rating

**Rating:** 1 — well understood, clear path; schema addition to an existing template file
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
