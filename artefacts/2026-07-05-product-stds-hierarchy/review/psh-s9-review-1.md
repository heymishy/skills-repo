# Review Report: psh-s9 — Org-level standard promotion and per-product opt-out — Run 1

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s9.md
**Date:** 2026-07-05
**Categories run:** A — Traceability, B — Scope, C — AC quality, D — Completeness, E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

- **[1-L1]** Category A — "Metric moved:" label is inconsistent with this story's role as infrastructure for M4b. The Benefit Linkage field reads "Metric moved: M4a (Standards library adoption rate)" but this story does not emit any PostHog event or directly shift the M4a signal. The story is plumbing that makes M4b (injection) correct — without opt-out data, psh-s10 cannot implement injection correctly. The coverage matrix correctly treats psh-s9 as an enabler. Recommended action: change to "Metric enabled/prerequisite for M4b (Standards injection rate — psh-s10 requires opt-out data model to compute active standards correctly)". (Finding also applies to psh-s2 where "Metric moved" is used for a prerequisite story.)

- **[1-L4]** Category E — Architecture Constraints does not reference ADR-011 (artefact-first). This story will require changes to src/ routes (new promotion endpoint, opt-out endpoint) and potentially a new module. ADR-011 applies to all new src/ modules and behavioural changes to existing routes. Recommended action: add "ADR-011 (artefact-first): This artefact must exist before any src/ route or module for promotion/opt-out is written" to the Architecture Constraints field.

---

## Score Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| A — Traceability | 4 | PASS |
| B — Scope integrity | 5 | PASS |
| C — AC quality | 5 | PASS |
| D — Completeness | 5 | PASS |
| E — Architecture compliance | 4 | PASS |

**A — Traceability (4):** Epic, discovery, and benefit-metric references present. "So that" names M4a as secondary signal. Metric linkage present but "Metric moved" label overstates the story's direct contribution — it is a prerequisite/enabler (1-L1). Coverage matrix context confirms enabler role.

**B — Scope integrity (5):** Out-of-scope enumerates three exclusions: cross-org sharing (Phase 2), approval workflow, bulk opt-out. Phase 2 guard is correctly modelled as AC5. No discovery out-of-scope items implemented.

**C — AC quality (5):** All 6 ACs are well-formed Given/When/Then. AC1 specifies visibility field change and HTTP 200. AC3 and AC4 form a complementary opt-out/reversal pair. AC5 specifies the HTTP 400 response body with reason field ("`public_visibility_not_available`"). AC6 specifies the full table schema for `standard_product_optouts` including UNIQUE constraint. No "should" language.

**D — Completeness (5):** All template fields populated. Named persona. Benefit linkage present (label inconsistency is LOW, not a missing field). Out of scope with real exclusions. NFRs with security (req.session.tenantId authority) and idempotency. Complexity 2, scope stability Stable.

**E — Architecture compliance (4):** ADR-003 (schema-first), Phase 2 readiness, MC-SEC-01 all referenced. ADR-011 not referenced despite story introducing new src/ routes (1-L4). No active ADR violated.

---

**Verdict:** PASS — all criteria scored 4 or above. 0 HIGH, 0 MEDIUM, 2 LOW (benefit linkage label overstates contribution; ADR-011 missing from Architecture Constraints).
