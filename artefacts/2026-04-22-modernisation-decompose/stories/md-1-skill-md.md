# Story: Write `/modernisation-decompose` SKILL.md

**Epic reference:** artefacts/2026-04-22-modernisation-decompose/epics/e1-modernisation-pipeline-bridging.md
**Discovery reference:** artefacts/2026-04-22-modernisation-decompose/discovery.md
**Benefit-metric reference:** artefacts/2026-04-22-modernisation-decompose/benefit-metric.md

## User Story

As a **platform maintainer**,
I want to author a complete, executable `/modernisation-decompose` SKILL.md following established skill conventions,
So that delivery squad leads running a Java legacy modernisation programme have a consistent, pipeline-governed path from a rev-eng corpus to bounded candidate features — moving M1 (decomposition consistency ≥80% cross-operator agreement) and MM-A (≥75% first-run acceptance without boundary revision).

## Benefit Linkage

**Metric moved:** M1 (decomposition consistency), MM-A (first-run acceptance rate)
**How:** The SKILL.md defines the canonical Java boundary heuristics that every operator uses. When two operators follow the same heuristic steps on the same corpus, their outputs converge. The quality and precision of those heuristics directly determines whether squad leads use the output as-is (MM-A) or revise it.

## Architecture Constraints

- Skill and template files: Markdown only — no embedded HTML except HTML comments for instructions. Follow established section headings used in existing SKILL.md files.
- ADR-011: This story IS the story artefact required before the SKILL.md file can be committed to the repo — the artefact-first rule is satisfied by this story's existence.
- `check-pipeline-artefact-paths.js` — PIPELINE_PATHS must be updated if the new skill introduces a new output path that other skills read. Verify after writing; coordinate with md-2 if the skill adds a path the contracts checker must also cover.
- Skill structural markers: the SKILL.md must contain at minimum: YAML frontmatter with `name`, `description`, `triggers`; at least one numbered step section; a `## Completion output` section; a `## State update — mandatory final step` section. These are checked by `check-skill-contracts.js` — the structural contracts for the new skill are registered in md-2.

## Dependencies

- **Upstream:** None — this is the highest-risk story; starts first.
- **Downstream:** md-2 (skill contracts registration) depends on the structural markers defined here; md-3 (ADR-014) is independent but benefits from knowing the final scope of the skill.

## Acceptance Criteria

**AC1:** Given a SKILL.md file exists at `.github/skills/modernisation-decompose/SKILL.md`, when `check-skill-contracts.js` runs as part of `npm test`, then the new skill passes all structural contract checks with 0 failures.

**AC2:** Given a reverse-engineering report exists at `artefacts/[system-slug]/reverse-engineering-report.md`, when a platform engineer invokes `/modernisation-decompose`, then the skill's entry condition step detects the report and confirms the system-slug before proceeding — and blocks gracefully with a clear error message if no reverse-engineering report is found.

**AC3:** Given a well-formed rev-eng report for a Java system (containing at minimum: extracted rules with `[VERIFIED]`/`[UNCERTAIN]` ratings, identified interfaces, and a Maven module inventory), when the skill runs the decomposition step, then it surfaces at least one Java boundary signal per proposed feature boundary (Maven module, Spring `@Service`, JPA aggregate root, or `@Transactional` span) as the stated rationale for that boundary — not a generic grouping label.

**AC4:** Given the skill completes a decomposition run, when the mandatory state update step executes, then it writes to `artefacts/[system-slug]/corpus-state.md`: the module coverage percentage (rules decomposed / total extracted rules), the `[VERIFIED]:[UNCERTAIN]` rule rating ratio, and a `lastRunAt` timestamp — creating the file if it does not exist, updating it if it does.

**AC5:** Given the skill produces a `candidate-features.md`, when a squad lead reads any candidate feature entry, then each entry contains: a proposed feature slug, a one-sentence problem statement derived from the decomposed rules, a list of the rules assigned to the feature (by rule ID), a proposed persona (derived from the rule domain), and a pre-populated MVP scope paragraph — sufficient to paste directly into a `/discovery` run without manual augmentation.

**AC6:** Given a low-signal codebase condition is detected (e.g. no Maven module structure found, circular package dependencies, no `@Service` annotations), when the skill reaches the decomposition step, then it surfaces an explicit escalation prompt to the operator naming the specific missing signals and offering three options: (1) proceed with package-level grouping as a fallback signal, (2) request the operator provides module boundary information manually, (3) abort the decomposition and record the system as low-signal in `corpus-state.md`.

**AC7:** Given the skill's completion output step, when a candidate-features.md is saved, then every candidate feature entry includes the field `umbrellaMetric: true` and a note stating: "This feature was produced by /modernisation-decompose. All stories must reference the umbrella Tier-3 parity metric defined at [artefacts/[system-slug]/corpus-state.md]."

## Out of Scope

- Non-Java language heuristics (COBOL, PL/SQL, .NET) — the SKILL.md must include a clearly labelled extension point comment but must not implement non-Java signals in this story.
- Pipeline visualiser integration for corpus-state.md fields — convergence fields are written to the file; rendering them in the viz is post-MVP.
- Automated running of `/modernisation-decompose` — this is an operator-invoked skill, not a CI trigger.
- Changes to `/review`, `/definition`, or any other existing SKILL.md — the umbrella metric convention is enforced by the new skill's output format, not by modifying existing skills.

## NFRs

- **Consistency:** The decomposition heuristics must be deterministic given the same inputs — the same signal priorities, the same tie-breaking rules, the same fallback order. Non-deterministic outputs break M1.
- **Security:** `corpus-state.md` must not contain raw business rules, customer data references, or regulatory clause text from the source system — it records metrics only (counts, ratios, timestamps).
- **Audit:** `corpus-state.md` records `lastRunAt` so teams can track when the convergence metric was last updated.

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable — the Java heuristic specification contains design decisions (signal priority order, tie-breaking rules, low-signal escalation path) that may require iteration after first use.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
