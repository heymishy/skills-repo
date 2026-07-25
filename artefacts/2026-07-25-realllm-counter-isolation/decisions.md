## Decisions: staging smoke-test job worker isolation (rlcc-s1)

### Decision: serialize the CI job rather than build per-request attribution in the counter

**Date:** 2026-07-25
**Context:** `src/web-ui/server.js`'s real-LLM-call counter is one process-wide number with no attribution to which HTTP request caused an increment. Running the staging smoke-test job's `@mocked` specs with Playwright's default multi-worker concurrency against the single, shared `wuce-staging` server let one spec's concurrently-running request pollute a different spec's before/after delta assertion — observed live as `bri-s3.4` capturing `beforeCount=1` then `afterCount=4`.
**Decision:** Add `--workers=1` to the smoke-test job's Playwright invocation, scoped to that one CI job only. Rejected building true per-request/per-worker attribution in `server.js` (e.g. `AsyncLocalStorage` correlating an incoming request's worker identity through to the `https.request` instrumentation).
**Rationale:** Serializing removes the race entirely and is directly precedented in this exact repo — `.github/workflows/e2e.yml`'s Scenario A job already uses the identical `--workers=1`-scoped-to-one-job pattern (a2ccf-s1) for a structurally similar concurrency-on-a-shared-resource flake. A per-request attribution mechanism would be a much larger, higher-risk change to the request-handling path for a problem this simpler fix fully closes. The trade-off (roughly doubling this job's wall-clock time) is acceptable within its existing 10-minute timeout budget, given the small number of specs/tests involved (5 spec files, ~21 tests).

### Decision: do not modify `playwright.config.js`

**Date:** 2026-07-25
**Context:** The fix could have been applied globally by adding a `workers: 1` key to the shared Playwright config.
**Decision:** Left `playwright.config.js` untouched; the `--workers=1` flag is CLI-only, applied solely in `staging-deploy.yml`'s `smoke-test` job step.
**Rationale:** Local/dev test runs and other CI jobs (e2e.yml's own suite, minus its own explicitly-scoped exceptions) have no evidence of this race — they either run against per-run-isolated local servers or already have their own explicit `--workers=1` where needed. A global change would slow down every other consumer of the shared config for a problem specific to this one job's shared-remote-server topology.
