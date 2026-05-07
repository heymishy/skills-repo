# Test Plan: owle.1 — Clarify side-trip

**Story:** artefacts/2026-05-07-web-ui-outer-loop-extensions/stories/owle.1-clarify-side-trip.md
**Test file:** tests/check-owle1-clarify-side-trip.js

---

## Technical Test Plan

### T1 — "Sharpen with /clarify" button only appears at discovery stage

**Type:** Unit / route handler
**Setup:** Mock journey at `stage: "discovery"` with a committed discovery.md; second mock journey at `stage: "benefit-metric"`.
**Action:** GET `/api/journey/:id/stage-controls`
**Assert:** Response for discovery journey includes `clarifyAvailable: true`; response for benefit-metric journey includes `clarifyAvailable: false` or omits the field.

---

### T2 — Side-trip session opens with discovery artefact as context

**Type:** Integration / route handler
**Setup:** Mock journey at discovery stage; `discovery.md` exists at `artefacts/test-feature/discovery.md` containing a known marker string.
**Action:** POST `/api/journey/:id/side-trip/clarify`
**Assert:** (a) Response includes a new `sideTripSessionId`. (b) The new session's system prompt or initial context message contains the marker string from the discovery.md file. (c) The parent journey's stage, turn count, and committed artefact path are unchanged.

---

### T3 — Parent journey state is isolated during side-trip

**Type:** Unit
**Setup:** Journey with `stage: "discovery"`, `turnCount: 3`, `artefactPath: "artefacts/test/discovery.md"`.
**Action:** Create a side-trip session; then modify the side-trip session (add a turn).
**Assert:** The parent journey object's `stage`, `turnCount`, and `artefactPath` are identical before and after the side-trip turn.

---

### T4 — "Return to journey" closes side-trip and restores journey

**Type:** Integration / route handler
**Setup:** Active side-trip session linked to a parent journey via `parentJourneyId`.
**Action:** DELETE `/api/journey/:id/side-trip` (or equivalent close endpoint)
**Assert:** (a) The side-trip session is marked closed. (b) The parent journey is still accessible at its pre-side-trip state. (c) No orphaned session record left with `parentJourneyId` pointing to a non-existent journey.

---

### T5 — Path traversal guard on discovery.md load

**Type:** Security / unit
**Setup:** Inject a journey with `featureSlug: "../../../etc"`.
**Action:** POST `/api/journey/:id/side-trip/clarify`
**Assert:** Response is HTTP 400; no file system read attempted outside `repoRoot`.

---

### T6 — Page reload while side-trip is active abandons side-trip cleanly

**Type:** Integration
**Setup:** Active side-trip session on a journey.
**Action:** Simulate page reload (GET `/api/journey/:id` without the side-trip session cookie / id).
**Assert:** (a) Journey is returned at its main discovery stage. (b) No side-trip state is exposed in the journey response. (c) No unhandled error thrown.

---

## Plain-language AC Verification Script

**Before coding agent runs:** all assertions in T1–T6 must fail (tests are written to fail first — TDD).

**After implementation — human smoke test steps:**

1. Start the server with a feature that has a `discovery.md` artefact committed.
2. Open the journey at the discovery stage. Confirm "Sharpen with /clarify" button is visible.
3. Navigate to a later stage (e.g. benefit-metric). Confirm the button is NOT visible.
4. Return to discovery. Click "Sharpen with /clarify". Confirm the /clarify chat interface opens and the first context message references the discovery.md content.
5. Send one message in the side-trip chat. Confirm the parent journey stage panel is unchanged.
6. Click "Return to journey". Confirm the journey is back at discovery with all prior turns intact.
7. Open the side-trip again, then reload the page. Confirm the journey loads at discovery (no side-trip state in UI).
