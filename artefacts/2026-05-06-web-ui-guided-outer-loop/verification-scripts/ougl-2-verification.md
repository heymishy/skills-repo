# AC Verification Script — ougl.2: Journey state store module

**Story:** ougl.2 — Journey state store module (`journey-store.js`)
**Verified by:** Developer / tech lead (unit test output)
**When to run:** After implementation of `journey-store.js` and `skills.js` changes, before opening PR.

---

## Pre-conditions

- Node.js v22+ installed
- `src/web-ui/modules/journey-store.js` created
- `skills.js` updated with `journeyId: null` in `registerHtmlSession` and `linkSessionToJourney` exported

---

## Run command

```powershell
node tests/check-ougl2-journey-state-store.js
```

**Expected output before implementation:** All tests fail (`Cannot find module` or assertion failures). `Failed: 9`.

**Expected output after implementation:** All 9 tests pass. `Failed: 0`.

---

## AC Scenario Walkthroughs

### AC1 — createJourney returns correct shape
1. Call `store.createJourney('my-feature')`.
2. Verify returned object has: `journeyId` (non-empty string), `featureSlug === 'my-feature'`, `activeSkill: null`, `activeSessionId: null`, `completedStages: []`, `mode: 'feature'`.
3. PASS if all fields present with correct values. FAIL if any field is missing or wrong.

### AC2 — getJourney returns same object
1. Create journey. Call `store.getJourney(result.journeyId)`.
2. Verify the returned object matches the created journey.
3. PASS if returned. FAIL if null/undefined.

### AC3 — setActiveSession updates fields
1. Create journey. Call `store.setActiveSession(journeyId, 'sess-abc', 'discovery')`.
2. Verify `journey.activeSessionId === 'sess-abc'` and `journey.activeSkill === 'discovery'`.
3. PASS if both fields updated. FAIL if not.

### AC4 — getJourneyBySession
1. Create journey. Call `setActiveSession(journeyId, 'sess-xyz', 'discovery')`.
2. Call `store.getJourneyBySession('sess-xyz')`. Verify journeyId matches.
3. PASS if returned. FAIL if null.

### AC5 — completeStage adds entry
1. Create journey. Call `store.completeStage(journeyId, 'discovery', 'artefacts/test/discovery.md')`.
2. Verify `journey.completedStages[0] = { skillName: 'discovery', artefactPath: 'artefacts/test/discovery.md' }`.
3. PASS if entry added. FAIL if completedStages empty.

### AC6 — getNextStage sequence
1. Call `store.getNextStage('discovery')` → expect `'benefit-metric'`.
2. Call `store.getNextStage('benefit-metric')` → expect `'definition'`.
3. Call `store.getNextStage('definition')` → expect `'test-plan'`.
4. Call `store.getNextStage('test-plan')` → expect `'definition-of-ready'`.
5. Call `store.getNextStage('definition-of-ready')` → expect `null`.
6. PASS if all match. FAIL if any differ.

### AC7 — registerHtmlSession stores journeyId:null
1. Call `routes.registerHtmlSession('sid', '/tmp/path', 'discovery')` (3 args).
2. Call `routes._getHtmlSession('sid')`. Verify `session.journeyId === null`.
3. PASS if `journeyId` field is null. FAIL if field absent or undefined.

### AC8 — linkSessionToJourney updates journeyId
1. Set a session via `routes._setHtmlSession('sid', { ..., journeyId: null })`.
2. Call `routes.linkSessionToJourney('sid', 'journey-xyz')`.
3. Call `routes._getHtmlSession('sid')`. Verify `session.journeyId === 'journey-xyz'`.
4. PASS if updated. FAIL if `linkSessionToJourney` not exported or field not set.

### AC9 — _clear() resets store
1. Create two journeys. Call `store._clear()`.
2. Call `store.getJourney(journeyId)` for each.
3. PASS if both return null. FAIL if any journey survives the clear.

### AC10 — Zero regressions
Run the full `npm test` chain after implementation. All previously passing tests must still pass. PASS if exit code is 0.

---

## Post-implementation smoke check

Visit the web UI. Click "Start a journey". Verify a journey is created in the server logs (or via a debug endpoint if one exists). Start a discovery session. Verify the session has `journeyId` set in server logs.
