# Discovery: PostHog LLM Analytics Instrumentation

**Status:** Approved
**Created:** 2026-07-04
**Approved by:** Hamish King — 2026-07-04
**Author:** Claude Sonnet 4.6 / Hamish King

---

## Problem Statement

The skills platform web UI makes Anthropic API calls on every skill session turn. Token costs, latency, cache hit rates, and per-tenant usage are computed server-side (via `_computeCostUsd()` and `_SKILL_PRICING` in `src/web-ui/routes/skills.js`) but are never forwarded to PostHog as structured LLM analytics events. The existing `skill_turn` and `stage_completed` events carry no `$ai_trace_id`, so PostHog cannot link individual turns to journeys in its trace timeline view.

As a result, the operator cannot answer: which tenants are spending the most on LLM calls, which skill stages are most expensive, whether prompt cache reads are saving money, or what latency distribution looks like across skills. There is also no per-user role breakdown — admin and standard users are indistinguishable in PostHog cost data. This absence of observability blocks cost management, pricing decisions, and performance investigation as the platform scales beyond a single-user context.

---

## Who It Affects

**Platform operator (Hamish King)** — runs the platform and owns billing. Needs per-tenant LLM cost visibility to price the service correctly, detect runaway usage before it becomes a billing incident, and understand which skill stages drive the most cost so they can optimise model routing or skill design.

