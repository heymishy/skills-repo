## Story: Stream assumption cards from SSE marker events into the #assumption-cards panel

**Epic reference:** artefacts/2026-05-21-ideate-web-ux/epics/iwu-web-session-surface.md
**Discovery reference:** artefacts/2026-05-21-ideate-web-ux/discovery.md
**Benefit-metric reference:** artefacts/2026-05-21-ideate-web-ux/benefit-metric.md

## User Story

As a **platform operator (primary)**,
I want each assumption surfaced by the model to appear as a card in `#assumption-cards` as it is emitted during the session,
So that I can see and act on assumptions at the moment they are relevant rather than only in the final Lens B output (M1, M2).

## Benefit Linkage

**Metric moved:** M1 — Assumption card render reliability
**How:** This story implements the complete marker-to-card pipeline: server-side SSE handler strips `---ASSUMPTION-JSON---` markers from the chat thread and emits `assumptionCard` events; the browser appends a card to `#assumption-cards` for each event. Without this story, M1 is structurally 0% — no markers reach the DOM.

## Architecture Constraints

- Extend the existing `handlePostTurnStreamHtml` SSE streaming pattern — no new model API dependencies, no new routes
- Marker protocol (ADR-018): `---ASSUMPTION-JSON: {"id":"...","text":"...","type":"...","risk":"...","knowness":"..."}---` — marker must appear on its own line in model output; server strips it from the chat thread before forwarding
- cardId derivation (ADR-018): `sha256(sessionId + emittedText)[0:8]` — hex string, 8 characters
- Session state (ADR-019): append card to `session.assumptionCards[]` on emission; 30-min TTL applies to the parent session
- Feature flag: when `session.assumptionCardsEnabled` is `false` (default until iwu.6 merges), strip markers silently and emit no `assumptionCard` events — no card appears in the DOM
- Security guardrail: assumption card `text` field must be HTML-escaped before DOM injection — no `innerHTML` with raw model output
- Accessibility guardrail: card type and risk state must have non-colour discriminators — type tag label, risk level label (not just a coloured dot)
- UX structural decisions from mockup (structural only, no CSS replication): card fields — type tag (desirability / viability / feasibility / ethical), risk indicator with label (high / medium / low), knowness label, assumption text, two action buttons (confirm / flag)

## Dependencies

- **Upstream:** iwu.2 — right panel layout must be restructured so `#assumption-cards` DOM section exists before this story can inject cards into it
- **Downstream:** iwu.4 depends on cards being in DOM with `data-card-id` and `session.assumptionCards[]` being populated; iwu.5 (nudge bar) interrogates card default state count

## Acceptance Criteria

**AC1:** Given a streaming `/ideate` session, when the server SSE stream contains an `---ASSUMPTION-JSON: {...}---` marker in the model output, then the server strips the marker text from the chat thread (it does not appear in the left-panel chat display) and emits an `assumptionCard` SSE event containing the parsed assumption payload (`id`, `text`, `type`, `risk`, `knowness`).

**AC2:** Given an `assumptionCard` SSE event is received by the browser, when the event fires, then a card is appended to `#assumption-cards` within 500ms, displaying: assumption text, type tag (one of: desirability / viability / feasibility / ethical), risk indicator with a text label (high / medium / low, not colour alone), knowness label, and two action buttons labelled "confirm" and "flag". The card carries a `data-card-id` attribute set to the cardId.

**AC3:** Given `session.assumptionCardsEnabled` is `false`, when an `---ASSUMPTION-JSON---` marker is present in model output, then no `assumptionCard` SSE event is emitted, the marker is stripped silently from the chat thread, and no card appears in `#assumption-cards`.

**AC4:** Given an assumption card `text` value that contains HTML special characters (`<`, `>`, `&`, `"`, `'`), when the card renders, then the text is HTML-escaped before DOM injection and the literal characters are displayed to the operator (no script execution, no tag injection).

**AC5:** Given a valid `---ASSUMPTION-JSON---` marker with an unrecognised `type` value (not one of the four expected values), when the card renders, then the type tag displays the raw value — the card is not silently dropped.

**AC6:** Given multiple `assumptionCard` events fire during one lens run, when all cards are rendered, then they appear in `#assumption-cards` in emission order and each card has a unique `data-card-id`.

## Out of Scope

- Confirm/flag button interaction and DOM state transition — iwu.4
- Server-side confirm/flag endpoint — iwu.4
- Lens-transition nudge bar (`lensComplete` SSE event) — iwu.5
- `#context-manifest` chip layout — iwu.1
- The `session.assumptionCardsEnabled` flag being set to `true` by default — that happens in iwu.6 when SKILL.md tuning merges
- Assumption card animation or transition effects — implementation detail left to the developer

## NFRs

- **Security:** Assumption card `text` HTML-escaped before DOM injection (no XSS via model-generated content)
- **Performance:** Card appended to `#assumption-cards` within 500ms of `assumptionCard` SSE event receipt
- **Accessibility:** WCAG 2.1 AA — card states communicated by more than colour; type and risk level have text labels

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
**Rationale:** SSE handler extension is a known pattern; marker parsing and cardId generation are new but well-specified. Feature flag conditional is straightforward. The main unknowns are in the SSE stream handler internals — requires code reading before implementation.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
