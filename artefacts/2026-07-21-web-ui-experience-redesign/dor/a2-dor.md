## Definition of Ready: Reassign an epic to a different module

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/a2-reassign-epics-between-modules.md`
**Test plan reference:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a2-test-plan.md`
**Assessed by:** Claude (agent)
**Date:** 2026-07-21

---

**CONTRACT REVIEW:** ✅ Passed — all 4 ACs have a matching test approach, no mismatches.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | |
| H2 | ≥3 ACs Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has a test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage references named metric | ✅ | Same metric as A1 |
| H6 | Complexity rated | ✅ | Rating 1 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS, Run 1, 0 findings at all |
| H8 | No uncovered ACs | ✅ | |
| H9 | Architecture Constraints populated | ✅ | References A1's schema |
| H-E2E | N/A | ✅ | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | N/A | ✅ | |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-GOV | Approved By populated | ✅ | Same discovery artefact as A1 |
| H-ADAPTER | N/A | ✅ | Reuses A1's adapter, introduces no new one |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | Stable |
| W3 | MEDIUM findings acknowledged | ✅ N/A | — | 0 findings |
| W4 | Verification script reviewed | ⚠️ | Not yet reviewed | Operator to review before assigning |
| W5 | No uncertain gap items | ✅ | — | |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Reassign an epic to a different module — artefacts/2026-07-21-web-ui-experience-redesign/stories/a2-reassign-epics-between-modules.md
Test plan: artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope beyond the ACs/tests.

Constraints:
- Depends on A1's schema/adapter existing first -- do not implement A2 before A1 is merged.
- Enforce product-scoping on reassignment (AC4) using the same pattern as A1.
- Open a draft PR when tests pass -- do not mark ready for review.
- If an ambiguity arises: add a PR comment, do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only
**Signed off by:** Hamish King (Founder/Operator) — awareness confirmed
