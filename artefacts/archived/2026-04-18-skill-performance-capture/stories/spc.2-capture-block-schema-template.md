# Story: Define capture block schema and Markdown template

**Epic reference:** artefacts/2026-04-18-skill-performance-capture/epics/e1-skill-performance-capture.md
**Discovery reference:** artefacts/2026-04-18-skill-performance-capture/discovery.md
**Benefit-metric reference:** artefacts/2026-04-18-skill-performance-capture/benefit-metric.md

## User Story

As a **platform maintainer tuning skills**,
I want a documented capture block schema and a reusable Markdown template,
So that capture blocks appended to different artefacts across two model runs share a consistent structure I can compare side by side.

## Benefit Linkage

**Metric moved:** M1 — Capture block completeness rate; MM1 — Context breadth; MM2 — Constraint inference rate; MM3 — Artefact linkage richness
**How:** The capture block schema defines the specific fields — `files_referenced`, `constraints_inferred`, `backward_references` — that MM1, MM2, and MM3 measure. Without a consistent schema, two runs produce incomparable data regardless of how complete each individual block is. This story is what makes M1's "fully populated" criterion testable.

## Architecture Constraints

- MC-SEC-02: No credentials or tokens in committed files — the capture block must not record API keys, session tokens, or personal data
- Skill and template files: Markdown only, no embedded HTML except HTML comments for instructions; Unix line endings (architecture-guardrails.md)
- C13 (product/constraints.md): structural metrics preferred over self-report where both are available — the schema should prefer countable/observable fields (file count, reference count) over free-text judgements where possible

## Dependencies

- **Upstream:** spc.1 — schema references `experiment_id` and `model_label` from the `context.yml` instrumentation block; those field names must be established first
- **Downstream:** spc.3 (agent instructions reference the template path), spc.5 (governance check validates presence of required fields)

## Acceptance Criteria

**AC1:** Given a new file at `.github/templates/capture-block.md`, When I inspect it, Then it contains the following required sections: `## Capture Block`, a metadata table (`experiment_id`, `model_label`, `cost_tier`, `skill_name`, `artefact_path`, `run_timestamp`), a structural metrics section (`turn_count`, `files_referenced` as a list, `constraints_inferred_count`, `intermediates_prescribed` vs `intermediates_produced`), a fidelity self-report section (free text, labelled as agent self-report), a `backward_references` section (list of references with `target` and `accurate: yes/no`), and an operator review section with fields for `context_score` (1–5), `linkage_score` (1–5), `notes`, and `reviewed_by`.

**AC2:** Given the capture block template, When I count the required fields in the metadata table, Then there are exactly six: `experiment_id`, `model_label`, `cost_tier`, `skill_name`, `artefact_path`, `run_timestamp` — no more, no less in the required section.

**AC3:** Given a capture block appended to `discovery.md` from one model run and a capture block appended to `discovery.md` from a second model run with a different `model_label`, When I compare the two blocks, Then I can calculate a numeric delta for `files_referenced` count, `constraints_inferred_count`, and the ratio of `accurate: yes` entries in `backward_references` — without any ambiguity about what is being compared.

**AC4:** Given the capture block template, When the `operator review` section is left blank (not yet filled in), Then the block is still structurally complete — operator review is optional at capture time and mandatory only before the experiment report is written.

**AC5:** Given the template file at `.github/templates/capture-block.md`, When it is appended to a phase output artefact, Then it renders as a valid Markdown section with no broken formatting — confirmed by reading the resulting artefact in a Markdown viewer.

## Out of Scope

- Automated parsing or diffing of capture block fields — analysis is manual operator work
- Version history of the schema — this is the initial version; evolution is a future story if needed
- Separate schemas per artefact type — one template covers all phase output artefacts

## NFRs

- **Security:** The `fidelity_self_report` free-text field must include a comment in the template warning that it must not contain session tokens, user identifiers, or credentials
- **Consistency:** Field names in this template must exactly match the field names used by the governance check script in spc.5

## Complexity Rating

**Rating:** 2 — some design decisions in the schema (what fields, what types, how to balance structural vs self-report)
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
