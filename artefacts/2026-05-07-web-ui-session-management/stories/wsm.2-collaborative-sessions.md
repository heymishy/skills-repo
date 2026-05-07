## Story: Collaborative sessions — shareable journey URL with live state sync

**Epic reference:** artefacts/2026-05-07-web-ui-session-management/discovery.md
**Discovery reference:** artefacts/2026-05-07-web-ui-session-management/discovery.md

## User Story

As an **operator who wants a colleague to see their in-progress journey**,
I want to share a journey URL and have the colleague see the current state within seconds,
So that I can walk through delivery decisions with a co-worker or stakeholder without screen-sharing.

## Benefit Linkage

**Metric moved:** Collaborative use rate — journeys accessed by more than one authenticated user.
**How:** The current single-user model makes the tool invisible to stakeholders and peer reviewers. A shareable URL with near-real-time state sync turns the web UI from a solo instrument into a collaborative one — supporting async review and live walkthroughs equally.

## Architecture Constraints

- **Authentication:** Any user who opens the shared URL must authenticate via the existing GitHub OAuth flow before they can view the journey. Unauthenticated requests receive the standard login redirect.
- **State sync:** The operator who owns the journey (created it) is the only one who can send turns. Other users are viewers — they see turns as they arrive but cannot interact with the chat panel. (Concurrent turn execution from multiple senders is out of scope for this story.)
- **Polling or SSE:** The viewer sync mechanism is the operator's choice of implementation. The AC requires state visible within 5 seconds. SSE (reusing the existing SSE infrastructure) is preferred; polling at ≤5 second interval is acceptable.
- **Concurrent turn serialisation:** If two authenticated users both attempt to send a turn (i.e. two browser tabs belonging to the journey owner), the second request must not be dropped silently — it must receive a 409 Conflict response ("Turn already in progress") and the operator must be able to retry.
- **No new persistent state schema change** — the existing journey object is extended with a `viewers` array (list of user logins currently subscribed) computed live from SSE connections / polling sessions; not persisted.
- **Idle disconnection:** A viewer who disconnects (closes tab) and does not poll for 30 minutes transitions the journey to "idle" (no active viewers) — the journey is not destroyed.
- D37: no new adapters introduced in this story beyond what wsm.1 already provides.

## Dependencies

- **Upstream:** wsm.1 (session persistence) — shareable URLs are only meaningful if the state survives beyond a single server process.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given an operator is mid-journey and opens the journey URL, when they copy and share that URL with an authenticated colleague, then the colleague sees the journey chat history and current stage within 5 seconds of opening the URL.

**AC2:** Given a viewer is watching a journey, when the owner sends a new turn and the response streams in, then the viewer's chat panel shows the new turn appear (the turn becomes visible within 5 seconds of the owner's turn completing).

**AC3:** Given the journey stage panel shows a user count indicator, when two authenticated users have the journey open, then the indicator shows "2 users"; when one closes the tab, the indicator updates to "1 user" within 10 seconds.

**AC4:** Given an unauthenticated user opens a shared journey URL, when the page loads, then they are redirected to the GitHub OAuth login flow — the journey content is not visible without authentication.

**AC5:** Given two browser tabs belonging to the journey owner both attempt to submit a turn simultaneously, when the second request arrives while the first is processing, then the second receives a 409 response with message "Turn already in progress" — the first turn completes normally and the second can be retried.

**AC6:** Given a viewer closes their browser tab and does not reconnect for 30 minutes, when the journey is next accessed by any user, then it is still accessible and its state is unchanged — idle disconnect does not destroy the journey.

**AC7:** Given the viewer-only restriction is in effect, when a viewer user attempts to submit a turn via a direct POST to the turn endpoint, then they receive a 403 Forbidden response — only the journey owner can submit turns.

## Out of Scope

- Role-based permissions (viewer vs editor vs admin) beyond the binary owner/viewer split in AC7.
- Conflict resolution for simultaneous edits from multiple owners — single owner model only.
- Presence indicators (who is typing, cursor position, etc.).
- Notifications when a viewer joins — the user count indicator (AC3) is sufficient.

## NFRs

- **Security:** Journey ownership is verified server-side against the GitHub login stored in the session. `ownerId` is never accepted from the client.
- **Performance:** The viewer sync polling or SSE connection must not add more than 50ms median latency to the owner's turn submissions.

## Complexity Rating

**Rating:** 3 — SSE/polling fan-out to multiple viewers, turn serialisation, ownership model.
**Scope stability:** Unstable — "Stable" aspects are the URL sharing and user count; the viewer-restriction and concurrent-turn-serialisation rules may need clarification during implementation.
