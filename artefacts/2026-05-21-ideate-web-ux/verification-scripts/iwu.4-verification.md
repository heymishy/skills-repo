# AC Verification Script: Confirm and flag assumption cards via HTTP endpoint

**Story reference:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.4.md
**Technical test plan:** artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.4-test-plan.md
**Script version:** 1
**Verified by:** __________ | **Date:** __________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Start the server: `node --env-file=.env src/web-ui/server.js`
2. Open an `/ideate` session that has at least two assumption cards emitted and visible in `#assumption-cards`
3. Open DevTools → Network panel (filter: XHR or Fetch)
4. Keep DevTools → Console open

**Reset between scenarios:** Start a new session or reload to reset card states.

---

## Scenarios

---

### Scenario 1: Confirm button sends POST with action:confirm and transitions card to confirmed state

**Covers:** AC1

**Steps:**
1. Locate the first assumption card in `#assumption-cards` in its default state (confirm and flag buttons both visible)
2. Click the "Confirm" button
3. Watch the Network panel for a POST request

**Expected outcome:**
> A POST request is made to `/api/skills/ideate/sessions/<id>/assumption/<cardId>/confirm` with a request body containing `{ "action": "confirm" }`. The server responds with HTTP 200. On the card: the "Confirm" button is replaced by a "✓ confirmed" indicator; the flag button is also removed or disabled. The card visually changes state to "confirmed".

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Flag button sends POST with action:flag and transitions card to flagged state

**Covers:** AC2

**Steps:**
1. Locate a second assumption card in its default state (both buttons visible)
2. Click the "Flag" button
3. Watch the Network panel for a POST request

**Expected outcome:**
> A POST request is made to the same endpoint structure with body `{ "action": "flag" }`. The server responds with HTTP 200. The flag button is replaced by a "flagged" indicator. The confirm button is also removed or disabled. The card state changes to "flagged".

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Confirmed state is terminal (cannot be flagged after confirming)

**Covers:** AC2 (confirmed is terminal)

**Steps:**
1. Confirm a card (see Scenario 1) — it should now show "✓ confirmed" with no flag button
2. Inspect the confirmed card in the DOM — look for any remaining flag button

**Expected outcome:**
> After a card is confirmed, no flag button is present on the card. There is no way to transition a confirmed card to flagged state via the UI.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Valid POST returns HTTP 200 and updates in-memory state

**Covers:** AC3

**Steps:**
1. Open the DevTools Console and run:
   ```js
   const sessionId = /* find from current URL or session cookie */ 'your-session-id';
   const cardId = /* copy data-card-id from a default-state card */;
   fetch(`/api/skills/ideate/sessions/${sessionId}/assumption/${cardId}/confirm`, {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({ action: 'confirm' })
   }).then(r => console.log('status:', r.status));
   ```
2. Note the HTTP status code

**Expected outcome:**
> The response status is `200`. The card with the given `cardId` is now in `confirmed` state (the DOM also reflects this if the card is visible).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: POST to expired session returns HTTP 404 (not 500)

**Covers:** AC4

**Steps:**
1. In the DevTools Console, run:
   ```js
   fetch('/api/skills/ideate/sessions/expired-does-not-exist/assumption/a1b2c3d4/confirm', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({ action: 'confirm' })
   }).then(r => console.log('status:', r.status));
   ```

**Expected outcome:**
> Response status is `404`. Response status is not `500`. The response body does not reveal session data (check in Network panel → Preview for the response).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: POST with unknown cardId returns HTTP 404

**Covers:** AC5

**Steps:**
1. Using a valid session ID from the current session, run in the Console:
   ```js
   fetch('/api/skills/ideate/sessions/<valid-id>/assumption/deadbeef/confirm', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({ action: 'confirm' })
   }).then(r => console.log('status:', r.status));
   ```
   (where `deadbeef` is 8 hex chars but not an actual card in the session)

**Expected outcome:**
> Response status is `404`. The response body is a safe error message — it does not expose the session's assumption cards list or any other session state.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 7: POST with invalid cardId format returns HTTP 400

**Covers:** AC6, NFR-SEC-1

**Steps:**
1. In the Console, run with a clearly invalid cardId:
   ```js
   fetch('/api/skills/ideate/sessions/<valid-id>/assumption/not-valid-hex/confirm', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({ action: 'confirm' })
   }).then(r => console.log('status:', r.status));
   ```
2. Also try with a path-traversal attempt: `cardId = '../../../etc/passwd'` (URL-encoded)

**Expected outcome:**
> Both requests return HTTP 400. No session lookup is performed — the server rejects the request at the cardId format validation step before accessing session storage. Response body is a safe error message only.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 8: Keyboard activation of confirm/flag buttons; AT announces state change 🟡 Manual

**Covers:** AC7

**Steps:**
1. Start a session with at least one assumption card in default state
2. Use Tab to navigate to the confirm button on the card
3. Press Enter or Space to activate the confirm button
4. If a screen reader is running, note what is announced after activation

**Expected outcome:**
> The confirm button is activated by keyboard (Enter or Space). The card transitions to confirmed state (same as Scenario 1). If a screen reader is running, it announces the state change — for example "confirmed" or "assumption confirmed". The focus is managed logically (focus does not jump to an unexpected location).

**Result:** [ ] Pass  [ ] Fail
**Notes:**
