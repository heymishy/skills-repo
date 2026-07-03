# Technical Test Plan: pla-s2 — Emit $ai_generation events after Anthropic calls and wire identity and group analytics

**Story reference:** artefacts/2026-07-04-posthog-llm-analytics/stories/pla-s2.md
**Review:** PASS — artefacts/2026-07-04-posthog-llm-analytics/review/pla-s2-review-1.md (0 HIGH, 3 MEDIUM)
**Date:** 2026-07-04
**Test runner:** `node tests/check-pla-s2-posthog-wiring.js` (added to `npm test` script in package.json)
**Framework:** Vanilla Node.js `assert` module, custom `test()` harness

---

## Review finding resolutions

The three MEDIUM findings from pla-s2-review-1.md are addressed in this plan as follows:

- **1-M1 (AC1, AC3, AC4, AC5 missing explicit "When" clause):** All test case descriptions in this plan use explicit Given/When/Then structure. Test case names use the verb-trigger form ("When X occurs, Then Y") to make the trigger action unambiguous.
- **1-M2 (AC3 and AC4 compound assertions):** AC3 and AC4 are each decomposed into five and four named sub-assertion groups respectively. Each group has its own `test()` call so a failure names the broken property group, not just "AC3 failed".
- **1-M3 (AC8 "any of" construct):** AC8 is decomposed into four separate `test()` calls — one per event type (`journey_created`, `stage_started`, `stage_completed`, `journey_completed`). All four must pass.

---

## Test Data Strategy

**Strategy:** Synthetic — all external calls intercepted via require cache injection and injectable adapter stubs; no real PostHog, no real Anthropic API, no real database calls.

**Test data is:** Self-contained — tests generate their own session objects, fake usage data, and mock responses.

**Sensitive data:** None. All keys and tokens are synthetic strings like `'test-ph-key'`, `'alice'`, `'acme'`.

### Mocking strategy

**posthog-server.js mock** (used across all tests):

Inject a spy into the require cache before requiring the route modules. The spy records all calls to `capture`, `identify`, and `groupIdentify`:

```js
var _phCalls = { capture: [], identify: [], groupIdentify: [] };
var mockPosthog = {
  PRIVACY_MODE: false,
  capture: function(id, event, props, groups) {
    _phCalls.capture.push({ id: id, event: event, props: props || {}, groups: groups });
  },
  identify: function(id, props) { _phCalls.identify.push({ id: id, props: props }); },
  groupIdentify: function(type, key, props) { _phCalls.groupIdentify.push({ type: type, key: key, props: props }); }
};
require.cache[require.resolve('../src/web-ui/modules/posthog-server')] = {
  id: require.resolve('../src/web-ui/modules/posthog-server'),
  filename: require.resolve('../src/web-ui/modules/posthog-server'),
  loaded: true, exports: mockPosthog
};
```

Reset `_phCalls = { capture: [], identify: [], groupIdentify: [] }` at the start of each test.

**Anthropic HTTP mock for _callAnthropic non-streaming (AC1, AC4):**

The non-streaming executor is injectable via `setSkillTurnExecutorAdapter(fn)` in `src/web-ui/routes/skills.js`. Use a mock adapter that returns `{ text: 'response text', usage: { input_tokens: 100, output_tokens: 50, cache_read_tokens: 20, cache_creation_tokens: 5, model: 'claude-sonnet-4.6' } }`.

**Anthropic SSE mock for _callAnthropicStream (AC2, AC3):**

The streaming executor is injectable via `setSkillTurnExecutorStreamAdapter(fn)` in `src/web-ui/routes/skills.js`. Use a mock adapter that:
1. Calls `onFirstChunk(120)` (simulates 120ms time to first token)
2. Calls `onChunk('response text')`
3. Resolves with `{ text: 'response text', usage: { input_tokens: 100, output_tokens: 50, cache_read_tokens: 20, cache_creation_tokens: 5, model: 'claude-sonnet-4.6' } }`

**journey.js posthog injection:** `journey.js` requires posthog-server.js at module load time (line 84). Inject the mock into the require cache, then fresh-require journey.js for each test group:

