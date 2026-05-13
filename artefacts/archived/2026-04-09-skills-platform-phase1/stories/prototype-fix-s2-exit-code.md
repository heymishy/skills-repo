> **VOID — 2026-04-09**
> Story removed from plan. Prototype exit code failure has no dependency on the skills repo delivery target. See decisions.md SCOPE entry 2026-04-09.

# Story: Fix dev agent exit code on failing-criterion run (S2 integration AC5)

**Epic reference:** artefacts/2026-04-09-skills-platform-phase1/epics/epic-1-prototype-stabilisation.md
**Discovery reference:** artefacts/2026-04-09-skills-platform-phase1/discovery.md
**Benefit-metric reference:** artefacts/2026-04-09-skills-platform-phase1/benefit-metric.md

## User Story

As a **platform maintainer**,
I want the dev agent to exit with code 0 on a failing-criterion run rather than exit code 2,
So that the S2 integration AC5 test passes cleanly, removing the second prototype RISK-ACCEPT block on P1.3 DoR.

## Benefit Linkage

**Metric moved:** M2 — CI-triggered assurance gate
**How:** The S2 exit code failure is a declared DoR blocker for P1.3 alongside the S4 issue. Resolving it removes the second blocker prerequisite for P1.3 to enter DoR — and P1.3 is the direct delivery of M2.

## Architecture Constraints

None identified — checked against .github/architecture-guardrails.md. The fix is an exit code contract correction in the dev agent; no architectural decisions are involved.

## Dependencies

- **Upstream:** None — can proceed in parallel with `prototype-fix-s4-compilation`
- **Downstream:** `p1.3-assurance-agent-ci-gate` cannot enter DoR until both prototype fix stories are marked DoD-complete
- **Prototype repository:** `C:\Users\Hamis\code\agentic dev loop 30-03-2026` — all implementation work is in this repo; the skills-repo contains only this artefact
- **Source file under change:** `src/agents/dev-agent.ts` — the dev agent entry point; [TODO: confirm exact exit path causing code 2 — `grep -rn 'process.exit' src/` in prototype repo found only `process.exit(1)` on line 91; run `npx jest tests/integration/s2-dev-agent-trace.integration.test.ts --verbose` and inspect which test assertion fails to confirm whether exit code 2 originates from the dev agent subprocess call or from the `tsc --strict --noEmit` NFR check (tsc exits 2 on TypeScript errors)]

## Acceptance Criteria

**AC1:** Given the dev agent is invoked with a scenario in which one or more evaluation criteria fail (failing-criterion run), when the agent completes its execution, then the process exits with code 0 — not code 2 or any other non-zero code.

**AC2:** Given the S2 integration test suite is run with `npx jest tests/integration/s2-dev-agent-trace.integration.test.ts` (from `C:\Users\Hamis\code\agentic dev loop 30-03-2026`), when AC5 evaluates the exit code from a failing-criterion run, then AC5 passes and the full S2 integration suite exits with code 0.

**AC3:** Given both the S4 and S2 prototype fix stories are complete, when the full S1–S7 test suite is run, then all suites pass with exit code 0 and no new failures are introduced in any suite by this change.

**AC4:** Given the RISK-ACCEPT entry for the S2 exit code failure in `decisions.md` (or equivalent risk register in the prototype repo), when the exit code is corrected and S2 AC5 passes, then that RISK-ACCEPT entry is updated to status `resolved` with a reference to the commit that closed it.

## Out of Scope

- Changes to the governance logic of the dev agent — the fix is the exit code contract only; dev agent evaluation behaviour is not modified
- Any changes to what constitutes a "failing criterion" — the semantics of pass/fail are unchanged; only the exit code returned on a fail is corrected
- Any changes to the skills-repo platform files — all implementation work is in the prototype repository
- CI configuration — no CI gate work is in this story

## NFRs

- **Performance:** None — exit code change has no performance impact
- **Security:** None
- **Audit:** The RISK-ACCEPT entry in `decisions.md` must be updated to `resolved` status as part of this story's DoD

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
