# Test Plan: wsm.2 — Collaborative sessions

**Story:** artefacts/2026-05-07-web-ui-session-management/stories/wsm.2-collaborative-sessions.md
**Test file:** tests/check-wsm2-collaborative-sessions.js

---

## Technical Test Plan

### T1 — Unauthenticated user is redirected from shared journey URL

**Type:** Integration / route handler
**Setup:** Journey exists. Request made without a valid session cookie.
**Action:** GET `/journey/:id` without authentication.
**Assert:** HTTP 302 redirect to `/auth/github` (or the login route). Journey content not returned.

---

### T2 — Authenticated viewer can load journey state

**Type:** Integration
**Setup:** Journey with 3 turns created by owner. Second authenticated user session.
**Action:** GET `/api/journey/:id` with viewer's session.
**Assert:** (a) HTTP 200. (b) Response contains the same `turns` and `stage` as the owner's view.

---

### T3 — Viewer cannot submit a turn (403)

**Type:** Unit / route handler
**Setup:** Journey owned by `user-A`. Viewer session as `user-B`.
**Action:** POST `/api/skills/:name/sessions/:id/turn` or equivalent turn endpoint as `user-B`.
**Assert:** HTTP 403. Turn is not added to the session. Owner's session is unchanged.

---

### T4 — Owner's new turn is visible to viewer within 5 seconds

**Type:** Integration (polling or SSE)
**Setup:** Owner adds a new turn via POST. Viewer is polling `/api/journey/:id` at 5-second interval.
**Assert:** After at most 5 seconds (one poll cycle), the viewer's GET returns a response that includes the new turn. (For SSE: the viewer's SSE connection receives an event within 5 seconds of the turn completing.)

---

### T5 — User count updates when second user opens journey

**Type:** Unit
**Setup:** Journey with one active connection (owner).
**Action:** Second authenticated user opens the journey (creates a second connection/poll registration).
**Assert:** GET `/api/journey/:id/viewers` (or equivalent) returns `count: 2`. After the second user disconnects and 10 seconds pass, count returns to 1.

---

### T6 — Concurrent turn attempt returns 409

**Type:** Integration
**Setup:** A turn is in progress (mocked as a long-running async operation). Second POST arrives while first is processing.
**Action:** POST second turn.
**Assert:** HTTP 409 with message "Turn already in progress". First turn completes normally.

---

### T7 — Journey survives 30-minute viewer idle without destruction

**Type:** Unit
**Setup:** Journey with one viewer connection. Simulate 30-minute idle (last-seen timestamp set to 30+ minutes ago).
**Action:** Run the idle-check cleanup.
**Assert:** Journey still exists in memory and on disk (wsm.1). Viewer count set to 0 (idle). Journey is accessible via GET.

---

### T8 — ownerId verified server-side; cannot be spoofed via request

**Type:** Security / unit
**Setup:** Journey owned by `user-A`. Request with `user-B` session and body containing `{ ownerId: "user-A" }`.
**Action:** POST turn as `user-B`.
**Assert:** HTTP 403 — the submitted `ownerId` field is ignored; ownership check uses the server-side session only.

---

## Plain-language AC Verification Script

**Before coding agent runs:** T1–T8 must all fail.

**After implementation — human smoke test steps:**

1. Open a journey as user A. Copy the URL. Open in a private browser window (not authenticated). Confirm redirect to login.
2. Log in as a second GitHub account (or use a different browser profile). Open the shared URL. Confirm the journey state is visible.
3. As the second user, try to send a chat message. Confirm 403 — the input is disabled or rejected.
4. As the owner, send a new turn. Confirm the viewer's browser updates within 5 seconds.
5. Confirm the user count indicator shows "2 users" with both connected; "1 user" after the second tab is closed.
6. Close the viewer tab. Wait 10 seconds. Confirm user count drops.
