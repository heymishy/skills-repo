## Test Plan: Emit lensComplete SSE event and show lens-transition nudge bar in left panel

**Story reference:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.5.md
**Epic reference:** artefacts/2026-05-21-ideate-web-ux/epics/iwu-assumption-card-flow.md
**Test plan author:** Copilot
**Date:** 2026-06-04

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | lensComplete event received → count default-state cards | 2 tests | — | — | — | — | 🟢 |
| AC2 | ≥1 default card → nudge bar appears in left panel with label + button | 2 tests | 1 test | — | — | — | 🟢 |
| AC3 | "review now" → nudge dismissed + first default card scrolled into view; focus transferred only if chat input inactive | 3 tests | — | — | — | — | 🟢 |
| AC4 | 0 default cards → no nudge bar appears | 1 test | — | — | — | — | 🟢 |
| AC5 | Confirming last default card auto-dismisses nudge bar | 2 tests | — | — | — | — | 🟢 |
| AC6 | lensComplete is a distinct SSE event type | 1 test | — | — | — | — | 🟢 |
| NFR-A11Y | Keyboard-accessible nudge; no focus steal; scroll announced to AT | — | 1 test | — | 1 scenario | DOM-behaviour | 🟡 |
| NFR-UX | Nudge does not cover chat panel or intercept keystrokes | — | — | — | 1 scenario | DOM-behaviour | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Node.js | Handling |
|-----|----|----------|------------------------------|---------|
| AT announcement of scroll-to-card action | AC3 | DOM-behaviour | Requires real AT to confirm announcement | Manual scenario in verification script 🟡 |
| Visual position of nudge bar (does not cover chat) | NFR-UX | CSS-layout-dependent | Position only measurable in real browser | Manual scenario 🟡 |

---

## Test Data Strategy

**Source:** Synthetic — mock `lensComplete` events; mock `#assumption-cards` DOM state
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | `lensComplete` SSE event with `lensName`; DOM with cards in various states | Synthetic | None | |
| AC2 | lensComplete event; ≥1 card in default state | Synthetic | None | |
| AC3 | lensComplete event; ≥1 default card; document.activeElement mock | Synthetic | None | Focus guard |
| AC4 | lensComplete event; 0 default cards | Synthetic | None | |
| AC5 | Nudge bar visible; last card about to be confirmed | Synthetic | None | |
| AC6 | List of all SSE event types emitted by the server | Code inspection | None | |
| NFR-A11Y | Running application with keyboard | Manual | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### lensComplete handler counts default-state cards in #assumption-cards

- **Verifies:** AC1
- **Precondition:** DOM has three cards: one in `default` state, one in `confirmed` state, one in `flagged` state
- **Action:** Dispatch a mock `lensComplete` SSE event; observe the count used by the nudge bar logic
- **Expected result:** The handler counts exactly 1 default-state card (cards with `data-state="confirmed"` or `data-state="flagged"` are excluded)
- **Edge case:** No

### lensComplete handler with all cards confirmed counts zero

- **Verifies:** AC1 (zero count)
- **Precondition:** DOM has two cards, both in `confirmed` state
- **Action:** Dispatch lensComplete event
- **Expected result:** Count is 0
- **Edge case:** No

### nudge bar text includes lens name and unconfirmed count

- **Verifies:** AC2 (nudge message format)
- **Precondition:** One default-state card; lensComplete event payload has `lensName: 'Lens A'`
- **Action:** Dispatch event; inspect the rendered nudge bar element
- **Expected result:** The nudge bar text contains "Lens A complete" and "1 unconfirmed assumption"; the bar contains a "review now" button
- **Edge case:** No

### nudge bar pluralises "assumption" for count > 1

- **Verifies:** AC2 (pluralisation)
- **Precondition:** Two default-state cards; lensComplete event `lensName: 'Lens B'`
- **Action:** Dispatch event; inspect nudge bar text
- **Expected result:** Text reads "2 unconfirmed assumptions" (plural)
- **Edge case:** No

### "review now" dismisses nudge bar

- **Verifies:** AC3 (dismiss)
- **Precondition:** Nudge bar visible in DOM
- **Action:** Simulate a click on the "review now" button
- **Expected result:** Nudge bar element is removed from DOM or `display: none`
- **Edge case:** No

### "review now" scrolls first default-state card into view

