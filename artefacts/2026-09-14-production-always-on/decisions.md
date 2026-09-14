# Decisions: Production always-on machine

## Keep production's single machine running continuously (min_machines_running: 1)

**Date:** 2026-09-14
**Context:** Production (`skills-framework`) runs `fly.toml`'s `auto_stop_machines='suspend'` with `min_machines_running=0` — the single machine suspends to zero between requests and resumes on the next one. This risk was first identified and explicitly deferred on 2026-08-31 (`workspace/capture-log.md`): "Needs an operator decision (disable auto-stop vs. accept the cost/latency tradeoff vs. a suspend-aware mitigation) before any fix is scoped." Two subsequent same-session incidents (`lasr-s1`'s outbound-LLM-agent stale-socket fix, and a `wuce-staging` CI smoke-test 502) confirmed the risk class was real and recurring. A third, direct occurrence disrupted the operator's own real test-plan work on 2026-09-14 — confirmed via cross-referencing PostHog AI traces with production logs: two `sse_client_disconnect` events 8-14 seconds into a stream, with the underlying LLM call continuing server-side for up to 176.8 seconds into an abandoned connection.

**Decision:** Set `http_service.min_machines_running = 1` in `fly.toml` (production only — `wuce-staging` is explicitly out of scope, see `pao-s1`'s own Architecture Constraints). The machine no longer suspends to zero; `auto_stop_machines`/`auto_start_machines` remain configured but have no effect while exactly one machine is running, since Fly only stops machines beyond the configured floor.

**Rationale:** The operator reviewed real Fly Cost Explorer billing data for this account before deciding: total spend across all apps was $0.69 for a ~31-35 day period, of which machine compute (CPU + RAM, both apps combined, currently running suspended-by-default) was $0.54. Against that baseline, the expected cost of one additional always-on 512MB shared-CPU-1x machine is low (single-digit dollars/month), a trade the operator judged clearly worth making given the now three-times-confirmed reliability and real-work-disruption cost of the alternative. This resolves the 2026-08-31 deferred decision.

**Story:** artefacts/2026-09-14-production-always-on/stories/pao-s1-min-machines-running-one.md
