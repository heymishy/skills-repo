## Story: The chat page stops sending hidden "continue" turns after a few, and shows the operator what it has

**Epic reference:** None - short-track (bug, issue #1148, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: issue #1148; the lpw-s5 diagnosis in `artefacts/2026-11-17-local-playwright-suite-trust/decisions.md` (2026-11-18); `src/web-ui/routes/skills.js` (the client script's `evt.done` branch); the icv-s1 comment in the same function, which fixed the same loop for ideate by exempting it rather than bounding it.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [web-ui] [chat]

## User Story

As **an operator working through a skill session in the chat page**,
I want **the page to give up on automatic "continue" turns after a few, and hand me back the input with what the model last said**,
So that **a model reply without a question mark can never lock the send button and spend tokens in an endless chain**.

## Benefit Linkage

**Metric moved:** None formal. The page re-sends a hidden "continue" turn whenever a streamed turn is not done and its text has no question mark (or the server says it was truncated). Nothing bounds the chain. In the browser test server a canned reply without a question mark made every fresh chat page send 7 to more than 10 hidden turns in 10 to 15 seconds with the send button disabled the whole time (lpw-s5). A real model can do the same: any non-artefact reply with no literal "?" (a statement, a summary, a refusal) starts the chain, and each turn spends tokens and credits.
**How:** a counter of consecutive hidden continues, reset by any turn the operator sends; a smaller cap for a reply that was not truncated and just lacked a question; a larger cap for truncated replies (long artefacts legitimately need several); and an early stop when a continue returns the same text as the turn before it.

## Architecture Constraints

- **Client script only.** The change is inside the embedded chat-page script in `src/web-ui/routes/skills.js`. The turn handlers, the SSE framing, the `done` and `truncated` fields, the mock gateway and the icv-s1 ideate exemption are not changed. The existing auto-continue tests (`check-icv-s1`, `check-ltd-s1`) pass unchanged.
- **Caps (decided here, adjustable):** 2 consecutive hidden continues when the reply was not truncated; 5 when it was; stop at once if a continue's text equals the previous turn's text. The operator's own message always resets the count.
- **What the operator sees when the cap is hit:** the last reply stays visible, the send button is re-enabled, and one short line tells them the page stopped asking the model to continue and they can reply or press send to try again.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain. No new injectable adapter (D37 not triggered).

## Dependencies

- **Upstream:** icv-s1, ltd-s1 (the existing continue logic), lpw-s5 (the finding).
- **Downstream:** none.

## Acceptance Criteria

**AC1:** Given a discovery-style session whose every reply is not done, not truncated and has no question mark, When the first turn completes, Then the page sends at most 2 hidden continue turns after it (3 turns in all), then re-enables the send button and shows the notice line; the last reply remains visible.

**AC2:** Given a session whose replies are truncated, When the chain runs, Then the page sends at most 5 hidden continue turns, and a truncated chain that finishes with a done turn within the cap behaves exactly as before (the artefact is shown, no notice).

**AC3:** Given a continue turn whose text equals the turn before it, When it completes, Then the page stops continuing at once (even below the cap), re-enables the send button and shows the notice.

**AC4:** Given the cap was reached, When the operator sends a message, Then the count restarts: that turn may be followed by its own continues up to the cap again.

**AC5:** Given replies that end with a question mark, replies that are done, and an ideate session, When they complete, Then no hidden continue is sent (unchanged), and `check-icv-s1-ideate-canvas-turn2-render-fix`, `check-ltd-s1-truncation-detection` and the other existing chat-page tests pass unchanged.

## Out of Scope

- Changing what counts as a finished turn, the mock gateway, or the server's truncation detection.
- A server-side limit on turns per minute (already exists per tenant).
- Showing a retry button; the notice points to the normal send button.

## NFRs

- **Cost:** the worst case after this change is 3 model turns for a reply without a question mark and 6 for a truncated one, down from unbounded.
- **Accessibility:** the notice is plain text in the chat thread (read by assistive technology like any bubble); no new control.
- **Security:** no new input reaches the server; the notice is fixed text.

## Complexity Rating

**Rating:** 2 - small code in a large embedded script, and the cap values are a product decision the operator reviews.
**Scope stability:** Stable
