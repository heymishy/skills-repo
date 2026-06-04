## Test Plan: Stream assumption cards from server-side marker emission to browser DOM via SSE

**Story reference:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.3.md
**Epic reference:** artefacts/2026-05-21-ideate-web-ux/epics/iwu-assumption-card-flow.md
**Test plan author:** Copilot
**Date:** 2026-06-04

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Server strips marker, emits assumptionCard SSE event with payload | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | Browser appends card within 500ms with all fields + data-card-id | 2 tests | — | — | — | — | 🟢 |
| AC3 | Feature flag false → no event emitted, marker stripped silently | 2 tests | — | — | — | — | 🟢 |
| AC4 | HTML special chars in text escaped before DOM injection | 2 tests | — | — | — | — | 🟢 |
| AC5 | Unknown type value rendered raw; card not dropped | 1 test | — | — | — | — | 🟢 |
| AC6 | Multiple cards in emission order with unique cardIds | 2 tests | — | — | — | — | 🟢 |
| NFR-SEC | HTML-escape before DOM injection (XSS guard) | 1 test | — | — | — | — | 🟢 |
| NFR-PERF | Card appears within 500ms of SSE event | 1 test | — | — | — | — | 🟢 |
| NFR-A11Y | Type and risk conveyed by text labels, not colour alone; WCAG AA | — | 1 test | — | 1 scenario | — | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Node.js | Handling |
|-----|----|----------|------------------------------|---------|
| Real screen reader announcement of card type/risk | NFR-A11Y | DOM-behaviour | Requires real AT | Manual scenario in verification script 🟡 |

---

## Test Data Strategy

**Source:** Synthetic — crafted SSE payload objects; no external data needed
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Mock AI response string containing `---ASSUMPTION-JSON: {...}---` marker | Synthetic | None | |
| AC2 | Received `assumptionCard` SSE event object | Synthetic | None | |
| AC3 | Session with `assumptionCardsEnabled: false`; AI response with marker | Synthetic | None | |
| AC4 | Marker payload with `text` containing `<script>alert(1)</script>` | Synthetic | None | XSS probe |
| AC5 | Marker payload with `type: "unknownType"` | Synthetic | None | |
| AC6 | AI response string containing two separate markers | Synthetic | None | |
| NFR-PERF | Timing from SSE dispatch to DOM append | Test harness timing | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### parseAssumptionMarker extracts fields from well-formed marker

- **Verifies:** AC1 (server side)
- **Precondition:** A parser function (e.g. `parseAssumptionMarker(text)`) is callable
- **Action:** Call `parseAssumptionMarker('---ASSUMPTION-JSON: {"id":"A1","text":"Will users pay?","type":"desirability","risk":"high","knowness":"unknown"}---')`
- **Expected result:** Returns an object with all five fields matching the JSON payload: `{ id: 'A1', text: 'Will users pay?', type: 'desirability', risk: 'high', knowness: 'unknown' }`
- **Edge case:** No

### parseAssumptionMarker strips marker from surrounding AI text

- **Verifies:** AC1 (server strips marker from chat text)
- **Precondition:** Parser is callable
- **Action:** Call with a string containing surrounding text: `"Here is the first assumption.\n---ASSUMPTION-JSON: {...}---\nAnd the analysis continues."`
- **Expected result:** The AI text returned by the function (if it returns both parts) does not contain `---ASSUMPTION-JSON:` or the JSON object; only the surrounding natural language is preserved
- **Edge case:** No

### card rendering function produces element with data-card-id attribute

- **Verifies:** AC2 (browser)
- **Precondition:** A card renderer function (e.g. `buildAssumptionCardHtml(payload, cardId)`) is callable
- **Action:** Call with a valid payload and `cardId = 'a1b2c3d4'`
- **Expected result:** The returned HTML string contains `data-card-id="a1b2c3d4"`
- **Edge case:** No

### card rendering function includes all payload fields

- **Verifies:** AC2 (all fields rendered)
- **Precondition:** Card renderer callable
- **Action:** Call `buildAssumptionCardHtml({ id:'A1', text:'Will users pay?', type:'desirability', risk:'high', knowness:'unknown' }, 'a1b2c3d4')`
- **Expected result:** The HTML contains "Will users pay?", "desirability" (or equivalent label), "high" (or equivalent label), "unknown" (or equivalent label), and `data-card-id="a1b2c3d4"` — all fields are represented
- **Edge case:** No

### feature flag false suppresses SSE emission

