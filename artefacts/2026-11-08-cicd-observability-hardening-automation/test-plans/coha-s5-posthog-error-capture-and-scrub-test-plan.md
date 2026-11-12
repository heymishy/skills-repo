# Test Plan: Production error capture to PostHog with tenant text scrubbed

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s5-posthog-error-capture-and-scrub.md
**Epic reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/epics/coha-e1-detect-and-alert.md
**Review reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/review/coha-s5-review-3.md (PASS, run 3)
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-13
**Test runner (read from `package.json`):** `npm test` runs `node scripts/run-all-tests.js`; each check is a plain Node script named `tests/check-<slug>.js` that prints pass and fail counts and exits non-zero on failure. The new file is `tests/check-coha-s5-error-capture.js`, run with `node tests/check-coha-s5-error-capture.js`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | A throwing request produces exactly one `$exception` event with the exact kept keys and a 500 | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | An unhandled rejection is captured and the process keeps running | — | 1 test | — | — | — | 🟢 |
| AC3 | No tenant data (generated and fixed shapes) in any field, including `route`, `distinct_id` and source lines | 6 tests | 1 test | — | — | — | 🟢 |
| AC4 | Real bootstrap failure paths in `auth.js` and `auth-email.js` capture the fixed code only | — | 2 tests | — | — | — | 🟢 |
| AC5 | `e2e-test-` identity sends nothing | 1 test | 1 test | — | — | — | 🟢 |
| AC6 | Unset key means no-op, clear startup log, request still 500 | 1 test | 1 test | — | — | — | 🟢 |
| AC7 | Staging events carry `environment: "staging"`, never `production` | 2 tests | 1 test | — | — | — | 🟢 |
| AC8 | Unreachable or slow endpoint does not break or slow the request beyond 200 ms | — | 1 test | — | — | — | 🟢 |
| AC9 | Real startup wiring delivers an event; unwired state is contained and logged | 1 test | 2 tests | — | — | — | 🟢 |

All automated. The deployed-environment behaviour (events reaching the real PostHog project) is a manual smoke scenario, not an AC gap: it is recorded as the post-merge check in the verification script.

---

## Coverage gaps

None. Real delivery to PostHog is not automated by design (tests point the SDK at a local sink with a fake key); the story marks AC3 as `integration-real-code`, not `live-verified`, until the coha-s6 live check and the post-deploy smoke scenario.

---

## Test Data Strategy

**Source:** Synthetic (generated in test setup) plus a local HTTP sink standing in for the PostHog host. No real keys, no network egress.
**PCI/sensitivity in scope:** No. The "tenant data" is invented strings: a tenant name, an email address, a database-style error string with an identifier, and identifiers generated fresh on each run.
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A route in the real server that throws | Real route with an injected failing adapter, chosen at implementation and recorded in the test | None | The test must use the real `createApp()` from `server.js`, started once in a child process (re-requiring `server.js` in-process hangs; see memory note) |
| AC2 | An unhandled rejection raised after the server is up | Test-triggered | None | |
| AC3 | Four tenant-data shapes plus random identifiers inserted into message, properties and URL on each run | Generated | Synthetic only | Assertion searches the whole serialised payload and the `distinct_id` |
| AC4 | A failing tenant admin bootstrap through both real routes | Real handlers with the bootstrap adapter set to throw | None | Mock-shape rule: the adapter mock must return the shape the real adapter returns on success |
| AC5 | Request with identity `e2e-test-user` | Synthetic | None | |
| AC6 | Environment with the key variable removed | Environment of the child process | None | |
| AC7 | Child process with `NODE_ENV=staging` and, in a second run, differing staging and production keys | Environment of the child process | Fake keys | Keys are fixed fake strings; the test never prints them |
| AC8 | Sink that never answers, then one that answers after 2 seconds | Local test server | None | |
| AC9 | Real startup path with a test key and the sink as host; second run with initialisation skipped | Environment of the child process | Fake key | |

### PCI / sensitivity constraints

None. Tests must never print the fake keys, and the log-secrecy NFR test asserts that.

### Gaps

None.

---

## Unit Tests

All unit tests exercise the new module `src/web-ui/modules/error-capture.js` directly, with the SDK constructor injected. They fail now because the module does not exist.

### scrubEvent_keepsOnlyNamedKeys_andFixedDistinctId

- **Verifies:** AC1, AC3
- **Precondition:** an SDK-shaped `$exception` event carrying extra properties `tenantId` and `reason` and a caller-supplied `distinct_id`
- **Action:** pass it to the `before_send` hook
- **Expected result:** properties are exactly `$exception_list`, `$exception_level`, `$exception_fingerprint` (if present), `$lib`, `$lib_version`, `$is_server`, `$geoip_disable`, `$process_person_profile` (false), `environment`, `route`, `code`; `distinct_id` is `server-error-capture`; person processing is off
- **Edge case:** Yes, event without a fingerprint

