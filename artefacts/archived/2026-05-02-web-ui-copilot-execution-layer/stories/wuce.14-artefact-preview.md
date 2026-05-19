## Story: Incremental artefact preview as skill session progresses

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e4-phase2-guided-ui.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **non-technical stakeholder running a skill session**,
I want to see the artefact being built in a live preview panel as I answer each question,
So that I can confirm the output is forming correctly before committing it to the repository — and catch quality issues without engineer review.

## Benefit Linkage

**Metric moved:** P2 — Unassisted /discovery completion rate
**How:** A visible incremental preview lets the non-technical user self-validate that the artefact is coherent and on-track — reducing the probability that an unassisted session produces an invalid or incomplete artefact (which is the primary failure mode for P2).

## Architecture Constraints

- Mandatory security constraint: the artefact preview content rendered in the browser must be sanitised before insertion into the DOM — same sanitisation constraint as wuce.2; no raw innerHTML from CLI output
- ADR-012: the preview content is returned from the backend execution adapter via the session API — the browser does not parse CLI JSONL output directly
- ACP server is public preview — incremental preview in v1 is achieved by polling the session state endpoint after each answer submission, not by WebSocket streaming; streaming is a progressive enhancement: "Reinstate/remove preview caveat when ACP reaches GA"

## Dependencies

- **Upstream:** wuce.13 (skill launcher and question flow — preview panel sits alongside the question form)
- **Downstream:** wuce.15 (write-back story commits the artefact whose final state is shown in this preview)

## Acceptance Criteria

**AC1:** Given a user is in an active skill session and has submitted at least one answer, When the question form is displayed, Then a preview panel alongside the form shows the current partial artefact content formatted as prose (not raw markdown) — updated after each answer submission.

**AC2:** Given the CLI produces a partial artefact output after answer N, When the session state is polled by the browser, Then the preview panel content is updated to reflect the latest output without a full page reload.

**AC3:** Given the preview content contains markdown tables or code blocks, When it is rendered in the preview panel, Then tables are displayed as HTML tables and code blocks are displayed with monospace formatting — not as raw markdown syntax.

**AC4:** Given the preview panel content originates from CLI JSONL output, When the backend extracts the artefact text, Then it sanitises the content before returning it to the browser — no script injection, no iframe injection.

**AC5:** Given a user has completed all questions and the final artefact is fully generated, When the preview panel updates for the last time, Then a "Commit artefact to repository" button becomes active — signalling that the artefact is ready for write-back.

## Out of Scope

- Real-time token-by-token streaming via WebSocket or server-sent events — acceptable for v1 to update after each answer (polling per interaction); streaming is a progressive enhancement
- Editable preview (allowing the user to hand-edit the artefact before commit) — post-MVP; the session output is committed as-is from the engine
- Side-by-side diff of the new artefact against any existing artefact — post-MVP

## NFRs

- **Security:** Preview HTML sanitised before DOM insertion. No raw CLI output to the browser.
- **Performance:** Preview panel update (polling + render) under 1 second after each answer submission.
- **Accessibility:** Preview panel is labelled as a live region (`aria-live="polite"`) so screen readers announce updates; preview panel heading is correct heading level in document hierarchy.

## Complexity Rating

**Rating:** 2
**Scope stability:** Unstable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
