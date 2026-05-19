# AC Verification Script — ougl.7: DoR per-story stage + journey complete screen

**Story:** ougl.7 — DoR per-story stage and journey complete screen
**Verified by:** Developer / BA / tech lead
**When to run:** After full ougl.1–ougl.7 implementation. Final integration check before PR.

---

## Pre-conditions

- All ougl.1–ougl.6 implemented and passing
- `journey.js` has DoR handling and `GET /journey/:id/complete`
- Server started with valid `.env`

---

## Run unit tests

```powershell
node tests/check-ougl7-dor-and-journey-complete.js
```

**Expected before implementation:** All 8 tests fail (T7.1–T7.8). `Failed: 8`.
**Expected after implementation:** All 8 tests pass. `Failed: 0`.

---

## AC Scenario Walkthroughs

### AC1 — Review done → DoR session with all priorArtefacts
1. Complete the review session for a story in a journey. Trigger gate-confirm.
2. Verify: a definition-of-ready session is created. Verify `priorArtefacts` includes the test-plan artefact AND the review artefact for the story.
3. PASS if DoR session created with ≥2 priorArtefacts. FAIL if priorArtefacts missing or incomplete.

### AC2 — DoR session → 303 to DoR chat
1. Same as AC1. Verify 303 redirect to `/skills/definition-of-ready/sessions/[sid]/chat`.
2. PASS if redirect correct. FAIL if wrong location.

### AC3 — DoR done + more stories → next story test-plan
1. Complete the DoR session for `wgol.1` in a journey with `storyList = ['wgol.1', 'wgol.2']`. Trigger gate-confirm.
2. Verify: a test-plan session for `wgol.2` is created. Verify 303 redirect to `/skills/test-plan/sessions/[sid]/chat`.
3. PASS if next story test-plan session created and redirect correct. FAIL if redirect goes to complete screen prematurely.

### AC4 — DoR done + no more stories → /journey/:id/complete
1. Complete the DoR session for the last story in the list. Trigger gate-confirm.
2. Verify: response is 303 to `/journey/[journeyId]/complete`.
3. PASS if redirect correct. FAIL if next story attempted or 500 returned.

### AC5 — Auth GET /journey/:id/complete → 200 with completedStages listed
1. Navigate to `/journey/[journeyId]/complete` (authenticated) after a full journey.
2. Verify: page returns 200. Page lists all completed stage artefact paths.
3. PASS if all artefact paths visible. FAIL if page empty or 404.

### AC6 — Unauth GET /journey/:id/complete → 302
1. Visit the complete URL without a session.
2. Verify: redirected to `/auth/github`.
3. PASS if redirected. FAIL if page loads without auth.

### AC7 — 3 feature + 2 stories × 3 story stages → ≥9 entries in complete screen
1. After a full journey with 3 feature stages and 2 stories each completing test-plan, review, and DoR:
2. Navigate to the complete screen.
3. Verify: page displays at least 9 artefact entries (count `artefacts/` occurrences in HTML).
4. PASS if ≥9 entries. FAIL if fewer entries shown.

### AC8 — Unknown journeyId → 404
1. Navigate to `/journey/nonexistent-id/complete`.
2. Verify: response is HTTP 404.
3. PASS if 404. FAIL if 500 or empty 200.

### AC9 — Full npm test → 0 failures
1. After implementing ougl.1–ougl.7:

```powershell
npm test
```

2. Verify: exit code 0. All test files pass. `Failed: 0` in every check file.
3. PASS if all tests green. FAIL if any test fails.

---

## Full journey end-to-end smoke test

1. Log in to the web UI.
2. Navigate to `/journey` and submit to start a feature journey.
3. Complete discovery session → click gate-confirm → confirm redirect to benefit-metric chat.
4. Complete benefit-metric → gate-confirm → confirm redirect to definition chat.
5. Complete definition → gate-confirm → confirm redirect to `/journey/:id/stories` screen.
6. Submit 2 story slugs.
7. Complete test-plan for story 1 → gate-confirm → confirm redirect to review chat.
8. Complete review for story 1 → gate-confirm → confirm redirect to DoR chat.
9. Complete DoR for story 1 → gate-confirm → confirm redirect to test-plan for story 2.
10. Repeat steps 7–9 for story 2. After story 2 DoR gate-confirm → confirm redirect to `/journey/:id/complete`.
11. Verify complete screen lists all artefact paths from all stages.

If all steps complete without error, the full ougl feature is working end-to-end.
