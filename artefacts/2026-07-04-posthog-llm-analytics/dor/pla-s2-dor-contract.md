# DoR Contract: pla-s2 — Emit $ai_generation events after Anthropic calls and wire identity and group analytics

**Date:** 2026-07-04
**Status:** Approved

---

## What will be built

**`src/modules/skill-turn-executor.js`:**
- Change `_callAnthropic()` to resolve with `{ text, usage }` instead of just `text`. Extract `usage` from the Anthropic JSON response body field `response.usage`: `{ input_tokens, output_tokens, cache_read_input_tokens, cache_creation_input_tokens }`. Map to internal naming: `{ input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens }` (matching the streaming path's existing convention).

**`src/web-ui/routes/skills.js` — streaming handler (`handlePostTurnStreamHtml`):**
- Add `$ai_trace_id: session.journeyId || sessionId` to the existing `skill_turn` PostHog capture call (AC2).
- After the streaming executor resolves with `{ text, usage }`, emit a `$ai_generation` PostHog event (AC3) using `_phStream.capture(login, '$ai_generation', props, { company: tenantId })` with all required properties from AC3.
- Gate `$ai_input` and `$ai_output_choices` behind `require('../modules/posthog-server').PRIVACY_MODE` (AC5).

**`src/web-ui/routes/skills.js` — non-streaming handler (`handlePostTurnHtml`):**
- After the non-streaming executor resolves with `{ text, usage }`, emit a `$ai_generation` PostHog event (AC4) with the same properties as AC3 except: no `$ai_time_to_first_token`, `$ai_stream: false`, token counts from `usage` returned by `_callAnthropic`.
- Gate `$ai_input` / `$ai_output_choices` behind `PRIVACY_MODE` (AC5).

**`src/web-ui/routes/journey.js` — journey creation route (`POST /api/journey`):**
- After creating the journey and setting session fields, call `_posthog.identify(login, { $set: { login, tenantId, role: req.session.role || 'user' } })` once (AC6).
- Call `_posthog.groupIdentify('company', tenantId, { name: tenantId })` once (AC7).

**`src/web-ui/routes/journey.js` — all four lifecycle event `capture()` calls:**
- `journey_created` (line ~353), `stage_started` (line ~1218), `stage_completed` (line ~1720), `journey_completed` (lines ~1890 and ~1915): add `{ company: req.session.tenantId || journey.tenantId }` as the `groups` 4th argument to each `_posthog.capture()` call (AC8). Use the `groups` parameter added to `capture()` by pla-s1.

**`tests/check-pla-s2-posthog-wiring.js`:** New test file (27 tests), added to `npm test` chain.

## What will NOT be built

- `$ai_span` events (Group D from the instrumentation plan) — deferred.
- `captureException` call sites for LLM error handlers (Group E) — deferred.
- Frontend `posthog.group()` calls (Group F) — separate story.
- `$ai_stop_reason` on `$ai_generation` — deferred (review 1-L1 note).
- Any changes to the Copilot (`_callCopilotStream`, `_callCopilot`) paths — Anthropic only.
- Any change to `posthog-server.js` itself — pla-s1 owns that file.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1: _callAnthropic returns usage | Integration I-NS-1: https mock → skillTurnExecutor → assert resolved object includes usage fields | integration |
| AC2: skill_turn gains $ai_trace_id | Unit S1: streaming adapter mock; assert skill_turn capture includes $ai_trace_id = journeyId | unit |
| AC3: streaming $ai_generation all properties | Unit S2-a through S2-e (5 sub-groups); integration I-STREAM-1 | unit + integration |
| AC4: non-streaming $ai_generation (no ttft, stream:false) | Unit S3-a through S3-d (4 sub-groups); integration I-NS-1 | unit + integration |
| AC5: PRIVACY_MODE → no $ai_input / $ai_output_choices | Unit P1, P2 (one per path) | unit |
| AC6: journey created → identify() called once with correct args | Unit J1, J2, J3 | unit |
| AC7: journey created → groupIdentify() called once | Unit J4, J5 | unit |
| AC8a: journey_created includes $groups | Unit G1: fresh-require journey; trigger handler; assert capture groups param | unit |
| AC8b: stage_started includes $groups | Unit G2: same pattern | unit |
| AC8c: stage_completed includes $groups | Unit G3: same pattern | unit |
| AC8d: journey_completed includes $groups | Unit G4: same pattern | unit |

## Assumptions

- pla-s1 is DoD-complete before implementation begins. `posthog-server.js` exports `identify`, `groupIdentify`, `PRIVACY_MODE`, and the updated `capture()` with groups param.
- `_computeCostUsd()` and `_SKILL_PRICING` are already imported in `skills.js` scope — no re-import needed.
- `crypto.randomUUID()` is available (Node.js ≥14.17) — no polyfill needed.
- The existing `_phStream` and `_phTurn` inline requires in `handlePostTurnStreamHtml`/`handlePostTurnHtml` will pick up the updated `posthog-server.js` module from the require cache. No adapter injection needed for production wiring.
- `req.session.tenantId` is populated at the point all route handlers fire — confirmed by existing `journey_created` event which already uses it.
- `journey.js` uses `_posthog = require('../modules/posthog-server')` at module load time (line 84) — the mock injection pattern (fresh-require after cache injection) is sufficient for test isolation.

## Estimated touch points

- **Files:** `src/modules/skill-turn-executor.js`, `src/web-ui/routes/skills.js`, `src/web-ui/routes/journey.js`, `tests/check-pla-s2-posthog-wiring.js`, `package.json`
- **Services:** None
- **APIs:** PostHog (mocked in tests); Anthropic (mocked in tests via https mock or injectable adapter)

## schemaDepends

| Field | Source |
|-------|--------|
| pla-s1 DoD-complete | pla-s1 must be DoD before this story begins implementation |

No `pipeline-state.schema.json` field dependency — this story does not extend the pipeline state schema.
