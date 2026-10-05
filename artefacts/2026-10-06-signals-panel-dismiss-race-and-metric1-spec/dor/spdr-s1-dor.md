# Definition of Ready Checklist

## Definition of Ready: Disable the Dismiss/Undismiss button on submit

**Story reference:** artefacts/2026-10-06-signals-panel-dismiss-race-and-metric1-spec/stories/spdr-s1-disable-dismiss-button-on-submit.md
**Test plan reference:** artefacts/2026-10-06-signals-panel-dismiss-race-and-metric1-spec/test-plans/spdr-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-06

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "operator triaging signals quickly" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1 via markup assertion (documented gap, matching dswf-s1's AC4 precedent), AC2/AC3 direct, AC4 via reasoning + no markup change to focus/tabindex |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ N/A | UI robustness fix, no metric moved — matches dswf-s1's own precedent for non-metric-moving short-track fixes |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings from the review report | ⚠️ **Short-track exemption** | No review ran — short-track. Logged in `decisions.md`. |
| H8 | Test plan has no uncovered ACs | ✅ | AC1's gap is documented and mitigated, not silently uncovered |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated with confirmed root cause, exact file/function, and explicit compatibility check against sptu-s4's own AC6 |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | Not CSS-layout-dependent — a timing/markup behaviour |
| H-GOV | Discovery `## Approved By` non-blank | ⚠️ **Short-track exemption** | No discovery — short-track. This story is itself the named follow-up the operator explicitly asked to pick up ("Do both follow ups please", 2026-10-06). Logged in `decisions.md`. |
| H-ADAPTER | D37 | ✅ N/A | No new adapter |

**All hard blocks PASS**, with H7 and H-GOV satisfied via the documented short-track exemption.

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated | ✅ |
| W2 | Scope stability declared | ✅ |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md` — no section directly applicable beyond "no new npm dependency," already satisfied (plain HTML attribute, no JS library).

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Disable the Dismiss/Undismiss button on submit
  — artefacts/2026-10-06-signals-panel-dismiss-race-and-metric1-spec/stories/spdr-s1-disable-dismiss-button-on-submit.md
Test plan: artefacts/2026-10-06-signals-panel-dismiss-race-and-metric1-spec/test-plans/spdr-s1-test-plan.md

Goal: Make every test in the test plan pass. Do not add scope beyond the ACs.

Constraints:
- Modify ONLY src/web-ui/views/signals-panel-view.js's _dismissControl() function
  — add an onsubmit attribute to the existing <form>, nothing else
- Do NOT convert this to a fetch()-based control
- Extend tests/check-sptu-s4-signals-dismiss.js with the new test(s)
- Open a draft PR when tests pass

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight, short-track, DoR PROCEED: Yes)
