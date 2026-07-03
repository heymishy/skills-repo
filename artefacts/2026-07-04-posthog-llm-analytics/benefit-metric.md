## Benefit Metric: PostHog LLM Analytics Instrumentation

**Discovery reference:** artefacts/2026-07-04-posthog-llm-analytics/discovery.md
**Date defined:** 2026-07-04
**Metric owner:** Hamish King — Platform operator / product owner
**Reviewers:** Hamish King — 2026-07-04

---

## Tier Classification

**META-BENEFIT FLAG:** No

This is an operational observability initiative. The metrics measure whether platform cost, latency, and cache usage are visible in PostHog at the per-tenant and per-role level. There is no hypothesis being validated about tooling or process approach — the PostHog hand-rolled pattern is already proven in production for existing events (`stage_completed`, `skill_turn`, etc.).

---

## Tier 1: Product Metrics (Operator Value)

### M1: Per-tenant LLM cost attribution rate

| Field | Value |
|-------|-------|
| **What we measure** | Percentage of Anthropic API calls that produce a PostHog `$ai_generation` event with `$ai_total_cost_usd` attributed to the correct PostHog `company` group (tenantId). |
| **Baseline** | 0% — no `$ai_generation` events exist in PostHog today. Cost is computed server-side in `_computeCostUsd()` but never forwarded. |
| **Target** | ≥99% of Anthropic calls produce a `$ai_generation` event with `$ai_total_cost_usd` and correct `$groups: { company: tenantId }` within 5 seconds of call completion. |
| **Minimum validation signal** | At least 1 `$ai_generation` event visible per active tenant in PostHog Group analytics within 24 hours of first deploy with this instrumentation active. |
| **Measurement method** | PostHog → Group analytics → filter `$ai_generation` events by `company` group; compare event count against Pino log count of LLM call completions for the same period. Measured by operator within 24 hours of deploy. |
| **Feedback loop** | If fewer than 99% of calls produce events, investigate the PostHog HTTP client call in the `handlePostTurnStreamHtml` catch path — likely a silent swallow. If <1 event per tenant, check `POSTHOG_KEY` is set and `$groups` wiring is correct. Operator decides: fix immediately (if instrumentation is silently failing) or log as known gap (if within acceptable loss rate). |

---

### M2: PostHog trace view completeness

| Field | Value |
|-------|-------|
| **What we measure** | Percentage of authenticated skill turns (from journey-linked sessions) where the `skill_turn` event and `$ai_generation` event share the same `$ai_trace_id` value equal to the session's `journeyId`. |
| **Baseline** | 0% — `$ai_trace_id` is absent on all PostHog events today. PostHog cannot construct a trace view. |
| **Target** | 100% of authenticated turns from journey-linked sessions carry `$ai_trace_id = journeyId` on both `skill_turn` and `$ai_generation` events, enabling PostHog's trace timeline to show the full journey. |
| **Minimum validation signal** | PostHog LLM Observability → Traces view shows at least one complete journey (≥2 turns linked by `$ai_trace_id`) within 48 hours of deploy. |
| **Measurement method** | Manual verification: run one complete skill session linked to a journey after deploy; check PostHog trace view for the session's `journeyId`; confirm both `skill_turn` and `$ai_generation` events appear under the same trace. Ongoing: PostHog Insights query for `$ai_trace_id` property presence on `$ai_generation` events (should be 100%). Measured at first deploy, then weekly. |
| **Feedback loop** | If trace view is empty, check that `session.journeyId` is correctly passed from the route handler into the turn executor context. If events appear but are unlinked, verify `$ai_trace_id` is being set on both event calls from the same value. |

---

### M3: Cache hit rate observability per skill

| Field | Value |
|-------|-------|
| **What we measure** | Whether a PostHog Insights formula can compute `$ai_cache_read_input_tokens / ($ai_cache_read_input_tokens + $ai_input_tokens)` per skill name, and the measured cache hit rate for prompt-heavy skills (discovery, benefit-metric). |
| **Baseline** | Not measurable — `$ai_cache_read_input_tokens` is not forwarded to PostHog today. Cache tokens are extracted from the Anthropic SSE stream and accumulated in `session.usage.cache_read_tokens` but never emitted as a PostHog property. |
| **Target** | (1) PostHog custom insight can render cache hit rate per skill using `$ai_cache_read_input_tokens` from `$ai_generation` events. (2) Measured cache hit rate for `discovery` and `benefit-metric` skills is ≥50% (these skills use extended system prompts that should hit the prompt cache on turns 2+). |
| **Minimum validation signal** | `$ai_cache_read_input_tokens` property appears on at least 1 `$ai_generation` event in PostHog within 24 hours of deploy. |
| **Measurement method** | PostHog → Insights → create formula metric: `sum($ai_cache_read_input_tokens) / (sum($ai_cache_read_input_tokens) + sum($ai_input_tokens))`, grouped by `$ai_span_name` (skill). Verified within 1 week of deploy by operator. |
| **Feedback loop** | If cache hit rate is <50% for multi-turn skills, investigate whether the Anthropic `cache_control` header is being sent correctly in `_callAnthropicStream`. Cache hit rate of 0% suggests caching is not enabled on the requests at all — not an instrumentation issue. |

---

### M4: Per-role LLM cost segmentation

| Field | Value |
|-------|-------|
| **What we measure** | Percentage of `$ai_generation` events that carry a `role` property (`'admin'` or `'user'`), enabling PostHog to compare LLM cost profiles between admin and standard user sessions. |
| **Baseline** | 0% — `role` is absent from all PostHog events today. Admin and standard user sessions are indistinguishable in PostHog cost data. |
| **Target** | 100% of `$ai_generation` events from authenticated sessions carry a `role` property. PostHog can render a cost breakdown by role (admin vs user) with at least 1 data point per role. |
| **Minimum validation signal** | At least one `$ai_generation` event with `role='admin'` and one with `role='user'` visible in PostHog within 1 week of deploy (requires both role types to have used the platform post-deploy). |
| **Measurement method** | PostHog → Insights → filter `$ai_generation` by `role` property; confirm distinct values `'admin'` and `'user'` appear. Check `role` property on `identify()` call via PostHog → People → person record for each user. Measured within 1 week of deploy. |
| **Feedback loop** | If `role` is absent, check that `req.session.role` is populated at the point the turn handler fires (requires arl-s1 wiring to be active — the admin role panel must be deployed and the admin seed SQL run). If `role` is always `'user'`, the admin seed SQL may not have been run post-deploy. |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1: Per-tenant LLM cost attribution | pla-s1 (infrastructure: identify + groupIdentify methods), pla-s2 (wiring: $ai_generation with $groups) | Covered |
| M2: PostHog trace view completeness | pla-s2 ($ai_trace_id on skill_turn and $ai_generation events) | Covered |
| M3: Cache hit rate observability | pla-s2 ($ai_cache_read_input_tokens and $ai_cache_creation_input_tokens on $ai_generation events; AC1 extracts cache tokens from non-streaming path) | Covered |
| M4: Per-role cost segmentation | pla-s1 (infrastructure: identify with role in $set), pla-s2 (role property on $ai_generation events; AC6 wires role into identify call) | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — the 34-task plan is in `docs/posthog-instrumentation-plan.md`; story ACs will reference it
- Sprint targets or velocity — these metrics are outcome-based, not output-based
- Groups B, D, E, F, G (from the plan) — deferred to follow-on stories; out of scope for this benefit-metric