- **Verifies:** AC3 (no event emitted)
- **Precondition:** SSE emitter/session configured with `assumptionCardsEnabled: false`
- **Action:** Call the SSE pipeline handler with an AI response string containing a valid marker and a session where `assumptionCardsEnabled` is `false`
- **Expected result:** No `assumptionCard` SSE event is dispatched; the SSE event list (or mock emitter call list) is empty
- **Edge case:** No

### feature flag false still strips marker from plain text stream

- **Verifies:** AC3 (marker stripped silently)
- **Precondition:** Same as above
- **Action:** Same call as above; capture the plain-text chat output
- **Expected result:** The `---ASSUMPTION-JSON:...---` marker is not present in the streamed text output. The surrounding AI text is preserved.
- **Edge case:** No

### card text HTML-escaped before DOM injection — angle brackets

- **Verifies:** AC4, NFR-SEC
- **Precondition:** Card renderer callable
- **Action:** Call with `{ text: '<script>alert(1)</script>', type: 'desirability', risk: 'low', knowness: 'known', id: 'x1' }` and any cardId
- **Expected result:** The returned HTML string contains `&lt;script&gt;` — the literal `<script>` tag is not present; the payload string cannot execute as HTML
- **Edge case:** Yes — XSS probe

### card text HTML-escaped — ampersand and quotes

- **Verifies:** AC4
- **Precondition:** Card renderer callable
- **Action:** Call with `{ text: 'A & B "test"', type: 'desirability', risk: 'low', knowness: 'known', id: 'x2' }`
- **Expected result:** Output contains `A &amp; B` and the quote is either left as a literal attribute-safe value or escaped; no raw `&` or unescaped quotes inside the HTML attribute context
- **Edge case:** No

### unknown type value rendered as-is on card

- **Verifies:** AC5
- **Precondition:** Card renderer callable
- **Action:** Call with `{ type: 'futuristic', text: 'Will users want this?', risk: 'medium', knowness: 'unknown', id: 'u1' }` and any cardId
- **Expected result:** The returned HTML contains the string "futuristic" rendered as a visible label — the card is not dropped (the function does not return null/empty), and no error is thrown
- **Edge case:** Yes — unknown type value

### multiple cards from two markers have unique cardIds

- **Verifies:** AC6
- **Precondition:** The session SSE pipeline processes two consecutive markers in one AI response
- **Action:** Process a response string containing two `---ASSUMPTION-JSON---` markers (different payloads)
- **Expected result:** Two `assumptionCard` events are emitted; the `cardId` of the first event differs from the `cardId` of the second event
- **Edge case:** No

### multiple cards appear in emission order

- **Verifies:** AC6
- **Precondition:** Same as above
- **Action:** Collect both emitted events in an array in the order they fire
- **Expected result:** The first event corresponds to the first marker in the AI text; the second corresponds to the second marker — order is preserved
- **Edge case:** No

---

## Integration Tests

### SSE pipeline emits assumptionCard event with correct structure

- **Verifies:** AC1 (end-to-end server path)
- **Components involved:** SSE streaming handler, session store with `assumptionCardsEnabled: true`
- **Precondition:** A mock session is configured; the SSE handler is called with an AI response that contains a marker
- **Action:** Invoke the handler and collect emitted SSE events from a mock event emitter
- **Expected result:** Exactly one `assumptionCard` event is emitted; the event payload includes `id`, `text`, `type`, `risk`, `knowness`, and `cardId`; the event type string is `"assumptionCard"`

---

## NFR Tests

### card appears within 500ms of the SSE event being dispatched

- **NFR addressed:** Performance (NFR-PERF)
- **Measurement method:** Record a timestamp immediately before dispatching the mock `assumptionCard` event to the browser-side handler; record a timestamp when the DOM append operation completes; assert the elapsed time is < 500ms
- **Pass threshold:** < 500ms from event dispatch to DOM append
- **Tool:** Node.js `Date.now()` or `performance.now()` in the handler under test; JSDOM for DOM operations

### axe-core scan on rendered assumption card passes WCAG AA

- **NFR addressed:** Accessibility (NFR-A11Y)
- **Measurement method:** Build a card HTML string with all fields populated; run `axe.run` on it in Node.js; assert zero violations; additionally assert that the `type` and `risk` fields are conveyed by visible text labels (not just CSS classes)
- **Pass threshold:** Zero axe violations at AA level; type and risk labels are text content, not only background-colour-coded
- **Tool:** axe-core Node.js API

---

## Out of Scope for This Test Plan

- Confirm/flag interaction on cards — iwu.4
- lensComplete nudge bar — iwu.5
- Right panel layout constraints — iwu.2
- cardId SHA-256 algorithm implementation details — tested indirectly via uniqueness check

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real AT announcement of card type/risk | Requires real AT; axe validates rules but not announcement | Manual verification scenario in verification script |