**Admin users** (any tenant with `role='admin'`) — following the admin role panel (PR #435), multiple tenants may have admin access. Admin-triggered skill sessions are currently indistinguishable from standard user sessions in PostHog cost data. The operator cannot determine whether admin-level activity (e.g. review passes, definition runs) is proportionally more expensive than standard user activity.

**Platform maintainer (future role)** — when the platform is operated by more than one person, the maintainer needs observability to diagnose expensive or slow skill stages without having to trawl raw logs or rerun experiments.

---

## Why Now

The admin role panel (PR #435, merged 2026-07-03) made multi-tenant, multi-role a production reality. Without per-tenant and per-role LLM cost tracking, there is no way to understand cost distribution as more tenants join. The `_computeCostUsd()` function and `_SKILL_PRICING` table already compute cost on every turn — the data exists but is never forwarded to PostHog. The research and instrumentation plan are complete (`docs/posthog-instrumentation-plan.md`), making the implementation ready to start immediately. The gap between what is computed and what is observable is the motivating trigger.

---

## MVP Scope

The MVP delivers Groups A and C from `docs/posthog-instrumentation-plan.md`:

**Group A — Extend `posthog-server.js` infrastructure:**
- Add `identify(distinctId, properties)` method — sends `$identify` event; includes `role` as a person property (multi-role support)
- Add `groupIdentify(groupType, groupKey, properties)` method — sends `$groupidentify` event; maps `tenantId` to PostHog `company` group
- Add `captureException(error, distinctId, properties)` method — sends `$exception` event with stack trace
- Update `capture()` to accept optional `groups` parameter and merge as `$groups` in event body
- Add `POSTHOG_PRIVACY_MODE` env var check (default `false`) — governs whether `$ai_input` / `$ai_output_choices` are included
- All via hand-rolled HTTP — zero new npm dependencies

**Group C — `$ai_generation` events after every LLM call:**
- Extract `usage` from the non-streaming `_callAnthropic` response body (currently discarded)
- Add `$ai_trace_id`, `$ai_span_id` to both streaming and non-streaming turn handlers
- Emit `$ai_generation` event after each Anthropic call with: model, provider, input/output/cache tokens, latency, TTFB (streaming), cost (USD), pricing properties, stop reason, `role` of the calling user
- Add `$ai_trace_id` to existing `skill_turn` events
- Fix `$ai_session_id` to `login + '-' + journeyId` (not `tenantId` — see note below)
- Add `role` to `identify()` `$set` properties

**Multi-user / multi-role / per-tenancy coverage:**
- `distinct_id` = `req.session.login` (canonical per-user identity)
- `role` = `req.session.role` on every `identify()` call and on `$ai_generation` events
- `$groups: { company: tenantId }` on all authenticated events (per-tenancy cost rollup)
- `$ai_session_id = login + '-' + journeyId` (per-user journey scoping, not tenant-level merging)
- `groupIdentify('company', tenantId, { name, plan })` called on journey creation

---

## Out of Scope

- **PostHog LLM evaluations (LLM-as-judge)** — no evaluation framework in place; the platform's `/review` skill could feed this but the integration design has not been done. Deferred to a future initiative.
- **A/B prompt variant testing via PostHog feature flags** — no SKILL.md variant framework exists yet. Deferred.
- **Token budget alerts in PostHog** — the credits system handles billing enforcement. PostHog alert configuration is a separate operational concern, not an instrumentation story.
- **`$ai_span` events for pipeline stages and gate-confirm** (Groups D, E from the plan) — high value but depends on Group C working end-to-end first. Deferred to a follow-on story.
- **Frontend group analytics** (`posthog.group()` on chat pages) and **session replay masking updates** (Group F) — separate UX/frontend story.
- **Stage cost rollup enhancements** (Group G) — minor additions to existing events; deferred to follow-on.
- **Copilot (GitHub) provider path instrumentation** — the Copilot path is not the primary production path; Anthropic path is the priority.

---

## Assumptions and Risks

~~[ASSUMPTION] PostHog Cloud account exists and `POSTHOG_KEY` env var is set on Fly.io~~ — **RESOLVED 2026-07-04:** Existing web analytics tracking confirms the PostHog account exists and `POSTHOG_KEY` is already set in Fly.io secrets.

[ASSUMPTION] PostHog's `$ai_generation` event schema supports manually-sent events with the same property set as auto-captured events — confirmed in `docs/posthog-instrumentation-plan.md` §1 (PostHog docs read by research subagent). Risk: PostHog may update the schema before implementation, changing required property names.

[ASSUMPTION] The hand-rolled `posthog-server.js` HTTP pattern is reliable enough to extend with 3 new methods following the existing pattern — supported by precedent (existing `capture()` works in production). Low risk.

Risk: `$ai_generation` events with `$ai_total_cost_usd` may cause PostHog to double-count cost (once from our manual value and once from its own computation from token counts + prices). Mitigation: test in PostHog sandbox before enabling on all events; use only `$ai_total_cost_usd` (pre-computed) and omit the per-token price properties, or vice versa.

Risk: privacy mode is off by default for skill sessions. Operator answers to discovery questions (SKILL.md prompts) may be stored in PostHog's `$ai_input` field. Mitigation: `POSTHOG_PRIVACY_MODE` env var gates this; operator can enable masking without a code change.

---

## Directional Success Indicators

**LLM cost per tenant visible in PostHog:** Baseline: zero PostHog visibility (all cost data computed server-side but not sent). Target: PostHog Group analytics shows daily LLM cost per `company` group (tenantId) with model and skill breakdown. Measured via: PostHog Insights → Group analytics → LLM cost by company.

**`$ai_generation` events appear in PostHog trace view linked to journeys:** Baseline: no `$ai_trace_id` on any event; PostHog cannot construct a trace. Target: each journey's generations appear in PostHog's trace timeline under the journey's `$ai_trace_id` (= `journeyId`). Measured via: PostHog LLM observability → Traces view.

**Cache hit rate visible per skill:** Baseline: unknown (cache tokens computed but not sent to PostHog). Target: PostHog Insights can compute `$ai_cache_read_input_tokens / ($ai_cache_read_input_tokens + $ai_input_tokens)` per skill. Measured via: PostHog custom formula insight.

**Per-role LLM cost segmentation:** Baseline: no role property on any PostHog event. Target: PostHog can filter `$ai_generation` events by `role = 'admin'` vs `role = 'user'` to compare cost profiles. Measured via: PostHog Insights → filter by `role`.

---

## Constraints

**No new npm dependencies** — product tech-stack constraint 11. All PostHog HTTP calls must use the existing hand-rolled pattern in `posthog-server.js` (Node.js `https` built-in). The `@posthog/ai` npm package and `posthog-node` SDK cannot be used.

**Node.js CommonJS only** — no ES modules, no TypeScript, no `import` syntax.

**Implementation plan exists** — `docs/posthog-instrumentation-plan.md` contains the full 34-task plan and event taxonomy. The definition phase should use this as the primary reference and produce stories that map to Groups A and C (MVP scope).

**EA registry note** — `context.yml` sets `ea_registry_authoritative: true`. The system being modified is the skills platform web UI (`src/web-ui/`). No new EA registry entry is required for instrumentation changes to an existing system, but the registry should be checked for any declared interface contracts on the PostHog integration point before stories are finalised.

[ASSUMPTION] No regulatory constraints apply — `meta.regulated: false` in `context.yml`. PostHog stores event data in US region by default. If EU data residency is required in future, the PostHog API host would need to change from `us.i.posthog.com` to `eu.i.posthog.com`. Currently unconfirmed as a requirement.

---

## Attribution

**Contributors:**
- Hamish King — Platform operator / product owner
- Claude Sonnet 4.6 — Research agent (instrumentation plan) and discovery author

**Reviewers:**
- Hamish King — 2026-07-04

**Approved By:**
- Hamish King — Platform operator / product owner — 2026-07-04

---

## /clarify recommendation

This discovery contains 3 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, consider running `/clarify` to resolve:

- [ASSUMPTION] PostHog Cloud account exists and `POSTHOG_KEY` env var is set on Fly.io — unconfirmed; **blocks metric measurement** (events will no-op without the key)
- [ASSUMPTION] PostHog's `$ai_generation` event schema supports manually-sent events with the same property set as auto-captured events — partially confirmed (PostHog docs read by research subagent); low risk
- [ASSUMPTION] No regulatory constraints apply (EU data residency for PostHog event storage) — confirmed by `context.yml` (`meta.regulated: false`); low risk

**Operator note:** Only the first assumption is genuinely blocking. The other two are supported by existing evidence. You can proceed to `/benefit-metric` once you confirm the PostHog account status, or accept the risk that events will be collected but not visible until the key is set.

---

**Next step:** Human review and approval → /benefit-metric
