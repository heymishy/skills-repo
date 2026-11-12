# DoR Contract Proposal: Production error capture to PostHog with tenant text scrubbed

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s5-posthog-error-capture-and-scrub.md
**Date:** 2026-11-13

---

**What will be built:**
A new module `src/web-ui/modules/error-capture.js` with `initErrorCapture(envName, env, deps)` and `captureServerError(err, context)`. It creates its own `posthog-node` client (constructor injectable), resolves the key with the existing `resolvePostHogApiKey` rule (no fallback between environments), turns on `enableExceptionAutocapture`, and installs a fail-closed `before_send` hook that keeps only the named SDK properties plus `environment`, `route` and `code`, replaces the message with the error class plus a fixed code unless it matches a short allow-list, deletes `pre_context`, `context_line` and `post_context` from every stack frame, sets `distinct_id` to the fixed label `server-error-capture` with person processing off, and suppresses `e2e-test-` identities. Before it is wired, `captureServerError` throws `Adapter not wired: error-capture. Call initErrorCapture() with a real implementation before use.` In `server.js`: one call from the `.catch` in `createApp()` (wrapped so a capture failure, including the not-wired throw, is logged and never changes the 500), one startup wiring call as its own task, and a `shutdown()` call in the existing shutdown path. In `auth.js` and `auth-email.js`: one `captureServerError` call each beside the existing `tenant_admin_bootstrap_failed` log line, sending only the fixed code; the existing return value and log line stay as they are. A new test file `tests/check-coha-s5-error-capture.js` and a child-process harness helper that starts the real `createApp()` against a local sink with a fake key.

**What will NOT be built:**
Opening GitHub issues or incident records (coha-s6, coha-s7). Any change to `posthog-config.js` (the feature-flag client), `posthog-server.js` (the hand-built capture and `captureException`), or their two existing call sites. OpenTelemetry (OTel) logs, traces or metrics. Any second vendor. A pattern-definition UI. Any change to PostHog alert rules.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Real `createApp()` in a child process with a throwing route; sink receives exactly one event with the exact kept keys; client gets 500 | integration (with 1 unit test of the hook) |
| AC2 | Unhandled rejection raised in the running child; sink receives one event; a following request still returns 200 | integration |
| AC3 | Six unit tests of the hook with fixed and generated tenant values, route pattern, fixed `distinct_id`, source lines removed, fail-closed; one integration test with a tenant slug in the URL | unit / integration |
| AC4 | Real bootstrap failure through `auth.js` and `auth-email.js` with the adapter set to throw; sink receives the fixed code only; return value and log line unchanged | integration |
| AC5 | `e2e-test-` identity unit test and a real-server test; nothing at the sink | unit / integration |
| AC6 | Child process without the key: startup log line, 500 still returned, nothing sent | unit / integration |
| AC7 | `NODE_ENV=staging` run, and a run with differing fake staging and production keys; sink sees `environment: "staging"` and the staging key | unit / integration |
| AC8 | Sink that never answers and sink that answers after 2 seconds; response time within baseline plus 200 ms; process alive | integration |
| AC9 | The real startup wiring delivers an event carrying the fake key and environment; with initialisation skipped the request still returns 500 and logs `Adapter not wired: error-capture` | unit / integration |

**Assumptions:**
1. The real startup block in `server.js` runs only when the file is the main module and calls `validateRequiredEnvVars()`, which can exit the process. The startup wiring is therefore written as a small exported function (for example `wireErrorCapture(env)`) that the startup block calls and the test harness also calls, and AC9's test asserts the observable outcome through that real wiring function and the real `createApp()`. If the implementer finds that the real startup block can be run as a child process with test environment variables instead, that is preferred; if neither is possible, add a PR comment and do not mark the PR ready.
2. Staging and production use the same PostHog key (operator statement, 2026-11-13, unverified); the `environment` property is the separation, so no test sends traffic to the real project.
3. `posthog-node` 5.40.0 is installed and exposes `before_send` and `enableExceptionAutocapture`; the kept-property list was read from a real SDK event in the 2026-11-13 proof of concept.
4. Re-requiring `server.js` more than once in one test process hangs; the harness starts it once per child process.
5. A route in the real server that can be forced to throw through an injected adapter exists; the implementer chooses it and records it in the test.

**Estimated touch points:**
Files: `src/web-ui/modules/error-capture.js` (new); `src/web-ui/server.js` (catch block, startup wiring, shutdown); `src/web-ui/routes/auth.js` and `src/web-ui/routes/auth-email.js` (one capture call each, required by the AC4 tests); `tests/check-coha-s5-error-capture.js` (new); a harness helper under `tests/helpers/` (new). Services: PostHog (local sink only in tests). APIs: none new. Files that must not be touched: `src/web-ui/modules/posthog-config.js`, `src/web-ui/modules/posthog-server.js`, `src/web-ui/modules/pipeline-state-github-writer.js`, `src/web-ui/modules/product-rollup.js`.
