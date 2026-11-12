## Story: Alert-to-GitHub-issue bridge for new production error issues

**Status:** DRAFT run 3, awaiting re-review. Revised 2026-11-13 after `review/coha-s6-review-1.md` (2 HIGH, 4 MEDIUM, 2 LOW) and `review/coha-s6-review-2.md` (1 HIGH, 1 MEDIUM, 1 LOW). Second half of the split of the 2026-11-13 draft; the first half is coha-s5 (capture and scrub). The incident record that was AC4 moved to coha-s7. Replaces the notification half of coha-s4 (bounded production-log scan), which is superseded per the 2026-11-13 decision in `decisions.md`.
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

- **First task, before `/test-plan`: capture one real PostHog payload.** The operator approved (2026-11-13) creating one PostHog webhook destination on the live project pointing at a throwaway receiver, and running its test function once. The scrubbed sample is committed as the fixture used by every test below (mock-shape rule). No test may use an invented payload shape. Exit condition for this task: the captured payload is confirmed to contain the fixed error code, first-seen time, occurrence count, the PostHog issue id and URL, and `environment`. If `environment` is absent, the decision between filtering in the PostHog alert only and having the bridge read the issue from the PostHog API is made before `/test-plan`. The destination is deleted or repointed to the real bridge afterwards. The issue body also carries the PostHog issue id as a marker line, used by the take-over rule above.
- **The bridge is a route in the running app** that PostHog's webhook destination calls; it runs only when called, never as a standing watcher (`product/mission.md`, `product/constraints.md` #11). It follows the existing `/webhook/stripe` route (`server.js` around line 4236): no user session, its own verification, exempt from the CSRF guard that mutating routes use, registered in `server.js` and wired at startup.
- **Request limits:** non-POST requests return 405; a body over 16 KB returns 413 and is rejected before it is parsed; an unparseable or wrongly shaped body returns 400.
- **Authentication:** a shared secret in a request header, compared in constant time (`crypto.timingSafeEqual`), supplied as a Fly secret. A missing or wrong secret returns 401 and does nothing else.
- **Duplicate state is a database table with a unique key.** The app creates `production_error_issues` at boot, as it does for `credit_audit_log` and the other tables; columns include the PostHog issue id (unique), a status (`pending` or `created`), the GitHub issue number and timestamps. The handler inserts the row with status `pending` and a claim time, creates the GitHub issue, then marks the row `created`. Rules for a row that already exists: status `created` is a duplicate (return 200, do nothing); status `pending` younger than a claim window of 2 minutes is in flight (return 200, do nothing); status `pending` older than the claim window is taken over with a single conditional update that only one caller can win, and the winner first searches the target repo for an existing issue whose body carries the PostHog issue id marker (so a crash between creating the issue and marking the row cannot produce a second issue), and creates one only if none exists. This survives restarts and a second Fly machine, and two simultaneous deliveries cannot both create an issue.
- **Injectable adapter rule (D37):** the GitHub issue creation is an injectable adapter whose stub throws. The plan names the production wiring as its own task and the wiring test asserts an observable outcome against a local fake GitHub API (the request has the right path, the token in the `Authorization` header, and the exact title and body), not that a function reference was assigned.
- **Credentials (`product/constraints.md` #12):** the webhook shared secret and a GitHub token with issue-write access on the target repo are Fly secrets, never tracked files, never logged. The existing app's GitHub writes use a per-user session token; this bridge has no session, so it uses its own server-owned token.
- **Target repo from configuration, not code:** the repo comes from an environment variable. It is `heymishy/skills-repo` today, which is a PUBLIC repository, so every issue is public.
- **Issue content is fixed fields only:** title is the fixed error code from the payload; the body holds first-seen time, occurrence count, `environment`, and a link to the PostHog issue. No exception message, no stack frame, no file path, no property from the payload beyond those fields. A label `production-error` is applied.
- **Environment filter:** coha-s5 events carry `environment`, and staging and production share one PostHog key. The bridge acts only on `environment = production`. The PostHog alert should also filter on it; the bridge check is the guarantee.

## Dependencies

- **Upstream:** coha-s5 (errors must be captured for there to be an issue to report). The bridge is built and tested against the captured fixture before coha-s5 ships, but the live check (AC6) needs both.
- **Operator prerequisites:** approval already given for the throwaway-receiver payload capture and one PostHog webhook destination on the live project; a shared secret and a GitHub token set as Fly secrets.
- **Downstream:** coha-s7 (incident record for each bridge-opened issue), and the incident-triage feature's first real recorded incident.

## Acceptance Criteria

**AC1:** Given PostHog calls the bridge with a new-issue alert payload for a production error and the correct shared secret, When the bridge handles it, Then exactly one GitHub issue is opened in the configured repo with the `production-error` label, a title equal to the fixed error code, and a body containing only first-seen time, occurrence count, environment and a link to the PostHog issue, and no exception message or stack content.

**AC2:** Given a PostHog issue id that already has an issue, When the same payload arrives again, or two copies arrive at the same moment, or the handler is restarted between deliveries, Then no second GitHub issue is opened, each tested through the real route handler against the `production_error_issues` table. Given a row stuck in `pending` older than the claim window because the process stopped after the insert, When the payload is delivered again, Then exactly one issue exists afterwards, whether or not the first attempt had already created it on GitHub.

**AC3:** Given a request with a missing or wrong shared secret, When the bridge handles it, Then nothing is created or inserted and it returns 401; a non-POST request returns 405; a body over 16 KB returns 413 without being parsed; a malformed body returns 400.

**AC4:** Given a payload whose `environment` is `staging` or is missing, When the bridge handles it, Then no GitHub issue is opened and no row is inserted, and it returns 200 so PostHog does not retry.

**AC5:** Given GitHub rejects or does not answer the issue creation, When the bridge handles a new payload, Then it returns 503, the row is not left marked `created`, and a later delivery of the same payload opens exactly one issue.

**AC6:** Given the alert destination exists on the live PostHog project, When its test function is run against the bridge, Then the request arrives with the secret header intact and the payload parses into the same fixture shape the tests use. This is `live-verified` evidence and is recorded in the DoD. If the header cannot be sent, the story falls back to a scheduled job reading PostHog's API, per the decision's revisit trigger.

**AC7:** Given the real server startup path runs with test environment variables and a local fake GitHub API, When a valid production payload is posted, Then the fake GitHub API receives one request with the right path, the token in the `Authorization` header and the expected title and body.

**AC8:** Given the issue-creating adapter has not been wired, When a valid production payload is posted, Then the bridge returns 503 and logs a "not wired" error rather than crashing, and no row is left marked `created`.

## Out of Scope

- Capturing or scrubbing errors (coha-s5).
- Creating incident records from the opened issue (coha-s7).
- Any remediation or auto-fix; issue creation only.
- Teams notification (on hold until Teams is in use).
- Changing PostHog's alert rules beyond creating the one destination.
- OpenTelemetry (OTel) logs, traces or metrics, and any second vendor.
- Comment, close or reopen of issues when an error recurs or is fixed.

## NFRs

- **Performance:** the route answers within 2 seconds under normal conditions and does not block on anything but the database insert and one GitHub call.
- **Security:** shared-secret authentication in constant time, request size limit, payload validation, no secrets in logs or issues, issue content limited to the fixed fields (the repo is public).
- **Audit:** every bridge call (created, duplicate, wrong environment, rejected, failed) is logged without the secret and without payload content beyond the PostHog issue id.
- **Reliability:** duplicate and concurrent delivery cannot create duplicate issues (AC2); a GitHub failure can be retried safely (AC5). PostHog's own retry behaviour is undocumented; the bridge returns 503 for retryable failures and 200 for deliberate ignores.
- **Accessibility:** not applicable.

## Complexity Rating

**Rating:** 2
**Scope stability:** Unstable until the real payload is captured and the live webhook check (AC6) is done.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared
- [ ] Benefit linkage is written
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story (coha-s5 must be merged before the live check)
- [ ] NFRs identified
- [ ] Human oversight level confirmed from parent epic
- [ ] Real payload fixture captured and committed (first task)
- [ ] Operator prerequisites (shared secret, GitHub token, webhook destination) confirmed
