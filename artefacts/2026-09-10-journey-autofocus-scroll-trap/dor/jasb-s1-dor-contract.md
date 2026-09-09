# Contract Proposal — /journey's unconditional autofocus on the "new feature" input auto-scrolls past the entire feature list on every page load

**Story:** `artefacts/2026-09-10-journey-autofocus-scroll-trap/stories/jasb-s1-remove-unconditional-autofocus-on-journey-new-feature-input.md`
**Date:** 2026-09-10

---

**What will be built:**
In `src/web-ui/routes/journey.js`, the `#jh-fname` input (currently line 344, inside the "Start a new feature" section rendered by `handleGetJourney`) will have its `autofocus` attribute made conditional on the existing `showNewForm` boolean (already computed at the top of the handler from `req.query.new === '1'`, already gating the panel's highlight styling at line 338). Instead of the literal, unconditional `autofocus` attribute always present in the template string, the attribute will only be emitted when `showNewForm` is `true`.

**What will NOT be built:**
No pagination, virtualization, or any other change to how the feature list itself renders. The list will remain exactly as long as it is today (currently 269 non-terminal features on `wuce-staging`) — this story only stops the browser from auto-scrolling to the bottom on a plain `/journey` load; it does not make the list shorter or faster to render.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Seed ~40 synthetic journeys via `/test/seed-durable-stage`, load `/journey` with no query string, assert `window.scrollY === 0` and `document.activeElement !== #jh-fname` | E2E (Playwright) |
| AC2 | Load `/journey?new=1`, assert `#jh-fname` `toBeFocused()` and `toBeInViewport()` | E2E (Playwright) |
| AC3 | Fill and submit the "Start a new feature" form from `/journey`, assert successful redirect into a new skill session | E2E (Playwright) |

**Assumptions:**
- The `showNewForm` boolean's existing computation (`req.query && req.query.new === '1'`) is correct and unchanged by this story — reused, not re-derived.
- No other code path relies on `#jh-fname` always carrying a literal `autofocus` attribute in the served HTML (confirmed by reading `journey.js` — the only reference to `jh-fname` is this one input definition and its `<label for="jh-fname">`).
- Playwright's own `toBeFocused()`/`toBeInViewport()` assertions and `page.evaluate()` for `window.scrollY` are suffficient to observe this behaviour reliably in CI (already used elsewhere in `tests/e2e/`, e.g. `fpux.1-keyboard-focus.spec.js`).

**Estimated touch points:**
Files: `src/web-ui/routes/journey.js` (one line changed, ~line 344), `tests/e2e/` (one new spec file).
Services: None.
APIs: None — no new or changed route; only rendering conditional on an existing, already-computed value.
