# Implementation Plan: pla-s2 — Emit $ai_generation events and wire identity/group analytics

**Date:** 2026-07-04
**Branch:** worktree-agent-af7ed7ac72ce10adf

## Tasks

1. Read and understand `_callAnthropic` in `skill-turn-executor.js` — resolves with plain `content` string; needs to change to `{ text, usage }` to match `_callAnthropicStream` convention.

2. Read `handlePostTurnStreamHtml` in `skills.js` — identify existing `skill_turn` capture at line ~4141, `_llmStart` at ~3798, `_ttfbMs` at ~3799, `_turnUsage` at ~3800, and executor call at ~3837. All variables already present; need to add `$ai_trace_id` to `skill_turn` and emit `$ai_generation` after.

3. Read `handlePostTurnHtml` in `skills.js` — calls `htmlSubmitTurn`; `htmlSubmitTurn` uses `response.match(...)` (string); needs update to handle `{ text, usage }` executor result shape.

4. Read journey lifecycle capture calls in `journey.js` — 4 calls: `journey_created` (~line 353), `stage_started` (~line 1218), `stage_completed` (~line 1720), `journey_completed` (~lines 1890, 1915). Each needs `{ company: req.session.tenantId }` groups arg.

5. Read `tests/check-wusl1-chat-streaming.js` and `tests/check-mfc1-model-first-chat-session.js` — confirmed: neither file asserts any `skill_turn` PostHog event shape. The `$ai_trace_id` addition is purely additive (NFR N3 confirmed).

6. Implement `_callAnthropic` change in `skill-turn-executor.js`:
   - Change `resolve(content)` to `resolve({ text: content, usage: { input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens, model } })`
   - `skillTurnExecutor` returns `_callAnthropic(...)` directly (no change needed — the returned promise now resolves with `{ text, usage }`)

7. Implement streaming `$ai_generation` + `$ai_trace_id` on `skill_turn` in `handlePostTurnStreamHtml`:
   - Add `$ai_trace_id: session.journeyId || sessionId` to existing `skill_turn` capture
   - After `skill_turn` capture, emit `$ai_generation` using `_llmStart`, `_ttfbMs`, `_turnUsage`

8. Implement non-streaming `$ai_generation` in `handlePostTurnHtml`:
   - Update `htmlSubmitTurn` to handle `{ text, usage }` executor result; return `usage` in result
   - Capture `_nonStreamStart = Date.now()` before `htmlSubmitTurn` call
   - Add `$ai_trace_id` to `skill_turn` capture
   - Emit `$ai_generation` if `result.usage` available

9. Implement `journey.js` `identify`/`groupIdentify` + groups param:
   - After `journey_created` capture, add `identify` and `groupIdentify` (gated on `req.session.login`)
   - Add `{ company: req.session.tenantId || (journey && journey.tenantId) }` as 4th arg to all 4 lifecycle captures

10. Write test file `tests/check-pla-s2-posthog-wiring.js` (27 tests)

11. Run tests — all 27 must pass: `node tests/check-pla-s2-posthog-wiring.js`

12. Run full `npm test` — no regressions

13. Walk AC verification script scenarios

14. Open draft PR

## Key design decisions

- `_callAnthropic` return shape matches `_callAnthropicStream`: `{ text, usage }` with model in usage
- `skillTurnExecutor` (public) now returns `{ text, usage }` for anthropic path (no explicit change needed — just stops extracting text)
- `htmlSubmitTurn` handles both string and `{ text, usage }` shapes from `_skillTurnExecutor` for forward/backward compat
- `_computeCostUsd` (already in scope as `_computeCostUsd` in `skills.js`) is used for `$ai_total_cost_usd`
- `$ai_generation` fires unconditionally on every non-empty LLM call (not gated by `!_isInitialTurn`)
- Fire-and-forget: no `await` on PostHog calls
- N1 fire-and-forget: `$ai_generation` is wrapped in try/catch to prevent PostHog failures from blocking SSE stream
