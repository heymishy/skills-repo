# Review Report: Define `context.yml` instrumentation config schema — Run 1

**Story reference:** artefacts/2026-04-18-skill-performance-capture/stories/spc.1-context-yml-instrumentation-config.md
**Date:** 2026-04-18
**Categories run:** A — Traceability, B — Scope, C — AC quality, D — Completeness, E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category C — AC4 references the outer loop running: `"When the outer loop runs, Then no capture blocks are expected and a completeness check skips without error."` The phrase "when the outer loop runs" means this AC cannot be verified without spc.3 being implemented first. As a standalone deliverable for spc.1 (a config schema addition), AC4 has no independently testable assertion — no artefact produced by spc.1 can be inspected to confirm this behaviour.
  Risk if proceeding: Test plan authors may write a test against spc.3 behaviour as evidence for spc.1's DoR, blurring story boundaries.
  To acknowledge: run /decisions, category RISK-ACCEPT

- **[1-M2]** Category C — AC3 defers testability to another story: `"the missing field is detectable (the field is absent or null) — confirmed by a governance check script in spc.5."` The testability claim depends on spc.5 being implemented. The AC for spc.1 should be independently verifiable against spc.1's own deliverable (the `context.yml` schema). Deferring confirmation to a downstream story is a test-plan concern — it reduces the ability to write a failing test for spc.1 alone.
  Risk if proceeding: spc.1's test plan will need to either test against a not-yet-existing script (spc.5) or restate AC3 in terms of what the YAML structure allows. This may cause test-plan rework.
  To acknowledge: run /decisions, category RISK-ACCEPT

---

## LOW findings — note for retrospective

None.

---

## Scores

| Criterion | Score | Pass/Fail | Notes |
|-----------|-------|-----------|-------|
| Traceability | 4/5 | PASS | All references valid. M1 linkage confirmed in benefit-metric coverage matrix. |
| Scope integrity | 5/5 | PASS | Out of scope explicit and well-bounded. No discovery violations. |
| AC quality | 3/5 | PASS | 5 ACs, all in Given/When/Then. MEDIUM findings on AC3 and AC4 reduce score. |
| Completeness | 5/5 | PASS | All template fields present: persona, benefit linkage, NFRs, complexity, scope stability, architecture constraints. |
| Architecture compliance | 4/5 | PASS | Constraints field populated. Config reading via context.yml compliant with ADR-004. MC-SEC-02 explicitly addressed. No guardrail violations. |

---

## Summary

0 HIGH, 2 MEDIUM, 0 LOW.
**Outcome: PASS** — no HIGH findings. 2 MEDIUM findings should be acknowledged in /decisions before /test-plan.

The two MEDIUM findings both concern testability boundaries: AC3 and AC4 describe behaviours that can only be verified in the context of spc.5 and spc.3 respectively. The test plan author must scope these ACs to what spc.1 can independently verify (the static schema shape and field declarations in `contexts/personal.yml`), not run-time or downstream behaviour.
