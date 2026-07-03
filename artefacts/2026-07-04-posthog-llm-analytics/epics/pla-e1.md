## Epic: LLM usage visible in PostHog per tenant and per role

**Discovery reference:** artefacts/2026-07-04-posthog-llm-analytics/discovery.md
**Benefit-metric reference:** artefacts/2026-07-04-posthog-llm-analytics/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

When this epic is complete, every Anthropic API call made during a skill session produces a `$ai_generation` event in PostHog carrying cost (USD), token counts (input, output, cache read, cache creation), latency, model, provider, and the user's role and tenant. The platform operator can open PostHog Group analytics and see daily LLM cost broken down by tenant (`company` group) and by role (`admin` vs `user`). PostHog's trace timeline shows each journey's turns linked under a shared `$ai_trace_id`. Cache hit rates are computable per skill via a PostHog Insights formula. This is delivered via two sequential stories: the first extends the PostHog module skeleton; the second wires it into all production call sites.

## Out of Scope

- `$ai_span` events for pipeline stage open/close and gate-confirm — Group D from the instrumentation plan; deferred to a follow-on story after the core `$ai_generation` coverage is confirmed in production.
- `captureException` call sites for LLM errors and gate failures — Group E; deferred to follow-on.
- Frontend `posthog.group()` calls on chat pages and session replay masking updates — Group F; separate story.
- Copilot (GitHub) provider path instrumentation — Anthropic path only in this epic.
- `$ai_input` and `$ai_output_choices` content capture — privacy mode is the gating mechanism; the epic delivers the env-var gate but does not require content to be captured.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1: Per-tenant LLM cost attribution rate | 0% | ≥99% of Anthropic calls produce `$ai_generation` with `$ai_total_cost_usd` + correct `company` group | pla-s2 emits `$ai_generation` with `$groups: { company: tenantId }` after every streaming and non-streaming Anthropic call |
| M2: PostHog trace view completeness | 0% | 100% of journey turns carry `$ai_trace_id = journeyId` on both `skill_turn` and `$ai_generation` | pla-s2 adds `$ai_trace_id = session.journeyId || sessionId` to both event calls |
| M3: Cache hit rate observability | Not measurable | PostHog insight renderable; discovery/benefit-metric skills ≥50% cache hit | pla-s2 includes `$ai_cache_read_input_tokens` and `$ai_cache_creation_input_tokens` on `$ai_generation` events |
| M4: Per-role LLM cost segmentation | 0% | 100% of `$ai_generation` events carry `role` property | pla-s1 exposes `identify()` with `role`; pla-s2 adds `role` to every `$ai_generation` event |

## Stories in This Epic

- [ ] pla-s1: Extend posthog-server.js with identify, groupIdentify, captureException, and $groups support
- [ ] pla-s2: Emit $ai_generation events after Anthropic calls and wire identity and group analytics

## Human Oversight Level

**Oversight:** Low
**Rationale:** Purely additive instrumentation to an existing module and route handlers. No auth, billing, or data-integrity changes. POSTHOG_KEY already in Fly.io secrets. No new infrastructure.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
