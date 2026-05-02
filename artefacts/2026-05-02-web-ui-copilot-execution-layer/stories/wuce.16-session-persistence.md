## Story: Multi-turn session persistence (resume an in-progress skill session)

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e4-phase2-guided-ui.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **non-technical stakeholder in an active skill session**,
I want to close the browser tab and resume my in-progress skill session later,
So that I don't lose my work if I'm interrupted mid-session — and I'm not forced to complete an entire /discovery run in a single sitting.

## Benefit Linkage

**Metric moved:** P2 — Unassisted /discovery completion rate
**How:** Sessions that cannot be resumed are more likely to be abandoned than completed; resumable sessions remove a key drop-off cause, increasing the proportion of initiated sessions that produce a committed artefact (the P2 measurement event).

## Architecture Constraints

- Mandatory security constraint: session state stored server-side must be associated with the authenticated user's identity — a user must not be able to resume another user's session by guessing a session ID; session IDs must be cryptographically random (≥128 bits)
- Mandatory security constraint: session state must not include the user's OAuth token — the token is held in the HTTP session cookie (set in wuce.1) and retrieved from there when the session is resumed
- ACP server is public preview — v1 session persistence uses server-side storage (file system or in-memory store keyed by session ID); ACP multi-turn session state (`newSession()` / `prompt(sessionId)`) is the preferred path once ACP reaches GA: "Reinstate/remove preview caveat when ACP reaches GA"
- ADR-009: session state storage and session lifecycle management are the responsibility of the session module (wuce.10) — not the web route handler

## Dependencies

- **Upstream:** wuce.10 (session lifecycle manager holds the per-user directory and session ID), wuce.13 (the resumed session re-enters the question flow at the correct step)
- **Downstream:** None — this is a resilience story; all Epic 4 stories work without it but unresumable sessions are the primary P2 dropout risk

## Acceptance Criteria

**AC1:** Given a user is mid-session (has answered 2 of 5 questions in a /discovery skill run), When they close the browser tab and return within 24 hours, Then the session is restored to the exact step they left at — the already-answered questions are shown as completed, the current question is shown as the next input, and the partial artefact preview reflects their previous answers.

**AC2:** Given a resumed session, When the user submits the remaining answers and confirms write-back, Then the committed artefact contains the full content from both the original and resumed session — no answers are lost or duplicated.

**AC3:** Given a user attempts to access a session ID that belongs to a different authenticated user, When the server validates the request, Then it returns a 403 error — the session state for the other user is never returned.

**AC4:** Given a session has been inactive for more than 24 hours, When the user attempts to resume it, Then they see a "Session expired — please start a new session" message and the expired session data is deleted from the server.

**AC5:** Given a user has multiple in-progress sessions (e.g. two different features started on different days), When they visit `/skills`, Then they see a "Resume in-progress session" list showing all unexpired sessions with the skill name, start date, and number of questions completed — allowing them to choose which to resume or start a new one.

## Out of Scope

- Cross-device session sync (resuming on a different browser or device) — v1 sessions are tied to the HTTP session cookie from wuce.1; cross-device is post-MVP
- Collaborative sessions (two users contributing to the same session simultaneously) — explicitly deferred (discovery out-of-scope item 1)
- Session export or download before commit — post-MVP

## NFRs

- **Security:** Session IDs cryptographically random (≥128 bits). Session state server-side only. No OAuth token in session state. User-to-session binding enforced. Expired sessions deleted.
- **Performance:** Session restore (loading state and re-rendering question form + preview) completes within 2 seconds.
- **Audit:** Session create, resume, expiry, and deletion events logged with user ID hash and session ID.

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