- **Verifies:** AC3 (scroll)
- **Precondition:** Two default-state cards; nudge bar visible
- **Action:** Click "review now"; observe which element receives `scrollIntoView()` call (spy on the method)
- **Expected result:** `scrollIntoView()` is called on the first default-state card (the one with the lowest DOM index among `data-state="default"` cards)
- **Edge case:** No

### "review now" transfers focus only when chat input is not active

- **Verifies:** AC3 (focus transfer guard)
- **Test A (chat inactive):** Set `document.activeElement` to a non-chat-input element; click "review now"
  - **Expected:** Focus transferred to the first default card (or its first interactive element)
- **Test B (chat active):** Set `document.activeElement` to the chat input element; click "review now"
  - **Expected:** Focus NOT transferred — chat retains focus; scroll still happens

### no nudge bar when zero default cards at lensComplete

- **Verifies:** AC4
- **Precondition:** All cards confirmed/flagged; lensComplete event dispatched
- **Action:** Dispatch event; inspect DOM for nudge bar
- **Expected result:** No nudge bar element appears in the left panel
- **Edge case:** No

### confirming last default card auto-dismisses nudge bar

- **Verifies:** AC5
- **Precondition:** Nudge bar visible; one card in default state
- **Action:** Dispatch a `cardStateChange` or equivalent event indicating that card is now confirmed
- **Expected result:** Nudge bar is removed from DOM or hidden immediately (without requiring another user action)
- **Edge case:** No

### nudge bar not dismissed when unconfirmed cards remain

- **Verifies:** AC5 (only last card dismisses)
- **Precondition:** Two default-state cards; nudge bar visible; one card confirmed
- **Action:** Trigger confirmation of first card; observe nudge bar
- **Expected result:** Nudge bar remains visible; count updates or bar stays until second card confirmed
- **Edge case:** No

### lensComplete event type is distinct from turn-complete and other SSE events

- **Verifies:** AC6
- **Precondition:** Server SSE handler code inspected or event emitter mock list checked
- **Action:** Enumerate all SSE event type strings emitted by the server; assert uniqueness
- **Expected result:** `"lensComplete"` is in the emitted event types list; it is not the same string as `"turn-complete"`, `"update"`, `"message"`, or any other existing event type; the string `"lensComplete"` appears exactly in the source as its own named type
- **Edge case:** No

---

## Integration Tests

### lensComplete event arrives via SSE and triggers nudge bar in real session shell

- **Verifies:** AC2 (end-to-end path)
- **Components involved:** SSE emitter (server), SSE listener (browser handler), nudge bar renderer
- **Precondition:** Mock session shell HTML with `#assumption-cards` containing one default card; server-side SSE emitter sends `lensComplete` event
- **Action:** Inject the event into the browser-side listener; observe the resulting DOM
- **Expected result:** A nudge bar element appears in the left panel with the correct text and "review now" button

### axe-core scan on nudge bar HTML passes WCAG AA

- **Verifies:** NFR-A11Y (structural)
- **Components involved:** axe-core, rendered nudge bar HTML
- **Precondition:** Nudge bar rendered as HTML string in visible state with "review now" button
- **Action:** Run `axe.run` on the nudge bar HTML
- **Expected result:** Zero WCAG AA violations; "review now" button has a non-empty accessible name; nudge bar has a `role` or `aria-live` attribute appropriate for a live notification

---

## NFR Tests

### nudge bar has appropriate ARIA live region or role

- **NFR addressed:** Accessibility (NFR-A11Y)
- **Measurement method:** Inspect the rendered nudge bar HTML string; assert that it carries `role="status"` or `aria-live="polite"` so AT can announce its appearance
- **Pass threshold:** One of `role="status"`, `aria-live="polite"`, or `aria-live="assertive"` is present on the nudge bar container
- **Tool:** Node.js DOM string assertion

---

## Out of Scope for This Test Plan

- SSE assumption card streaming — iwu.3
- Confirm/flag HTTP endpoint — iwu.4
- CSS position of nudge bar — verified manually (NFR-UX)
- Keyboard intercept prevention — verified manually (NFR-UX)

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AT scroll announcement | Requires real AT | Manual verification scenario |
| Nudge bar does not cover chat panel visually | CSS layout — requires real browser | Manual scenario 🟡; risk is low (chat and nudge bar in separate panels) |
