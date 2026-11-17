## Story: The model-session browser specs run against the test server without the chat page looping, and join the browser suite

**Epic reference:** None - short-track (follow-up from the lpw-s2 capability matrix; capability gap "model sessions", per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: `tests/e2e/capability-matrix.json` entries for `design-definition-canvas-render`, `ep2-s1-presence-sidebar`, `ep2-s2-stage-visibility` and `rdac-s1-resume-shows-diagrams-artefact-conversation` (lane quarantined, reason "waits for a real model session turn (90 to 150 second timeouts); the CI job has no model gateway"), and the diagnosis in `decisions.md` (2026-11-18).
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [testing] [web-ui]

## User Story

As **the operator who relies on the browser suite to say whether the product still works**,
I want **the four model-session specs to run against the test server instead of timing out**,
So that **the canvas diagrams, presence sidebar, stage visibility and resume-with-artefact behaviours are checked on every change, and the matrix's "model sessions" gap is closed**.

## Benefit Linkage

**Metric moved:** None formal. Four specs are quarantined with the reason "no model gateway in CI". The reason was wrong. The test server already answers model turns with canned text: in `NODE_ENV=test` `src/web-ui/server.js` wires a stub streaming executor. That stub ends with the marker `---ARTEFACT-COMPLETE---` and no question mark, and the chat page automatically re-sends a hidden "continue" turn whenever a streamed turn is not done and has no "?" in its text. So every fresh chat page in the test server re-sent hidden turns without end (more than ten in 15 seconds, identical 1,745-byte replies), the send button stayed disabled, and the specs waited out their 90 to 150 second timeouts.
**How:** the stub ends its text on a question, which the page treats as a turn awaiting the operator, so the loop never starts; `ep2-s1` also needs the lpw-s4 roster helper; the four specs leave quarantine.

## Architecture Constraints

- **Test-mode only.** The change is inside the `NODE_ENV=test` stub block of `src/web-ui/server.js` (the existing stub streaming adapter); nothing runs in production or staging. The mock LLM gateway and its fixtures are not edited.
- **No change to the chat page or the turn handlers.** The page's unbounded auto-continue (a not-done turn with no "?") is a product weakness of the same class as icv-s1 and is recorded as a separate issue, not changed here.
- **Specs use real flows.** `ep2-s1` seeds its roster and adds members through the real pod flow (`tests/e2e/fixtures/pods.js`, lpw-s4); member ids are identity strings.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain.

## Dependencies

- **Upstream:** lpw-s2 (matrix and core), lpw-s4 (the roster seed route and `pods.js` helper).
- **Downstream:** none.

## Acceptance Criteria

**AC1:** Given the test server, When a streamed turn is requested for a fresh session (`POST /api/skills/<skill>/sessions/<id>/turn-stream`), Then the final event reports `done: false`, the streamed text contains a question mark, and the canvas blocks the stub carries are still sent (so the page re-enables its input and does not send a hidden continue turn).

**AC2:** Given a fresh chat page loaded in the browser against the test server, When ten seconds pass without any user action, Then the page has sent at most one stream request and its send button is enabled (no runaway continue chain).

**AC3:** Given the four specs `design-definition-canvas-render`, `ep2-s1-presence-sidebar`, `ep2-s2-stage-visibility` and `rdac-s1-resume-shows-diagrams-artefact-conversation`, When each is run alone and then together in core order, Then all of their tests pass (`ep2-s1` seeds the roster with the lpw-s4 helper and asserts on identity-string ids and the pod roles it adds).

**AC4:** Given the capability matrix, When the four specs pass, Then they leave `quarantined` with their reason removed; the specs that take under 30 seconds in total join the core lane and the slower one is lane extended; the matrix guards still pass and the core job's runtime grows by no more than about 30 seconds.

**AC5:** Given the diff, When read, Then product changes are limited to the test-mode stub in `src/web-ui/server.js`; nothing under `src/web-ui/public/`, `modules/`, `routes/` or `src/modules/` changes.

## Out of Scope

- Bounding the page's automatic "continue" turns, or changing which responses count as a finished turn (separate issue).
- The mock LLM gateway fixtures, or a real-model lane.
- The remaining quarantined specs (including `ep3-s1-regression`, tracked as #1042).

## NFRs

- **Security:** no change reachable outside `NODE_ENV=test`.
- **Reliability:** the four specs pass alone and in core order, twice.
- **Runtime:** see AC4.

## Complexity Rating

**Rating:** 1 - the cause is one stub line; the rest is one spec's roster step and the matrix.
**Scope stability:** Stable
