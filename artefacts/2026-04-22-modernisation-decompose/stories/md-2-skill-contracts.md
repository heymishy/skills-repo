# Story: Register `/modernisation-decompose` in `check-skill-contracts.js`

**Epic reference:** artefacts/2026-04-22-modernisation-decompose/epics/e1-modernisation-pipeline-bridging.md
**Discovery reference:** artefacts/2026-04-22-modernisation-decompose/discovery.md
**Benefit-metric reference:** artefacts/2026-04-22-modernisation-decompose/benefit-metric.md

## User Story

As a **platform maintainer**,
I want `check-skill-contracts.js` to include contract definitions for the new `/modernisation-decompose` skill,
So that the pre-commit suite catches any structural regression to the new skill's required sections — supporting M2 (outer-loop entry rate) by ensuring the skill remains governable throughout its lifecycle.

## Benefit Linkage

**Metric moved:** M2 — Outer-loop entry rate
**How:** A skill that cannot pass the governance suite cannot be merged and therefore cannot be used. Registering the skill in the contracts checker keeps it permanently in the governed set, preventing silent structural regressions that would remove the skill from the pipeline.

## Architecture Constraints

- `.github/scripts/check-skill-contracts.js`: Plain Node.js, CommonJS (`require`), no external npm dependencies (pre-commit hook constraint). Follow the existing pattern for registering structural marker requirements.
- The registered markers must match the actual structural markers committed in md-1. This story is sequenced after md-1.
- Running `npm test` after this change must still pass all 70+ existing tests — no regressions.

## Dependencies

- **Upstream:** md-1 (the SKILL.md structural markers must be finalised before the contract definition can be written accurately).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `check-skill-contracts.js` has been updated to include a contract definition for `modernisation-decompose`, when `npm test` runs against a valid `/modernisation-decompose` SKILL.md (as produced in md-1), then the check passes with 0 failures for the new skill.

**AC2:** Given `check-skill-contracts.js` has been updated, when a future change removes the `## State update — mandatory final step` section from the new SKILL.md, then `npm test` fails with a clear error message identifying the missing marker and the skill name — not a generic "contract failed" message.

**AC3:** Given `check-skill-contracts.js` has been updated, when `npm test` runs against all existing SKILL.md files (the prior 37 + the new one), then 0 regressions are introduced — all previously passing skills still pass.

## Out of Scope

- Changes to any other governance check scripts — only `check-skill-contracts.js` is in scope.
- Updating `check-pipeline-artefact-paths.js` — any new output path registered by the new skill will be assessed during md-1 implementation; if required, it is raised as a new story.

## NFRs

- **No-dep constraint:** The updated script must not introduce any new `require()` calls for external npm packages — it must continue to run with Node.js built-ins only.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable — the mechanic is established; this is a registry entry, not new logic.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
