## Story: Guard the initial-turn auto-fire so viewing an already-completed session can never re-execute or re-mutate it

**Epic reference:** None — short-track (bug fix, found via live Chrome-browser exploration of the operator's real kanban board while trialling `rubber-duck-review-capture`)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator viewing an already-completed skill session** (via a resumed conversation, a kanban card, or any other read-only navigation path),
I want **opening that page to be a true no-op**,
So that **a GET-driven page view can never silently trigger a real model call, append a new turn, or change the session's artefact/completion state underneath me**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — found live on `wuce-staging.fly.dev`'s real `skills-framework` product board (2026-08-09): merely opening (GET, no answer submitted) the chat session for a completed journey card silently changed its board state from "no artefacts yet / not ready to advance" to "1 artefact / ready to advance" between two page loads, with a never-opened sibling card confirmed unchanged as a control. Root-caused via code inspection to two layers of the same flawed invariant ("`turns` array is empty" used as a proxy for "this is a fresh session"), both in `src/web-ui/routes/skills.js`.

**How:** Client-side, `_renderChatPage`'s emitted script (~line 2675) auto-fires `sendTurn("__init__")` whenever `thread.children.length === 0` — a DOM proxy that is only ever zero, in the real turn-execution flow, for a genuinely fresh session (because `session.done` is always set in the same code path that pushes the final assistant turn — see `htmlSubmitTurn`, ~line 2283/2286 — so a real done session never renders an empty thread). But a session seeded directly with `done: true` + `artefactContent` + an empty `turns: []` (a canned fixture, or any resume path that fails to restore `turns` while `done` restores fine) renders zero chat messages, so the browser wrongly concludes "fresh session" and fires the init turn for real. Server-side, `handlePostTurnStreamHtml`'s `_isInitialTurn` check (~line 4314) has the identical gap: `rawAnswer === '__init__' && session.turns.length === 0`, with no `session.done` guard at all — so even a direct API call (not just the browser auto-fire) re-runs the "Begin the session…" opening prompt against an already-completed session, re-executing the artefact-extraction logic that can re-set `session.done`/`artefactContent`. The non-streaming twin (`handlePostTurnHtml` → `htmlSubmitTurn`) has no `__init__`/done guard whatsoever — it treats `__init__` as a literal user answer and always calls the executor.

## Architecture Constraints

- **No new adapter or D37 concern** — this is a guard-clause fix inside two existing handler functions, not a new injectable dependency.
- **The fix must be a true no-op for an already-done session**, not merely "suppress the client-side auto-fire." A guard that only stops the browser's automatic call still leaves the server-side endpoints exploitable by a direct API call (e.g. `curl -X POST .../turn-stream -d '{"answer":"__init__"}'` against a done session's ID) — both the client heuristic (AC4/AC5) and the server-side handlers (AC1/AC2/AC3) must be fixed, not just one layer.
- **Must not change any existing behaviour for a genuinely fresh or genuinely in-progress session.** The only behavioural change is: `__init__` arriving for a session where `session.done === true` now does nothing instead of re-executing.
- **When the no-op guard triggers, the response/stream shape must still be valid** — the streaming endpoint must still emit a well-formed terminal `data: {...}` event (echoing the existing `done: true` / `artefactContent`) so client-side code that awaits a response doesn't hang or error; it must simply not call the executor or mutate session state to get there.

## Dependencies

- **Upstream:** None (this fixes already-shipped, already-merged model-first chat session code, `mfc.1` onward).
- **Downstream:** None known. Loosely related to (but not proven identical to) the operator's separately-reported "SSE stream doesn't load after resuming a conversation" signal (`workspace/capture-log.md`, 2026-08-09) — that symptom goes through the submit path rather than this auto-fire-on-load path, so it is not assumed fixed by this story; if it persists after this fix ships, it needs its own separate investigation.

## Acceptance Criteria

**AC1:** Given a session where `session.done === true`, When `POST /api/skills/:name/sessions/:id/turn-stream` is called with `answer: "__init__"`, Then the handler does not call the skill-turn executor, does not push any new turn onto `session.turns`, and does not modify `session.artefactContent` or `session.done` — it immediately streams back the session's existing, unchanged completion state (`done: true`, the existing `artefactContent`) and closes the stream.

**AC2:** Given the same already-done scenario, When `POST /api/skills/:name/sessions/:id/turn` (the non-streaming endpoint) is called with `answer: "__init__"`, Then the identical no-op guard applies — no turn pushed, no executor call, the existing `{ done: true, artefactContent }` state returned unchanged.

**AC3:** Given a session where `session.done` is falsy and `session.turns.length === 0` (a genuinely fresh session), When `__init__` arrives on either endpoint, Then today's existing initial-turn behaviour is completely unchanged — this is a regression guard, not a new capability.

**AC4:** Given the server renders the chat page for a session where `session.done === true`, When the page's client-side script runs, Then a new `SESSION_DONE` flag (rendered from `session.done`, alongside the existing `IS_IDEATE`/`SUPPORTS_CANVAS` flags) suppresses the `sendTurn("__init__")` auto-fire entirely, regardless of how many chat messages the server happened to render into `#chat-messages`.

**AC5:** Given a session where `session.done` is falsy and the server rendered zero chat messages (a genuinely fresh session), When the page loads, Then the auto-fire still fires exactly as it does today — this is a regression guard on the client-side change, not a new capability.

## Out of Scope

- **Investigating or fixing the operator's separately-reported "SSE doesn't load after resume" signal.** Related territory (same file, same general auto-fire/turn-stream mechanism) but a distinct symptom on the submit path, not proven to share this exact root cause — needs its own investigation if it persists after this ships.
- **Cleaning up the leaked `bri-s3.1` mock-fixture card itself** (`new-feature-f3765c1a` on the real `skills-framework` board) — a separate data-hygiene action (candidate: `DELETE /api/journey/:journeyId`, `alrf-s10`), not a code change this story should bundle in.
- **Changing how `session.turns` restoration works on resume** (`_getSessionOrRestore`/Redis merge logic) — this story guards against the *consequence* of an empty-turns-but-done session regardless of how it arose (canned fixture, restore gap, or anything else), rather than auditing every path that could produce that shape.

## NFRs

- **Security / integrity:** Closes a real state-mutation-via-view class of gap — a read-only navigation action (opening a page, or an idempotent-looking `__init__` API call) must never be able to trigger a write-side effect (new model call, new turn, changed artefact/completion state). This is the specific property both AC1/AC2's no-op guard and AC4's client-side suppression exist to guarantee.
- **Cost:** Prevents wasted LLM/mock-gateway spend from spurious re-execution of the opening prompt against sessions that are already complete — directly relevant given this session's own earlier finding about uncontrolled mock-gateway/real-token cost exposure.
- **Performance:** Negligible — an early-return guard-clause check, not a new I/O path.

## Complexity Rating

**Rating:** 2 — the fix itself is a small guard clause in two places, but correctly reasoning about *what* the no-op response should look like (a valid terminal SSE event with the pre-existing state, not silence or an error) requires care, and both a client-side and two server-side call sites must be covered for the fix to actually be exploit-proof rather than merely hiding the symptom in the browser.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
