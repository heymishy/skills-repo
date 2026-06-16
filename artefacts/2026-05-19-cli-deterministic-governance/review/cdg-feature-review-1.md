# Feature Review: CLI Deterministic Governance — Executable Gate Enforcement and Tamper-Evident Audit Trail

**Feature slug:** 2026-05-19-cli-deterministic-governance
**Review run:** 1
**Review date:** 2026-06-15
**Reviewer:** GitHub Copilot (Claude Sonnet 4.6) — operator-directed review
**Stories reviewed:** cdg.1, cdg.2, cdg.3, cdg.4, cdg.5, cdg.6, cdg.7

---

## Delivery summary

| Story | Title | PR | Tests | ACs | Review | Status |
|-------|-------|----|-------|-----|--------|--------|
| cdg.1 | skills validate: CLI entry point, exit codes, governance check | #353 | 26/26 | 6/6 | PASS | ✅ DoD |
| cdg.2 | H1–H9 gate logic: DoR deterministic checks | #354 | 33+/33+ | 7/7 | PASS | ✅ DoD |
| cdg.3 | skills advance: pipeline-state field write (CLI) | #355 | — | — | PASS | ✅ DoD |
| cdg.4 | Web UI gate-confirm: `_validate` adapter wiring | #356 | 10/10 | 7/7 | PASS | ✅ DoD |
| cdg.5 | Chain-hash trace emission on gate-confirm | #357 | 10/10 | 8/8 | PASS | ✅ DoD |
| cdg.6 | skills advance enhancements: epic-nested, dot-notation, coercion, harness rule | #358 | 34/34 | 7/7 | PASS (retrospective) | ✅ DoD |
| cdg.7 | Gated advance: validate-before-write, gate-map registry, web UI writer delegation | #373 | 37/37 | 6/6 | PASS (retrospective) | ✅ DoD |

All 7 stories delivered. All PRs merged to master. All automated test suites passing.

---

## FINDINGS

### MEDIUM findings

**FR-M1 — M1 (CPF score) not-yet-measured**
The composite pipeline fidelity score (M1, tier 1) requires EXP runs against regulated stories to measure. It is `not-yet-measured`. Target is 0.9; minimum signal is 0.8. The governance infrastructure is in place; measurement is deferred to a dedicated EXP run.
- **Recommended action:** Schedule EXP run against a regulated story delivery to establish M1 baseline. Accept as deferred measurement — the gate enforcement mechanism is delivered and functional.

**FR-M2 — T3M1 (audit readability) not-yet-measured**
T3M1 (tier 3) requires a compliance reviewer to confirm deterministic enforcement from the trace. Minimum signal: one complete feature delivery with validate entries. The web-ui-pm-flow feature (2026-06-14) just completed through the CDG-enforced pipeline — its trace entries exist in `workspace/traces/`. T3M1 is measurable now but not yet formally assessed.
- **Recommended action:** Have an operator review the pmf trace entries and record T3M1 signal. Can be done as a lightweight follow-on action before CDG is archived.

### LOW findings

**FR-L1 — cdg.3 DoD artefact missing**
`artefacts/2026-05-19-cli-deterministic-governance/dod/cdg.3-dod.md` does not exist. Story is at `definition-of-done` in pipeline-state and PR #355 is merged, but the DoD artefact was not written.
- **Recommended action:** Write cdg.3-dod.md retroactively or accept as a process gap on an older story. cdg.3 is the predecessor to cdg.6's enhancements; full AC coverage can be reconstructed from git history.

**FR-L2 — cdg.6 and cdg.7 review artefacts written retrospectively**
Both review artefacts were written after implementation and merge (2026-06-15 vs. merge dates 2026-05-24 and 2026-05-27). This is an administrative process exception; no implementation correctness concerns.

---

## METRIC STATUS

| Metric | Signal | Notes |
|--------|--------|-------|
| M1 — CPF composite score | not-yet-measured | Deferred; EXP run needed. Finding FR-M1. |
| M2 — Gate bypass incident rate | on-track | gate-advance deployed; mandate in copilot-instructions. |
| M3 — Gate logic unit test fixtures (target ≥33) | on-track | 34 assertions in check-cli-outer-loop.js; 10 further in cdg.4. |
| M4 — Schema violation rate | on-track | 0 violations in test suite; pipeline-state-writer delegates to advance(). |
| T3M1 — Audit readability | not-yet-measured | Deferred; pmf trace entries now available for review. Finding FR-M2. |

---

## VERDICT

**Feature review PASSED ✅ — Run 1**

0 HIGH | 2 MEDIUM (FR-M1 deferred measurement; FR-M2 deferred measurement) | 2 LOW (FR-L1 cdg.3 DoD gap; FR-L2 retrospective reviews)

All 7 stories at definition-of-done. All PRs merged. Gate enforcement is deployed and enforcing. Feature is ready to advance to definition-of-done with M1/T3M1 accepted as deferred measurements.
