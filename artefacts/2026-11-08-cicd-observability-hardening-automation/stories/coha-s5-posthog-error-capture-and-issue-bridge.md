## Story: Production error capture to PostHog with an alert-to-GitHub-issue bridge

**Status:** DRAFT, awaiting operator review. Replaces coha-s4 (bounded production-log scan) per the 2026-11-13 decision in `decisions.md`; coha-s4's pipeline state is not changed until the operator confirms.
**Epic reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/epics/coha-e1-detect-and-alert.md
**Discovery reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/benefit-metric.md
**Spike evidence:** artefacts/2026-11-08-cicd-observability-hardening-automation/spikes/production-error-source-outcome.md and production-error-source-working-notes.md

## User Story

As a **delivery engineer**,
I want to **production errors captured automatically with the tenant text removed, grouped into issues, and a GitHub issue opened the first time a new one appears**,
So that **a production defect like the still-unfixed `tenant_admin_bootstrap_failed` bug is found and queued for a fix without anyone having to notice it by luck**.

## Benefit Linkage

**Metric moved:** Production-defect detection latency
**How:** today detection is manual and the earlier scan never worked. With capture at the app's single error path plus an issue opened on the first occurrence, "time between the error and the GitHub issue existing" becomes measurable.

## Architecture Constraints

- **Capture reuses the app's existing `posthog-node` client** created in `src/web-ui/modules/posthog-config.js`, with `enableExceptionAutocapture: true` and a `before_send` hook. The app has no Express: the single catch point for failing requests is the `.catch` in `createApp()` in `src/web-ui/server.js`, and one `captureException` call there covers every thrown request error.
- **Scrubbing is the app's job, in `before_send`:** replace tenant text in `$exception_list[*].value` and delete `pre_context`, `context_line` and `post_context` from every stack frame (the SDK has no switch for source lines). The hook is `before_send` (snake case) in `posthog-node` 5.40.0.
- **Warn-level errors are not captured by the SDK.** `tenant_admin_bootstrap_failed` is logged at warn level (`auth.js:131` through `_logger.warn`, `auth-email.js:91` through `console.warn`) and returns false. It needs an explicit capture call.
- **Existing hand-built exception events** from `captureException` in `src/web-ui/modules/posthog-server.js` lack `$exception_list`; this story decides whether to switch those two call sites to the SDK client so they group as issues.
- **Injectable adapter rule (D37) applies to the issue-creating call:** the GitHub issue creation is an injectable adapter whose stub throws; wiring to the real implementation is a separate named task with a test of observable behaviour (one issue, correct title and body), not a function-reference check.
- **Credentials (`product/constraints.md` #12):** the webhook shared secret and any GitHub token are Fly or GitHub secrets, never tracked files, never logged. The receiver rejects a request without the shared secret.
- **Triggered and bounded, never a standing process:** capture happens inside the running app; the bridge runs only when PostHog calls it.
- **Mock-shape rule:** the test fixture for the PostHog webhook payload comes from a real payload captured at the live webhook check (AC6), not invented.
- **No new vendor.** OpenTelemetry (OTel) logs and traces stay out of this story.

## Dependencies

- **Upstream:** none. coha-s1 (the Teams adapter) is no longer needed by this story.
- **Operator prerequisites:** a PostHog alert destination of type webhook on the existing project, and a shared secret set as a Fly secret.
- **Downstream:** the incident-triage feature's first real recorded incident (pins the drafter's provisional similarity threshold).

## Acceptance Criteria

**AC1:** Given a request whose handler throws, When it goes through the real `createApp()` server, Then exactly one `$exception` event with a populated `$exception_list` (type, message, stack frames) reaches the capture endpoint, and the client receives a 500.

**AC2:** Given an unhandled promise rejection occurs, When autocapture is enabled, Then an `$exception` event is captured even though the process's own handler only logs it.

**AC3:** Given an error message contains tenant text (a fixture tenant name), When the event is sent, Then the outgoing payload contains the fixture text in no field, including the message and the stack frame source lines, while the type and stack frames remain.

**AC4:** Given the real tenant admin bootstrap path fails (through the real route in `auth.js` and the real route in `auth-email.js`), When the failure is logged, Then an `$exception` event with a fixed code for `tenant_admin_bootstrap_failed` is captured, and the existing return value and log line are unchanged.

**AC5:** Given PostHog calls the bridge with a new-issue alert payload carrying the correct shared secret, When the bridge handles it, Then exactly one GitHub issue is opened in this repo containing the issue title, first-seen time, count and a link to the PostHog issue, and a repeat of the same PostHog issue id opens no second issue. A call with a missing or wrong secret opens nothing and returns 401.

**AC6:** Given the alert destination is created on the live PostHog project, When its test function is run against the bridge, Then the request arrives with the custom `Authorization` or shared-secret header intact and the payload shape matches the AC5 fixture. This is `live-verified` evidence and is recorded in the DoD.

**AC7:** Given a GitHub issue was opened by the bridge, When the incident record is created, Then it is created through the existing incident store with a link to the issue. Open question for DoR: the running app cannot write `workspace/incidents.json`; the options are the app writing it through the GitHub Contents API as `pipeline-state-github-writer.js` does, or the record being created by a workflow triggered from the issue. If undecided at DoR, AC7 is split into its own story.

## Out of Scope

- Any remediation or auto-fix; detection and issue creation only.
- OTel logs, traces or metrics, and any second vendor (Grafana Cloud, Sentry). The recorded decision keeps OTel as a later portability layer.
- Teams notification (on hold until Teams is in use).
- Repairing or re-enabling the old Production Log Scan workflow, which is being disabled.
- A pattern-definition UI; the fixed-code list for warn-level cases is code-maintained.
- Alert thresholds beyond PostHog's own new-issue and spike triggers.

## NFRs

- **Performance:** capture is asynchronous and batched; a PostHog outage must not slow or fail a request. `shutdown()` runs in the existing shutdown path so the last batch is flushed.
- **Security:** no tenant text or source lines in outgoing events (AC3); bridge authenticated by shared secret; secrets never logged; bridge validates the payload shape and rejects anything else.
- **Privacy:** the scrub rules are covered by a test that fails if a new field leaks fixture text.
- **Cost:** within PostHog's 100,000 free exceptions per month; the story notes the per-error event count observed in test.
- **Audit:** every bridge call (accepted, duplicate, rejected) is logged without the secret.
- **Accessibility:** not applicable.

## Complexity Rating

**Rating:** 2
**Scope stability:** Unstable until AC7 and the live webhook check (AC6) are settled. Consider splitting: story A = AC1 to AC4 (capture and scrub), story B = AC5 to AC7 (bridge and incident record).

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity (AC7 needs the open question resolved)
- [ ] Out of scope is declared
- [ ] Benefit linkage is written
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified
- [ ] Human oversight level confirmed from parent epic
- [ ] Operator prerequisites (webhook destination, shared secret) confirmed
