# Story: Streaming turn endpoint must block a new attemptId while any turn is already in-flight, not just a matching one

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the real, live-confirmed production incident below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As an **operator submitting a long-running skill turn (e.g. `/review` on a large feature) whose SSE connection drops mid-generation**,
I want **a retry (automatic or manual) to never start a second, independent, fully-billed LLM generation while the original is still running**,
So that **I am not charged twice (API cost and credit balance) for one logical turn, and the saved artefact is not silently overwritten by whichever of two concurrent generations happens to finish last**.

## Benefit Linkage

**Metric moved:** None formally tracked — this is a short-track correctness/cost-safety fix, not a metric-bearing feature. Direct benefit: eliminates a real, live-confirmed defect. Investigated live on 2026-10-06/07 after the operator reported hitting a generic chat-turn error during `/review`; Fly logs and PostHog's `$ai_generation` events jointly confirmed two independent ~100-second Claude generations ran concurrently for the same logical `/review` turn on feature `2026-10-05-customer-journey-as-first-class` (141.9s/$0.436 and 100.8s/$0.1095, near-identical token counts), both completed successfully, and the second one's output silently overwrote the first's already-`artefact_auto_saved` `review.md` via `artefact_auto_amended` roughly a minute later — with no indication to the operator that this happened.
**How:** Closing the gap that let the second generation start at all removes the duplicate cost, the duplicate credit deduction, and the data-corruption risk in one fix, for every future occurrence of this connection-drop pattern — not just this one incident.

## Architecture Constraints

**Root cause, fully confirmed (not speculative) — read directly and cross-checked against live production logs/PostHog, not guessed:**
- `src/web-ui/routes/skills.js`'s `handlePostTurnStreamHtml()` (the real handler behind the browser chat UI's `/api/skills/:name/sessions/:id/turn-stream` endpoint — confirmed via `STREAM_URL = TURN_URL + "-stream"` in the generated client script) already has an idempotent-reconnect guard (`srar-s1`, `artefacts/2026-09-01-sse-reconnect-on-resume/`), explicitly written to handle "Fly's `auto_stop_machines='suspend'` can freeze a genuinely in-flight request mid-turn" (per its own code comment).
- The guard's flaw: it only short-circuits when the incoming request's `attemptId` **exactly matches** `session._lastAttempt.attemptId` (lines ~4948-4966 as of this story). A genuinely **different** `attemptId` — e.g. a manual resubmit after the client's own single automatic retry (which reuses the same `attemptId`, per `srar-s1`'s own client-side logic at `skills.js:4096-4101`) has already failed once — sails straight past the match check entirely and is treated as a brand-new, independent turn. `session._lastAttempt` is a single shared mutable slot; the new attemptId's request unconditionally overwrites it (line ~4965), so once this happens the server has no further record that the *original* attempt is still running.
- Confirmed live via `flyctl logs --app skills-framework` (2026-10-07, correlated against PostHog's `$ai_generation` events for trace_id `1f268337-0b3c-445e-a0a7-6553011e9876`): turn `51845db7` opened 07:25:16, client disconnected 07:25:24 (8.8s in); turn `81d0cb15` — a **different** `attemptId` — opened 07:26:31 and disconnected 07:26:36 (5s in); turn `51845db7`'s own generation (the original) finally completed server-side at 07:27:11 (115.2s total, `artefact_auto_saved`); turn `81d0cb15`'s own generation **also** completed independently at 07:28:12 (100.8s total, `artefact_auto_amended` — overwriting the first's save). Both generations were billed via `$ai_generation` (confirmed in PostHog: `$ai_total_cost_usd` 0.436 and 0.1095) and both reached the post-turn credit-deduction step (`TURN_CREDIT_COST`, `skills.js:5400-5403`), so the tenant's credit balance was debited twice for one logical turn.

