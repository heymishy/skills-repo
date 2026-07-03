## Story: Emit $ai_generation events after Anthropic calls and wire identity and group analytics

**Epic reference:** artefacts/2026-07-04-posthog-llm-analytics/epics/pla-e1.md
**Discovery reference:** artefacts/2026-07-04-posthog-llm-analytics/discovery.md
**Benefit-metric reference:** artefacts/2026-07-04-posthog-llm-analytics/benefit-metric.md

## User Story

As a **platform operator**,
I want every Anthropic LLM call to produce a PostHog `$ai_generation` event with cost, token counts, latency, model, cache data, tenant, and role — and for journeys to trigger identity and group analytics calls,
So that **I can see per-tenant and per-role LLM cost, trace full journey timelines, and measure cache hit rates in PostHog** (M1, M2, M3, M4).

## Benefit Linkage

**Metric moved:** M1, M2, M3, M4 — all four metrics become measurable after this story ships.
**How:** This story wires the new PostHog module methods (from pla-s1) into `skill-turn-executor.js` and the route handlers. After this story, every Anthropic call produces a `$ai_generation` event attributed to a tenant and role, every journey turn carries a shared `$ai_trace_id`, and PostHog has the data needed to render LLM cost by group, trace timelines, cache hit rates, and role breakdowns.

## Architecture Constraints

- **ADR-011 (artefact-first):** This story artefact and DoR must exist before any implementation code is written or merged to master.
- **Zero new npm dependencies:** No packages added. All new PostHog calls use the methods added in pla-s1.
- **Node.js CommonJS only:** `require()` throughout. No `import`.
- **`req.session.login` is the canonical `distinct_id`:** All authenticated PostHog events emitted from route handlers must use `req.session.login` as `distinctId`. Fallback chain when `login` is absent: `req.session.tenantId || req.session.userId || 'anonymous'`.
- **`_computeCostUsd()` and `_SKILL_PRICING` are authoritative:** Cost computation for `$ai_total_cost_usd` and per-token price properties must use the existing `_computeCostUsd()` function and `_SKILL_PRICING` table in `src/web-ui/routes/skills.js`. These must not be duplicated or reimplemented in the turn executor or journey route.
- **`$ai_session_id` = `login + '-' + journeyId`:** This is the per-user journey scoping strategy decided during discovery. Do NOT use `tenantId` as `$ai_session_id` — that would collapse all users of a tenant into one PostHog session.
- **pla-s1 dependency:** `posthog.identify`, `posthog.groupIdentify`, and the `groups` param on `posthog.capture` must exist (pla-s1 DoD-complete) before this story begins implementation.

## Dependencies

- **Upstream:** pla-s1 must be DoD-complete — this story calls `posthog.identify`, `posthog.groupIdentify`, and the updated `capture()` with `groups` param.
- **Downstream:** None — this story completes the MVP scope.

## Acceptance Criteria

**AC1:** Given the non-streaming `_callAnthropic` function in `src/modules/skill-turn-executor.js` completes a successful Anthropic API call, then the returned object includes `usage: { input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens }` extracted from the Anthropic JSON response body's `usage` field.

**AC2:** Given a skill turn completes on the streaming path (`handlePostTurnStreamHtml`), when the `skill_turn` PostHog event is captured, then it includes a `$ai_trace_id` property equal to `session.journeyId || sessionId`.

**AC3:** Given a skill turn completes on the streaming path, then a `$ai_generation` PostHog event is captured with all of the following properties: `$ai_trace_id` (= `session.journeyId || sessionId`), `$ai_span_id` (a fresh `crypto.randomUUID()`), `$ai_session_id` (= `req.session.login + '-' + session.journeyId`), `$ai_model` (= the model string returned from the Anthropic call), `$ai_provider: "anthropic"`, `$ai_input_tokens`, `$ai_output_tokens`, `$ai_cache_read_input_tokens`, `$ai_cache_creation_input_tokens`, `$ai_latency` (total LLM duration in seconds), `$ai_time_to_first_token` (in seconds), `$ai_stream: true`, `$ai_total_cost_usd` (from `_computeCostUsd()`), `role` (= `req.session.role || 'user'`), and `$groups: { company: req.session.tenantId }`.

**AC4:** Given a skill turn completes on the non-streaming path (`handlePostTurnHtml`), then a `$ai_generation` PostHog event is captured with the same properties as AC3 except: `$ai_time_to_first_token` is absent, `$ai_stream: false`, and all token counts come from the `usage` extracted in AC1.

**AC5:** Given `POSTHOG_PRIVACY_MODE` is `"true"` in the environment, then the `$ai_generation` event does NOT include `$ai_input` or `$ai_output_choices` properties on either the streaming or non-streaming path.

**AC6:** Given a new journey is created (`POST /api/journey` succeeds and `req.session.login` is set), then `posthog.identify(login, { $set: { login, tenantId, role } })` is called once with `login = req.session.login`, `tenantId = req.session.tenantId`, and `role = req.session.role || 'user'`.

**AC7:** Given a new journey is created, then `posthog.groupIdentify('company', tenantId, { name: tenantId })` is called once with `tenantId = req.session.tenantId`.

**AC8:** Given any of the following events is captured from an authenticated session — `journey_created`, `stage_started`, `stage_completed`, `journey_completed` — then the event properties include `$groups: { company: req.session.tenantId }`.

## Out of Scope

- `$ai_span` events for stage open/close and gate-confirm — Group D from the instrumentation plan; deferred.
- `posthog.captureException` call sites in LLM error handlers — Group E; deferred.
- Frontend `posthog.group()` calls on chat pages — Group F; separate story.
- `cacheReadTokens`/`cacheCreationTokens` added to `stage_completed` event — Group G; deferred.
- Changing the `distinct_id` on historical events already in PostHog — no backfill.
- Adding `$ai_stop_reason` to `$ai_generation` events — requires parsing `message_delta.stop_reason` from the Anthropic stream; deferred (noted in the instrumentation plan as "not yet captured").

## NFRs

- **Performance:** The `$ai_generation` event capture call is fire-and-forget (same as all other PostHog calls) and must not block the SSE stream or the non-streaming response. If the PostHog HTTP call fails, the turn response must still be delivered to the client.
- **Security:** `$ai_input` and `$ai_output_choices` (prompt and response content) are gated behind `POSTHOG_PRIVACY_MODE`. Default is OFF (content may be sent). If privacy mode is toggled, no code change is needed — only the env var.
- **Correctness:** `$ai_total_cost_usd` must be computed via the existing `_computeCostUsd()` function, not inline arithmetic, to ensure pricing table updates propagate automatically.
- **Test isolation:** The test suite for this story must not make real HTTP calls to PostHog. The `posthog-server.js` module must be mockable or the PostHog capture calls must be verifiable via an injectable or spy pattern agreed at test-plan time.
- **Backward compatibility:** Adding `$ai_trace_id` to the existing `skill_turn` capture call must not break any existing test that asserts the shape of that event.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
