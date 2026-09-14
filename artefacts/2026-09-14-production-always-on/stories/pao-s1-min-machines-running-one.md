## Story: Keep production's single machine always running instead of scaling to zero

**Epic reference:** None — short-track (bounded infra config change, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery; scope stated directly below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **the operator running real work sessions against the live production app (`skills-framework.fly.dev`)**,
I want **the production machine to stay running continuously instead of suspending to zero between requests**,
So that **a long-running skill turn (e.g. test-plan artefact generation) never gets its streaming connection severed mid-response by the machine suspending underneath it**.

## Benefit Linkage

**Metric moved:** None formal — reliability fix, per this story's own short-track Benefit Linkage convention.
**How:** Directly closes a gap that disrupted the operator's own real work this session (2026-09-14): cross-referencing PostHog's AI traces with production logs (`fly logs --app skills-framework`) showed two `sse_client_disconnect` events during active test-plan generation (09:14:23 and 09:15:17 UTC), each only 8-14 seconds after the stream opened, with the underlying LLM call continuing to run server-side for 26s and 176.8s respectively after the client connection was already gone — the operator experienced this as "started having issues... refreshed and tried again and there was an error." This is the third confirmed occurrence this session of the same root risk class (`fly.toml`'s `auto_stop_machines='suspend'`, `min_machines_running=0`), following `lasr-s1` (outbound LLM agent, this same repo, this same session) and a `wuce-staging` CI smoke-test flake earlier today — the first occurrence of this specific risk was originally identified and explicitly deferred by the operator on 2026-08-31 (`workspace/capture-log.md`), pending exactly this cost-vs-reliability decision.

**Decision basis:** the operator reviewed real Fly Cost Explorer data for this account (all apps, ~31-35 day period): total spend $0.69, of which machine compute (CPU + RAM, both apps combined, currently running suspended-by-default) was $0.54. Given that baseline, running one additional small (512MB, shared-CPU-1x) machine continuously is expected to land in the low single digits of dollars per month — the operator confirmed this is an acceptable trade-off and approved the change directly in conversation on 2026-09-14.

## Architecture Constraints

- **Scope: production (`skills-framework`, root `fly.toml`) only.** `wuce-staging` (`fly.staging.toml`) is explicitly out of scope for this story — it's a lower-stakes environment (auto-deployed on every push, used for CI/E2E, not real operator work sessions) where the existing scale-to-zero trade-off remains acceptable for now.
- **Single-field change:** `http_service.min_machines_running` from `0` to `1` in `fly.toml`. `auto_stop_machines = 'suspend'` and `auto_start_machines = true` are left unchanged — with `min_machines_running: 1`, Fly keeps one machine running at all times and only auto-stop/auto-starts *additional* machines beyond that floor (this app runs a single machine today, so in practice this machine simply never suspends).
- **Takes effect on the next production deploy**, gated by the same existing manual "Promote to production" approval step (`bri-s2.6`) as every other change — no new deployment mechanism introduced.
- **Supersedes, not duplicates, the 2026-08-31 deferred decision** (`workspace/capture-log.md`) — that entry should be treated as resolved by this story once merged, not left open alongside it.

## Dependencies

- **Upstream:** None.
- **Downstream:** None known. `lasr-s1`'s `keepAlive: false` fix (outbound LLM agent) remains correct and unaffected — it addresses a different connection (this app's own outbound calls to Anthropic), and stays valid defense-in-depth regardless of whether the machine itself ever suspends.

## Acceptance Criteria

**AC1:** Given `fly.toml`, When inspecting `http_service.min_machines_running`, Then its value is `1` (changed from `0`).

**AC2:** Given `fly.toml`, When inspecting every other field (`auto_stop_machines`, `auto_start_machines`, `sticky_sessions`, `[http_service.concurrency]`, `[[vm]]`), Then none of them are changed from their current values — this story is a single-field change.

**AC3 (manual verification, post-deploy):** Given the change has been deployed to production, When `fly status --app skills-framework` is checked some time after the last real request, Then the machine's state remains `started`, not `suspended`.

**AC4 (manual verification, post-deploy):** Given the change has been deployed to production, When a long-running skill turn (e.g. a test-plan continue-chain) is run end-to-end, Then no `sse_client_disconnect` event appears in production logs for that session.

## Out of Scope

- `wuce-staging`'s own `fly.staging.toml` (explicitly deferred, see Architecture Constraints).
- Any code-level mitigation (heartbeat pings, client-side auto-reconnect) — this story resolves the risk at the infra level instead.
- Retroactively refunding or crediting the wasted API spend from the two disconnected calls in this session's own incident.

## NFRs

- **Performance:** expected to improve — eliminates the "first request after suspend" cold-resume latency for production entirely, not just the mid-session disconnect risk.
- **Cost:** a small, operator-approved, ongoing increase (estimated low single-digit dollars/month, based on real account billing data reviewed in this session) — not formally metered by this story; the operator can verify actual impact via Fly Cost Explorer after a full billing cycle.
- **Availability:** directly improves availability for production — removes the specific failure mode confirmed in this session's own incident.

## Complexity Rating

**Rating:** 1 — a single config field change with the underlying risk already thoroughly evidenced across three separate incidents this session.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic
