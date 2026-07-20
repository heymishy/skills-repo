## Definition of Ready: Impersonation audit log

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/d3-impersonation-audit-log.md`
**Test plan reference:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/d3-test-plan.md`
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
| H5 | Benefit linkage | ✅ | |
| H6 | Complexity rated | ✅ | Rating 2 |
| H7 | No unresolved HIGH | ✅ | Review PASS, 0 findings |
| H8 | No uncovered ACs | ✅ | |
| H9 | Architecture Constraints | ✅ | References `credit_audit_log` convention |
| H-E2E | N/A | ✅ | |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | N/A | ✅ | |
| H-NFR3 | Data classification | ✅ | Confidential |
| H-GOV | Approved By | ✅ | |
| H-ADAPTER | N/A | ✅ | Reuses D1's adapter for reads, introduces no new one |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability | ✅ | — | Stable — lower ambiguity than D1/D2 |
| W3 | MEDIUM findings | ✅ N/A | — | 0 findings |
| W4 | Verification script reviewed | ⚠️ | Not yet reviewed | Operator to review before assigning |
| W5 | No uncertain gaps | ✅ | — | |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Impersonation audit log — artefacts/2026-07-21-web-ui-experience-redesign/stories/d3-impersonation-audit-log.md
Test plan: artefacts/2026-07-21-web-ui-experience-redesign/test-plans/d3-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope beyond the ACs/tests.

Constraints:
- Depends on D1's audit table schema existing first.
- Enforce requireAdmin at the API layer (AC3) -- do not rely on the UI tab
  simply being hidden as the only protection.
- Read-only -- this story never writes to the audit table.
- Open a draft PR when tests pass -- do not mark ready for review.

Oversight level: High
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes — named human sign-off required (consistent with the rest of Epic D, even though this story's own complexity is lower than D1/D2).
**Signed off by:** _[Pending — Hamish King, Founder/Operator, to confirm explicitly before this story is assigned]_
