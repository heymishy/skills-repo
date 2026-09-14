# Decisions: Production always-on machine

## Keep production's single machine running continuously (min_machines_running: 1)

**Date:** 2026-09-14
**Context:** Production (`skills-framework`) runs `fly.toml`'s `auto_stop_machines='suspend'` with `min_machines_running=0` — the single machine suspends to zero between requests and resumes on the next one. This risk was first identified and explicitly deferred on 2026-08-31 (`workspace/capture-log.md`): "Needs an operator decision (disable auto-stop vs. accept the cost/latency tradeoff vs. a suspend-aware mitigation) before any fix is scoped." Two subsequent same-session incidents (`lasr-s1`'s outbound-LLM-agent stale-socket fix, and a `wuce-staging` CI smoke-test 502) confirmed the risk class was real and recurring. A third, direct occurrence disrupted the operator's own real test-plan work on 2026-09-14 — confirmed via cross-referencing PostHog AI traces with production logs: two `sse_client_disconnect` events 8-14 seconds into a stream, with the underlying LLM call continuing server-side for up to 176.8 seconds into an abandoned connection.

**Decision:** Set `http_service.min_machines_running = 1` in `fly.toml` (production only — `wuce-staging` is explicitly out of scope, see `pao-s1`'s own Architecture Constraints). The machine no longer suspends to zero; `auto_stop_machines`/`auto_start_machines` remain configured but have no effect while exactly one machine is running, since Fly only stops machines beyond the configured floor.

**Rationale:** The operator reviewed real Fly Cost Explorer billing data for this account before deciding: total spend across all apps was $0.69 for a ~31-35 day period, of which machine compute (CPU + RAM, both apps combined, currently running suspended-by-default) was $0.54. Against that baseline, the expected cost of one additional always-on 512MB shared-CPU-1x machine is low (single-digit dollars/month), a trade the operator judged clearly worth making given the now three-times-confirmed reliability and real-work-disruption cost of the alternative. This resolves the 2026-08-31 deferred decision.

**Story:** artefacts/2026-09-14-production-always-on/stories/pao-s1-min-machines-running-one.md

---

## CI follow-up: staging-parity test updated, test-plan artefact retrofitted

**Date:** 2026-09-14
**Context:** Opening the PR for the above decision surfaced two CI gate failures neither this story's own DoR nor its test plan (at the time, none existed) had anticipated: (1) `tests/check-bri-s2.1-fly-staging-app.js` — a pre-existing governance test asserting `fly.toml`/`fly.staging.toml` parity — hard-fails on `min_machines_running` now legitimately differing between the two files; (2) the CI "Validate traceability chain" job's `test_plan_coverage` check hard-fails because this story's `pipeline-state.json` stage (`definition-of-ready`) requires a test-plan artefact to exist on disk, which this story's own DoR H8 had marked N/A without creating one.

**Decision:** (1) Updated `check-bri-s2.1-fly-staging-app.js`'s T3b and NFR3 to allowlist `min_machines_running` as an intentionally divergent field (documented inline, referencing this decision) rather than adding `2026-09-14-production-always-on` to `.github/trace-validation.yml`'s `test_plan_exempt_features` list — that list is explicitly scoped ("features whose stories pre-date the trace validation system... adding test plan files retroactively is out of scope") to legacy debt, not new short-track stories, so using it here would have been a misuse of an exemption meant for a different problem. (2) Wrote `artefacts/2026-09-14-production-always-on/test-plans/pao-s1-test-plan.md`, retrofitted to describe the same AC1-AC4 verification approach the DoR had already reasoned about (static diff checks for AC1/AC2, manual post-deploy steps for AC3/AC4) — this satisfies the file-existence gate correctly rather than working around it.

**Rationale:** Both fixes are direct, necessary, in-scope consequences of implementing exactly what this story already decided and got approved for (production/staging intentionally diverging on one field) — not new architectural decisions requiring a separate chain. Recorded here rather than silently fixed with no trace, per this repo's own decisions.md discipline.

**Story:** artefacts/2026-09-14-production-always-on/stories/pao-s1-min-machines-running-one.md
