## Definition of Ready: Billing tab — plan status and Stripe portal access

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/c2-billing-tab.md`
**Test plan reference:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/c2-test-plan.md`
**Assessed by:** Claude (agent)
**Date:** 2026-07-21

---

**CONTRACT REVIEW:** ✅ Passed — all 5 ACs have a matching test approach (post-Run-2 fix resolving the AC4 scope ambiguity).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1–H2 | Story format, ≥3 ACs | ✅ | 5 ACs |
| H3 | Every AC has a test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 2 items, resolved of the earlier scope ambiguity |
| H5 | Benefit linkage | ✅ | |
| H6 | Complexity rated | ✅ | Rating 1 |
| H7 | No unresolved HIGH | ✅ | Review Run 2 PASS, 0 findings (Run 1's 2 MEDIUM resolved) |
| H8 | No uncovered ACs | ✅ | |
| H9 | Architecture Constraints | ✅ | Updated in Run 2 to name `/billing/checkout` explicitly |
| H-E2E | N/A | ✅ | |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | N/A | ✅ | |
| H-NFR3 | Data classification | ✅ | Internal |
| H-GOV | Approved By | ✅ | |
| H-ADAPTER | N/A | ✅ | No new adapter |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability | ✅ | — | Stable |
| W3 | MEDIUM findings | ✅ N/A | — | 0 findings after Run 2 fix |
| W4 | Verification script reviewed | ⚠️ | Not yet reviewed | Operator to review before assigning |
| W5 | No uncertain gaps | ✅ | — | |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Billing tab — plan status and Stripe portal access — artefacts/2026-07-21-web-ui-experience-redesign/stories/c2-billing-tab.md
Test plan: artefacts/2026-07-21-web-ui-experience-redesign/test-plans/c2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope beyond the ACs/tests.

Constraints:
- Depends on C1's shell existing first.
- Reuse /billing/plan-state, /settings/billing, and /billing/checkout
  exactly as they exist today -- no new Stripe logic.
- Open a draft PR when tests pass -- do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No — proceed directly to coding agent assignment.
