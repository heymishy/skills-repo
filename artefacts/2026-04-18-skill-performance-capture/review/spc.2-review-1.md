# Review Report: Define capture block schema and Markdown template — Run 1

**Story reference:** artefacts/2026-04-18-skill-performance-capture/stories/spc.2-capture-block-schema-template.md
**Date:** 2026-04-18
**Categories run:** A — Traceability, B — Scope, C — AC quality, D — Completeness, E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M3]** Category A — Benefit linkage in the story claims M1 ("Capture block completeness rate") as a metric this story moves: `"Metric moved: M1 — Capture block completeness rate; MM1 — ...; MM2 — ...; MM3 — ..."`. However, the benefit-metric coverage matrix lists M1 as contributed by spc.1, spc.3, and spc.5 — spc.2 is absent from the M1 row. The coverage matrix is the authoritative benefit traceability record. The story overclaims its contribution. The justification given is that the schema makes M1's "fully populated" criterion testable, which is enabling infrastructure, not a direct metric driver.
  Risk if proceeding: test plan may write M1 tests against spc.2 deliverables, creating confusion about which story provides the M1 evidence.
  To acknowledge: run /decisions, category RISK-ACCEPT

- **[1-M4]** Category C — AC3 is framed as a runtime comparison scenario requiring two actual experiment runs: `"Given a capture block appended to discovery.md from one model run and a capture block appended to discovery.md from a second model run with a different model_label, When I compare the two blocks, Then I can calculate a numeric delta..."`. The static deliverable for spc.2 is the template file. AC3 is verifiable against the template alone (by checking that the fields are numeric/list types that support unambiguous comparison), but the Given clause frames this as a post-run verification rather than a template inspection. The test plan author may write a test that requires an actual experiment to be run, which is not appropriate for a pre-implementation unit test.
  Risk if proceeding: test plan spec for AC3 may be written as an integration test requiring full experiment runs rather than a static template inspection — making it non-runnable in CI.
  To acknowledge: run /decisions, category RISK-ACCEPT

---

## LOW findings — note for retrospective

None.

---

## Scores

| Criterion | Score | Pass/Fail | Notes |
|-----------|-------|-----------|-------|
| Traceability | 3/5 | PASS | Discovery, epic, benefit-metric refs all valid. MM1, MM2, MM3 linkages confirmed in matrix. MEDIUM finding on M1 overclaim. |
| Scope integrity | 5/5 | PASS | Out of scope explicit. Schema coverage and version history exclusions are well-reasoned. |
| AC quality | 3/5 | PASS | 5 ACs in Given/When/Then. No "should". MEDIUM finding on AC3 runtime framing. |
| Completeness | 5/5 | PASS | All template fields present: persona, benefit linkage, NFRs, complexity, scope stability, architecture constraints. |
| Architecture compliance | 5/5 | PASS | Architecture Constraints field populated. Markdown-only template compliant with style guide. MC-SEC-02 addressed. C13 referenced. ADR-011 not triggered (template file, not SKILL.md/src/check script). |

---

## Summary

0 HIGH, 2 MEDIUM, 0 LOW.
**Outcome: PASS** — no HIGH findings. 2 MEDIUM findings should be acknowledged in /decisions before /test-plan.

The critical implementation note for the test plan: AC3 should be tested by inspecting the template's field types (are the fields numeric/list types that would support delta calculation?), NOT by running two model experiments. Re-framing AC3 at the test-plan stage will prevent test-plan rework.
