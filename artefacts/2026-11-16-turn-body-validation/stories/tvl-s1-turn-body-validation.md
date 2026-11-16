## Story: Reject malformed, empty and oversized skill turns before they reach the model

**Epic reference:** None - short-track (bounded defect found by a staging test session, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: the staging write-test session of 2026-11-16 (this session): on `POST /api/skills/discovery/sessions/<id>/turn` and `/turn-stream`, a malformed JSON body, an empty answer, a number, `null`, `{}`, a text/plain body, a 2 MB answer and a wrong skill name in the URL all returned 200 and ran a full model turn (the response carries `usage`). Staging uses the mock model so it cost nothing; production has no mock gateway, so each is a real model call and a credit deduction.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [web-ui]

## User Story

As **the operator paying for model calls**,
I want **a skill turn with a broken, empty or oversized body to be refused with a clear error before any model call**,
So that **mistakes and abuse by a signed-in user cost nothing, and the chat page can tell the person what was wrong**.

## Benefit Linkage

**Metric moved:** None formal - short-track convention. Removes avoidable model spend and credit deductions, and an unbounded request-body read, from the two turn endpoints.
**How:** `handlePostTurnHtml` and `handlePostTurnStreamHtml` read the body with `_readBody`, which turns any parse failure into `null` and then substitutes an empty answer; they never validate the type, emptiness or size, and the skill name in the URL is ignored in favour of the session's. This story adds one shared validation step, after the session is found and before any journey lock, credit deduction or model call.

## Architecture Constraints

- **Order of checks:** (1) authentication and viewer/credits guards, unchanged (in `server.js`); (2) unknown session answers 404 `{"error":"Session not found"}` exactly as today; (3) the body is read with a size limit and validated; (4) only then the journey `turnInProgress` lock is taken, credits are deducted after success exactly as today, and the model is called. A validation failure must never leave `turnInProgress` set.
- **Validation rules:** the body must parse as a JSON object (not an array, number, string or `null`) else 400 `{"error":"INVALID_BODY"}`; `answer` must be a string else 400 `{"error":"INVALID_ANSWER"}`; a string that is empty or only whitespace is also `INVALID_ANSWER`, except the literal `__init__` which the page sends to start a session; an answer over 100000 characters is 413 `{"error":"ANSWER_TOO_LARGE"}`; the raw body is read up to 262144 bytes and a larger body is 413 `{"error":"ANSWER_TOO_LARGE"}` without buffering the rest; the skill name in the URL must equal the session's own `skillName` (when the session has one) else 404 `{"error":"Session not found"}`.
- **JSON errors, not pages:** both endpoints already answer JSON; the streaming endpoint must answer these errors as plain JSON before it sends any SSE headers.
- **Unchanged:** the request shape the page sends (`{answer, attemptId}`), `__init__`, every valid turn, credits deduction on success, the 401 and 404 answers, and the response bodies.
- **Existing helper kept:** `_readBody` stays as is for every other route; the new limited reader is used only by these two handlers and honours a pre-parsed `req.body` the way `_readBody` does (tests).
- **No error reports for 4xx** (they are client mistakes, not server errors); one log line per rejection with no body content.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; ADR-025 (tenant isolation) not engaged; no other Active ADR engaged.
- **Zero new npm dependencies.**

## Dependencies

- **Upstream:** mfc.1 (the turn endpoints), lab-s3.3 (credits), ecg-s1. All merged.
- **Related:** `sub-s1` (the legacy `/answer` route is unwired) and `cpv-s1` (commit-preview for an unknown session), both separate.

## Acceptance Criteria

**AC1:** Given a signed-in request to `/turn`, When the body is malformed JSON, empty, a JSON array, a number, a string or `null`, Then the response is 400 `{"error":"INVALID_BODY"}`, no model call is made, no credits are deducted, and the journey's `turnInProgress` is not left set.

**AC2:** Given a JSON object body, When `answer` is missing, not a string, empty or only whitespace, Then the response is 400 `{"error":"INVALID_ANSWER"}` with the same no-model, no-credit and no-lock guarantees; and the literal answer `__init__` is still accepted.

**AC3:** Given an answer longer than 100000 characters, or a request body larger than 262144 bytes, When the request is made, Then the response is 413 `{"error":"ANSWER_TOO_LARGE"}`, no model call is made, and the body reader stops buffering at the limit.

**AC4:** Given a session whose skill is `discovery`, When the URL names a different skill (including `not-a-skill` and a traversal-shaped name), Then the response is 404 `{"error":"Session not found"}` and no model call is made.

**AC5:** Given the same inputs as AC1 to AC4 on `/turn-stream`, When the request is made, Then each is answered with the same status and JSON body before any SSE headers are sent.

**AC6:** Given a valid answer (an ordinary sentence, one with unicode, one of exactly 100000 characters, and `__init__`), When the request is made on either endpoint, Then it behaves exactly as before (200 or SSE stream, credits deducted on success), and every existing turn test passes unchanged.

**AC7:** Given any rejection above, When it happens, Then no error report is sent and nothing is logged beyond one line with the status and reason code.

**AC8 (live, staging, mock model):** Given a signed-in staging session, When the garbage set from the 2026-11-16 test session is replayed (malformed JSON, empty answer, number, 200 KB and 2 MB answers, wrong skill name), Then each is 400, 413 or 404 as above, and a normal answer still returns 200. Evidence class `production-observed` (staging); read-only effect on staging state.

## Out of Scope

- Rate limiting per user, token counting before the call, and spend caps.
- The legacy `/answer` route (`sub-s1`), commit-preview (`cpv-s1`), and the journey-level turn endpoints.
- Changing what the model receives, the response shape, or the page's own error display.
- Rejecting overly long but valid answers below the limit; the limit is a safety bound, not a product rule.

## NFRs

- **Cost and safety:** a rejected request costs no model call, no credits, and bounded memory (at most 256 KB buffered).
- **Security:** the error bodies are fixed strings; the input is never echoed.
- **Reliability:** validation never throws; a rejected request never leaves the journey locked.
- **Performance:** one extra length and type check.

## Complexity Rating

**Rating:** 2 - two handlers share one validation step; the lock ordering and the existing ~30 turn tests need care.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic
