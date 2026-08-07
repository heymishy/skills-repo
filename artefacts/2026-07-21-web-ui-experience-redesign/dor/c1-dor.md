## Definition of Ready: Settings page shell with Profile tab

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/c1-settings-shell-and-profile-tab.md`
**Test plan reference:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/c1-test-plan.md`
**Assessed by:** Claude (agent)
**Date:** 2026-07-21

---

**CONTRACT REVIEW:** ✅ Passed — all 4 ACs have a matching test approach.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1–H2 | Story format, ≥3 ACs | ✅ | 4 ACs |
| H3 | Every AC has a test | ✅ | AC3's external-dependency gap has a manual scenario, satisfying H3 |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage | ✅ | |
| H6 | Complexity rated | ✅ | Rating 1 |
| H7 | No unresolved HIGH | ✅ | Review PASS, 0 findings |
| H8 | No uncovered ACs | ✅ | AC3's external-dependency gap acknowledged with a manual scenario |
| H9 | Architecture Constraints | ✅ | |
| H-E2E | N/A | ✅ | AC3's gap is External-dependency, not CSS-layout-dependent — different gap type, H-E2E doesn't apply |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | N/A | ✅ | |
| H-NFR3 | Data classification | ✅ | Internal |
| H-GOV | Approved By | ✅ | |
| H-ADAPTER | N/A | ✅ | No new adapter — reuses existing account-linking handlers |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability | ✅ | — | Stable |
| W3 | MEDIUM findings | ✅ N/A | — | 0 findings |
| W4 | Verification script reviewed | ⚠️ | Not yet reviewed | Operator to review before assigning |
| W5 | No uncertain gaps | ✅ | AC3's real-OAuth gap is explicitly acknowledged with a manual scenario, not left uncertain | |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Settings page shell with Profile tab — artefacts/2026-07-21-web-ui-experience-redesign/stories/c1-settings-shell-and-profile-tab.md
Test plan: artefacts/2026-07-21-web-ui-experience-redesign/test-plans/c1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope beyond the ACs/tests.

Constraints:
- Reuse handleStartGoogleLink/handleStartGithubLink and the existing
  callback handlers unmodified -- this story wraps them in the shell,
  it does not reimplement OAuth linking logic.
- Open a draft PR when tests pass -- do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No — proceed directly to coding agent assignment.
