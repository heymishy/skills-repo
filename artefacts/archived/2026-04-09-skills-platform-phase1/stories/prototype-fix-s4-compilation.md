> **VOID — 2026-04-09**
> Story removed from plan. Prototype compilation failure has no dependency on the skills repo delivery target. See decisions.md SCOPE entry 2026-04-09.

# Story: Export computeEntryHash and detectEntryTampering from assurance-validator.ts

**Epic reference:** artefacts/2026-04-09-skills-platform-phase1/epics/epic-1-prototype-stabilisation.md
**Discovery reference:** artefacts/2026-04-09-skills-platform-phase1/discovery.md
**Benefit-metric reference:** artefacts/2026-04-09-skills-platform-phase1/benefit-metric.md

## User Story

As a **platform maintainer**,
I want `computeEntryHash` and `detectEntryTampering` to be exported from `assurance-validator.ts`,
So that the S4 unit test suite compiles and passes cleanly, removing the prototype RISK-ACCEPT block on P1.3 DoR.

## Benefit Linkage

**Metric moved:** M2 — CI-triggered assurance gate
**How:** The S4 compilation failure is a declared DoR blocker for P1.3 (assurance CI gate). Resolving it removes the blocker, which is the prerequisite for P1.3 to enter DoR — and P1.3 is the direct delivery of M2.

## Architecture Constraints

None identified — checked against .github/architecture-guardrails.md. This change is scoped to a single `export` keyword addition in one TypeScript file; no architectural decisions are involved.

## Dependencies

- **Upstream:** None — this is the first story in the epic and has no predecessors
- **Downstream:** `prototype-fix-s2-exit-code` (can be worked in parallel); `p1.3-assurance-agent-ci-gate` (cannot enter DoR until both prototype fix stories are marked DoD-complete per the RISK-ACCEPT resolution condition)
- **Prototype repository:** `C:\Users\Hamis\code\agentic dev loop 30-03-2026` — all implementation work is in this repo; the skills-repo contains only this artefact

## Acceptance Criteria

**AC1:** Given `assurance-validator.ts` in the prototype repository, when `computeEntryHash` is added to the module's public exports, then importing `{ computeEntryHash }` from `assurance-validator` in any file in the prototype repository compiles without a TypeScript error.

**AC2:** Given `assurance-validator.ts` in the prototype repository, when `detectEntryTampering` is added to the module's public exports, then importing `{ detectEntryTampering }` from `assurance-validator` in any file in the prototype repository compiles without a TypeScript error.

**AC3:** Given both exports are in place, when the S4 unit test suite is run with `npx jest tests/unit/s4-assurance-agent.test.ts`, then all S4 unit tests pass and the exit code is 0 — with no new test failures introduced in any other suite (S1–S3, S5–S7). Run from `C:\Users\Hamis\code\agentic dev loop 30-03-2026`.

**AC4:** Given the RISK-ACCEPT entry for the S4 compilation failure in `decisions.md` (or equivalent risk register in the prototype repo), when both exports compile and S4 passes, then that RISK-ACCEPT entry is updated to status `resolved` with a reference to the commit that closed it.

## Out of Scope

- Changes to the runtime governance logic of `computeEntryHash` or `detectEntryTampering` — this story adds export declarations only; function bodies are not modified
- Refactoring `assurance-validator.ts` for any other reason — this story does the minimum to resolve the RISK-ACCEPT
- Any changes to the skills-repo platform files — all implementation work happens in the prototype repository
- CI configuration in either repository — no CI work is in this story

## NFRs

- **Performance:** None — export declaration changes have no performance impact
- **Security:** None — these functions handle hash computation; exporting them does not expose credentials or secrets
- **Audit:** The RISK-ACCEPT entry in `decisions.md` must be updated to `resolved` status as part of this story's DoD

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
