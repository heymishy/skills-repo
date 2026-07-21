## Definition of Ready: Credits tab — restyle admin credit management into the shared design system

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/c3-credits-tab-restyle.md`
**Test plan reference:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/c3-test-plan.md`
**Assessed by:** Claude (agent)
**Date:** 2026-07-21

---

**CONTRACT REVIEW:** ✅ Passed — all 4 ACs have a matching test approach.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1–H2 | Story format, ≥3 ACs | ✅ | 4 ACs |
| H3 | Every AC has a test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage | ✅ | |
| H6 | Complexity rated | ✅ | Rating 1 |
| H7 | No unresolved HIGH | ✅ | Review PASS, 0 findings |
| H8 | No uncovered ACs | ✅ | |
| H9 | Architecture Constraints | ✅ | Explicit CSRF preservation constraint |
| H-E2E | N/A | ✅ | |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | N/A | ✅ | |
| H-NFR3 | Data classification | ✅ | Confidential (credit/tenant financial data) |
| H-GOV | Approved By | ✅ | |
| H-ADAPTER | N/A | ✅ | Reuses existing admin-credits handlers, no new adapter |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability | ✅ | — | Stable |
| W3 | MEDIUM findings | ✅ N/A | — | 0 findings |
| W4 | Verification script reviewed | ⚠️ | Not yet reviewed | Operator to review before assigning |
| W5 | No uncertain gaps | ✅ | — | |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Credits tab — restyle admin credit management into the shared design system — artefacts/2026-07-21-web-ui-experience-redesign/stories/c3-credits-tab-restyle.md
Test plan: artefacts/2026-07-21-web-ui-experience-redesign/test-plans/c3-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope beyond the ACs/tests.

Constraints:
- Preserve the existing CSRF token flow (generateCsrfToken/csrfField) EXACTLY --
  this is the single most security-relevant part of this restyle. Do not
  regenerate or restructure the hidden CSRF field's mechanics.
- Reuse adminCreditsGet/adminCreditsPost's validation logic unchanged.
- Open a draft PR when tests pass -- do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No — proceed directly to coding agent assignment.
