# AC Verification Script: Render journey stages as connected nodes on a drawflow canvas, replacing the linear list

**Story reference:** artefacts/2026-10-10-infinite-canvas/stories/ic-s1.md
**Technical test plan:** artefacts/2026-10-10-infinite-canvas/test-plans/ic-s1-test-plan.md
**Script version:** 1
**Verified by:** Claude (session verify-completion pass) | **Date:** 2026-10-11 | **Context:** [x] Pre-code  [ ] Post-merge  [ ] Demo

**Method note:** Verified against the real `handleGetJourneyCanvas` production output (the `res.writeHead`/`res.end` branch, full page shell via `renderShellWithNav`, not the jsdom test-mock `res.status`/`res.json` branch), rendered in an actual Chrome tab via the already-running local dev server for `/vendor/drawflow.min.js`/`.css`, with a real `window.Drawflow` instance. Not run against a live-created journey end-to-end (this repo's `fake-test-db.js` has no `customer_journeys` backing in `NODE_ENV=test` with no `DATABASE_URL` — a pre-existing, already-documented gap, confirmed by running the two matching E2E specs and observing them fail at journey creation for the same reason, unrelated to this story's own diff) — a mock pool matching the already-passing jsdom tests' own data shape was used instead, with the handler's real code path otherwise fully exercised.

---

## Setup

**Before you start:**
1. Open a journey with at least 3 stages, one of which is flagged "Moment of truth".
2. Click the "Canvas" tab (not "Customer experience" or "Delivery").

**Reset between scenarios:** Reload the page.

---

## Scenarios

---

### Scenario 1: Stages render as connected nodes, not a list

**Covers:** AC1

**Steps:**
1. Open the Canvas tab.

**Expected outcome:**
> Each stage shows as a boxed "node" (not a row in a vertical list), arranged left-to-right in the same order they appear elsewhere in the app. A line connects each node to the next one in sequence.

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed visually: 3 nodes (Discover, Evaluate, Buy) rendered left-to-right in position order, with a visible connecting line between each. Initially failed on first attempt — `addConnection` was called with each stage's own string id instead of the numeric id `addNode` returns, throwing inside `drawflow.min.js` and leaving no connection lines drawn (see Task 3, commit `49b7a28e`). Re-verified after the fix.

---

### Scenario 2: Every existing stage action still works

**Covers:** AC2

**Steps:**
1. On any node, find the "Edit stage" link, "Map feature" button, and health indicator.
2. Click "Edit stage" and confirm the side panel opens as before.

**Expected outcome:**
> All three elements (Edit stage link, Map feature button, health indicator) appear on the node and work exactly as they did on the old list view — nothing is missing or broken.

**Result:** [x] Pass  [ ] Fail
**Notes:** All three elements present on the node. "Map feature" confirmed working via a real `.click()` dispatch on the canvas node's own button (opened the feature picker modal) — it was already correctly wired (document-wide `querySelectorAll` binding). "Edit stage" initially did NOT work when clicked from a canvas node — the delegated click handler was scoped to `#sw-journey-stages` only, which canvas nodes are a sibling of, not a descendant of. Fixed by delegating on `document` instead (Task 3, commit `538e1504`). Re-verified after the fix: a real click opens the side panel with the correct stage's data pre-filled, including the Moment-of-truth checkbox.

---

### Scenario 3: Moment of truth badge still shows

**Covers:** AC3

**Steps:**
1. Find the node for the stage flagged "Moment of truth".

**Expected outcome:**
> That node shows the 🚩 flag badge. Other nodes do not.

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed visually: "Discover" (flagged `moment_of_truth: true`) shows the "Moment of truth" badge; "Evaluate" and "Buy" (unflagged) do not.

---

### Scenario 4: Empty journey shows the same message as before

**Covers:** AC4

**Steps:**
1. Open a journey with 0 stages (or create a new one).
2. Click the Canvas tab.

**Expected outcome:**
> You see the text "No stages yet. Add your first stage." — not a blank or broken canvas.

**Result:** [x] Pass  [ ] Fail
**Notes:** Initially FAILED: the Canvas tab rendered completely blank for a 0-stage journey. The message lives inside `#sw-journey-stages`, which Task 2's own CSS rule hides specifically on the canvas view — the jsdom AC4 test only asserted the text's presence anywhere in the HTML, never whether it was actually visible, so it passed throughout. Fixed by rendering a separate `#sw-drawflow-canvas-empty` element for the 0-stage case, using the same scoped-visibility CSS pattern as `#sw-drawflow-canvas` itself (Task 3, commit `538e1504`). Re-verified after the fix: message visible on the Canvas tab.

---

### Edge case: Canvas library actually loads

**Covers:** AC5, AC6

**Steps:**
1. Open the browser's developer console before loading the Canvas tab.
2. Load the Canvas tab.

**Expected outcome:**
> No red error about a failed script load. If you deliberately block the `/vendor/drawflow.min.js` request (e.g. via dev tools network blocking) and reload, you see a clear, visible error — not a silently blank canvas.

**Result:** [x] Pass (first half) / verified by code inspection, not a live block-and-reload test (second half)
**Notes:** "No error on successful load": confirmed — console was clean (zero messages) after all four fixes were applied; before the first fix (no `<script src>` tag at all), the drawflow library was never requested, so there was nothing to error on network-wise, but `window.Drawflow` being undefined would have hit the AC6 guard's fallback branch on the first page load, before any of this session's own live checks were run against the fixed code. "Deliberate-block → visible error": NOT separately exercised with a live network-block-and-reload — the guard itself is a single-line `textContent` assignment (`el.textContent="Canvas failed to load. Please refresh the page."`), trivially correct by inspection, and its conditional structure is covered by the passing AC6 jsdom test (`tests/check-ic-s1-canvas-render.js`). Flagging this distinction explicitly per this story's own evidence standard, rather than marking a blanket Pass.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — nodes, connected | Pass (after fix) | addConnection used wrong id type; fixed, re-verified |
| Scenario 2 — existing actions preserved | Pass (after fix) | Edit-stage click delegation scoped too narrowly; fixed, re-verified |
| Scenario 3 — moment of truth badge | Pass | No issue found |
| Scenario 4 — empty state | Pass (after fix) | Message hidden by canvas-view CSS toggle; fixed, re-verified |
| Edge case — load failure is visible | Pass (load-success half); code-inspected (block-and-reload half) | Drawflow asset was never requested at all; fixed, re-verified |

**Overall verdict:** [x] All pass — ready to proceed (after 4 real defects found this session were fixed and re-verified live)
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| Edge case (AC5/AC6) | drawflow.min.js/.css loaded on page load | Never requested at all — no `<script>`/`<link>` tag existed anywhere | HIGH | Fixed (commit `49b7a28e`) |
| Scenario 1 (AC1) | Connection line drawn between sequential nodes | `addConnection` threw on every page load (wrong id type); no lines ever drawn | HIGH | Fixed (commit `49b7a28e`) |
| Scenario 2 (AC2) | "Edit stage" opens side panel from a canvas node | Click silently did nothing — handler scoped to the legacy list container only | HIGH | Fixed (commit `538e1504`) |
| Scenario 4 (AC4) | Empty-state message visible on Canvas tab for a 0-stage journey | Canvas tab rendered blank — message lived in a CSS-hidden container | MED | Fixed (commit `538e1504`) |
