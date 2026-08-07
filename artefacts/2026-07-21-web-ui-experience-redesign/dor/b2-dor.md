## Definition of Ready: Restructure account-level nav items and add a dangling-link regression test

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/b2-account-nav-restructure-and-dangling-link-test.md`
**Test plan reference:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/b2-test-plan.md`
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
| H9 | Architecture Constraints | ✅ | |
| H-E2E | N/A | ✅ | |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | N/A | ✅ | |
| H-NFR3 | Data classification | ✅ | Internal |
| H-GOV | Approved By | ✅ | |
| H-ADAPTER | N/A | ✅ | |

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
Story: Restructure account-level nav items and add a dangling-link regression test — artefacts/2026-07-21-web-ui-experience-redesign/stories/b2-account-nav-restructure-and-dangling-link-test.md
Test plan: artefacts/2026-07-21-web-ui-experience-redesign/test-plans/b2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope beyond the ACs/tests.

Constraints:
- Depends on B1 being merged first.
- Admin-only nav visibility must key off requireAdmin's LIVE role check, not
  a session-start-cached role (AC2).
- Open a draft PR when tests pass -- do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No — proceed directly to coding agent assignment.
