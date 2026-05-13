> **VOID — 2026-04-09**
> Epic removed from plan. P1.3 (assurance CI gate) targets the skills repo, not the prototype repo. Prototype test failures have no dependency on the skills repo delivery. See decisions.md SCOPE entry 2026-04-09.

# Epic: Prototype Test Suite Stabilisation

**Discovery reference:** artefacts/2026-04-09-skills-platform-phase1/discovery.md
**Benefit-metric reference:** artefacts/2026-04-09-skills-platform-phase1/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

The prototype's two known test failures are resolved and the full S1–S7 test suite passes cleanly. `computeEntryHash` and `detectEntryTampering` are exported from `assurance-validator.ts`. The dev agent exits with code 0 on a failing-criterion run. Both RISK-ACCEPT entries in `decisions.md` are updated to resolved. The P1.3 CI gate stories can enter DoR without the prototype failure blockers.

## Out of Scope

- Changes to the runtime governance behaviour of the assurance loop — fixes are export declarations and exit code contracts only, not logic changes
- New features or refactors in the prototype repo — these stories do the minimum to clear the RISK-ACCEPTs
- CI configuration changes in either repo — no CI gate work is in this epic
- Any changes to the skills-repo platform files — implementation work happens in the prototype repo only

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M2 — CI-triggered assurance gate | Zero — CI gate does not exist; S4 and S2 failures are declared P1.3 DoR blockers | First inner loop PR after P1.3 delivery satisfies all four sub-conditions | Removing both RISK-ACCEPT blockers enables P1.3 stories to enter DoR, which is the prerequisite for M2 to be measurable |

## Stories in This Epic

- [ ] Resolve S4 unit suite compilation failure in assurance validator — `stories/prototype-fix-s4-compilation.md`
- [ ] Resolve S2 integration AC5 exit code contract failure — `stories/prototype-fix-s2-exit-code.md`

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Code changes in the prototype repo; the existing test suite is the verifier. Changes are narrow (export declaration, exit code) with no governance logic impact. Human reviews the test suite output before marking DoD-complete.

## Complexity Rating

**Rating:** 1

## Scope Stability

**Stability:** Stable