### scrubEvent_removesTenantShapes_fromMessage

- **Verifies:** AC3
- **Precondition:** four messages: a tenant name, an email address, a database error string containing an identifier, and a string made of random identifiers generated this run
- **Action:** run each through the hook
- **Expected result:** the outgoing message is the error class plus the fixed code; none of the four values appears anywhere in the serialised event
- **Edge case:** Yes, generated values differ on every run (the test prints the seed on failure so a failure can be reproduced)

### scrubEvent_keepsAllowListedMessageUnchanged

- **Verifies:** AC3
- **Precondition:** an event whose message exactly equals an allow-listed code
- **Action:** run through the hook
- **Expected result:** message unchanged
- **Edge case:** No

### scrubEvent_removesSourceContextLines_keepsFrames

- **Verifies:** AC3
- **Precondition:** frames carrying `pre_context`, `context_line` and `post_context` that contain a tenant string
- **Action:** run through the hook
- **Expected result:** the three fields are absent from every frame; function name, file and line number frames remain
- **Edge case:** No

### scrubEvent_routeIsPattern_notRawUrl

- **Verifies:** AC3
- **Precondition:** capture context where the raw URL is `/products/<random-slug>?token=<random>`
- **Action:** build the event
- **Expected result:** `route` is the matched pattern or the fixed label; neither the slug nor the query string appears
- **Edge case:** Yes, URL with query string

### scrubEvent_throwingHook_dropsEvent

- **Verifies:** AC3
- **Precondition:** an event shape that makes the scrubber throw (for example a circular property)
- **Action:** run through the hook
- **Expected result:** the hook returns `null` and nothing is sent
- **Edge case:** Yes

### captureServerError_suppressesE2eIdentity

- **Verifies:** AC5
- **Precondition:** capture context with identity `e2e-test-user`
- **Action:** call `captureServerError`
- **Expected result:** the injected client's capture method is never called
- **Edge case:** No

### initErrorCapture_unsetKey_returnsNotWired_andNoOps

- **Verifies:** AC6
- **Precondition:** environment without the key for the active environment
- **Action:** call `initErrorCapture`
- **Expected result:** returns `{ wired: false }`, logs a message that names the missing variable and no key value, and later calls to `captureServerError` do not throw
- **Edge case:** No

### initErrorCapture_resolvesStagingAndProductionKeys_neverFallsBack

- **Verifies:** AC7
- **Precondition:** only the production key set, environment `staging`
- **Action:** call `initErrorCapture`
- **Expected result:** not wired and logged; the production key is never used for staging
- **Edge case:** Yes

### captureServerError_setsEnvironmentProperty

- **Verifies:** AC7
- **Precondition:** wired with environment `staging`
- **Action:** capture one error
- **Expected result:** the event's `environment` is `staging`
- **Edge case:** No

### captureServerError_beforeInit_throwsNotWiredMessage

- **Verifies:** AC9
- **Precondition:** module freshly loaded, `initErrorCapture` not called
- **Action:** call `captureServerError`
- **Expected result:** throws an error whose message is `Adapter not wired: error-capture. Call initErrorCapture() with a real implementation before use.`
- **Edge case:** No

### scrubEvent_thrownErrorWithTenantReason_neverSendsReason

- **Verifies:** AC1, AC4
- **Precondition:** capture context built the way `auth.js:131` does, with `{ tenantId, reason }`
- **Action:** build the event
- **Expected result:** neither value is in the event
- **Edge case:** No

---

## Integration Tests

All run the real `createApp()` from `src/web-ui/server.js`, started once in a child process by a harness script, with the SDK host pointed at a local sink and a fake key. They fail now because `error-capture.js` and its startup wiring do not exist.

### throwingRequest_producesExactlyOneEvent_andReturns500

- **Verifies:** AC1
- **Components involved:** `createApp()` catch block, `error-capture.js`, local sink
- **Precondition:** server started with a route whose injected adapter throws
- **Action:** send a request to that route
- **Expected result:** the client gets 500; the sink receives exactly one `$exception` with a populated `$exception_list`; the property keys are exactly the named kept keys plus `environment`, `route`, `code`; the number of events per error is recorded in the test output (cost NFR)

### unhandledRejection_isCaptured_processKeepsRunning

- **Verifies:** AC2
- **Components involved:** autocapture, the process's own handler
- **Action:** trigger an unhandled rejection, then send a normal request
- **Expected result:** one `$exception` reaches the sink and the normal request still returns 200

