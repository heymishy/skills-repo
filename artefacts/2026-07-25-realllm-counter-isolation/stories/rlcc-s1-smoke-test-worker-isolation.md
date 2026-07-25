## Story: Staging smoke-test job runs single-worker so the real-LLM-call counter can't be polluted by a concurrently-running spec

**Short-track:** bug fix -- adjacent gap surfaced by dss-s1's own post-merge live verification (found via capture-log review).

## User Story

As **Hamish King (Founder/Operator)**,
I want **the staging smoke-test job's `@mocked` Playwright specs to run against a real-LLM-call counter that only ever reflects that spec's own actions**,
So that **a spec never fails its own "zero real LLM calls" assertion because of a different spec's concurrently-running request against the same shared staging server**.

## Background / Investigation

`src/web-ui/server.js` (~line 1436) wraps `https.request` and increments one process-wide counter, `global.__BRI_S3_2_REAL_LLM_CALL_COUNT__`, whenever a call targets a real LLM provider hostname. `GET /test/real-llm-call-count` exposes it, and every `@mocked` spec (`bri-s3.2`, `bri-s3.3`, `bri-s3.4`, `bri-s3.5`) reads it before and after its own actions, asserting `expect(afterCount).toBe(beforeCount)` -- i.e. its own segment made zero real calls.

This is correct when specs run one at a time against one server, but `.github/workflows/staging-deploy.yml`'s `smoke-test` job runs `npx playwright test --grep "@mocked"` with Playwright's default worker concurrency (dss-s1's post-merge live re-run showed "21 tests using 2 workers") against the single, shared `wuce-staging` server process. Because the counter is a single process-wide number with no attribution to which spec's request caused which increment, a real (or accidentally-real) call triggered by one spec's concurrently-running test can land inside a *different* spec's before/after window and fail that spec's assertion for a reason entirely unrelated to its own correctness. This is exactly what happened live: `bri-s3.4`'s combined AC1/AC2/AC3/AC5 test captured `beforeCount=1`, then observed `afterCount=4` (a jump of 3 attributable to other concurrent activity), failing the `toBe(beforeCount)` assertion.

## Architecture Constraints

- **Fix scoped to the CI job invocation, not the counter's implementation.** True per-request attribution (threading a per-worker identifier through the async chain from an incoming HTTP request to the `https.request` instrumentation, e.g. via `AsyncLocalStorage`) is a larger, higher-risk change to `server.js`'s request-handling path for a problem that a much smaller, already-precedented fix fully eliminates.
- **Precedent exists in this exact repo:** `.github/workflows/e2e.yml`'s Scenario A job already uses `--workers=1` as "a deliberate, narrowly-scoped-to-this-job fix, not a global playwright.config.js change" (a2ccf-s1) for an unrelated but structurally similar concurrency-on-a-shared-resource flake. This story follows the same pattern for the same class of reason: serializing removes the race entirely, rather than trying to out-engineer it.
- **`playwright.config.js` itself is unaffected** -- local/dev runs keep their existing default parallelism; only the `staging-deploy.yml` smoke-test job's own `run:` line changes.

## Dependencies

- **Upstream:** dss-s1 (staging-safe test endpoint gate) -- this gap was only visible once dss-s1 made the counter genuinely reachable/functional on staging.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `.github/workflows/staging-deploy.yml`'s `smoke-test` job, When its Playwright invocation is inspected, Then it includes `--workers=1` on the `npx playwright test --grep "@mocked"` line.

**AC2:** Given the same job, When any other step in the same workflow file is inspected, Then no other job's Playwright invocation gained `--workers=1` as a side effect (change is scoped to exactly the one line).

**AC3:** Given `playwright.config.js` (the shared, non-CI-specific config), When it is inspected, Then it has NOT been modified -- local/dev test runs keep their existing default concurrency.

## Out of Scope

- Building true per-request/per-worker attribution in `server.js` (AsyncLocalStorage or equivalent) -- rejected in favour of the simpler, precedented serialization fix; may be revisited later if job runtime becomes a real constraint.
- Investigating exactly which other code path produced the 3 extra real-looking calls observed in the bri-s3.4 incident -- serializing the job makes this no longer observable/relevant for the CI gate's own correctness, though it may still be worth a separate curiosity-driven investigation later.
- Any change to the 20x-repeat `bri-s3.4-cross-tenant-repeat-gate.yml` workflow -- that workflow already runs a single spec file with no `--grep` fan-out; out of scope unless it's shown to share this exact race (not evidenced).

## NFRs

- **CI runtime:** Serializing roughly doubles this job's wall-clock time (5 spec files, ~21 tests, 2 workers -> 1). Must stay within the job's existing 10-minute `timeout-minutes` budget.

## Complexity Rating

**Rating:** 1 -- a one-line CI workflow change with a directly-precedented rationale in the same repo.
**Scope stability:** Stable.