```js
function freshRequireJourney() {
  delete require.cache[require.resolve('../src/web-ui/routes/journey')];
  return require('../src/web-ui/routes/journey');
}
```

**AC1 test approach note:** `_callAnthropic` in `skill-turn-executor.js` is a private function (not exported). AC1 is verified through integration with AC4: by confirming that the `$ai_generation` event on the non-streaming path contains the correct token counts, we implicitly verify that `_callAnthropic` now returns `usage`. A separate direct unit test of `_callAnthropic` would require exporting it — this plan opts for integration coverage to avoid adding test-only exports.

---

## AC Coverage Table

| AC | Description | Test type | Tests |
|----|-------------|-----------|-------|
| AC1 | _callAnthropic returns object with usage field | Integration | via AC4 (I-NS-1 to I-NS-2) |
| AC2 | skill_turn event on streaming path gains $ai_trace_id | Unit | S1 |
| AC3 | streaming path $ai_generation has all required properties | Unit | S2-a through S2-e (5 sub-groups) |
| AC4 | non-streaming path $ai_generation has all required properties (no ttft, stream:false) | Unit | S3-a through S3-d (4 sub-groups) |
| AC5 | PRIVACY_MODE=true → $ai_generation excludes $ai_input and $ai_output_choices | Unit | P1, P2 |
| AC6 | journey created → posthog.identify called once with correct args | Unit | J1, J2, J3 |
| AC7 | journey created → posthog.groupIdentify called once with correct args | Unit | J4, J5 |
| AC8a | journey_created event includes $groups.company | Unit | G1 |
| AC8b | stage_started event includes $groups.company | Unit | G2 |
| AC8c | stage_completed event includes $groups.company | Unit | G3 |
| AC8d | journey_completed event includes $groups.company | Unit | G4 |
| NFR-PERF | PostHog failure does not block SSE stream or response | NFR | N1 |
| NFR-CORRECTNESS | $ai_total_cost_usd uses _computeCostUsd(), not inline arithmetic | NFR | N2 |
| NFR-COMPAT | adding $ai_trace_id to skill_turn does not break existing assertions | NFR | N3 |

---

## Unit Tests

### skill_turn event (AC2)

**S1 — When a streaming skill turn completes, the skill_turn PostHog event includes $ai_trace_id**
- **Given:** posthog mock installed; streaming executor mock installed; `req.session = { login: 'alice', tenantId: 'acme', role: 'user', journeyId: 'journey-123' }`; `sessionId = 'sess-abc'`
- **When:** `handlePostTurnStreamHtml` completes successfully
- **Then:** `_phCalls.capture` contains an entry with `event === 'skill_turn'`; that entry's `props.$ai_trace_id` equals `'journey-123'` (the journeyId)
- **Edge case:** When `session.journeyId` is absent, `$ai_trace_id` equals `sessionId`

---

### $ai_generation — streaming path (AC3) — 5 sub-groups

**S2-a — streaming $ai_generation: trace identity properties**
- **Given:** same session as S1; streaming executor mock with usage; posthog mock
- **When:** `handlePostTurnStreamHtml` completes
- **Then:** `_phCalls.capture` contains an entry with `event === '$ai_generation'`; `props.$ai_trace_id === 'journey-123'`; `props.$ai_session_id === 'alice-journey-123'`; `typeof props.$ai_span_id === 'string' && props.$ai_span_id.length > 0`
- **Why separate:** If trace identity is wrong, other sub-group failures are misleading

**S2-b — streaming $ai_generation: model and provider properties**
- **Given:** same as S2-a
- **When:** `handlePostTurnStreamHtml` completes
- **Then:** `props.$ai_model === 'claude-sonnet-4.6'`; `props.$ai_provider === 'anthropic'`