**"Check this doesn't occur elsewhere" — full audit performed, not assumed:**
1. **Every SSE-producing endpoint in this codebase was enumerated** (`grep -rl "text/event-stream" src/web-ui`): exactly two files, `routes/skills.js` and `routes/journey.js`. `journey.js`'s two SSE endpoints (`handleGetJourneyPresenceStream`, the artefact-merge-broadcast subscribe handler) are pure read/broadcast — periodic presence polling and a pub/sub subscription to already-computed merge events. Neither triggers an LLM call, a credit deduction, or an artefact write; a duplicate subscription is naturally idempotent (two redundant read streams, no cost, no corruption risk). **No equivalent fix needed there.**
2. **The second, non-streaming turn-submission code path was checked**: `handlePostTurnHtml()` (routes/skills.js:4792, routed at `/api/skills/:name/sessions/:id/turn`, confirmed NOT the path the real browser chat UI calls — that's `/turn-stream`). This handler already uses a **different, more robust** pattern: a `journey.turnInProgress` boolean flag, checked and set *before* any work starts, returning a clean HTTP 409 "Turn already in progress" for a concurrent call — regardless of any attemptId matching. **This handler is not vulnerable to the bug this story fixes and needs no change.** It is in fact the better-designed precedent this story's fix (broadening the in-flight check to apply regardless of attemptId) brings the streaming handler in line with, in spirit.
3. **`session._lastAttempt` usage was confirmed to exist in exactly one place** (`grep -n "_lastAttempt" src/web-ui/routes/skills.js`): the guard this story fixes, plus its own two "mark complete" call sites within the same function. Not duplicated or copy-pasted elsewhere.

**Scope decision — broaden the existing guard, do not redesign the retry architecture:** The fix changes the in-flight branch of the existing `srar-s1` guard to check `session._lastAttempt.status === 'in-flight'` (and non-stale) **regardless of whether the incoming `attemptId` matches** — rather than only when it matches. The "already complete, same attemptId → resumed:true" branch is unchanged (it correctly still requires an exact match, since it means "you're asking about a turn that already finished"). This is the minimal change that closes the gap; a full redesign (e.g. actually waiting for and relaying the original generation's result to a reconnecting client, rather than telling it to wait and retry) is a larger UX improvement explicitly out of scope here.

## Dependencies

- **Upstream:** `srar-s1` (`artefacts/2026-09-01-sse-reconnect-on-resume/`) — merged; this story fixes a gap in that story's own guard, does not replace it.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a session has an in-flight attempt (`_lastAttempt.status === 'in-flight'`, started <60s ago) for attemptId A, When a turn request arrives carrying a **different** attemptId B, Then the LLM executor is NOT called for request B, the client receives the existing `{ error: 'This turn is still processing — please wait a moment and try again.' }` event, and `session._lastAttempt` still reflects attemptId A's in-flight state afterward (not overwritten by B).

**AC2:** Given a session's in-flight attempt is stale (≥60s old), When a turn request arrives with a different attemptId, Then it proceeds as a fresh attempt exactly as before this fix (regression guard — the staleness fallback is unchanged).

**AC3:** Given the existing `tests/check-srar-s1-idempotent-turn-reconnect.js` suite (same-attemptId resume/duplicate/in-flight/stale/no-attemptId cases, 5 AC groups), When this fix is applied, Then every existing test in that file still passes unmodified.

**AC4:** Given the full SSE-endpoint and turn-submission-path audit performed for this story (see Architecture Constraints), When checking whether the same duplicate-concurrent-billable-work defect class exists anywhere else in this codebase, Then it is confirmed to exist in exactly one place (the guard fixed by this story) — `journey.js`'s SSE endpoints do no billable work and `handlePostTurnHtml`'s separate `turnInProgress` guard is already correct — with no further code change required.

## Out of Scope

- Redesigning the retry architecture so a reconnecting client receives/awaits the *original* in-flight generation's eventual result, rather than being told to wait and resubmit later — a larger UX improvement, not required to close the cost/correctness defect itself.
- The separate `review_split_verdict_unparseable`/`review_split_incomplete` parsing gap observed in the same incident's logs (story `ep1-s2`'s verdict failed to parse during the review-artefact split) — a different code path (`review-artefact-splitter.js`), not confirmed to be caused by this story's own bug, logged separately as its own gap signal.
- Any change to the 60-second staleness threshold, the keepalive interval, or `fly.toml`'s `auto_stop_machines` setting — none of those are the defect; the defect is that a second, different attemptId was never checked against an existing in-flight one at all.

## NFRs

- **Performance:** Positive — this fix *reduces* load (prevents a wasted concurrent ~100s LLM call) rather than adding any new work on the normal-path.
- **Security:** None identified — no new input surface; the guard change only tightens an existing concurrency check.
- **Accessibility:** N/A — no UI change; the existing "still processing" message text is unchanged.
- **Audit/Cost:** Directly addresses a real cost-and-credit-correctness gap (duplicate `$ai_generation` billing and duplicate `TURN_CREDIT_COST` deduction for one logical turn) — this IS the audit/cost fix.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->
