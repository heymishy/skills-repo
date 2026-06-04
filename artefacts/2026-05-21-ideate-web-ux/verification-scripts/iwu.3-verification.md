# AC Verification Script: Stream assumption cards via SSE

**Story reference:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.3.md
**Technical test plan:** artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.3-test-plan.md
**Script version:** 1
**Verified by:** __________ | **Date:** __________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Start the server: `node --env-file=.env src/web-ui/server.js`
2. Open an `/ideate` session page in the browser with DevTools → Network panel open (filter: `EventStream`)
3. Ensure `session.assumptionCardsEnabled` is `true` (default post-iwu.6; toggle if needed)
4. Keep DevTools → Console open for DOM inspection commands

---

## Scenarios

---

### Scenario 1: Running a lens emits assumptionCard SSE events and strips markers from chat text

**Covers:** AC1

**Steps:**
1. Start a new `/ideate` session with feature flag on
2. Run Lens A (or any lens) — trigger it via the lens selector
3. Watch the Network panel → EventStream for the SSE connection
4. Look for events of type `assumptionCard` in the event stream

**Expected outcome:**
> At least one `assumptionCard` SSE event appears in the network stream during the lens run. The chat text area does not display the raw `---ASSUMPTION-JSON:...---` marker string — the marker is not visible in the rendered chat output.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Card appears in #assumption-cards within 500ms of SSE event

**Covers:** AC2, NFR-PERF

**Steps:**
1. In the DevTools Console, inject a timing hook before the card append:
   ```js
   const origAppend = (window._iwu_appendCard || function(){});
   window._iwu_appendCard_ts = null;
   // If the app exposes an event hook, timestamp it
   document.addEventListener('assumptionCardAppended', e => {
     window._iwu_appendCard_ts = Date.now();
   });
   ```
2. Trigger a lens run and note the timestamp of the first `assumptionCard` SSE event in the Network panel
3. Note when the card element appears in `#assumption-cards` (look at Elements panel or use a MutationObserver in Console)
4. Calculate the delay

**Expected outcome:**
> A new card element with `data-card-id` attribute appears in `#assumption-cards`. The delay between the SSE event timestamp and the card appearing is under 500ms. The card displays the `text`, `type`, `risk`, and `knowness` values from the event payload.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Feature flag off — no assumptionCard events emitted; markers not shown in chat

**Covers:** AC3

**Steps:**
1. Set `session.assumptionCardsEnabled = false` on the server (toggle via a test endpoint or restart server with flag disabled)
2. Open a new session
3. Run a lens and watch the Network SSE stream

**Expected outcome:**
> No `assumptionCard` SSE events appear in the event stream. The `#assumption-cards` section remains showing only its placeholder. The chat text does not show `---ASSUMPTION-JSON:` marker strings.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: HTML special characters in assumption text are escaped

**Covers:** AC4, NFR-SEC

**Steps:**
1. If the system allows injecting a custom marker (e.g. via a test endpoint or mocked AI response), trigger a marker with `text: '<script>alert("xss")</script>'`
2. Alternatively: check the source code of the card renderer to verify `<`, `>`, `&`, `"` are escaped before insertion
3. Observe whether an alert dialog appears and inspect the rendered card in DevTools → Elements

**Expected outcome:**
> No alert dialog appears. In the Elements panel, the card text node shows the literal characters `<script>...` escaped as `&lt;script&gt;...` — it is text content, not an executable HTML element.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Unknown type value shown on card without dropping the card

**Covers:** AC5

**Steps:**
1. Trigger a marker with `type: "someFutureType"` (via test endpoint or code inspection)
2. Observe the rendered card in `#assumption-cards`

**Expected outcome:**
> A card appears in `#assumption-cards`. It shows the raw `type` value "someFutureType" as a visible label. The card is not silently dropped or replaced with an error.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: Multiple cards appear in emission order with unique IDs

**Covers:** AC6

**Steps:**
1. Run a lens that emits two or more assumption markers in a single response
2. Observe `#assumption-cards` in the Elements panel as cards appear

**Expected outcome:**
> Cards appear in the same order as the markers appeared in the AI response (first marker → first card, second marker → second card). Each card has a distinct `data-card-id` attribute value — no two cards share an ID.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 7: Type and risk labels are not conveyed by colour alone 🟡 Manual

**Covers:** NFR-A11Y

**Steps:**
1. View a rendered assumption card
2. Turn off colour rendering: in DevTools → Rendering (... → More tools → Rendering), enable "Emulate vision deficiencies → Achromatopsia" (greyscale)
3. Observe the `type` and `risk` labels on the card

**Expected outcome:**
> The `type` (e.g. "desirability") and `risk` (e.g. "high") values are conveyed by visible text labels — not just by background colour. Under greyscale emulation, the meaning of each field is still readable without colour.

**Result:** [ ] Pass  [ ] Fail
**Notes:**