### urlWithTenantSlug_reportsOnlyRoutePattern

- **Verifies:** AC3
- **Action:** request `/products/<random-slug>?x=<random>` against a throwing route
- **Expected result:** the slug and the query value appear in no field of the sink payload, including `route` and `distinct_id`

### bootstrapFailure_authJs_capturesFixedCodeOnly

- **Verifies:** AC4
- **Components involved:** the real tenant admin bootstrap function in `auth.js` with its adapter set to throw `Error("<random tenant text>")`
- **Expected result:** one event with code `tenant_admin_bootstrap_failed`, no `tenantId`, no `reason`, none of the random text; the function still returns `false` and the existing `_logger.warn` line is still written

### bootstrapFailure_authEmailJs_capturesFixedCodeOnly

- **Verifies:** AC4
- **Expected result:** same as above through `auth-email.js`; the existing `console.warn` line is still written and the function returns `false`

### e2eIdentityRequest_sendsNothing

- **Verifies:** AC5
- **Action:** a request authenticated as `e2e-test-user` hits a throwing route
- **Expected result:** the client gets 500 and the sink receives nothing within one second

### unsetKey_startupLogsClearly_requestStill500

- **Verifies:** AC6
- **Precondition:** child process started with the key variable removed
- **Expected result:** a startup log line names the missing variable and shows no key value; a throwing request returns 500; the sink receives nothing

### stagingRun_labelsStaging_neverProduction

- **Verifies:** AC7
- **Precondition:** two runs: `NODE_ENV=staging` with the staging key set; and with differing staging and production fake keys
- **Expected result:** every event has `environment: "staging"` and carries the staging key (the sink records the key it received, compared inside the test and never printed)

### unreachableOrSlowEndpoint_doesNotBreakOrSlowRequest

- **Verifies:** AC8
- **Precondition:** sink never answers in one run, answers after 2 seconds in another; baseline request time measured with capture off
- **Expected result:** the client still gets 500; the response time is within baseline plus 200 ms; the failure is logged without any key; the process is alive afterwards

### realStartup_wiresCapture_andEventCarriesKey

- **Verifies:** AC9
- **Components involved:** the real startup path in `server.js` that calls `initErrorCapture`
- **Action:** start via the real startup path with test environment variables, then throw
- **Expected result:** the event reaches the sink, carries the fake key and the right `environment` (a differentiating outcome, not a check that a function was assigned)

### unwiredStartup_containedAndLoggedLoudly

- **Verifies:** AC9
- **Precondition:** harness starts `createApp()` without calling `initErrorCapture`
- **Expected result:** a throwing request still returns 500, the log contains `Adapter not wired: error-capture`, and the process stays up

---

## NFR Tests

### Cost: events per error recorded and bounded

- **NFR addressed:** Cost
- **Measurement method:** count sink events per single thrown error in the AC1 integration test
- **Pass threshold:** exactly 1 `$exception` event per request error (autocapture must not duplicate the caught one)
- **Tool:** Node check script

### Security: no key and no source lines in logs or events

- **NFR addressed:** Security and privacy
- **Measurement method:** capture the child process's output and every sink payload across all integration runs; search for the fake key values and a marker string placed in a source line
- **Pass threshold:** zero occurrences
- **Tool:** Node check script

### Performance: shutdown flushes the last batch

- **NFR addressed:** Performance
- **Measurement method:** raise an error, then send the process `SIGTERM` (or `SIGINT`) immediately; the handler under test is the one this story adds, since the app had none
- **Pass threshold:** the sink still receives the event before exit
- **Tool:** Node check script

---

## Out of Scope for This Test Plan

- Delivery to the real PostHog project, and PostHog's own processing (grouping, alert rules): covered by the post-merge smoke scenario and the coha-s6 live check.
- The bridge, GitHub issues, incident records (coha-s6).
- Moving the two existing hand-built `captureException` call sites onto the new module (follow-up).
- Browser or layout behaviour: this story has no UI.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| The real PostHog service is never contacted by the automated tests | Tests must not send traffic to the shared project (staging and production are assumed to share one key; the operator stated this on 2026-11-13) | Local sink with a fake key; one manual smoke scenario after deploy; AC3 tagged `integration-real-code` |
| Installed `posthog-node` version could change which keys the SDK adds | Property list was read from version 5.40.0 | The AC1 exact-keys assertion fails loudly on an upgrade, which is intended |
| Choice of throwing route in the real server | No route in the real router can be made to throw from outside (115 routes probed at planning) | `createApp(options)` takes an optional `options.router`; tests inject a throwing router so the real production `.catch` block is the code under test |