**S2-c — streaming $ai_generation: token count properties**
- **Given:** executor mock resolves with `usage: { input_tokens: 100, output_tokens: 50, cache_read_tokens: 20, cache_creation_tokens: 5, model: 'claude-sonnet-4.6' }`
- **When:** `handlePostTurnStreamHtml` completes
- **Then:** `props.$ai_input_tokens === 100`; `props.$ai_output_tokens === 50`; `props.$ai_cache_read_input_tokens === 20`; `props.$ai_cache_creation_input_tokens === 5`
- **Why separate:** Token count bugs would not be surfaced if this was combined with S2-a

**S2-d — streaming $ai_generation: latency and timing properties**
- **Given:** executor mock calls `onFirstChunk(120)` (120ms ttft); turn completes after ~50ms total
- **When:** `handlePostTurnStreamHtml` completes
- **Then:** `typeof props.$ai_latency === 'number' && props.$ai_latency > 0`; `typeof props.$ai_time_to_first_token === 'number' && props.$ai_time_to_first_token > 0`; `props.$ai_stream === true`

**S2-e — streaming $ai_generation: cost and attribution properties**
- **Given:** same session as S2-a; executor mock with usage
- **When:** `handlePostTurnStreamHtml` completes
- **Then:** `typeof props.$ai_total_cost_usd === 'number' && props.$ai_total_cost_usd >= 0`; `props.role === 'user'`; `props.$groups` deep-equals `{ company: 'acme' }`
- **Edge case:** When `req.session.role` is absent, `role` defaults to `'user'`

---

### $ai_generation — non-streaming path (AC4) — 4 sub-groups

Note: AC4 is tested via integration (see Integration Tests below), which also covers AC1. The unit sub-groups below verify the discrete property expectations using a mock adapter for `skillTurnExecutor`.

**S3-a — non-streaming $ai_generation: trace identity properties**
- **Given:** posthog mock; non-streaming executor mock returning `{ text, usage }`; `req.session = { login: 'alice', tenantId: 'acme', role: 'admin', journeyId: 'journey-456' }`
- **When:** `handlePostTurnHtml` completes
- **Then:** `$ai_generation` event captured; `props.$ai_trace_id === 'journey-456'`; `props.$ai_session_id === 'alice-journey-456'`; `typeof props.$ai_span_id === 'string'`

**S3-b — non-streaming $ai_generation: token count properties**
- **Given:** executor mock returns `usage: { input_tokens: 200, output_tokens: 80, cache_read_tokens: 0, cache_creation_tokens: 10, model: 'claude-sonnet-4.6' }`
- **When:** `handlePostTurnHtml` completes
- **Then:** `props.$ai_input_tokens === 200`; `props.$ai_output_tokens === 80`; `props.$ai_cache_read_input_tokens === 0`; `props.$ai_cache_creation_input_tokens === 10`

**S3-c — non-streaming $ai_generation: stream flag and no ttft**
- **Given:** same as S3-a
- **When:** `handlePostTurnHtml` completes
- **Then:** `props.$ai_stream === false`; `'$ai_time_to_first_token' in props === false`

**S3-d — non-streaming $ai_generation: cost and attribution properties**
- **Given:** same session as S3-a; executor mock with usage
- **When:** `handlePostTurnHtml` completes
- **Then:** `typeof props.$ai_total_cost_usd === 'number'`; `props.role === 'admin'`; `props.$groups` deep-equals `{ company: 'acme' }`

---

### Privacy mode (AC5)

**P1 — When PRIVACY_MODE is true, streaming $ai_generation excludes $ai_input and $ai_output_choices**
- **Given:** `mockPosthog.PRIVACY_MODE = true`; streaming executor mock; same session
- **When:** `handlePostTurnStreamHtml` completes
- **Then:** `_phCalls.capture` has a `$ai_generation` entry; `'$ai_input' in props === false`; `'$ai_output_choices' in props === false`

**P2 — When PRIVACY_MODE is true, non-streaming $ai_generation excludes $ai_input and $ai_output_choices**
- **Given:** `mockPosthog.PRIVACY_MODE = true`; non-streaming executor mock; same session
- **When:** `handlePostTurnHtml` completes
- **Then:** Same assertions as P1 on the non-streaming path

