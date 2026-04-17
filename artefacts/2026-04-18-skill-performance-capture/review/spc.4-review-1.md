# Review Report: Define experiment workspace structure and manifest format — Run 1

**Story reference:** artefacts/2026-04-18-skill-performance-capture/stories/spc.4-experiment-workspace-structure.md
**Date:** 2026-04-18
**Categories run:** A — Traceability, B — Scope, C — AC quality, D — Completeness, E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M7]** Category A — The story's Benefit Linkage claims: `"Metric moved: MM1 — Context breadth; MM2 — Constraint inference rate; MM3 — Artefact linkage richness"`. However, spc.4 is not listed in the benefit-metric coverage matrix under any metric row. The matrix attributes MM1, MM2, MM3 coverage to spc.2 and spc.3 only. spc.4 provides the storage structure — the workspace directory where comparison results live — but does not produce or populate any measurement fields. The story overclaims: it is an enabling infrastructure story, not a metric-moving story.
  Risk if proceeding: test plan may attempt to write MM1/MM2/MM3 tests against spc.4's deliverables (the workspace directory structure), which would produce tests with no clear pass/fail criterion (a directory structure can't be tested against a metric definition).
  To acknowledge: run /decisions, category RISK-ACCEPT

- **[1-M8]** Category C — AC1's Given clause is ambiguous about the documentation source: `"Given the feature documentation (or a README in workspace/experiments/)"`. Two distinct documentation sources are offered — "feature documentation" (undefined location) and "a README in workspace/experiments/" (specific path). The AC doesn't decide between them; the operator behaviour described in the Then clause ("When I follow the defined structure") depends on which document exists. If neither exists when the story is implemented, the AC is trivially unverifiable.
  Risk if proceeding: the test plan author may write AC1's verification against "feature documentation" (which doesn't have a defined path), producing an unresolvable test location. The implementation may produce only one of the two suggested documents, leaving the AC ambiguous at DoD verification.
  To acknowledge: run /decisions, category RISK-ACCEPT

---

## LOW findings — note for retrospective

- **[1-L2]** Category C — AC3 is a negative assertion ("the test suite does not fail or warn because of files in workspace/experiments/"). This is functionally an NFR stated as an AC. It is testable and the intent (excluding experiment output from governance checks) is important, but placing it as an AC means the test plan must include a test for the absence of a failure — which is fine but worth flagging as an NFR-as-AC pattern.

---

## Scores

| Criterion | Score | Pass/Fail | Notes |
|-----------|-------|-----------|-------|
| Traceability | 3/5 | PASS | All artefact cross-references valid. MEDIUM finding: benefit linkage overclaims metric contribution not reflected in coverage matrix. |
| Scope integrity | 5/5 | PASS | Out of scope explicit: no auto-creation, no CI checks, no file copying. Consistent with discovery. |
| AC quality | 3/5 | PASS | 4 ACs (above minimum of 3). MEDIUM finding on AC1 ambiguity. AC3 is NFR-as-AC (1-L2). |
| Completeness | 5/5 | PASS | All template fields present: persona, benefit linkage, NFRs, complexity, scope stability, architecture constraints. |
| Architecture compliance | 4/5 | PASS | C11, MC-SEC-02, and workspace path conventions all addressed. No guardrail violations identified. |

---

## Summary

0 HIGH, 2 MEDIUM, 1 LOW.
**Outcome: PASS** — no HIGH findings. 2 MEDIUM findings should be acknowledged in /decisions before /test-plan.

The benefit linkage concern (1-M7) is worth a quick definition correction: spc.4 should describe itself as enabling infrastructure for MM1/MM2/MM3 rather than claiming to move those metrics. AC1's documentation ambiguity (1-M8) should be resolved at test-plan time by deciding on a single authoritative documentation location (recommend: a `README.md` in `workspace/experiments/` as the concrete deliverable for this story, consistent with AC1's "or a README" option).
