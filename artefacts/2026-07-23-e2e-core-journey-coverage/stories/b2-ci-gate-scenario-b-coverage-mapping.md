## Story: Add Scenario B to the CI-blocking gate and publish the spec-to-journey-step coverage mapping

**Epic reference:** artefacts/2026-07-23-e2e-core-journey-coverage/epics/epic-b-formed-idea-journey-e2e-full-gate-data-hygiene.md
**Discovery reference:** artefacts/2026-07-23-e2e-core-journey-coverage/discovery.md
**Benefit-metric reference:** artefacts/2026-07-23-e2e-core-journey-coverage/benefit-metric.md

## User Story

As a **Hamish King (Founder/Operator)**,
I want to **have Scenario B (B1's outer-loop-to-DoR spec) added to the same CI-blocking gate A5 established, and a documented mapping of which real user-facing step each E2E assertion actually proves**,
So that **the E2E CI gate metric (m1) reaches its full target (both scenarios blocking, not just the minimum signal), and coverage claims are auditable rather than asserted from memory**.

## Benefit Linkage

**Metric moved:** E2E CI gate on core signup/billing/creation journeys (m1)
**How:** This story is the final step that converts the metric from "minimum validation signal met" (A5, Scenario A only) to "target met" (both scenarios blocking) — and the coverage mapping is the metric's own stated measurement method, not an optional extra.

## Architecture Constraints

- Same as A5: new CI-blocking gate applies only to Scenario A and Scenario B — the 29 existing local-mocked specs remain non-blocking. ADR-018 (Playwright in `tests/e2e/`, devDependency only, unit chain must not invoke Playwright) applies identically.
- **Config governance bridge (ADR-004):** the gate's enablement flags belong in `.github/context.yml`, following the same pattern A5 establishes — not hardcoded into workflow YAML.

## Dependencies

- **Upstream:** A5 (Scenario A CI gate wiring) — this story extends the same gate mechanism rather than building a second, parallel one. B1 (the Scenario B spec itself) must also exist and pass locally before this story can wire it as blocking.
- **Downstream:** None — this is the epic's/feature's completion point for the CI-gate metric.

## Acceptance Criteria

**AC1:** Given a PR that intentionally breaks a step covered by Scenario B (e.g. reverting B1's story-map canvas rendering), When CI runs on that PR, Then the Scenario B E2E job fails and the PR's merge is blocked.

**AC2:** Given a PR with no regression in either Scenario A or Scenario B's covered paths, When CI runs, Then both E2E jobs pass and neither blocks merge.

**AC3:** Given both scenarios are now wired, When a new coverage-mapping document (e.g. `artefacts/2026-07-23-e2e-core-journey-coverage/coverage/spec-to-journey-step-mapping.md`) is inspected, Then it lists every real user-facing journey step from discovery's MVP Scope (both Scenario A's 7 steps and Scenario B's 4 steps) and names which spec file and assertion (AC reference) proves each one — with no journey step left unmapped.

**AC4:** Given the coverage mapping document, When cross-checked against the actual spec files, Then every AC referenced in the mapping genuinely exists in the named spec file — the mapping is generated/verified against real code, not hand-asserted from the story artefacts alone.

## Out of Scope

- Adding any journey beyond Scenario A and Scenario B to this gate — no third scenario in this feature's MVP scope
- A fully automated mapping-generation tool — a manually authored (but code-verified per AC4) markdown document is sufficient for this MVP

## NFRs

- **Performance:** Combined Scenario A + Scenario B CI job runtime should stay under a total of ~10 minutes for the E2E portion of a PR's CI run, to keep the feedback loop usable.
- **Security:** None beyond A5's existing staging-credential handling.
- **Accessibility:** Not applicable.
- **Audit:** The coverage mapping document itself is the audit artefact — reviewed by Hamish King (sole reviewer) whenever a new journey step is added to either scenario.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
