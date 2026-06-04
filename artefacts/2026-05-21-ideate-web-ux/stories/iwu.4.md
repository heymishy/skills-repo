## Story: Confirm or flag assumption cards via POST endpoint with in-session state persistence

**Epic reference:** artefacts/2026-05-21-ideate-web-ux/epics/iwu-web-session-surface.md
**Discovery reference:** artefacts/2026-05-21-ideate-web-ux/discovery.md
**Benefit-metric reference:** artefacts/2026-05-21-ideate-web-ux/benefit-metric.md

## User Story

As a **platform operator (primary)**,
I want to mark each assumption card as confirmed or flagged and have that state persist for the session,
So that I can signal which assumptions are accepted versus require investigation without interrupting the session flow (M1, M2).

## Benefit Linkage

**Metric moved:** M1 — Assumption card render reliability (terminal state completion) and M2 — Rework rate reduction
**How:** Without an endpoint to record confirm/flag state, cards are display-only and the operator has no way to act on them. This story closes the card interaction loop: operator action → server state update → DOM visual feedback. Cards moving to confirmed or flagged state are the observable outcome that M2 measures as evidence of assumptions being surfaced and acted on rather than forgotten.

## Architecture Constraints

- Endpoint (ADR-018): `POST /api/skills/:name/sessions/:id/assumption/:cardId/confirm` with JSON body `{ "action": "confirm" | "flag" }`
- Session state (ADR-019): card state written to `session.assumptionCards[]` in-memory; HTTP 404 returned when session has expired (TTL elapsed) — not HTTP 500
- HTTP 404 when `cardId` not found in `session.assumptionCards[]` — `cardId` is a resource address, 404 is the correct semantics
- UX structural decisions from mockup (structural only): confirmed state = confirmed styling + "✓ confirmed" indicator replacing the confirm button; flagged state = flagged styling + flagged indicator replacing the flag button
- Security: `cardId` validated server-side as 8-character hex string before session lookup — reject with HTTP 400 if format invalid (path traversal guard per architecture-guardrails.md)
- Security: Session state must not be returned in error response bodies
- Accessibility: confirm and flag buttons must be keyboard-activatable; state change must be announced to assistive technology

## Dependencies

- **Upstream:** iwu.3 — cards must be in the DOM with `data-card-id` attributes and `session.assumptionCards[]` must be populated by the server before confirm/flag can be tested end-to-end; the server endpoint itself is independent but E2E tests require iwu.3
- **Downstream:** iwu.5 (nudge bar) queries the count of cards in default state — depends on this story correctly tracking confirmed and flagged state so the default-state count is accurate

## Acceptance Criteria

**AC1:** Given an assumption card in default state, when the operator activates the "confirm" button (click or keyboard), then the card transitions to confirmed visual state — confirmed styling applied and "✓ confirmed" indicator replaces the confirm button — and a `POST /api/skills/:name/sessions/:id/assumption/:cardId/confirm` request is sent with `{ "action": "confirm" }`.

**AC2:** Given an assumption card in default or confirmed state, when the operator activates the "flag" button, then the card transitions to flagged visual state — flagged styling applied and flagged indicator replaces the flag button — and a `POST .../confirm` request is sent with `{ "action": "flag" }`.

**AC3:** Given a `POST .../assumption/:cardId/confirm` request where the session exists and the `cardId` is found in `session.assumptionCards[]`, when the request is received, then the server returns HTTP 200 and the card's state in `session.assumptionCards[]` is updated to the requested action.

**AC4:** Given a `POST .../assumption/:cardId/confirm` request where the session has expired (TTL elapsed per ADR-019), when the request is received, then the server returns HTTP 404 (not HTTP 500).

**AC5:** Given a `POST .../assumption/:cardId/confirm` request where the `cardId` does not exist in `session.assumptionCards[]`, when the request is received, then the server returns HTTP 404 and no session state is modified.

**AC6:** Given a `cardId` parameter that is not an 8-character hex string (e.g. contains path traversal characters or is longer than 8 characters), when the `POST .../confirm` request is received, then the server returns HTTP 400 and does not perform a session lookup.

**AC7:** Given an operator using a keyboard only, when they activate the confirm or flag button on a card, then the resulting state change is applied and the new state is announced to assistive technology (WCAG 2.1 AA).

## Out of Scope

- Persisting card state to disk or any external store — in-memory only (ADR-019)
- Card state surviving session expiry — TTL-based eviction clears all state
- Bulk confirm/flag across multiple cards — single-card endpoint only
- Un-confirming a confirmed card — confirm and flag are terminal states in MVP

## NFRs

- **Security:** `cardId` validated as 8-char hex before session lookup (guards path traversal via URL parameter)
- **Security:** Session state not exposed in error response bodies
- **Accessibility:** WCAG 2.1 AA — button activation result announced; state change communicated by more than colour

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
**Rationale:** Endpoint is a straightforward session state mutation against an in-memory store. The confirm/flag DOM transition is well-specified. The main care point is the HTTP 404 on expired session (must not be 500) and the cardId format validation guard.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
