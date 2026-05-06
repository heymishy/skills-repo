# AC Verification Script — ougl.4: Journey-aware chat button

**Story:** ougl.4 — Journey-aware chat button in `handleGetChatHtml`
**Verified by:** Developer / tech lead
**When to run:** After implementation of `handleGetChatHtml` journey button logic.

---

## Pre-conditions

- `skills.js` updated with journey-aware button rendering
- `journey-store.js` and `journey.js` implemented (ougl.2, ougl.3 done)
- Server started with valid `.env`

---

## Run unit tests

```powershell
node tests/check-ougl4-journey-aware-chat-button.js
```

**Expected before implementation:** Tests T4.1, T4.2, T4.5, T4.7 fail. `Failed: 4+`.
**Expected after implementation:** All 7 tests pass. `Failed: 0`.

---

## AC Scenario Walkthroughs

### AC1 — journeyId + done:true → gate-confirm form present
1. Complete a skill session within a journey (i.e., artefact produced, `done: true`).
2. Reload the chat page.
3. Verify: page contains a form with action pointing to `/api/journey/[journeyId]/gate-confirm`.
4. PASS if form present. FAIL if button missing.

### AC2 — Button text includes next skill name
1. On discovery session done within a journey.
2. Verify: the gate-confirm form/button text includes "benefit-metric" (the next stage).
3. PASS if visible. FAIL if button has generic text with no skill reference.

### AC3 — journeyId:null + done:true → no /api/journey/ link
1. Complete a standalone skill session (not started from a journey).
2. Verify: page does NOT contain any `/api/journey/` links or forms.
3. PASS if absent. FAIL if journey controls appear for standalone sessions.

### AC4 — done:false → gate button not rendered
1. In an active (in-progress) journey session where artefact has not been produced.
2. Verify: no gate-confirm form is visible.
3. PASS if absent. FAIL if button appears before session completes.

### AC5 — definition-of-ready → link to /journey/:id/complete
1. Complete a definition-of-ready session within a journey.
2. Verify: page shows a link to `/journey/[journeyId]/complete` instead of a gate-confirm form.
3. PASS if complete link visible. FAIL if next-skill button shown for the last stage.

### AC6 — Standalone done:true → commit-preview link still present
1. Complete a standalone skill session (no journeyId).
2. Verify: commit-preview link ("Review & save artefact") still appears.
3. PASS if present. FAIL if the journey button changes removed the commit link for standalone sessions.

### AC7 — journeyId XSS prevention
1. In a unit test (T4.7), inject `journeyId: '<script>alert(1)</script>'`.
2. Inspect the HTML output. Verify `<script>alert(1)</script>` does NOT appear as a raw tag.
3. PASS if encoded as `&lt;script&gt;`. FAIL if raw script tag in HTML.

---

## Regression check

Run `npm test` after implementation. All previously-passing tests must still pass.
