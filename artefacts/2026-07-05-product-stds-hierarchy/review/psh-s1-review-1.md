# Review Report: psh-s1 — Products and standards Postgres tables and schema — Run 1

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s1.md
**Date:** 2026-07-05
**Categories run:** A — Traceability, B — Scope, C — AC quality, D — Completeness, E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category C — AC5 is not a testable acceptance criterion. The text reads: "No injectable adapter is introduced in this story — the schema migration is a direct Postgres call. This AC is a guard: if any adapter pattern is introduced during implementation, the stub must throw per D37. Record in implementation plan if applicable." This is a conditional planning note, not a Given/When/Then observable behaviour. It cannot be verified by a test runner. The story has 4 genuinely testable ACs (AC1–AC4) which satisfy the ≥3 minimum. Recommended action: remove AC5 and move its intent to the story's Architecture Constraints field as a constraint note ("If any injectable adapter is added during implementation, stub must throw per D37 — add a separate AC at that time").

---

## LOW findings — note for retrospective

None.

---

## Score Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| A — Traceability | 5 | PASS |
| B — Scope integrity | 5 | PASS |
| C — AC quality | 3 | PASS |
| D — Completeness | 5 | PASS |
| E — Architecture compliance | 5 | PASS |

**A — Traceability (5):** All three reference links present. "So that" names M1 and M2 as metrics moved from impossible to achievable. Benefit linkage field explains the prerequisite mechanism. Both metrics appear in the coverage matrix as enabled by this story.

**B — Scope integrity (5):** Story is tightly scoped to schema creation. Out-of-scope section enumerates five concrete exclusions. No discovery out-of-scope items are implemented.

**C — AC quality (3):** AC1–AC4 are well-formed Given/When/Then, specific (schema columns named), and independently testable. AC5 is a planning note — not a testable criterion (1-M1). Minimum 3 testable ACs is satisfied by AC1–AC4. No "should" language in AC1–AC4.

**D — Completeness (5):** All template fields populated. Named persona ("Platform operator (Hamish King)"). Benefit linkage with mechanism sentence. Out-of-scope with real exclusions. NFRs with idempotency and data isolation. Complexity and scope stability rated.

**E — Architecture compliance (5):** Architecture Constraints references ADR-003 (schema-first), ADR-011 (artefact-first), additive-only schema constraint. No applicable active ADRs are missed — ADR-018 (UI), ADR-022/023 (session context), ADR-024 (route handler) are not applicable to a schema-only story.

---

**Verdict:** PASS — all criteria scored 3 or above. 0 HIGH, 1 MEDIUM (AC5 non-testable planning note — addressable without story rework), 0 LOW.
