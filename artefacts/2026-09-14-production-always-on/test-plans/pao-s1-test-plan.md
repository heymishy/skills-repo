# Test Plan: Keep production's single machine always running instead of scaling to zero (pao-s1)

**Story:** artefacts/2026-09-14-production-always-on/stories/pao-s1-min-machines-running-one.md
**Track:** Short-track

---

## Test Cases

This is a single-field infra config change (`fly.toml`), not application code — AC1/AC2 are static file-diff checks verifiable by inspection at commit time (not a runnable unit test); AC3/AC4 are manual post-deploy verification steps, per this story's own DoR H3/H8 classification (consistent with this repo's established CSS-layout-AC precedent: RISK-ACCEPT + manual smoke test in lieu of automated coverage where automated coverage isn't the right tool for an infra/config change).

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Static diff check | `git diff origin/master -- fly.toml` shows `http_service.min_machines_running` changed from `0` to `1`, and no other line changed — verified at commit time (see commit `511d8e32`) |
| T2 | AC2 | Regression (automated) | `tests/check-bri-s2.1-fly-staging-app.js` — the pre-existing governance test asserting production/staging `fly.toml` parity — confirms every OTHER `[http_service]` key (`auto_stop_machines`, `auto_start_machines`, `sticky_sessions`) and the `[http_service.concurrency]`/`[[vm]]` sections still match exactly between `fly.toml` and `fly.staging.toml`; only `min_machines_running` is now an intentionally allowlisted divergence (see that test's own T3b/NFR3, updated by this story) |
| T3 | AC3 | Manual, post-deploy | `fly status --app skills-framework` checked some time after the last real request — machine state is `started`, not `suspended` |
| T4 | AC4 | Manual, post-deploy | A long-running skill turn (e.g. a test-plan continue-chain) run end-to-end against production — no `sse_client_disconnect` event appears in production logs for that session |

## Regression coverage

- `tests/check-bri-s2.1-fly-staging-app.js` (full 8-test suite) re-run clean after this story's edit to T3b/NFR3 — confirms the intentional `min_machines_running` divergence is the *only* thing that changed in that test's assertions, and every other production/staging parity check still holds.

## Out of Scope (per story)

- `fly.staging.toml` / `wuce-staging` — explicitly out of scope, per the story's own Architecture Constraints.
- Any code-level mitigation.
- Retroactive spend credit for the incident that prompted this story.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
