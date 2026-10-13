# Definition of Ready Checklist (Short-track)

## Definition of Ready: "+ Add stage" is invisible and never receives focus outside the Delivery view

**Story reference:** short-track bug fix (production functional bug)
**Test plan reference:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-hotfix4-test-plan.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-14

---

## Short-track justification

Bug fix, bounded to one event-handler change in one file (`src/web-ui/routes/journeys.js`), root cause confirmed directly against real staging via `javascript_tool` (new input exists in the DOM but its container stays `display:none` and focus never moves to it), not assumed. Matches CLAUDE.md's own short-track criteria exactly, same pattern as `jcx-hotfix1`/`jcx-hotfix2`/`jcx-hotfix3` earlier in this feature's own history. Skips discovery through review (steps 1-4); `/definition-of-done` still applies after merge.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H3 | Every AC has ≥1 test | ✅ | 1 AC ("+ Add stage" produces a visible, focused, usable input regardless of active view), covered by a new jsdom test (3 scenarios: canvas, customer-experience, delivery-no-regression) plus live re-verification on staging after deploy |
| H9 | Architecture Constraints — no Category E HIGH | ✅ | Pure client-side DOM-insertion-point change — no new pattern, no schema change, no new route, no change to the save/PATCH logic or to any existing stage card's own rendering |
| H-GOV | Production-functional-bug urgency | ✅ | Confirmed live on `wuce-staging.fly.dev` via `javascript_tool`: clicking the real button produced a DOM node whose container stayed `display:none` and never received focus — reproduced directly, not inferred from code reading alone |

**All hard blocks PASS.**

---

## Coding Agent Instructions

```
Proceed: Yes
Goal: Fix "+ Add stage" so the new, unsaved stage-name input is visible
and receives focus regardless of which canvas view (Canvas, Customer
experience, Delivery) is currently active. Today the click handler in
src/web-ui/routes/journeys.js appends the new input into #sw-journey-stages,
which is hidden (display:none) in both the Canvas and Customer-experience
views (visible only in Delivery) -- confirmed live via javascript_tool
that this makes the click silently do nothing from the two views a user
actually works from by default.

Fix: insert the new, unsaved .sw-stage-card--new element as a SIBLING of
addBtn itself (e.g. addBtn.insertAdjacentElement('beforebegin', card)),
not inside #sw-journey-stages. addBtn is not inside that container and is
confirmed visible (inline-block) in all 3 views. Do not change the
view-conditional visibility rules for #sw-journey-stages itself, and do
not change how already-saved stage cards render in any view -- those are
correctly scoped as-is; only the transient, unsaved new-stage input's
insertion point changes.

Constraints:
- Do not touch the save() function's own PATCH/POST logic, the
  window.location.reload() call, or any other event handler in this
  file -- scope is the insertion point only. (The reload-resets-the-view
  behaviour is a separate, already-named finding in
  spikes/cx-interaction-design-polish-outcome.md, Part 2 finding 2 --
  explicitly out of scope for this hotfix.)
- Add a regression test (tests/check-jcx-hotfix4-add-stage-visibility.js)
  using jsdom with real dispatchEvent-driven clicks and real
  getComputedStyle, not a string-matching check. Three scenarios: (1)
  canvas view active, click add-stage, assert the new input is visible
  (computed display is not "none" on any ancestor up to body) and is
  document.activeElement; (2) same assertions with customer-experience
  view active; (3) delivery view active, confirm the existing behaviour
  is unchanged (input still appears inside #sw-journey-stages, as before
  -- no regression to the one view that already worked).
- Confirm RED against the current code (test fails, reproducing the bug)
  before applying the fix, then GREEN after.
- Deploy to staging and confirm live via javascript_tool or Chrome
  (click "+ Add stage" from the Customer-experience view, confirm a
  visible, focused input appears) before considering this done.
- Note in decisions.md that this is a long-standing defect (predates
  jcx-s6, originating in ep2-s3's own view-toggle work) found during the
  cx-interaction-design-polish spike, not a new regression from this
  feature's own recent stories.

Oversight level: Low (single-file, single-insertion-point change, well-understood fix)
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No — operator already explicitly confirmed proceeding with this fix as a hotfix via direct reply to the spike's own findings ("Fix the bug now as a hotfix (Recommended)"), 2026-10-14.
