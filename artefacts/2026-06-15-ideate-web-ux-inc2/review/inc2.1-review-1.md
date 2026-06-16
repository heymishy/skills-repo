# Review Report: inc2.1 — Conditions panel

**Story slug:** inc2.1
**Review run:** 1
**Review date:** 2026-06-15
**Reviewer:** GitHub Copilot (Claude Sonnet 4.6) — operator-directed review
**Feature:** 2026-06-15-ideate-web-ux-inc2
**Categories run:** A, B, C, D, E (all five)

---

## FINDINGS

### MEDIUM findings

None.

### LOW findings

**1-L1 — AC9 regression contract is a suite-level assertion, not a per-test assertion (Completeness)**
The test plan documents 62 regression tests (check-iwu1 through check-iwu6) but the test file `check-inc2.1-conditions-panel.js` will not re-run those tests internally — it runs 11 new tests only. Regression is verified by running the full `npm test` suite, which includes all iwu tests. This is correct but the AC9 phrasing ("62 existing iwu test assertions pass unmodified") could be misread as implying check-inc2.1 itself verifies them.
- **Recommended action:** Make AC9 explicit: "The full `npm test` suite, which includes check-iwu1 through check-iwu6, must pass. Verified as part of pre-commit hook and CI — not re-tested within check-inc2.1-conditions-panel.js."

---

## SCORE

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| A — Traceability | 5 | PASS |
| B — Scope integrity | 5 | PASS |
| C — AC quality | 5 | PASS |
| D — Completeness | 4 | PASS |
| E — Architecture compliance | 5 | PASS |

**Traceability (5):** Discovery, benefit-metric (M1, MM1), NFR-profile all reference AC coverage. 11 tests cover 8 ACs with explicit AC→test mapping in the test plan. No broken references.

**Scope integrity (5):** Out-of-scope section explicitly excludes confirm/flag, export, deduplication, panel resize, SKILL.md changes (inc2.2), and assumption card modifications. Architecture Constraints restrict changes to `skills.js` and `chat-view.js` only — matching the Increment 1 pattern exactly.

**AC quality (5):** 9 ACs. All in observable-behaviour form. AC1 (parse + store), AC2 (SSE emit), AC3 (marker strip), AC4 (panel present), AC5 (card render), AC6 (read-only), AC7 (layout), AC8 (type validation), AC9 (regression). All independently testable. Type allowlist (constraint/dependency/outcome) and source default ("model") specified.

**Completeness (4):** User story in correct format with named persona. Benefit linkage to M1 and MM1. NFR section present (latency, escaping, regression, a11y). Architecture Constraints name files to modify. Scope Stability: stable. Score 4 due to finding 1-L1 (AC9 phrasing ambiguity).

**Architecture compliance (5):** Follows D37 pattern (same parser pattern as `parseAssumptionMarker`). OWASP A03 (HTML escaping) explicitly called out. ADR-019 (in-memory only) confirmed. No new routes. No new npm dependencies. WCAG SC 1.4.1 and SC 2.1.1 addressed. Regression contract stated.

---

## VERDICT

**Review PASSED ✅ — Run 1**

0 HIGH | 0 MEDIUM | 1 LOW (1-L1 — AC9 phrasing clarification)

Ready for /test-plan (written) → /definition-of-ready.
