## Definition of Ready: Persistent viewing-as banner, exit flow, and permission-scoped visibility

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/d2-banner-exit-and-permission-scoped-visibility.md`
**Test plan reference:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/d2-test-plan.md`
**Assessed by:** Claude (agent)
**Date:** 2026-07-21

---

**CONTRACT REVIEW:** ✅ Passed — all 5 ACs have a matching test approach; this is the most rigorously specified story in the feature (both directions of the effective-role property tested explicitly).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1–H2 | Story format, ≥3 ACs | ✅ | 5 ACs |
| H3 | Every AC has a test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage | ✅ | Directly ties to the risk metric |
| H6 | Complexity rated | ✅ | Rating 3 |
| H7 | No unresolved HIGH | ✅ | Review PASS, 0 findings |
| H8 | No uncovered ACs | ✅ | |
| H9 | Architecture Constraints | ✅ | Strong, explicit constraints |
| H-E2E | Layout-dependent gap check | ✅ | AC1 (banner persistence) is CSS-layout-dependent; Playwright is configured — no gap |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | N/A | ✅ | |
| H-NFR3 | Data classification | ✅ | Confidential |
| H-GOV | Approved By | ✅ | |
| H-ADAPTER | N/A | ✅ | No new adapter — reads D1's existing session state |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability | ✅ | Declared Unstable — depends on D1's mechanism landing first | Operator aware |
| W3 | MEDIUM findings | ✅ N/A | — | 0 findings |
| W4 | Verification script reviewed | ⚠️ | Not yet reviewed; all 5 scenarios marked 🔴 high-risk | **Operator must review `d2-verification.md` before assigning** |
| W5 | No uncertain gaps | ✅ | — | |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Persistent viewing-as banner, exit flow, and permission-scoped visibility — artefacts/2026-07-21-web-ui-experience-redesign/stories/d2-banner-exit-and-permission-scoped-visibility.md
Test plan: artefacts/2026-07-21-web-ui-experience-redesign/test-plans/d2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope beyond the ACs/tests.

Constraints:
- Depends entirely on D1 being merged first -- do not begin until D1's
  session-swap mechanism exists and is queryable.
- The banner MUST be implemented at the shell level (renderShell), not
  opt-in per route -- a route that forgets to add it must still show it.
- Effective-role visibility logic must be applied to EVERY existing
  requireAdmin-gated surface, not only newly-built ones. Enumerate them via
  grep -rn "requireAdmin" src/web-ui/ as your own checklist.
- Test BOTH directions explicitly: a non-admin target hides admin surfaces
  (AC2) AND an admin target correctly shows them (AC3) -- do not implement
  a blanket "always hide while impersonating" shortcut.
- This story is the direct subject of D4's dedicated security review --
  write with that scrutiny in mind.
- Open a draft PR when tests pass -- do not mark ready for review.

Oversight level: High
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes — named human sign-off required.
**Signed off by:** Hamish King — Founder/Operator — 2026-07-21
