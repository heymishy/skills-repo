# AC Verification Script: lensComplete SSE event and lens-transition nudge bar

**Story reference:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.5.md
**Technical test plan:** artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.5-test-plan.md
**Script version:** 1
**Verified by:** __________ | **Date:** __________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Start the server: `node --env-file=.env src/web-ui/server.js`
2. Open an `/ideate` session that has been running long enough to have assumption cards in `#assumption-cards`
3. Keep DevTools → Network (EventStream) and Console open

---

## Scenarios

---

### Scenario 1: lensComplete event triggers nudge bar when unconfirmed cards exist

**Covers:** AC1, AC2

**Steps:**
1. Run a full lens (e.g. Lens A) until it completes
2. Ensure at least one card in `#assumption-cards` remains in default state (not yet confirmed or flagged)
3. Watch for a nudge bar to appear in the left panel

**Expected outcome:**
> After the lens completes, a nudge bar appears in the left panel. It reads something like "Lens A complete — N unconfirmed assumption(s)". A "review now" button is visible inside the nudge bar.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Nudge bar message counts only default-state (unconfirmed, unflagged) cards

**Covers:** AC1, AC2

**Steps:**
1. Before running the lens, confirm one card manually via Scenario 1 of iwu.4-verification (confirm one card)
2. Run a second lens until lensComplete fires
3. Note the count in the nudge bar message

**Expected outcome:**
> The nudge bar count reflects only cards in default state — confirmed and flagged cards are not counted. If 3 cards were emitted and 1 was confirmed before lensComplete, the nudge bar reads "2 unconfirmed assumptions".

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: "review now" dismisses nudge and scrolls first default card into view

**Covers:** AC3

**Steps:**
1. Ensure nudge bar is visible (at least one default-state card, post-lensComplete)
2. Click "review now" in the nudge bar
3. Observe the nudge bar and the `#assumption-cards` section

**Expected outcome:**
> The nudge bar disappears. The first card in `#assumption-cards` that is still in default state scrolls into view. If the chat input does not currently have keyboard focus, that card (or its first interactive element) receives focus.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: "review now" does not steal focus from chat input

**Covers:** AC3 (focus-transfer guard)

**Steps:**
1. Click in the chat input field to give it keyboard focus (confirm focus with Tab)
2. With chat input active, click "review now" in the nudge bar (mouse click only — do not Tab away)

**Expected outcome:**
> The nudge bar dismisses and the first default card scrolls into view. The chat input retains keyboard focus — it is not stolen by the card or any other element.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: No nudge bar when all cards are already confirmed/flagged at lensComplete

**Covers:** AC4

**Steps:**
1. Confirm or flag every card in `#assumption-cards` before the lens finishes
2. Wait for the lens to complete (lensComplete event fires)
3. Inspect the left panel for a nudge bar

**Expected outcome:**
> No nudge bar appears in the left panel. The lensComplete event fires (visible in Network EventStream), but because zero default-state cards remain, the nudge is suppressed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: Confirming the last default card auto-dismisses the nudge bar

**Covers:** AC5

**Steps:**
1. Ensure nudge bar is visible (exactly one default-state card remaining)
2. Without clicking "review now", confirm the last default-state card directly via its confirm button

**Expected outcome:**
> The nudge bar automatically disappears as soon as the last card is confirmed — no additional user action required. If multiple cards were present, the nudge bar remains visible until the very last one is confirmed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 7: lensComplete is a distinct SSE event type (not an alias)

**Covers:** AC6

**Steps:**
1. Run a lens to completion
2. In the DevTools Network → EventStream, inspect the event stream entries
3. Identify the event that fires at lens boundary — check its `event:` type field

**Expected outcome:**
> An event with `event: lensComplete` (or equivalent field) appears in the stream at lens boundary. It is distinct from `turn-complete`, `update`, `message`, or any other event type. The event type string is "lensComplete" — not an alias or a renamed existing event.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 8: Nudge bar is keyboard-accessible and does not intercept keystrokes 🟡 Manual

**Covers:** NFR-A11Y, NFR-UX

**Steps:**
1. Trigger the nudge bar (run a lens to completion with default-state cards)
2. Tab from elsewhere to reach the nudge bar
3. Press Enter or Space to activate "review now"
4. While the nudge bar is visible, type in the chat input field

**Expected outcome:**
> The "review now" button is reachable by Tab and activatable by keyboard. Keystrokes typed in the chat input field are received by the chat input — the nudge bar does not intercept them. The nudge bar does not visually cover the chat input or left panel input area.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 9: AT announces nudge bar appearance and scroll action 🟡 Manual

**Covers:** NFR-A11Y (announcement)

**Steps:**
1. Enable a screen reader (e.g. Windows Narrator, NVDA, JAWS, or macOS VoiceOver)
2. Navigate to an `/ideate` session and run a lens to completion
3. Listen for the announcement when the nudge bar appears
4. Press "review now" and listen for the announcement of the scroll action

**Expected outcome:**
> When the nudge bar appears, the screen reader announces the nudge message without requiring focus to be moved to it (the bar uses `aria-live` or `role="status"`). When "review now" is activated, the screen reader announces the navigation to the first unconfirmed card.

**Result:** [ ] Pass  [ ] Fail
**Notes:**
