## Story: Alert-to-GitHub-issue bridge for new production error issues

**Status:** DRAFT run 5, awaiting re-review. Reinstated 2026-11-13 after the native-destination route was abandoned (see "coha-s6 — native PostHog GitHub destination abandoned, custom bridge reinstated" in `decisions.md`): the PostHog GitHub App's permission set is fixed and far broader than issue write, and the repository holds deploy and staging secrets a branch workflow can read. This is the run-3 design (commit 6e16356c7, reviewed PASS) with these changes: the first task no longer needs a throwaway receiver, the payload is a body we define ourselves, the "occurrence count" field is dropped (a "new issue created" event always has a count of 1), and a production-observed check is added (AC9). Because the story changed, it goes back through `/review`. The T3 test run of the native destination (one test issue, since closed) is evidence for the record only.
**Epic reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/epics/coha-e1-detect-and-alert.md
**Discovery reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/benefit-metric.md
**Spike evidence:** artefacts/2026-11-08-cicd-observability-hardening-automation/spikes/production-error-source-outcome.md and production-error-source-working-notes.md
**Decision reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/decisions.md (entries dated 2026-11-13)

## User Story

As a **delivery engineer**,
I want to **a GitHub issue opened automatically, once, the first time PostHog reports a new production error issue**,
So that **a captured error is queued for a fix without anyone having to notice the alert, and a staging or test error never reaches that queue**.

## Benefit Linkage

**Metric moved:** Production-defect detection latency (Metric 4)
**How:** with coha-s5 recording the error, this story makes the second timestamp of the revised measurement ("time between a production defect occurring and a GitHub issue for it existing") real. Metric 4 only starts moving when this story ships.

## Architecture Constraints

