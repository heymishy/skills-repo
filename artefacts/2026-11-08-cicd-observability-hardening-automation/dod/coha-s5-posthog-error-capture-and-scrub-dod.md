# Definition of Done: Production error capture to PostHog with tenant text scrubbed

**PR:** https://github.com/heymishy/skills-repo/pull/1087 (merge commit e7954dc8f) | **Merged:** 2026-11-13 (22:27 UTC on 2026-11-12)
**Story:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s5-posthog-error-capture-and-scrub.md
**Test plan:** artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s5-posthog-error-capture-and-scrub-test-plan.md
**DoR artefact:** artefacts/2026-11-08-cicd-observability-hardening-automation/dor/coha-s5-posthog-error-capture-and-scrub-dor.md (signed off by Hamish King, 2026-11-13)
**Assessed by:** Claude (Sonnet 5.5), with the merge confirmed by the operator
**Date:** 2026-11-13

---

## AC Coverage

Verification-strength tags: `integration-real-code` means the real production code ran (the real `createApp()` and real server startup in a child process, the real `auth.js` and `auth-email.js` bootstrap paths) with a local sink standing in for PostHog. No AC has `live-verified` or `production-observed` evidence yet: nothing has been sent to the real PostHog project from the deployed app (see Follow-up actions 1 and 2).

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Criterion: a request that throws produces exactly one scrubbed `$exception` event and still returns 500. Real `createApp()` in a child process with the injected throwing router drives the production `.catch`; the sink receives exactly one event whose properties are exactly the kept keys; client gets 500 | `tests/check-coha-s5-error-capture.js` (77 tests), `integration-real-code` | The throwing route is injected through a new `createApp(options.router)` seam, because no route in the real router can be made to throw from outside (115 routes probed at planning). Recorded in the story and DoR contract. |
| AC2 | ✅ | Criterion: an unhandled rejection is captured and the process keeps running. Child process raises an unhandled rejection (and an uncaught exception); the sink receives an event and the process is still serving afterwards | same file, `integration-real-code` | Autocapture is only enabled when another `uncaughtException` listener already exists, because `posthog-node` 5.40.0 calls `process.exit(1)` otherwise. The startup call is placed after the app's own handlers and a test pins the order. |
| AC3 | ✅ | Criterion: no tenant data, keys or source lines leave the app. Generated canary values per field (tenant name, email, database error string, URL slug, random identifiers) are absent from every field of every outgoing payload; route reports the pattern only; allow-listed message passes unchanged; a throw inside `before_send` sends nothing | same file, `integration-real-code` for the sink payloads, `unit` for the scrub functions | Scrubber was hardened in three review rounds so it fails closed. Accepted risk: stack-frame function names that are plain identifiers are kept. |
| AC4 | ✅ | Criterion: the real `tenant_admin_bootstrap_failed` paths capture only the fixed code. Real bootstrap failure in `auth.js` and in `auth-email.js` yields one event carrying the code only, no `tenantId` or `reason`; return value `false` and the log line unchanged | same file, `integration-real-code` | None |
| AC5 | ✅ | Criterion: `e2e-test-` identities send nothing. Proved at both bootstrap call sites, where the identity is known | same file, `integration-real-code` | The story's catch-block idea of a header-supplied test identity was built and then removed after review found any caller could use it to hide their own request from monitoring. Suppression now applies only where the identity is trustworthy (the bootstrap call sites). |
| AC6 | ✅ | Criterion: unset key means a clear startup line, no-op capture, normal 500. Child process started with no key: startup log line present, no event, request returns 500 | same file, `integration-real-code` | None |
| AC7 | ✅ | Criterion: staging events carry `environment: "staging"` and the staging key. Child process in staging mode with different staging and production keys: event carries `environment: "staging"` and the sink sees the staging key | same file, `integration-real-code` | None |
| AC8 | ✅ | Criterion: a down or slow PostHog adds at most 200 ms and never crashes. Unreachable and hanging sinks: 500 returned within the bound, no key in the log, process alive | same file, `integration-real-code` | None |
| AC9 | ✅ | Criterion: startup wiring is its own function; the unwired stub throws and is contained. Real startup path with test keys reaches the sink; with no init the stub throws the exact `Adapter not wired: error-capture...` message, the caller contains it and the 500 is unchanged | same file, `integration-real-code` | Added a minimal `SIGTERM`/`SIGINT` handler (flush up to 2 seconds, then exit 143/130), because the app had no shutdown handler although the story assumed one. Registered once, inside `wireErrorCapture`. |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures; they are recorded here and will be surfaced by /trace.