---

### Journey created — identify and groupIdentify (AC6, AC7)

**J1 — When a new journey is created with a logged-in user, posthog.identify is called once**
- **Given:** posthog mock; `req.session = { login: 'alice', tenantId: 'acme', role: 'user' }`; journey route fresh-required with posthog mock in cache; mock journey store returning a new journeyId
- **When:** `POST /api/journey` handler succeeds
- **Then:** `_phCalls.identify.length === 1`

**J2 — posthog.identify is called with the correct login and $set properties (AC6)**
- **Given:** same as J1
- **When:** `POST /api/journey` handler succeeds
- **Then:** `_phCalls.identify[0].id === 'alice'`; `_phCalls.identify[0].props.$set` deep-includes `{ login: 'alice', tenantId: 'acme', role: 'user' }`

**J3 — posthog.identify uses role default 'user' when req.session.role is absent**
- **Given:** `req.session = { login: 'alice', tenantId: 'acme' }` (no role)
- **When:** `POST /api/journey` handler succeeds
- **Then:** `_phCalls.identify[0].props.$set.role === 'user'`

**J4 — When a new journey is created, posthog.groupIdentify is called once (AC7)**
- **Given:** same as J1
- **When:** `POST /api/journey` handler succeeds
- **Then:** `_phCalls.groupIdentify.length === 1`

**J5 — posthog.groupIdentify is called with correct company group params (AC7)**
- **Given:** same as J1
- **When:** `POST /api/journey` handler succeeds
- **Then:** `_phCalls.groupIdentify[0].type === 'company'`; `_phCalls.groupIdentify[0].key === 'acme'`; `_phCalls.groupIdentify[0].props.name === 'acme'`

---

### $groups on journey lifecycle events (AC8) — 4 separate tests

Each test exercises a distinct event handler. All use `req.session = { login: 'alice', tenantId: 'acme' }` and fresh-required journey.js.

**G1 — journey_created event includes $groups.company (AC8a)**
- **Given:** posthog mock; journey route fresh-required; journey store mock returns new journeyId
- **When:** `POST /api/journey` handler succeeds and `journey_created` is captured
- **Then:** The `capture` call with `event === 'journey_created'` has `groups` argument containing `{ company: 'acme' }`, OR `props.$groups === { company: 'acme' }` (depending on implementation approach — the test asserts the tenantId reaches PostHog via either mechanism)

**G2 — stage_started event includes $groups.company (AC8b)**
- **Given:** posthog mock; journey route; mock journey store with existing journey owned by `alice` in tenant `acme`
- **When:** the route handler that captures `stage_started` is called with a valid request
- **Then:** The `capture` call with `event === 'stage_started'` includes group attribution for `acme`

**G3 — stage_completed event includes $groups.company (AC8c)**
- **Given:** same setup as G2
- **When:** the route handler that captures `stage_completed` is called
- **Then:** The `capture` call with `event === 'stage_completed'` includes group attribution for `acme`

**G4 — journey_completed event includes $groups.company (AC8d)**
- **Given:** same setup as G2
- **When:** the route handler that captures `journey_completed` is called (all stages complete)
- **Then:** The `capture` call with `event === 'journey_completed'` includes group attribution for `acme`

---

## Integration Tests

### I-STREAM-1 — Streaming path end-to-end: $ai_generation fires with correct sub-group properties

**Purpose:** Verify that the streaming handler correctly assembles all $ai_generation properties from the executor result, the session, and _computeCostUsd() — end-to-end without decomposing individual assertions.

- **Given:** posthog mock; streaming executor mock calling `onFirstChunk(120)` then resolving with full usage; `session.journeyId = 'j-e2e-1'`; `req.session = { login: 'alice', tenantId: 'acme', role: 'user' }`
- **When:** `handlePostTurnStreamHtml` completes with a 200-status SSE response
- **Then:** `_phCalls.capture` has exactly 2 entries (one `skill_turn`, one `$ai_generation`); the `$ai_generation` entry passes all assertions from S2-a through S2-e simultaneously

