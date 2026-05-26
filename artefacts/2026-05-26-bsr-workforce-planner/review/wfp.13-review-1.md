# Review: wfp.13 — Cross-portfolio bottleneck analysis
**Run:** 1
**Date:** 2026-05-27
**Reviewer:** Copilot / Hamish King
**Story:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.13.md

---

## FINDINGS

**1-M1 (MEDIUM) — Epic forward-link gap** *(shared with wfp.12–wfp.16)*
`wfp-planning-dashboard.md` does not list wfp.13 in its stories section. See wfp.12 1-M1 for full description and recommended action.

**1-L1 (LOW) — AC2: missing-portfolio-file exclusion from tagUniverse not stated**
The tag universe is derived from `requiredTags` in `portfolio/[slug].json` files. AC2 specifies this correctly but does not state what happens when a portfolio file is absent for an initiative slug. The implicit behaviour (slug contributes no tags, no error) should be made explicit so the test author knows what to assert.
_Recommended action:_ Add one sentence to AC2: "If `portfolio/[slug].json` is absent for an initiative slug, that slug contributes no entries to the `tagUniverse` and a warning is printed to stderr."

**1-L2 (LOW) — DoR pre-check boxes unchecked**
No rework needed; verify at DoR sign-off.

---

## SCORES

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS — all references present; M3 explicitly named; benefit linkage clear |
| Scope integrity | 5 | PASS — person-level bottleneck explicitly excluded; no scope creep |
| AC quality | 4 | PASS — 7 ACs, all Given/When/Then; threshold constant (AC5) and allocation filter (AC7) have dedicated ACs |
| Completeness | 4 | PASS — all template fields populated; named persona; complexity rated |

---

## VERDICT

**PASS ✅ — Run 1**

0 HIGH, 1 MEDIUM (epic forward-link gap), 2 LOW. Ready for /test-plan after MEDIUM acknowledged.
