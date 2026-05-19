# AC Verification Script — ougl.6: Per-story stage routing

**Story:** ougl.6 — Per-story stage routing (`/journey/:id/stories`)
**Verified by:** Developer / BA / tech lead
**When to run:** After implementation of stories routes and journey store additions.

---

## Pre-conditions

- `journey.js` implements `GET/POST /journey/:id/stories`
- `journey-store.js` has `setStoryList`, `getCurrentStory`, `advanceToNextStory`
- ougl.5 (gate-confirm) implemented

---

## Run unit tests

```powershell
node tests/check-ougl6-perstory-stage-routing.js
```

**Expected before implementation:** All 9 tests fail. `Failed: 9`.
**Expected after implementation:** All 9 tests pass. `Failed: 0`.

---

## AC Scenario Walkthroughs

### AC1 — Auth GET /journey/:id/stories → 200 with textarea form
1. Complete the feature-stage definition-of-ready in a journey. Navigate to `/journey/[journeyId]/stories`.
2. Verify: page returns 200. Page contains a form with a textarea field for entering story slugs.
3. PASS if form with textarea visible. FAIL if 404 or form absent.

### AC2 — Unauth GET → 302
1. Visit `/journey/[journeyId]/stories` without a session.
2. Verify: redirected to `/auth/github`.
3. PASS if redirected. FAIL if page loads without auth.

### AC3 — POST sets storyList and mode
1. Submit the story list form with slugs `wgol.1`, `wgol.2`, `wgol.3` (one per line or comma-separated per implementation).
2. Verify in server logs or debug: `journey.storyList === ['wgol.1', 'wgol.2', 'wgol.3']` and `journey.mode === 'story'`.
3. PASS if both correct. FAIL if list empty or mode unchanged.

### AC4 — POST → 303 to test-plan chat
1. Submit story list (authenticated).
2. Verify response is 303. Verify `Location` is `/skills/test-plan/sessions/[sid]/chat`.
3. PASS if redirect correct. FAIL if wrong status or location.

### AC5 — New test-plan session systemPrompt has HANDOFF and story slug
1. After redirect, inspect the test-plan session.
2. Verify `systemPrompt` contains `--- HANDOFF CONTEXT ---` AND the first story slug (e.g., `wgol.1`).
3. PASS if both present. FAIL if either absent.

### AC6 — test-plan done + gate-confirm → review session with priorArtefacts
1. Complete the test-plan session for `wgol.1`.
2. Click the gate-confirm button.
3. Verify a review session is created. Verify `priorArtefacts` includes the test-plan artefact content.
4. PASS if review session created with priorArtefacts. FAIL if priorArtefacts empty.

### AC7 — Review session → 303 to review chat
1. Same as AC6. Verify 303 redirect to `/skills/review/sessions/[sid]/chat`.
2. PASS if redirect correct. FAIL if wrong location.

### AC8 — Path-traversal slug → 400
1. Submit a story list containing a slug like `../etc` or `../../bad`.
2. Verify response is HTTP 400. Journey store NOT modified.
3. PASS if 400. FAIL if accepted.

### AC9 — Empty story list → 400
1. Submit the form with an empty textarea or whitespace-only content.
2. Verify response is HTTP 400.
3. PASS if 400. FAIL if 303 or empty journey created.

---

## Slug validation check

Valid slugs (should pass): `wgol.1`, `ougl-2`, `abc`, `a1b2`, `a.b-c`
Invalid slugs (should be rejected): `../etc`, `/absolute`, `has space`, `../../bad`

---

## Regression check

Run `npm test` after implementation. All previously-passing tests must still pass.
