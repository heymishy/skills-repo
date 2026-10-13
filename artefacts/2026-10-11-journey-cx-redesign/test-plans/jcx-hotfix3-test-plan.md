# Test Plan (Short-track): Customer experience swimlane grid stays visible in every view (CSS specificity bug)

**Story reference:** short-track bug fix (production visual bug, confirmed live on staging via Chrome)
**Date:** 2026-10-14

---

## Root cause

`jcx-s6` (merged, deployed) added `'.sw-cx-swimlane-grid{display:block}'` to `journeys.js`'s own inline `<style>` block. This selector has the SAME specificity as the pre-existing base rule `'.sw-stage-annotations{display:none;...}'` (both single-class selectors) — and since the new rule is textually LATER in the stylesheet, it wins the cascade unconditionally, overriding the base hide rule regardless of which view is active. The grid container already carries both `sw-stage-annotations--customer-experience` and `sw-cx-swimlane-grid` classes, and the EXISTING, correctly-scoped rule `'.sw-journey-canvas--view-customer-experience .sw-stage-annotations--customer-experience{display:block}'` already handles making it visible only in the Customer-experience view — the new rule was redundant and actively harmful.

**Confirmed live** on `wuce-staging.fly.dev`: opened a journey's Customer experience tab (grid correctly visible), then clicked the Delivery tab — the swimlane grid (persona-less: EMOTION/CUSTOMER ACTIONS/TOUCHPOINTS/PAIN POINTS/OPPORTUNITIES rows) remained fully visible, stacked directly above the old per-stage Delivery list ("Evaluate ✕ No coverage ↓ Edit stage Map feature Add placeholder" etc.) — both rendering simultaneously, which should never happen.

**Fix:** remove the unconditional `.sw-cx-swimlane-grid{display:block}` rule entirely. Visibility is already fully and correctly handled by the existing view-scoped descendant-selector rule.

---

## Verification

| Check | Method | Result |
|-------|--------|--------|
| New regression test: grid hidden by default (canvas view), visible in customer-experience view, hidden again in delivery view | `tests/check-jcx-hotfix3-cx-grid-visibility.js` (jsdom `getComputedStyle`, reusing `check-ep3-s1-customer-experience-view.js`'s own established AC3 pattern for this exact class-toggle mechanism) | New test, must pass; confirmed RED against the bug, GREEN against the fix |
| Full repo suite, no regressions | `npm test` | Must be 0 failures |
| Real-world fix confirmed (the actual visual bug no jsdom test alone proves fixed) | Live Chrome check against `wuce-staging.fly.dev` after deploy: open Customer experience tab, then Delivery tab, confirm the grid disappears and only the Delivery list shows | Pending deploy |

**Known residual gap, logged not fixed here:** this is the second CSS-cascade/specificity-class bug found by live verification in two consecutive sessions in this feature area (the first being the dashboard CSRF gap, a different class of issue). No dedicated CSS-specificity lint/test exists in this repo's own governance checks to catch "a later same-specificity rule silently overriding an earlier conditional one" automatically — worth a `/improve` candidate, not attempted here (same-day fix scope only).