- **First task, before `/test-plan`: define the payload and prove the template renders it.** PostHog's `template-webhook` destination takes a `body` we write ourselves, so the bridge reads a small JSON document of our own design instead of PostHog's default event shape: PostHog issue id (`event.properties.$exception_issue_id`), fixed error code (the exception message, `$exception_values[1]`), environment (`event.properties.environment`), first-seen time (`event.properties.exception_timestamp`) and the PostHog issue link. The task renders that body template with PostHog's test invocation of the destination with its outgoing request simulated (no receiver and no live call), using a sample created-event, and records the rendered body and headers as the fixture. This replaces the old throwaway-receiver capture, which needed a public receiver that was never named. Open point the simulation cannot answer: whether a real `$error_tracking_issue_created` event carries the `environment` property. If it does not, the alert's environment filter and the bridge's environment check would both ignore every real production error. This is why AC9 (production-observed) exists, and it is the reason the bridge logs a distinct line for "ignored: environment missing". If a real event turns out to lack `environment`, the decision between reading the issue from the PostHog API and another route is made then, not assumed here.
- **The bridge is a route in the running app** that PostHog's webhook destination calls; it runs only when called, never as a standing watcher (`product/mission.md`, `product/constraints.md` #11). It follows the existing `/webhook/stripe` route (`server.js` around line 4236): no user session, its own verification, exempt from the CSRF guard that mutating routes use, registered in `server.js` and wired at startup.
- **Request limits:** non-POST requests return 405; a body over 16 KB returns 413 and is rejected before it is parsed; an unparseable or wrongly shaped body returns 400.
- **Authentication:** a shared secret in a request header (the destination's secret-headers input, encrypted and hidden in PostHog), compared in constant time (`crypto.timingSafeEqual`), supplied as a Fly secret. A missing or wrong secret returns 401 and does nothing else.
- **Duplicate state is a database table with a unique key.** The app creates `production_error_issues` at boot, as it does for `credit_audit_log` and the other tables; columns include the PostHog issue id (unique), a status (`pending` or `created`), the GitHub issue number and timestamps. The handler inserts the row with status `pending` and a claim time, creates the GitHub issue, then marks the row `created`. Rules for a row that already exists: status `created` is a duplicate (return 200, do nothing); status `pending` younger than a claim window of 2 minutes is in flight (return 200, do nothing); status `pending` older than the claim window is taken over with a single conditional update that only one caller can win, and the winner first searches the target repo for an existing issue whose body carries the PostHog issue id marker (so a crash between creating the issue and marking the row cannot produce a second issue), and creates one only if none exists. The issue body carries the PostHog issue id as a marker line for this rule. This survives restarts and a second Fly machine, and two simultaneous deliveries cannot both create an issue.
- **Injectable adapter rule (D37):** the GitHub issue creation is an injectable adapter whose stub throws. The plan names the production wiring as its own task and the wiring test asserts an observable outcome against a local fake GitHub API (the request has the right path, the token in the `Authorization` header, and the exact title, body and label), not that a function reference was assigned.
- **Credentials (`product/constraints.md` #12):** the webhook shared secret and a GitHub token are Fly secrets, never tracked files, never logged. The token's scope is the whole point of this route: it must be limited to the single target repo with issue read and write and nothing else (a fine-grained personal access token, or a GitHub App owned by the operator that holds only the issues permission; the operator picks one at DoR and records its expiry as a rotation action). PostHog's own GitHub App is deliberately not used, because its permissions cannot be narrowed (RISK recorded 2026-11-13). The existing app's GitHub writes use a per-user session token; this bridge has no session, so it uses its own server-owned token.
- **Target repo from configuration, not code:** the repo comes from an environment variable. It is `heymishy/skills-repo` today, which is a PUBLIC repository, so every issue is public.
- **Issue content is fixed fields only:** title is the fixed error code from the payload; the body holds first-seen time, environment, a link to the PostHog issue and the marker line. No exception message beyond the code, no stack frame, no file path, no property from the payload beyond those fields. A label `production-error` is applied by the bridge (coha-s7 keys on it).
- **Environment filter:** coha-s5 events carry `environment`, and staging and production send to one PostHog project (confirmed 2026-11-13: `POSTHOG_KEY_PROD` and `POSTHOG_KEY_STAGING` have identical digests). The bridge acts only on `environment = production`. The PostHog alert also filters on it; the bridge check is the guarantee.

## Dependencies

- **Upstream:** coha-s5 (merged, PR #1087; errors must be captured for there to be an issue to report). The bridge is built and tested against the fixture before AC6 and AC9 are checked live.
- **Operator prerequisites:** the webhook shared secret and the narrowly scoped GitHub token set as Fly secrets on the app that serves PostHog's call (staging first, for AC6); approval for creating one PostHog error-tracking alert with a `template-webhook` destination on the live project and for running its test function once; the choice between a fine-grained token and an operator-owned issues-only GitHub App.
- **Downstream:** coha-s7 (label and incident record for each bridge-opened issue; it keys on the `production-error` label the bridge applies), and the incident-triage feature's first real recorded incident.

## Acceptance Criteria

**AC1:** Given PostHog calls the bridge with a new-issue alert payload for a production error and the correct shared secret, When the bridge handles it, Then exactly one GitHub issue is opened in the configured repo with the `production-error` label, a title equal to the fixed error code, and a body containing only first-seen time, environment, a link to the PostHog issue and the PostHog issue id marker, and no exception message or stack content.

**AC2:** Given a PostHog issue id that already has an issue, When the same payload arrives again, or two copies arrive at the same moment, or the handler is restarted between deliveries, Then no second GitHub issue is opened, each tested through the real route handler against the `production_error_issues` table. Given a row stuck in `pending` older than the claim window because the process stopped after the insert, When the payload is delivered again, Then exactly one issue exists afterwards, whether or not the first attempt had already created it on GitHub.

**AC3:** Given a request with a missing or wrong shared secret, When the bridge handles it, Then nothing is created or inserted and it returns 401; a non-POST request returns 405; a body over 16 KB returns 413 without being parsed; a malformed body returns 400.

**AC4:** Given a payload whose `environment` is `staging` or is missing, When the bridge handles it, Then no GitHub issue is opened and no row is inserted, it returns 200 so PostHog does not retry, and the log line for a missing environment differs from the one for staging so a silent drop of real production errors can be told apart from a correct staging ignore.

**AC5:** Given GitHub rejects or does not answer the issue creation, When the bridge handles a new payload, Then it returns 503, the row is not left marked `created`, and a later delivery of the same payload opens exactly one issue.

**AC6:** Given the alert destination exists on the live PostHog project with the secret header, When its test function is run once against the deployed bridge (staging first) with the outgoing request live, Then the request arrives with the secret header intact, the body parses into the same fixture shape the tests use, and the bridge acts on it. This is `live-verified` evidence and is recorded in the DoD. Running it opens one real issue in the public repo, so it needs operator approval immediately before and the issue is closed afterwards.

**AC7:** Given the real server startup path runs with test environment variables and a local fake GitHub API, When a valid production payload is posted, Then the fake GitHub API receives one request with the right path, the token in the `Authorization` header and the expected title, body and label.

**AC8:** Given the issue-creating adapter has not been wired, When a valid production payload is posted, Then the bridge returns 503 and logs a "not wired" error rather than crashing, and no row is left marked `created`.

**AC9:** Given a real production error issue is first seen by PostHog after the bridge is live, When PostHog raises "issue created", Then exactly one GitHub issue exists for it and further occurrences open none. This is `production-observed` evidence and may legitimately be absent at merge; DoR classifies it with a RISK-ACCEPT in `decisions.md` and a post-merge action in `workspace/state.json` naming who confirms it, and until it is seen the DoD records COMPLETE WITH DEVIATIONS. It is also the only check that a real created event carries `environment`.

## Out of Scope

- Capturing or scrubbing errors (coha-s5).
- Creating incident records from the opened issue (coha-s7).
- Any remediation or auto-fix; issue creation only.
- Teams notification (on hold until Teams is in use).
- PostHog's native GitHub destination and its GitHub App (rejected 2026-11-13: permissions cannot be narrowed).
- Changing PostHog's alert rules beyond creating the one destination.
- OpenTelemetry (OTel) logs, traces or metrics, and any second vendor.
- Comment, close or reopen of issues when an error recurs or is fixed; occurrence counts in the issue.

## NFRs

- **Performance:** the route answers within 2 seconds under normal conditions and does not block on anything but the database insert and one GitHub call.
- **Security:** shared-secret authentication in constant time, request size limit, payload validation, no secrets in logs or issues, issue content limited to the fixed fields (the repo is public), a token that can only write issues on one repo.
- **Audit:** every bridge call (created, duplicate, staging, environment missing, rejected, failed) is logged without the secret and without payload content beyond the PostHog issue id.
- **Reliability:** duplicate and concurrent delivery cannot create duplicate issues (AC2); a GitHub failure can be retried safely (AC5). PostHog's own retry behaviour is undocumented; the bridge returns 503 for retryable failures and 200 for deliberate ignores.
- **Accessibility:** not applicable.

## Complexity Rating

**Rating:** 2
**Scope stability:** Unstable until the payload template is proven (first task) and the live webhook check (AC6) is done.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared
- [ ] Benefit linkage is written
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story (coha-s5 is merged)
- [ ] NFRs identified
- [ ] Human oversight level confirmed from parent epic
- [ ] Payload fixture from the simulated destination invocation committed (first task)
- [ ] Operator prerequisites (shared secret, narrowly scoped GitHub token and its expiry, webhook destination approval) confirmed
- [ ] AC9 classified at DoR with a RISK-ACCEPT and a post-merge action
