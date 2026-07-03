# AC Verification Script: pla-s2 — Emit $ai_generation events after Anthropic calls and wire identity and group analytics

**Story:** Emit $ai_generation events after Anthropic calls and wire identity and group analytics
**For:** Pre-code sign-off (confirm the described behaviour is correct) · Post-merge smoke test · Delivery review
**Date:** 2026-07-04

---

## Setup

This story wires server-side PostHog analytics into the skill turn flow and journey lifecycle. Verification has two levels:

1. **Automated tests** — run `node tests/check-pla-s2-posthog-wiring.js` to verify the implementation is correct. All 27 tests should print `[PASS]`.
2. **Live PostHog checks** — after deploying to Fly.io, open PostHog and verify the data appears as described in each scenario.

**Before live PostHog checks:**
1. Complete at least one skill session linked to a journey (go to the platform, start a journey, answer a question, advance at least one stage).
2. Wait up to 2 minutes for events to appear in PostHog Live Events.

**Load environment and start server for local manual checks:**

```powershell
# PowerShell — load .env then start server
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
node src/web-ui/server.js
```

```bash
# bash/zsh
export $(grep -v '^#' .env | xargs) && node src/web-ui/server.js
```

---

## Scenario 1 — Every skill turn produces a $ai_generation event in PostHog (AC3, AC4)

**What to check:** After this story ships, every time a skill session processes a question (pressing "Submit" or equivalent), a `$ai_generation` event should appear in PostHog under the correct user and tenant.

**How to verify (automated):** `node tests/check-pla-s2-posthog-wiring.js` — tests S2-a through S2-e and S3-a through S3-d confirm this.

**How to verify (live PostHog):**
1. Log into the platform, start a journey, and answer one question to advance a stage.
2. In PostHog → Activity → Live Events, look for an event named `$ai_generation` from your login.
3. Expand the event and confirm the following properties exist:
   - `$ai_provider` = `"anthropic"`
   - `$ai_model` starts with `"claude-"`
   - `$ai_input_tokens` is a positive number
   - `$ai_output_tokens` is a positive number
   - `$ai_total_cost_usd` is a non-negative number
   - `$groups` shows `company: <your-tenant-id>`

**What broken looks like:** No `$ai_generation` event appears in PostHog Live Events after completing a skill turn. Or the event appears but is missing `$ai_total_cost_usd` or `$groups`.

---

## Scenario 2 — Skill turns on the same journey share a trace ID (AC2, AC3)

**What to check:** Each `$ai_generation` event and its accompanying `skill_turn` event should carry the same `$ai_trace_id` — the journey ID. This links all turns in a journey into a single trace timeline in PostHog LLM Observability.

**How to verify (automated):** Test S1 confirms `skill_turn` gains `$ai_trace_id`; tests S2-a and S3-a confirm `$ai_generation` carries the same value.

**How to verify (live PostHog):**
1. Complete two turns in the same journey (answer two questions).
2. In PostHog → LLM Observability → Traces, find a trace by your journey ID (copy it from the URL bar on the journey page, e.g. `/journey/abc-123` → `$ai_trace_id = 'abc-123'`).
3. The trace timeline should show at least two `$ai_generation` events linked together.

**What broken looks like:** Each turn appears as a separate, unlinked event in PostHog LLM Observability. No trace timeline is visible.

---

## Scenario 3 — Token counts and cache data appear on the event (AC3, AC4)

**What to check:** PostHog should receive the Anthropic token usage breakdown including cache read tokens and cache creation tokens, enabling the cache hit rate insight described in M3.

**How to verify (automated):** Tests S2-c and S3-b confirm token properties are present.

**How to verify (live PostHog):**
1. After running at least one skill turn, open PostHog → Activity → Events → filter by `$ai_generation`.
2. Expand one event and confirm `$ai_cache_read_input_tokens` and `$ai_cache_creation_input_tokens` exist as numeric properties (they may be 0 on turn 1, non-zero on subsequent turns in the same session due to prompt caching).

**What broken looks like:** `$ai_cache_read_input_tokens` is absent from the event. Or all cache tokens are always 0 even after multiple turns (this would indicate caching is not active, not an instrumentation bug — check `WUCE_ENABLE_PROMPT_CACHE`).

---

## Scenario 4 — LLM prompt content is gated by privacy mode (AC5)

