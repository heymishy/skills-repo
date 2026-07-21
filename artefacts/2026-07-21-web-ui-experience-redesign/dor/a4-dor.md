## Definition of Ready: Render the product view grouped by module with dual health/coverage indicators and a scale gauge

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/a4-module-grouped-rendering-and-scale-gauge.md`
**Test plan reference:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a4-test-plan.md`
**Assessed by:** Claude (agent)
**Date:** 2026-07-21

---

**CONTRACT REVIEW:** ✅ Passed — all 5 ACs have a matching test approach.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1–H2 | Story format, ≥3 ACs | ✅ | 5 ACs |
| H3 | Every AC has a test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage | ✅ | |
| H6 | Complexity rated | ✅ | Rating 2 |
| H7 | No unresolved HIGH | ✅ | Review PASS, 1 LOW only |
| H8 | No uncovered ACs | ✅ | |
| H9 | Architecture Constraints populated | ✅ | |
| H-E2E | Layout-dependent AC + E2E tooling check | ✅ | AC5 is CSS-layout-dependent; Playwright IS configured in this repo (`test:e2e`) — no gap |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | N/A | ✅ | |
| H-NFR3 | Data classification | ✅ | Internal |
| H-GOV | Approved By | ✅ | |
| H-ADAPTER | N/A | ✅ | No new adapter introduced |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability | ✅ | — | Stable |
| W3 | MEDIUM findings | ✅ N/A | — | 0 MEDIUM (1 LOW only, no action needed) |
| W4 | Verification script reviewed | ⚠️ | Not yet reviewed | Operator to review before assigning |
| W5 | No uncertain gaps | ✅ | — | |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Render the product view grouped by module with dual health/coverage indicators and a scale gauge — artefacts/2026-07-21-web-ui-experience-redesign/stories/a4-module-grouped-rendering-and-scale-gauge.md
Test plan: artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a4-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope beyond the ACs/tests.

Constraints:
- Depends on A1, A2, and A3 being merged first.
- Reuse html-shell.js's existing design tokens -- do not introduce a new styling system.
- All operator-authored content (module/epic names) must pass through _escapeHtml.
- The expand/collapse transition must use a real CSS transition (grid-template-rows
  or equivalent), not an instant show/hide -- covered by the Playwright E2E test.
- Open a draft PR when tests pass -- do not mark ready for review.
- If an ambiguity arises: add a PR comment, do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only
**Signed off by:** Hamish King (Founder/Operator) — awareness confirmed
