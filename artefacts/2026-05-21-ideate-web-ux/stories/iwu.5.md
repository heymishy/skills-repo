## Story: Emit lensComplete SSE event and render lens-transition nudge bar when unconfirmed cards are present

**Epic reference:** artefacts/2026-05-21-ideate-web-ux/epics/iwu-web-session-surface.md
**Discovery reference:** artefacts/2026-05-21-ideate-web-ux/discovery.md
**Benefit-metric reference:** artefacts/2026-05-21-ideate-web-ux/benefit-metric.md

## User Story

As a **platform operator (primary)**,
I want a nudge bar to appear in the left panel at each lens boundary when there are unconfirmed assumption cards,
So that I am prompted to review accumulated cards at the natural pause point rather than discovering them at session end (M1, M2).

## Benefit Linkage

**Metric moved:** M1 — Assumption card render reliability (reviewed-and-actioned count) and M2 — Rework rate reduction
**How:** The nudge bar addresses D-3 (the high-risk UX assumption from discovery): operators are most likely to act on assumptions at a lens boundary rather than mid-stream. ADR-020 resolves D-3 as a design decision — accumulate during generation, nudge at lens transition. Without this story, cards accumulate silently and the operator may not notice them until session end, increasing re-run risk (M2).

## Architecture Constraints

- `lensComplete` is a new SSE event type added to the stream handler — it must not be piggy-backed onto `turn-complete` or any other existing event type (ADR-018 extension pattern); it carries a `lensName` field (e.g. `{ type: "lensComplete", lensName: "Lens B" }`)
- Nudge bar renders in the left panel (above the chat input area), not inside `#assumption-cards` — the nudge is a session-level notification, not a card-level one
- ADR-020 (D-3 UX resolution): accumulate cards during generation; surface nudge at `lensComplete` event; auto-dismiss when all cards for that lens are confirmed
- The real `lensComplete` trigger from the SKILL.md execution path is delivered by iwu.6 — this story wires the browser-side handler and adds the server-side SSE event type; testing uses synthetic `lensComplete` events before iwu.6 merges
- Accessibility: nudge bar must be keyboard-activatable; appearance must not steal focus — operator can continue reading without being interrupted

## Dependencies

- **Upstream:** iwu.2 — `#assumption-cards` DOM section must exist (created by the right panel layout restructure) for the nudge bar's card-count query to resolve correctly; iwu.3 — card DOM and default state tracking must exist for the nudge bar to interrogate the count of unconfirmed cards; iwu.4 — card state transitions (confirmed / flagged) must work correctly for auto-dismiss to detect the all-confirmed condition
- **Downstream:** iwu.6 (SKILL.md tuning) provides the real `lensComplete` trigger in production sessions; iwu.5 is fully testable against synthetic events before iwu.6 merges

## Acceptance Criteria

**AC1:** Given a lens has completed generation, when the server emits a `lensComplete` SSE event (format: `{ type: "lensComplete", lensName: "Lens B" }`), then the browser receives the event and evaluates the count of cards in `#assumption-cards` that are in default (unactioned) state.

**AC2:** Given at least one card in default state is present when the `lensComplete` event fires, then a nudge bar appears in the left panel above the chat input displaying "Lens [name] complete — [N] unconfirmed assumption[s]" and a "review now" button.

**AC3:** Given the nudge bar is visible, when the operator activates the "review now" button (click or keyboard), then the nudge bar is dismissed and the first unconfirmed card in `#assumption-cards` is scrolled into view; focus is transferred to the card only if the chat input does not currently hold focus — if the operator is mid-typing in the chat input, the card is scrolled into view but focus remains on the chat input.

**AC4:** Given zero cards in default state when the `lensComplete` event fires, then no nudge bar is shown.

**AC5:** Given a nudge bar is visible, when the operator confirms the last remaining unconfirmed card, then the nudge bar is dismissed automatically without requiring a manual close action.

**AC6:** Given this story is implemented, when the `lensComplete` SSE event type is defined in the stream handler, then it is registered as a new named event type distinct from `turn-complete` and any other existing event — it is not an alias or extension of an existing event.

## Out of Scope

- Emitting `lensComplete` events from the SKILL.md execution path — that is iwu.6; this story adds the SSE event type and browser handler only
- Bulk-dismiss of the nudge bar without reviewing cards
- Nudge bar for session-end summary (post-session review UI) — deferred to post-MVP (Cluster 3 in discovery)
- The lens track topbar indicator (done/active/pending dots) — deferred to post-MVP per discovery out-of-scope section

## NFRs

- **Accessibility:** WCAG 2.1 AA — nudge bar keyboard-accessible; "review now" button activatable by keyboard; appearance does not steal focus; scroll-to and focus action on first unconfirmed card announced to assistive technology
- **UX:** Nudge bar appearance does not interrupt operator reading flow — does not cover the chat panel or intercept keystrokes

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
**Rationale:** New SSE event type definition is straightforward. The auto-dismiss logic requires observing card state transitions — requires care in coupling between the nudge bar and iwu.4 state tracking. The nudge bar is a new UI component with specific dismiss conditions.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
