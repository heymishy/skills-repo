# Test Plan — ougl.2: Journey state store module

**Story:** ougl.2 — Journey state store module (`journey-store.js`)
**Feature:** 2026-05-06-web-ui-guided-outer-loop
**Test file:** `tests/check-ougl2-journey-state-store.js`
**Date:** 2026-05-06
**Total ACs:** 10

---

## Test Data Strategy

**Type:** Synthetic — all journey IDs, session IDs, skill names, and artefact paths are constructed inline. No disk I/O. No external services.

**Setup/teardown:** Call `store._clear()` in each test to reset the in-memory store. `freshRequire` clears module cache before the test group runs.

---

## AC Coverage Table

| AC  | Description | Test IDs | Gap type | Risk |
|-----|-------------|----------|----------|------|
| AC1 | `createJourney('slug')` returns correct shape | T2.1 | None | Low |
| AC2 | `getJourney(journeyId)` returns same object | T2.2 | None | Low |
| AC3 | `setActiveSession` updates `activeSessionId` and `activeSkill` | T2.3 | None | Low |
| AC4 | `getJourneyBySession` returns journey | T2.4 | None | Low |
| AC5 | `completeStage` adds `{skillName, artefactPath}` to `completedStages` | T2.5 | None | Low |
| AC6 | `getNextStage` returns correct sequence | T2.6 | None | Medium |
| AC7 | `registerHtmlSession` without journeyId → `session.journeyId === null` | T2.7 | None | Medium |
| AC8 | `linkSessionToJourney(sid, journeyId)` → `session.journeyId === journeyId` | T2.8 | None | Medium |
| AC9 | `_clear()` → `getJourney(anyId)` returns null | T2.9 | None | Low |
| AC10 | Zero regressions in full `npm test` | (full npm test chain) | N/A | Low |

**Coverage gaps:** AC10 is verified by running `npm test` after implementation, not by this script.

---

## Unit Tests

### T2.1 (AC1) — createJourney returns correct shape
**Module:** `journey-store.js`
**Call:** `store.createJourney('my-feature')`
**Expected:** returned object has `journeyId` (string), `featureSlug === 'my-feature'`, `activeSkill === null`, `activeSessionId === null`, `completedStages` is an empty array, `mode === 'feature'`.

### T2.2 (AC2) — getJourney returns same object
**Call:** create journey, then `store.getJourney(result.journeyId)`
**Expected:** returned object is deeply equal (or same reference) to the created journey.

### T2.3 (AC3) — setActiveSession updates fields
**Call:** create journey, then `store.setActiveSession(journeyId, 'sess-abc', 'discovery')`
**Expected:** `journey.activeSessionId === 'sess-abc'` and `journey.activeSkill === 'discovery'`.

### T2.4 (AC4) — getJourneyBySession returns journey
**Call:** create journey, `setActiveSession(journeyId, 'sess-xyz', 'discovery')`, then `store.getJourneyBySession('sess-xyz')`
**Expected:** returns journey with matching `journeyId`.

### T2.5 (AC5) — completeStage adds to completedStages
**Call:** create journey, then `store.completeStage(journeyId, 'discovery', 'artefacts/test/discovery.md')`
**Expected:** `journey.completedStages[0]` equals `{ skillName: 'discovery', artefactPath: 'artefacts/test/discovery.md' }`.

### T2.6 (AC6) — getNextStage sequence
**Tests:** `getNextStage('discovery') === 'benefit-metric'`, `getNextStage('benefit-metric') === 'definition'`, `getNextStage('definition') === 'test-plan'`, `getNextStage('test-plan') === 'definition-of-ready'`, `getNextStage('definition-of-ready') === null`.

### T2.7 (AC7) — registerHtmlSession stores journeyId: null
**Module:** `skills.js`
**Setup:** freshRequire skills.js, set a mock buildSystemPrompt stub (skip actual file I/O via `_setHtmlSession`). Call `routes.registerHtmlSession(sid, '/tmp/test', 'discovery')` (3 args only).
**Expected:** `routes._getHtmlSession(sid).journeyId === null`.

### T2.8 (AC8) — linkSessionToJourney updates session
**Setup:** freshRequire skills.js, set up session via `_setHtmlSession(sid, { ..., journeyId: null })`. Call `routes.linkSessionToJourney(sid, 'journey-xyz')`.
**Expected:** `routes._getHtmlSession(sid).journeyId === 'journey-xyz'`.

### T2.9 (AC9) — _clear() resets store
**Call:** create two journeys, then `store._clear()`. Call `store.getJourney(journeyId)`.
**Expected:** returns `null` (or `undefined`).

---

## Integration Tests

**T2.INT.1 — Module isolation:** `freshRequire('journey-store.js')` then call `_clear()` — no other modules are affected.

**T2.INT.2 — journeyId uniqueness:** Create two journeys with the same slug. Verify `journeyId` values differ (UUID uniqueness property).

---

## NFR Tests

**NFR-1 (O(1) Map operations):** Not directly testable. Covered implicitly — all Map operations are constant time by definition.

**NFR-2 (crypto.randomUUID):** `createJourney` returns a `journeyId` that matches UUID v4 format: `assert.ok(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(journey.journeyId))`.

---

## Pre-implementation Expectation

T2.1–T2.6 and T2.9 will FAIL before implementation (`Cannot find module journey-store.js`). T2.7 will FAIL (no `journeyId` field in current session). T2.8 will FAIL (`linkSessionToJourney` not exported from skills.js). This is the correct TDD baseline.
