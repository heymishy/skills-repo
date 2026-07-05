# Review Report: psh-s6 — Per-product kanban board — Run 1

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s6.md
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

- **[1-L3]** Category C — AC6 is a DoR gate reminder formatted as an acceptance criterion. The text reads: "[Testability: accepted by operator — CSS-layout-dependent. Playwright E2E test or RISK-ACCEPT + manual smoke test required at DoR sign-off. Not independently testable by unit test runner.]" This is not a Given/When/Then observable behaviour — it is a process instruction for the DoR review. A test author cannot write a test for it as written. The story's four substantive ACs (AC1–AC5) cover all functional behaviour. Recommended action: rename AC6 as a DoR flag (e.g. `## DoR note — CSS-layout compliance`) and remove it from the numbered AC list, or rewrite it as a specific Playwright AC ("Given the kanban is rendered in a 1280×800 viewport, when the page loads, then eight stage columns are visible without horizontal overflow" etc.). (Finding also applies to psh-s7 AC6.)

---

## Score Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| A — Traceability | 5 | PASS |
| B — Scope integrity | 5 | PASS |
| C — AC quality | 4 | PASS |
| D — Completeness | 5 | PASS |
| E — Architecture compliance | 5 | PASS |

**A — Traceability (5):** All three reference links present. "So that" names M3a and M3b with specific targets. Benefit linkage explains the mechanism for both metrics (CI test for M3a, PostHog event for M3b). Both metrics appear in coverage matrix for this story.

**B — Scope integrity (5):** Out-of-scope enumerates four exclusions. No discovery out-of-scope items implemented. Org kanban correctly deferred to psh-s7.

**C — AC quality (4):** AC1–AC5 are well-formed Given/When/Then. AC1 names all 8 columns. AC3 specifies icon/text alongside colour (not colour alone). AC5 names PostHog event properties. AC6 is a DoR note, not a testable criterion (1-L3). Minimum 3 testable ACs: satisfied (AC1–AC5).

**D — Completeness (5):** All template fields populated. Named persona. Benefit linkage with mechanism. Out-of-scope with real exclusions. NFRs with performance (2s for ≤50 features), accessibility. Complexity 2, scope stability Stable. CSS-layout AC flagged in DoR pre-check.

**E — Architecture compliance (5):** ADR-018 (Playwright/RISK-ACCEPT for CSS-layout ACs), MC-A11Y-01, MC-A11Y-02, MC-SEC-01, ADR-003 (conditional) all referenced. Architecture Constraints field fully populated. No active ADR missed.

---

**Verdict:** PASS — all criteria scored 4 or above. 0 HIGH, 0 MEDIUM, 1 LOW (AC6 DoR note formatted as AC — minor restructure recommended).