---

## Scope Deviations

None against the story's Out of Scope list (no remediation, no GitHub issues, no migration of the two existing hand-built `captureException` call sites, no OTel, no Teams, no alert rules).

Three additions beyond the plain story wording, all recorded in the plan, the PR body and the corrected story and DoR contract: the `createApp(options.router)` seam, the `SIGTERM`/`SIGINT` flush handler, and the autocapture guard.

One governed file outside the story's own touch points changed during the PR: `scripts/run-all-tests.js` (commit 0087442ed). The new test file was added to `SEQUENTIAL_EXCLUSIVE_LIST`, because running it beside `tests/check-cat-s1-core-trace-builder.js` on the CI's two-slot test pool pushed that file's hard 50 ms directory-walk assertion to 52-56 ms and failed PR Checks. Reproduced locally with two-CPU affinity (3 of 4 runs failed with both running; 5 of 5 passed with cat-s1 alone at about 28 ms). Nothing was loosened.

---

## Test Plan Coverage

**Tests from plan implemented:** 26 planned, 77 implemented (the plan's cases were expanded into per-field and per-environment cases, plus tests added by the review rounds)
**Tests passing in CI:** 77 of 77, and PR Checks "Lint, typecheck, test, build" passed on the final commit (0087442ed) after the fix above; the E2E Playwright run, Cross-tenant isolation, Assurance, Watermark, Trace Validation and Vulnerability check runs also passed on that commit.

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| Scrubbing (AC1, AC3) | ✅ | ✅ | Generated canaries per field |
| Client lifecycle, suppression, unwired stub (AC5, AC6, AC7, AC9) | ✅ | ✅ | |
| Catch-block capture and router seam (AC1, AC8) | ✅ | ✅ | Real `createApp()` in a child process |
| Startup wiring and signal-time flush (AC9) | ✅ | ✅ | Wiring test asserts a differentiating outcome (event with the environment's key reaches the sink) |
| Unhandled rejection (AC2) | ✅ | ✅ | |
| Bootstrap call sites (AC4, AC5) | ✅ | ✅ | |
| NFR checks | ✅ | ✅ | |

**Gaps (tests not implemented):**
None against the plan. Verification script scenario 10 (a deliberate staging error appears in PostHog Error Tracking) is a manual post-merge step, not an automated test, and has not been run (Follow-up action 1).

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: PostHog outage cannot slow or fail a request (at most 200 ms added) | ✅ | AC8 tests with unreachable and hanging sinks |
| Performance: last batch flushed on shutdown | ✅ | Signal-time flush (bounded at 2 seconds) added and tested |
| Security and privacy: allow-list scrubbing, no tenant data, key or source lines, fails closed | ✅ | AC3 canary tests; three hardening rounds after review; cross-task security review found no leaks in probes |
| Isolation: test and staging traffic cannot reach production issues | ⚠️ | Test identities and the `environment` label are proved in code; whether staging and production share one PostHog project is still unverified (operator statement only), so the `environment` label is the only separation and coha-s6 must filter on it |
| Cost: within 100,000 free exceptions per month | ⚠️ | One event per error is asserted; there is no rate limit, so an error storm sends one event per failing request (queue capped at 1,000 in memory) |

NFR profile status left at Active, not Verified: two rows are only partly evidenced and coha-s6 and coha-s7 add further rows to the same profile.

---

## Metric Signal

Metric 4 (Production-defect detection latency) lists no contributing stories in `pipeline-state.json`, and the story's own Benefit Linkage states it does not move until coha-s6 opens a GitHub issue from the PostHog record. The measurement-ready question therefore does not apply to this story: no signal is recorded and no deferred-item registration is made.

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Production-defect detection latency (Metric 4) | ❌ (baseline still unknown) | After coha-s6 ships and the first real production error produces a GitHub issue | coha-s5 supplies the "defect appeared" timestamp in PostHog; the metric needs the bridge to start moving |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

All nine ACs are satisfied on `integration-real-code` evidence. The verdict carries deviations because the evidence stops at a local sink: the claimed real-world effect (an event arriving in the real PostHog project, labelled and scrubbed) has not been observed, and the story's accepted-risk entry has not been logged.

**Follow-up actions:**
1. Operator: run verification script scenario 10 after the next staging deploy: cause a deliberate failing page on staging and confirm a scrubbed event with `environment: "staging"` appears in PostHog Error Tracking with no tenant text. This upgrades AC1, AC3 and AC7 from `integration-real-code` to `live-verified`.
2. Operator: confirm `POSTHOG_KEY_PROD` is set on the production Fly app and `POSTHOG_KEY_STAGING` on the staging Fly app (names only, never print values). Without them capture is a no-op by design (AC6), so nothing is captured on that app.
3. Operator: confirm whether staging and production share one PostHog project, by comparing the two keys without printing them. coha-s6 filters on `environment = production` either way.
4. Decision pending: log the accepted risk "stack-frame function names that are plain identifiers are kept" in `decisions.md` as a RISK-ACCEPT (currently documented only in code, one test and the PR body). Operator has not yet answered.
5. Decision pending: whether to add a per-minute rate limit on captured events as a follow-up story (not required by any AC).
6. Follow-up story candidate: move the two existing hand-built `captureException` call sites onto the new module (already named in the story's Out of Scope).

---

## DoD Observations

1. **The story assumed a shutdown path that did not exist.** The story wording said capture would be flushed "in the existing shutdown path"; the app had none. Found at implementation planning and corrected in the story, test plan and DoR contract before coding. Tag: /improve candidate (`/definition` should have the author confirm named existing code paths exist by reading them, not recall).
2. **A third-party SDK default was a process-level hazard.** `posthog-node` 5.40.0 autocapture calls `process.exit(1)` from its `uncaughtException` handler when no other listener exists. Found by task review, not by the story. Mitigated by enabling autocapture only when a listener exists, placing the startup call after the app's handlers and pinning the order in a test. Tag: /improve candidate (a "read the SDK's handler behaviour before enabling process-level hooks" prompt for stories that add them).
3. **An identity shortcut was removable surface.** An early catch-block version read an `x-test-identity` header; review showed any caller could use it to suppress monitoring of their own requests. Removed. Test-identity suppression now lives only where the identity is known.
4. **A new CPU-heavy test broke an unrelated timing assertion in CI only.** `check-cat-s1-core-trace-builder.js` has a hard 50 ms assertion that passes alone and on a fast local machine but fails when a process-spawning test shares the CI's two-slot pool. The local full-suite run did not show it; only restricting to two CPUs did. Fixed by moving the new file into the runner's exclusive phase. Tag: /improve candidate (any story adding a test that spawns servers should be checked against `SEQUENTIAL_EXCLUSIVE_LIST` at DoR, and `check-cat-s1` is a candidate for a tolerance review by its owner).
5. **Known unrelated full-suite failures on the final commit** (local run, 851 files, 6 failed): `check-pipeline-state-integrity` (the existing `tfhc-s1` item), `check-p3.5-validate-trace` (PowerShell 5 parse error), `check-rtvap-s1-archived-test-plan-coverage` (WSL `bash` missing), and timing flakes `check-pcr-s1-test-runner` (per-file average 777 ms against 750 ms), `check-p4-enf-second-line`, `check-rb-s3-harness-agnostic-instructions`. None are caused by this change.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Production error capture to PostHog with tenant text scrubbed".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
