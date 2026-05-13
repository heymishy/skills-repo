# Review Report: sfa.1 — Add workspace/state.schema.json and document state file authority model — Run 1

**Story reference:** `artefacts/2026-05-02-state-file-authority-model/stories/sfa.1-state-file-schema-and-adr.md`
**Date:** 2026-05-02
**Categories run:** A — Traceability, B — Scope discipline, C — AC quality, D — Completeness, E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Traceability — No formal discovery or benefit-metric artefact exists for this feature. The story references `/improve extraction — 2026-04-30-governed-distribution-and-onboarding (Category B)` as its discovery source and acknowledges "no formal metric yet." This is structurally expected for a short-track /improve-derived story but is a formal gap against the standard pipeline entry conditions.
  Risk if proceeding: artefact-coverage gate may flag the feature as missing discovery/benefit-metric. To acknowledge: run /decisions, RISK-ACCEPT.
  _Fixed in Run 1: story text is correct; this is an upstream structural gap, not a story defect. Acknowledged via RISK-ACCEPT in /decisions before /test-plan._

- **[1-M2]** Architecture/NFR — The Architecture Constraints section says "schema validation uses the existing `jsonschema` Python call pattern or a Node.js built-in equivalent" but the Test Plan Hints section says "use `ajv` if already present, otherwise write a minimal required-fields check." `ajv` is NOT in `package.json`. These instructions are inconsistent and will leave the implementing agent without a clear single rule.
  Fix: remove the `ajv` conditional; clarify to use a minimal Node.js required-fields check (no library needed to assert 3 required keys exist on a parsed JSON object).
  _Fixed in story file during Run 1._

---

## LOW findings — note for retrospective

- **[1-L1]** Completeness — `## Complexity Rating` section and `Scope stability` field absent. Template requires both.
  _Fixed in story file during Run 1: Complexity: 2, Scope stability: Stable._

- **[1-L2]** AC quality — No explicit edge-case AC for `additionalProperties` tolerance (the schema must not reject state files with extra fields added by future skills). NFR-SFA1-COMPATIBILITY covers the intent but leaves no testable AC.
  _Fixed in story file during Run 1: AC6 added._

---

## Summary

0 HIGH, 2 MEDIUM, 2 LOW across 1 story.
**Outcome:** PASS — all criteria scored 3 or above. MEDIUM findings addressed in story file (1-M2, 1-L1, 1-L2 fixed inline; 1-M1 accepted as structural short-track gap).

---

## Scores

| Criterion | Score | Pass/Fail | Notes |
|-----------|-------|-----------|-------|
| A — Traceability | 3 | PASS | No formal discovery/benefit-metric — expected for /improve short-track (1-M1) |
| B — Scope integrity | 4 | PASS | Out-of-scope section well-populated; no formal discovery to violate |
| C — AC quality | 4 | PASS | All 5 ACs in GWT; observable and specific; 1-L2 added AC6 |
| D — Completeness | 3 | PASS | Complexity/scope stability fields added (1-L1) |
| E — Architecture | 4 | PASS | ADR-003/ADR-004 referenced; validation approach clarified (1-M2) |
