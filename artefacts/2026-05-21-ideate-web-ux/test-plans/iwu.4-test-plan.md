## Test Plan: Confirm and flag assumption cards via HTTP endpoint with in-memory session state update

**Story reference:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.4.md
**Epic reference:** artefacts/2026-05-21-ideate-web-ux/epics/iwu-assumption-card-flow.md
**Test plan author:** Copilot
**Date:** 2026-06-04

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Confirm button → confirmed state + POST action:confirm | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | Flag button on default card → flagged state + POST action:flag | 2 tests | 1 test | — | — | — | 🟢 |
| AC3 | HTTP 200 + session state updated on valid request | — | 2 tests | — | — | — | 🟢 |
| AC4 | HTTP 404 on expired session (not 500) | — | 1 test | — | — | — | 🟢 |
| AC5 | HTTP 404 when cardId not in session | — | 1 test | — | — | — | 🟢 |
| AC6 | HTTP 400 when cardId not 8-char hex (path traversal guard) | — | 2 tests | — | — | — | 🟢 |
| AC7 | Keyboard activation + AT announces state change | — | — | — | 1 scenario | DOM-behaviour | 🟡 |
| NFR-SEC-1 | 8-char hex validation before session lookup | — | 2 tests | — | — | — | 🟢 |
| NFR-SEC-2 | Session state not in error response bodies | — | 2 tests | — | — | — | 🟢 |
| NFR-A11Y | WCAG AA; button result announced to AT | — | 1 test | — | 1 scenario | — | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Node.js | Handling |
|-----|----|----------|------------------------------|---------|
| AT announcement of state change on button press | AC7 | DOM-behaviour | Requires real AT or browser accessibility tree | Manual scenario in verification script 🟡 |
| Real screen reader announcement test | NFR-A11Y | DOM-behaviour | Requires real AT | Manual scenario 🟡 |

---

## Test Data Strategy

**Source:** Synthetic — in-memory session store seeded in test setup; no real session data
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Session with a card in default state; confirm button click mock | Synthetic | None | |
| AC2 | Session with a card in default state; flag button click mock | Synthetic | None | |
| AC3 | `POST /api/skills/:name/sessions/:id/assumption/:cardId/confirm` with valid IDs | Synthetic | None | |
| AC4 | Session ID that has expired (not in `_sessionStore`) | Synthetic | None | |
| AC5 | Valid session ID + cardId not in session | Synthetic | None | |
| AC6 | cardId with path traversal payload (e.g. `../etc/`) or non-hex value | Synthetic | None | Security probe |
| NFR-SEC-2 | Error responses from AC4/AC5/AC6 | Synthetic | None | Must not expose session state |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### confirm button click sends POST with action:confirm

- **Verifies:** AC1 (browser side)
- **Precondition:** A card DOM element is rendered in `#assumption-cards` in default state with confirm/flag buttons present; a mock `fetch` is in place
- **Action:** Simulate a click on the confirm button
- **Expected result:** `fetch` is called with the correct endpoint URL and body `{ action: 'confirm' }`
- **Edge case:** No

### confirmed card replaces confirm button with "✓ confirmed" text

- **Verifies:** AC1 (DOM transition)
- **Precondition:** Card in default state; mock `fetch` resolves with HTTP 200
- **Action:** Click confirm button; wait for mock response
- **Expected result:** The confirm button is replaced by the text "✓ confirmed"; the card element has a `confirmed` state class or `data-state="confirmed"` attribute; the flag button is also removed or hidden
- **Edge case:** No

### flag button click sends POST with action:flag

- **Verifies:** AC2 (browser side)
- **Precondition:** Card DOM in default state; mock `fetch`
- **Action:** Simulate a click on the flag button
- **Expected result:** `fetch` called with body `{ action: 'flag' }` and correct endpoint
- **Edge case:** No

### flagged card replaces flag button with flagged indicator

- **Verifies:** AC2 (DOM transition)
- **Precondition:** Card in default state; mock `fetch` resolves 200
- **Action:** Click flag button; wait for mock response
- **Expected result:** The flag button is replaced by a "flagged" indicator; the card has `data-state="flagged"` or equivalent; the confirm button is also removed or hidden
- **Edge case:** No

