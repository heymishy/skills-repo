# Review Report: Write `/modernisation-decompose` SKILL.md — Run 1

**Story reference:** artefacts/2026-04-22-modernisation-decompose/stories/md-1-skill-md.md
**Date:** 2026-04-22
**Categories run:** A — Traceability, B — Scope, C — AC quality, D — Completeness, E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **1-M1** Category A — Benefit Linkage section lists only M1 and MM-A, but AC4 (corpus-state.md write) also moves M3 (convergence metric visibility) and AC6 (low-signal escalation path) also moves MM-B (heuristic coverage for low-signal codebases). The benefit-metric coverage matrix correctly maps all five metrics to md-1, but the story's own Benefit Linkage section omits M3 and MM-B.
  Line: `**Metric moved:** M1 (decomposition consistency), MM-A (first-run acceptance rate)`
  Risk if proceeding: test-plan author won't know to trace M3 and MM-B test coverage to this story's ACs.
  To acknowledge: run /decisions, category RISK-ACCEPT

- **1-M2** Category C — AC7 specifies `umbrellaMetric: true` as a field in `candidate-features.md`. It is ambiguous whether this means YAML frontmatter, a table column, or inline text. A test-plan author writing a test for AC7 could interpret this in incompatible ways, and different implementations would satisfy the letter of the AC while producing incompatible formats.
  Line: `then every candidate feature entry includes the field \`umbrellaMetric: true\``
  Risk if proceeding: AC7 tests may pass against an output format that is incompatible with downstream skill consumption.
  To acknowledge: run /decisions, category RISK-ACCEPT

---

## LOW findings — note for retrospective

- **1-L1** Category E — The Architecture Constraints section flags `check-pipeline-artefact-paths.js` as a conditional update ("PIPELINE_PATHS must be updated if...") but there is no tracking mechanism for the case where an update is needed. The deferred mechanism ("raise a new story if needed" in md-2's out-of-scope) is present, but the author has to remember to check. No DoR gate will catch a missed PIPELINE_PATHS update.

---

## Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 4 | PASS |

0 HIGH, 2 MEDIUM, 1 LOW.
**Outcome: PASS** — no HIGH findings. Two MEDIUM findings should be acknowledged in /decisions before /test-plan proceeds.
