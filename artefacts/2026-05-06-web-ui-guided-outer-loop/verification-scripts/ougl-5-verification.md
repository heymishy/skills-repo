# AC Verification Script — ougl.5: Gate-confirm handler (feature stages)

**Story:** ougl.5 — Gate-confirm handler for feature-level stages
**Verified by:** Developer / tech lead
**When to run:** After implementation of `POST /api/journey/:journeyId/gate-confirm`.

---

## Pre-conditions

- `src/web-ui/routes/journey.js` created (gate-confirm route)
- `journey-store.js` implements `completeStage`, `getNextStage`
- `skills.js` `buildSystemPrompt` updated with 4th parameter (ougl.1 done)

---

## Run unit tests

```powershell
node tests/check-ougl5-gate-confirm-feature-stages.js
```

**Expected before implementation:** All 12 tests fail. `Failed: 12`.
**Expected after implementation:** All 12 tests pass. `Failed: 0`.

---

## AC Scenario Walkthroughs

### AC1 — done:true → artefact written to disk
1. Complete a skill session in a journey. Trigger gate-confirm.
2. Check `artefacts/[feature-slug]/[skill-name].md` exists on disk with the content from the session.
3. PASS if file exists with correct content. FAIL if file not written or wrong path.

### AC2 — priorArtefacts content from disk, not session
1. After AC1, verify in server logs or test output that the file was read back from disk (not in-memory session content) when building `priorArtefacts`.
2. In unit test T5.2, mutate `session.artefactContent` after write — verify read-back returns disk content.
3. PASS if disk content used. FAIL if session memory value used.

### AC3 — registerHtmlSession called with priorArtefacts
1. Verify unit test T5.3 passes: `registerHtmlSession` mock captures a 4th argument containing `priorArtefacts[0].path === session.artefactPath`.
2. PASS if called with priorArtefacts. FAIL if called without or with empty array.

### AC4 — New session journeyId set correctly
1. After gate-confirm, inspect the new session object. Verify `session.journeyId === journeyId`.
2. PASS if journeyId propagated. FAIL if null or different value.

### AC5 — New session systemPrompt contains HANDOFF CONTEXT
1. Inspect the new session's `systemPrompt`. Verify it contains `--- HANDOFF CONTEXT ---`.
2. PASS if block present. FAIL if systemPrompt has no handoff block.

### AC6 — discovery → benefit-metric → 303 to benefit-metric chat
1. Complete discovery session in a journey. Trigger gate-confirm.
2. Verify response is 303. Verify `Location` header is `/skills/benefit-metric/sessions/[newSid]/chat`.
3. PASS if redirect correct. FAIL if wrong status or wrong location.

### AC7 — done:false → 400
1. Trigger gate-confirm on a session where `done: false`.
2. Verify response is HTTP 400.
3. PASS if 400. FAIL if session advance proceeds.

### AC8 — Unknown journeyId → 404
1. POST to `/api/journey/nonexistent-id/gate-confirm`.
2. Verify response is HTTP 404.
3. PASS if 404. FAIL if 500 or other status.

### AC9 — Unauth → 302
1. POST without a session cookie.
2. Verify response is 302 to `/auth/github`.
3. PASS if redirected. FAIL if processed.

### AC10 — test-plan stage → /journey/:id/stories
1. Complete definition session in a journey. Trigger gate-confirm.
2. Verify response is 303. Verify `Location` is `/journey/[journeyId]/stories`.
3. Verify no new session was created for `test-plan` (stories screen handles that).
4. PASS if redirect to stories. FAIL if redirect to a skill chat URL.

### AC11 — Path traversal in artefactPath → 400, no file written
1. Inject a session with `artefactPath: '../../etc/passwd'`.
2. POST gate-confirm.
3. Verify response is HTTP 400. Verify no file was written at `/etc/passwd` or any parent-directory path.
4. PASS if 400 and no file. FAIL if file written or 200 returned.

### AC12 — Multiple prior stages in priorArtefacts
1. Set up a journey with 2 completed stages (discovery, benefit-metric). Complete definition.
2. Trigger gate-confirm for definition.
3. Verify `registerHtmlSession` receives `priorArtefacts` with 3 entries (discovery, benefit-metric, definition).
4. PASS if 3 entries present. FAIL if only current stage included.

---

## Regression check

Run `npm test` after implementation. All previously-passing tests must still pass.