### I-NS-1 — Non-streaming path end-to-end: _callAnthropic usage flows through to $ai_generation

**Purpose:** Verify AC1 (usage extraction from _callAnthropic) and AC4 together. The implementation must change `_callAnthropic` to return `{ text, usage }` (currently it resolves with only `text`). This integration test uses a real (mocked https) `_callAnthropic` call rather than the injectable adapter, to confirm the return shape change.

- **Given:** https mock (for Anthropic API) returning a synthetic JSON body: `{ "content": [{ "type": "text", "text": "response" }], "usage": { "input_tokens": 150, "output_tokens": 60, "cache_read_input_tokens": 30, "cache_creation_input_tokens": 0 }, "model": "claude-sonnet-4.6" }`; posthog mock; `ANTHROPIC_API_KEY = 'test-anth-key'`; fresh `skill-turn-executor.js`
- **When:** `skillTurnExecutor(systemPrompt, history, input, ...)` is called and resolves
- **Then:** The resolved value includes a `usage` field with `input_tokens: 150`, `output_tokens: 60`, `cache_read_tokens: 30`, `cache_creation_tokens: 0`
- **Why this is integration:** It tests `_callAnthropic` through its public API (`skillTurnExecutor`) while mocking at the https level, confirming the return shape change propagates without relying on the injectable adapter

---

## NFR Tests

**N1 — PostHog failure does not block SSE stream (NFR-PERF)**
- **Given:** posthog mock where `capture()` throws synchronously (`throw new Error('posthog unavailable')`)
- **When:** `handlePostTurnStreamHtml` processes a valid skill turn
- **Then:** The SSE response completes normally; no unhandled error propagates to the test process
- **NFR scope:** Performance / reliability only. Do not assert skill_turn event shape here — that belongs in S1.

**N2 — $ai_total_cost_usd comes from _computeCostUsd(), not inline arithmetic (NFR-CORRECTNESS)**
- **Given:** A spy on `computeCostUsd` exported from skills.js (via `require('../src/web-ui/routes/skills').computeCostUsd`); streaming executor mock with known usage; posthog mock
- **When:** `handlePostTurnStreamHtml` completes
- **Then:** The spy was called at least once; the `$ai_total_cost_usd` in the captured `$ai_generation` event equals the value returned by the spy (not a hardcoded or computed-inline value)
- **Why:** Ensures that pricing table updates in `_SKILL_PRICING` automatically propagate to PostHog without requiring code changes to the $ai_generation emission.

**N3 — adding $ai_trace_id to skill_turn does not break existing skill_turn shape (NFR-COMPAT)**
- **Given:** posthog mock; streaming executor mock; session with `journeyId`
- **When:** `handlePostTurnStreamHtml` completes
- **Then:** The `skill_turn` event still has all previously-required properties (check for `skillName`, `sessionId` or equivalent key properties that existing tests assert). The addition of `$ai_trace_id` is additive only.
- **Note:** Before implementing, read the existing `skill_turn` assertions in other test files (`tests/check-wusl1-chat-streaming.js`, `tests/check-mfc1-model-first-chat-session.js`) to identify which properties are already asserted. The coding agent must confirm `$ai_trace_id` does not replace any of them.

---

## Gap Table

No test coverage gaps. All ACs are testable at unit or integration level. No browser layout dependency. No E2E tooling required.

---

## Test count summary

| Type | Count |
|------|-------|
| Unit | 22 |
| Integration | 2 |
| NFR | 3 |
| **Total** | **27** |

---

## Test file location

`tests/check-pla-s2-posthog-wiring.js` — to be created by the coding agent.
Add to `npm test` in `package.json`: append `&& node tests/check-pla-s2-posthog-wiring.js` to the test chain.

### Dependency note for N3

Before writing `check-pla-s2-posthog-wiring.js`, the coding agent must read `tests/check-wusl1-chat-streaming.js` and `tests/check-mfc1-model-first-chat-session.js` to identify the existing `skill_turn` property assertions and confirm the new `$ai_trace_id` addition is purely additive.
