# Review Report: Add instrumentation instruction to `copilot-instructions.md` — Run 1

**Story reference:** artefacts/2026-04-18-skill-performance-capture/stories/spc.3-agent-instruction-integration.md
**Date:** 2026-04-18
**Categories run:** A — Traceability, B — Scope, C — AC quality, D — Completeness, E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M5]** Category A — The benefit-metric coverage matrix assigns spc.3 responsibility for moving MM1 ("instruction populates it"), MM2 ("agent instruction populates it"), and MM3 ("agent instruction populates it") in addition to M1. However, the story's Benefit Linkage section only claims M1: `"Metric moved: M1 — Capture block completeness rate"`. The coverage matrix is the authoritative record. spc.3 writes the instruction that causes agents to populate the MM1/MM2/MM3 fields (files_referenced, constraints_inferred_count, backward_references) — it owns the population of those fields even though it doesn't define them. The story underreports its metric footprint.
  Risk if proceeding: test plan may not include tests for MM1/MM2/MM3 field population in the instruction, leaving those fields untested at the story level.
  To acknowledge: run /decisions, category RISK-ACCEPT

- **[1-M6]** Category E — The Architecture Constraints field does not reference the Platform change policy requirement for changes to `copilot-instructions.md`. The copilot-instructions.md file is a governed platform file. Per the repo's copilot-instructions.md ("Platform change policy (Phase 2+)"): `"SKILL.md files, templates, standards files, and pipeline infrastructure changes must be merged via PR — not committed directly to the default branch."` The `copilot-instructions.md` is platform infrastructure. This PR requirement should be named in the Architecture Constraints field of spc.3 so the coding agent and DoR check know to enforce it.
  Risk if proceeding: a coding agent or contributor may commit the copilot-instructions.md change directly to master, bypassing the required PR gate.
  To acknowledge: run /decisions, category RISK-ACCEPT

---

## LOW findings — note for retrospective

- **[1-L1]** Category D — Grammar error in user story: `"As a **operator** running a comparison experiment"` — should be `"As an **operator** running a comparison experiment"`. Does not affect testability or compliance. Fix at next definition pass or quietly correct before DoR.

---

## Scores

| Criterion | Score | Pass/Fail | Notes |
|-----------|-------|-----------|-------|
| Traceability | 3/5 | PASS | All artefact cross-references valid. MEDIUM finding: story underreports its metric contribution (MM1/MM2/MM3 not claimed). |
| Scope integrity | 5/5 | PASS | No SKILL.md changes explicitly excluded. Out of scope is crisp and well-aligned with discovery constraints (C3). |
| AC quality | 4/5 | PASS | 5 ACs in Given/When/Then. ACs 2–3 test runtime agent behaviour (inherent to instruction stories — expected verification method). No "should". |
| Completeness | 4/5 | PASS | All template fields present. Grammar error in user story (1-L1). |
| Architecture compliance | 3/5 | PASS | C3 (no SKILL.md) explicitly addressed. ADR-004 referenced. MEDIUM finding: Platform change policy PR requirement for copilot-instructions.md not named in Architecture Constraints. |

---

## Summary

0 HIGH, 2 MEDIUM, 1 LOW.
**Outcome: PASS** — no HIGH findings. 2 MEDIUM findings should be acknowledged in /decisions before /test-plan.

Key note for the coding agent: `copilot-instructions.md` changes require a PR and cannot be committed directly to master (Platform change policy). The DoR artefact must explicitly flag this. The test plan for ACs 2–3 must use a live agent session as the verification method — no static analysis can confirm conditional runtime agent behaviour.