**What to check:** If `POSTHOG_PRIVACY_MODE=true` is set, the `$ai_input` (the prompt sent to the model) and `$ai_output_choices` (the model's response) must NOT appear in the `$ai_generation` event. This protects any operator instructions embedded in skill prompts.

**How to verify (automated):** Tests P1 and P2 confirm `$ai_input` and `$ai_output_choices` are absent when PRIVACY_MODE is true.

**How to verify (live — only if you want to test privacy mode explicitly):**
1. Set `POSTHOG_PRIVACY_MODE=true` in Fly.io: `fly secrets set POSTHOG_PRIVACY_MODE=true`
2. Run a skill turn.
3. In PostHog, find the `$ai_generation` event — confirm `$ai_input` and `$ai_output_choices` do not appear in the properties list.
4. Reset: `fly secrets unset POSTHOG_PRIVACY_MODE` to return to default (content may be sent).

**Default behaviour (privacy mode OFF):** `$ai_input` and `$ai_output_choices` may appear in events. This is acceptable for an internal operator tool where skill prompts contain no user PII.

---

## Scenario 5 — Journey creation triggers PostHog identify and groupIdentify (AC6, AC7)

**What to check:** When a user creates a new journey, PostHog should receive two calls: one to identify the user (linking their GitHub login, tenant, and role to their PostHog person record), and one to identify the tenant as a company group.

**How to verify (automated):** Tests J1–J5 confirm identify and groupIdentify are called with the correct arguments.

**How to verify (live PostHog):**
1. Create a new journey (start a new feature pipeline from the homepage).
2. In PostHog → People, search for your GitHub login.
3. The person record should show `login`, `tenantId`, and `role` as properties set in `$set`.
4. In PostHog → Groups → filter type "company", find your tenant ID. The group record should have `name = <your-tenant-id>`.

**What broken looks like:** Your GitHub login does not appear in PostHog → People. Or it appears but has no `tenantId` or `role` properties. Or the "company" group type is missing from PostHog → Groups.

---

## Scenario 6 — All journey lifecycle events carry tenant group attribution (AC8)

This scenario has four parts — one per event type. All four must pass.

**What to check:** The events `journey_created`, `stage_started`, `stage_completed`, and `journey_completed` must all include `$groups: { company: <tenantId> }` so that PostHog Group analytics can aggregate them per tenant.

**How to verify (automated):** Tests G1–G4 each verify one event type separately (addressing review finding 1-M3 which warned that a single "any of" check could leave three event types untested).

**How to verify (live PostHog):**
1. Run a complete journey: create journey → advance at least one stage → complete the journey.
2. In PostHog → Groups → find your tenant's company group.
3. Click the group and open its events feed.
4. Confirm all four event types appear: `journey_created`, `stage_started`, `stage_completed`, `journey_completed`.

**What broken looks like:** The company group exists but its events feed is empty. Or only `journey_created` appears but `stage_started` and `stage_completed` do not. Each missing event type is a separate gap.

---

## Scenario 7 — Cost attribution is correct and uses the shared pricing table (NFR-CORRECTNESS)

**What to check:** The `$ai_total_cost_usd` value on every `$ai_generation` event must come from the existing `_computeCostUsd()` function in `skills.js` — not a reimplemented calculation. This ensures that when the Anthropic pricing table (`_SKILL_PRICING`) is updated, the PostHog data is automatically correct.

**How to verify (automated):** Test N2 confirms `_computeCostUsd` is called and its return value matches the emitted `$ai_total_cost_usd`.

**How to verify (live PostHog):**
1. After running a skill turn, find the `$ai_generation` event in PostHog.
2. Note the `$ai_input_tokens`, `$ai_output_tokens`, `$ai_cache_read_input_tokens`, `$ai_cache_creation_input_tokens`, and `$ai_model` values.
3. Compute the expected cost manually using the pricing table in `src/web-ui/routes/skills.js` → `_SKILL_PRICING`.
4. Confirm `$ai_total_cost_usd` matches (within floating-point rounding).

---

## Scenario 8 — PostHog failure does not break skill sessions (NFR-PERF)

**What to check:** If PostHog's servers are unreachable or slow, skill sessions must continue to work normally — the turn response should complete and the user should see the model's output. PostHog data may be lost in this scenario, but the session must not be affected.

**How to verify (automated):** Test N1 confirms a PostHog exception does not propagate to the caller.

**How to verify (live — optional):** Temporarily set `POSTHOG_KEY` to an invalid value. Run a skill turn. Confirm the turn completes normally and shows the model response. PostHog events will fail silently. Reset `POSTHOG_KEY` afterwards.

---

## Reset instructions

**Between live PostHog checks:** No reset needed — PostHog events are append-only. Each scenario's events can be found by filtering by event name in PostHog Live Events.

**Between automated test runs:** No reset needed — the test file manages its own state via fresh require and mock reset.

**If you toggled POSTHOG_PRIVACY_MODE:** Remember to unset it if you want content to appear in events: `fly secrets unset POSTHOG_PRIVACY_MODE`.

---

## Sign-off (pre-code)

> I have read the scenarios above and confirm the described behaviours are correct and complete for this story.
>
> Signed: _________________________ Date: _____________
