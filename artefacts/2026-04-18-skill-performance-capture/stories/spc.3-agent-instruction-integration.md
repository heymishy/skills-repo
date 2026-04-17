# Story: Add instrumentation instruction to `copilot-instructions.md`

**Epic reference:** artefacts/2026-04-18-skill-performance-capture/epics/e1-skill-performance-capture.md
**Discovery reference:** artefacts/2026-04-18-skill-performance-capture/discovery.md
**Benefit-metric reference:** artefacts/2026-04-18-skill-performance-capture/benefit-metric.md

## User Story

As a **operator running a comparison experiment**,
I want the agent to automatically append a capture block to each phase output artefact when instrumentation is enabled in `context.yml`,
So that I do not have to manually trigger or remember to request capture during a session.

## Benefit Linkage

**Metric moved:** M1 — Capture block completeness rate
**How:** The instruction in `copilot-instructions.md` is the mechanism that causes capture blocks to be appended. Without this instruction, even a correct `context.yml` config and a complete template produce no data — the agent has no instruction to act. This story converts the config schema and template into a working capture mechanism.

## Architecture Constraints

- C3 (product/constraints.md): skill instructions cannot be modified — the instrumentation instruction goes in `copilot-instructions.md` (active session context), not in any `SKILL.md` file
- Config reading in skills: the instruction must read `.github/context.yml` to detect whether instrumentation is enabled — cannot hardcode `enabled: true` (architecture-guardrails.md, Approved Patterns)
- MC-CONSIST-01: if this instruction causes any new fields to be written to `pipeline-state.json`, those fields must exist in `pipeline-state.schema.json` first (N/A for this story — capture blocks go in artefact files, not state)

## Dependencies

- **Upstream:** spc.1 must be complete — field names (`enabled`, `experiment_id`, `model_label`, `cost_tier`) must be established before this instruction can reference them
- **Upstream:** spc.2 must be complete — the instruction references the template at `.github/templates/capture-block.md` and specifies which artefacts receive blocks
- **Downstream:** spc.5 (governance check verifies the blocks this instruction produces exist and are complete)

## Acceptance Criteria

**AC1:** Given `.github/copilot-instructions.md` with the instrumentation section present, When I inspect it, Then it contains a section titled `## Skill Performance Capture (instrumentation)` that instructs the agent to: (a) read `.github/context.yml` at the start of each session, (b) check whether `instrumentation.enabled: true`, (c) if enabled, append the capture block template to each phase output artefact immediately after writing it.

**AC2:** Given `context.yml` with `instrumentation.enabled: true`, When a phase output artefact (`discovery.md`, `benefit-metric.md`, a story `.md`, or a test plan `.md`) is written during the session, Then the agent appends the capture block from `.github/templates/capture-block.md` as the final section of that artefact, populated with: `experiment_id` and `model_label` from `context.yml`, `skill_name` from the skill currently running, `artefact_path` as the file path written, and `run_timestamp` as the current date.

**AC3:** Given `context.yml` with `instrumentation.enabled: false` (or no instrumentation block), When a phase output artefact is written, Then the agent does not append any capture block — the artefact ends at its normal final section.

**AC4:** Given the instrumentation instruction in `copilot-instructions.md`, When I read the instruction text, Then it explicitly states: "The capture block is an appendix — do not modify or reorder any content in the primary artefact body. The capture block begins after the artefact's `---` closing separator."

**AC5:** Given the instrumentation instruction, When I read it, Then it names the five phase output artefact types that receive capture blocks (`discovery.md`, `benefit-metric.md`, story artefacts, test plan artefacts) and explicitly excludes gate artefacts (DoR, DoD).

## Out of Scope

- Modifying any SKILL.md file to add capture instructions — all capture logic lives in `copilot-instructions.md` only
- Automatic population of the operator review section — that is filled in post-run by the operator
- Retroactively appending capture blocks to artefacts written before instrumentation was enabled in the session

## NFRs

- **Security:** The instruction must explicitly state that `fidelity_self_report` must not contain session tokens, user identifiers, or API credentials
- **Consistency:** Field names referenced in the instruction (`experiment_id`, `model_label`, `cost_tier`, `skill_name`, `artefact_path`, `run_timestamp`) must exactly match those defined in the capture block template (spc.2)

## Complexity Rating

**Rating:** 2 — changes to `copilot-instructions.md` are straightforward content additions, but the conditional read-context-then-act pattern requires careful phrasing to be reliably followed
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