---

## Integration Tests

### POST confirm on valid card returns 200 and updates session state

- **Verifies:** AC3 (confirm action)
- **Components involved:** Express route `POST /api/skills/:name/sessions/:id/assumption/:cardId/confirm`, in-memory `_sessionStore`
- **Precondition:** Session exists in `_sessionStore` with a card having `cardId = 'a1b2c3d4'` in default state
- **Action:** POST to `/api/skills/ideate/sessions/:id/assumption/a1b2c3d4/confirm` with body `{ action: 'confirm' }`
- **Expected result:** HTTP 200; `_sessionStore[sessionId].assumptionCards['a1b2c3d4'].state === 'confirmed'`
- **Edge case:** No

### POST flag on valid card returns 200 and updates session state

- **Verifies:** AC3 (flag action)
- **Precondition:** Same session; card in default state
- **Action:** POST to same endpoint with body `{ action: 'flag' }`
- **Expected result:** HTTP 200; card state is `'flagged'` in `_sessionStore`
- **Edge case:** No

### POST to expired session returns 404 not 500

- **Verifies:** AC4
- **Precondition:** `_sessionStore` does not contain the session ID used in the request
- **Action:** POST to `/api/skills/ideate/sessions/nosuchsession/assumption/a1b2c3d4/confirm`
- **Expected result:** HTTP 404 response; response body does not contain any session data or stack traces
- **Edge case:** No

### POST with unknown cardId returns 404

- **Verifies:** AC5
- **Precondition:** Session exists but has no card with `cardId = 'deadbeef'`
- **Action:** POST to the endpoint with a valid session ID but `cardId = 'deadbeef'`
- **Expected result:** HTTP 404; response body is a safe error message without session state
- **Edge case:** No

### POST with cardId shorter than 8 chars returns 400 without session lookup

- **Verifies:** AC6, NFR-SEC-1
- **Precondition:** Session exists; any valid session ID; `cardId = 'abc'` (too short)
- **Action:** POST to endpoint with `cardId = 'abc'`
- **Expected result:** HTTP 400 returned immediately; no session lookup performed (assert via spy or logging that `_sessionStore` was not accessed)
- **Edge case:** Yes — format guard

### POST with cardId containing path traversal chars returns 400

- **Verifies:** AC6, NFR-SEC-1
- **Precondition:** Session exists
- **Action:** POST to endpoint with `cardId = '../etc'`
- **Expected result:** HTTP 400; no session lookup; no file system access
- **Edge case:** Yes — path traversal probe

### error responses do not contain session state

- **Verifies:** NFR-SEC-2
- **Precondition:** Expired session scenario (AC4); unknown card scenario (AC5)
- **Action:** Collect the full response body JSON from both error cases
- **Expected result:** Neither response body contains `assumptionCards`, `accessToken`, `userId`, or any other session field — only a safe error message string
- **Edge case:** No

### axe-core scan on card in confirmed state passes WCAG AA

- **Verifies:** NFR-A11Y (structural)
- **Components involved:** axe-core, rendered card HTML after state transition
- **Precondition:** Card HTML rendered in `confirmed` state (confirm button replaced with "✓ confirmed")
- **Action:** Run `axe.run` on the card HTML
- **Expected result:** Zero WCAG AA violations; the state indicator has a non-empty accessible name

---

## NFR Tests

### cardId validation fires before any session access (order guard)

- **NFR addressed:** Security — path traversal guard (NFR-SEC-1)
- **Measurement method:** Use a spy on `_sessionStore` access; call the endpoint with an invalid `cardId`; assert the spy was never called
- **Pass threshold:** `_sessionStore` spy call count === 0 when `cardId` fails validation
- **Tool:** Node.js sinon spy or manual mock

---

## Out of Scope for This Test Plan

- SSE card emission from AI — iwu.3
- lensComplete nudge bar — iwu.5
- Card rendering and layout — iwu.2
- Bulk confirm/flag operations — not in scope

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AT announcement of button state change | Requires real AT | Manual verification scenario |
| Full browser keyboard activation test | Requires browser environment | Manual scenario; axe reduces risk |
