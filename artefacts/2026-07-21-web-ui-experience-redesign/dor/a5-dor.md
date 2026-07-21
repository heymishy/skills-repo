## Definition of Ready: Surface discovery-only and ideation-only work in a Roadmap tab

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/a5-roadmap-tab.md`
**Test plan reference:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a5-test-plan.md`
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
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references named metric | ✅ | Indirect linkage — see review finding 1-M1, risk-accepted |
| H6 | Complexity rated | ✅ | Rating 2 |
| H7 | No unresolved HIGH | ✅ | Review PASS, 1 MEDIUM (risk-accepted) |
| H8 | No uncovered ACs | ✅ | |
| H9 | Architecture Constraints | ✅ | |
| H-E2E | N/A | ✅ | |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | N/A | ✅ | |
| H-NFR3 | Data classification | ✅ | Internal |
| H-GOV | Approved By | ✅ | |
| H-ADAPTER | N/A | ✅ | No new adapter — direct filesystem read |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability | ✅ | — | Stable |
| W3 | MEDIUM findings acknowledged | ✅ | Already logged as RISK-ACCEPT in decisions.md (2026-07-21, review 1-M1) | Hamish King, implicitly per the review's own completion path |
| W4 | Verification script reviewed | ⚠️ | Not yet reviewed | Operator to review before assigning |
| W5 | No uncertain gaps | ✅ | — | |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Surface discovery-only and ideation-only work in a Roadmap tab — artefacts/2026-07-21-web-ui-experience-redesign/stories/a5-roadmap-tab.md
Test plan: artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a5-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope beyond the ACs/tests.

Constraints:
- Read-only operation -- never write to or modify any artefact file.
- Do not build the full sync/cache pipeline -- this is a render-time scan only,
  explicitly deferred per discovery's Out of Scope.
- Open a draft PR when tests pass -- do not mark ready for review.
- If an ambiguity arises: add a PR comment, do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only
**Signed off by:** Hamish King (Founder/Operator) — awareness confirmed
