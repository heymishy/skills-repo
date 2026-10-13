# Test Plan (Short-track): "+ Add stage" is invisible and never receives focus outside the Delivery view

**Story reference:** short-track bug fix (production functional bug, confirmed live on staging via `javascript_tool`); found during `spikes/cx-interaction-design-polish-outcome.md` Part 2
**Date:** 2026-10-14

---

## Root cause

`journeys.js`'s own `addBtn` click handler (the "+ Add stage" button) creates a new, unsaved `<input class="sw-stage-name-input">` wrapped in a `.sw-stage-card--new` div and appends it to `#sw-journey-stages` — the legacy per-stage card list. That container is hidden (`display:none`) in BOTH the Canvas view (`.sw-journey-canvas--view-canvas #sw-journey-stages{display:none}`, from `ep2-s3`, predates this feature) and the Customer-experience view (`.sw-journey-canvas--view-customer-experience #sw-journey-stages{display:none}`, added by `jcx-s6` to extend the same already-existing pattern). It is visible only in the Delivery view. The handler then calls `input.focus()`, which silently no-ops because a descendant of a `display:none` ancestor cannot receive focus (HTML spec).

**Confirmed live** via `javascript_tool` on `wuce-staging.fly.dev`: from the Customer-experience view, calling `document.getElementById('sw-add-stage-btn').click()` created the new input in the DOM (`newCardExists: true`) but left `stagesListDisplay: "none"` and `document.activeElement` on the button itself (`isActiveElement: false`) — the user sees no visible change and cannot type a name. The Canvas view (the page's own default on load) has the identical defect, since it hides the same container.

**Impact:** "+ Add stage" — the first step in building a journey map — silently does nothing from the two views a user actually works from by default. It only works from the Delivery view.

**Fix:** insert the new unsaved stage-card as a sibling of `addBtn` itself (which is NOT inside `#sw-journey-stages` and is visible in all 3 views), instead of inside the view-conditionally-hidden list. No change to the visibility rules for existing, saved stage cards — those are correctly scoped as-is; this only changes where the new, transient, unsaved input renders before its first save.

---

## Verification

| Check | Method | Result |
|-------|--------|--------|
| New regression test: clicking "+ Add stage" while the Canvas view is active results in a visible, focusable new-stage input | `tests/check-jcx-hotfix4-add-stage-visibility.js` (jsdom `getComputedStyle` + `dispatchEvent`-driven click, reusing `check-ic-s1-...`/`check-ep2-s3-...`'s own established real-DOM-interaction convention) | New test, must pass; confirmed RED against the bug, GREEN against the fix |
| Same check repeated with the Customer-experience view active | Same test file, second scenario | New test, must pass |
| Existing Delivery-view add-stage behaviour unchanged (still works, no regression) | Same test file, third scenario | New test, must pass |
| Full repo suite, no regressions | `npm test` | Must be 0 failures |
| Real-world fix confirmed live | Live Chrome/`javascript_tool` check against `wuce-staging.fly.dev` after deploy: from the Customer-experience view, click "+ Add stage", confirm the input is visible and focused | Pending deploy |

**Known residual gap, logged not fixed here:** the save handler still performs a full `window.location.reload()` on success, which resets the active view back to the default Canvas view regardless of where the user was working. This is a separate, named finding (Part 2, finding 2 of the spike) — not fixed in this narrowly-scoped hotfix, which addresses only the confirmed invisible/unfocused-input defect.
