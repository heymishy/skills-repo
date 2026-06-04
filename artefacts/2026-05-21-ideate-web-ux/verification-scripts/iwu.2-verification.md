# AC Verification Script: Restructure right panel into two named sections

**Story reference:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.2.md
**Technical test plan:** artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.2-test-plan.md
**Script version:** 1
**Verified by:** __________ | **Date:** __________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Start the server: `node --env-file=.env src/web-ui/server.js`
2. Open a browser and navigate to the `/ideate` skill session page
3. Open DevTools (F12) → Elements panel; keep the Console panel handy

**Reset between scenarios:** Reload the page or start a new session for each scenario.

---

## Scenarios

---

### Scenario 1: Both #assumption-cards and #draft-content sections are present in the DOM

**Covers:** AC1

**Steps:**
1. Start a new `/ideate` session
2. When the session shell renders, open DevTools → Elements
3. Search (Ctrl+F in Elements) for `assumption-cards`
4. Search again for `draft-content`

**Expected outcome:**
> Both `id="assumption-cards"` and `id="draft-content"` are present in the DOM. Both are visible in the right panel as sibling elements within a flex container.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: #assumption-cards shows placeholder when no cards have been emitted

**Covers:** AC2

**Steps:**
1. Start a new session before any assumptions are generated (session just opened, no lens run yet)
2. Inspect `#assumption-cards` in DevTools

**Expected outcome:**
> The `#assumption-cards` element is visible and contains a placeholder message such as "assumptions will appear here". It is not empty, collapsed, or hidden.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: #draft-content shows placeholder and occupies available space

**Covers:** AC3

**Steps:**
1. Start a new session (no content generated yet)
2. Inspect `#draft-content` in DevTools
3. In the DevTools Console, run: `document.getElementById('draft-content').style.flex`

**Expected outcome:**
> The `#draft-content` element is visible and contains a placeholder message (e.g. "artefact draft will appear here"). The element occupies the remaining vertical space below `#assumption-cards`. The `flex` style resolves to a value indicating `flex: 1` (may show as `1 1 0%` or similar).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: #assumption-cards does not exceed 42% of right panel height and scrolls internally 🟡 CSS-layout-dependent

**Covers:** AC4

**Steps:**
1. Ensure several assumption cards are present in `#assumption-cards` (enough to fill more than 42% of the panel if unrestricted)
2. In the DevTools Console, run:
   ```js
   const cards = document.getElementById('assumption-cards');
   const panel = cards.closest('.right-panel') || cards.parentElement;
   const ratio = cards.getBoundingClientRect().height / panel.getBoundingClientRect().height;
   console.log('ratio:', ratio.toFixed(3));
   ```
3. Attempt to scroll the `#assumption-cards` section using the mouse wheel while hovering over it

**Expected outcome:**
> The logged ratio is ≤ 0.42. The `#assumption-cards` section scrolls internally when cards overflow — `#draft-content` does not shrink or disappear when the cards area is full.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Both sections are keyboard-reachable and AT-announced 🟡 Manual

**Covers:** AC5

**Steps:**
1. Start a session with at least one assumption card and some draft content visible
2. Click the page header then Tab forward until focus reaches the right panel
3. Continue Tabbing through the right panel area; note which elements receive focus
4. If a screen reader is available, note what is announced as you move through each section

**Expected outcome:**
> Focus enters both `#assumption-cards` and `#draft-content` without being skipped. If a screen reader is running, it announces the section role or label when the boundary is crossed (e.g. "Assumption cards region" or a heading). No content is unreachable by keyboard alone.

**Result:** [ ] Pass  [ ] Fail
**Notes:**
