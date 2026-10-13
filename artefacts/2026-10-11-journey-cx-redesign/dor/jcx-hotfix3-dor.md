# Definition of Ready Checklist (Short-track)

## Definition of Ready: Customer experience swimlane grid stays visible in every view (CSS specificity bug)

**Story reference:** short-track bug fix (production visual bug)
**Test plan reference:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-hotfix3-test-plan.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-14

---

## Short-track justification

Bug fix, bounded, single-rule deletion in one file (`src/web-ui/routes/journeys.js`), root cause confirmed directly against real staging via a live Chrome session (Customer experience tab correct, Delivery tab shows both the grid AND the old list simultaneously), not assumed. Matches CLAUDE.md's own short-track criteria exactly, same pattern as `jcx-hotfix1`/`jcx-hotfix2` earlier in this feature's own history. Skips discovery through review (steps 1-4); `/definition-of-done` still applies after merge.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H3 | Every AC has ≥1 test | ✅ | 1 AC (the grid is visible only in the Customer-experience view, never in Canvas or Delivery), covered by a new jsdom test plus live re-verification on staging after deploy |
| H9 | Architecture Constraints — no Category E HIGH | ✅ | Pure bug fix (deleting one redundant, harmful CSS rule) — no new pattern, no schema change, no new route, no change to any handler's own logic |
| H-GOV | Production-visual-bug urgency | ✅ | Live-confirmed on `wuce-staging.fly.dev`: Customer experience tab correct; Delivery tab shows the grid AND the old delivery list simultaneously, confirmed via direct screenshot comparison, not assumed |

**All hard blocks PASS.**

---

## Coding Agent Instructions

```
Proceed: Yes
Goal: Delete the '.sw-cx-swimlane-grid{display:block}' CSS rule added by
jcx-s6 in src/web-ui/routes/journeys.js -- it has the same specificity as
the base '.sw-stage-annotations{display:none}' rule and, being later in
the stylesheet, unconditionally wins the cascade, making the grid visible
in every view. The EXISTING rule '.sw-journey-canvas--view-customer-
experience .sw-stage-annotations--customer-experience{display:block}'
already correctly handles visibility -- the grid container already
carries both classes.

Constraints:
- This is the ONLY rule affected -- confirmed by reading every other CSS
  rule added by jcx-s6; none of the row/cell/label rules set display on
  a view-independent basis.
- Add a regression test (tests/check-jcx-hotfix3-cx-grid-visibility.js)
  using jsdom's real getComputedStyle against the real rendered <style>
  block (not a string-matching check on the CSS text) -- reuse
  check-ep3-s1-customer-experience-view.js's own established AC3 pattern
  for this exact class-toggle mechanism. Assert: hidden by default
  (canvas view), visible after switching to customer-experience, HIDDEN
  AGAIN after switching to delivery -- that last assertion is the one
  that would have caught this bug before it shipped.
- Deploy to staging and confirm live via a real Chrome click-through
  (Customer experience tab, then Delivery tab, confirm the grid
  disappears) before considering this done -- this is a live, confirmed
  bug, not just a code fix.
- Note in decisions.md and in jcx-s6-dod.md's own Follow-up Actions that
  this is a correction to an already-merged, DoD-pending story found by
  live verification immediately after merge.

Oversight level: Low (single-file, single-rule deletion, well-understood fix)
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No — production-visual-bug fast-track, found during operator-requested live Chrome validation immediately after merge (same pattern as `jcx-hotfix1`/`jcx-hotfix2`).
