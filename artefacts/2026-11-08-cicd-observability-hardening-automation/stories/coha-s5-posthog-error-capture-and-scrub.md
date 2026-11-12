## Story: Production error capture to PostHog with tenant text scrubbed

**Status:** DRAFT, awaiting operator review. First half of a split of the 2026-11-13 draft; the bridge that opens GitHub issues is coha-s6. Replaces the detection half of coha-s4 (bounded production-log scan) per the 2026-11-13 decision in `decisions.md`; coha-s4's pipeline state is not changed until the operator confirms.
**Epic reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/epics/coha-e1-detect-and-alert.md
**Discovery reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/benefit-metric.md
**Spike evidence:** artefacts/2026-11-08-cicd-observability-hardening-automation/spikes/production-error-source-outcome.md and production-error-source-working-notes.md

## User Story

As a **delivery engineer**,
I want to **production errors captured automatically, grouped into issues in PostHog, with tenant text and source lines removed before they leave the app**,
So that **a production defect like the still-unfixed `tenant_admin_bootstrap_failed` bug is recorded the moment it happens, without anyone having to notice it by luck and without sending tenant data to a third party**.

## Benefit Linkage

**Metric moved:** Production-defect detection latency
**How:** today detection is manual and the earlier scan never worked. With capture at the app's single error path, "time between the error and PostHog holding a grouped issue" becomes measurable; coha-s6 then turns that issue into a GitHub issue.

## Architecture Constraints

- **Capture reuses the app's existing `posthog-node` client** created in `src/web-ui/modules/posthog-config.js`, with `enableExceptionAutocapture: true` and a `before_send` hook. The app has no Express: the single catch point for failing requests is the `.catch` in `createApp()` in `src/web-ui/server.js`, and one `captureException` call there covers every thrown request error.
- **Scrubbing is the app's job, in `before_send`:** replace tenant text in `$exception_list[*].value` and delete `pre_context`, `context_line` and `post_context` from every stack frame (the SDK has no switch for source lines). The hook is `before_send` (snake case) in `posthog-node` 5.40.0.
- **Warn-level errors are not captured by the SDK.** `tenant_admin_bootstrap_failed` is logged at warn level (`auth.js:131` through `_logger.warn`, `auth-email.js:91` through `console.warn`) and returns false. It needs an explicit capture call.
- **Existing hand-built exception events** from `captureException` in `src/web-ui/modules/posthog-server.js` lack `$exception_list`; this story decides whether to switch those two call sites to the SDK client so they group as issues.
- **Triggered and bounded, never a standing process:** capture happens inside the running app.
- **No new vendor.** OpenTelemetry (OTel) logs and traces stay out of this story.

## Dependencies

- **Upstream:** none. coha-s1 (the Teams adapter) is no longer needed.
- **Operator prerequisites:** none beyond the existing `POSTHOG_KEY` Fly secret.
- **Downstream:** coha-s6 (the bridge), and through it the incident-triage feature's first real recorded incident.

## Acceptance Criteria

**AC1:** Given a request whose handler throws, When it goes through the real `createApp()` server, Then exactly one `$exception` event with a populated `$exception_list` (type, message, stack frames) reaches the capture endpoint, and the client receives a 500.

**AC2:** Given an unhandled promise rejection occurs, When autocapture is enabled, Then an `$exception` event is captured even though the process's own handler only logs it.

**AC3:** Given an error message contains tenant text (a fixture tenant name), When the event is sent, Then the outgoing payload contains the fixture text in no field, including the message and the stack frame source lines, while the type and stack frames remain.

**AC4:** Given the real tenant admin bootstrap path fails (through the real route in `auth.js` and the real route in `auth-email.js`), When the failure is logged, Then an `$exception` event with a fixed code for `tenant_admin_bootstrap_failed` is captured, and the existing return value and log line are unchanged.

## Out of Scope

- Any remediation or auto-fix; capture only.
- Opening GitHub issues and creating incident records (coha-s6).
- OTel logs, traces or metrics, and any second vendor (Grafana Cloud, Sentry). The recorded decision keeps OTel as a later portability layer.
- Teams notification (on hold until Teams is in use).
- Repairing or re-enabling the old Production Log Scan workflow, which is being disabled.
- A pattern-definition UI; the fixed-code list for warn-level cases is code-maintained.
- Alert rules and webhooks (coha-s6).

## NFRs

- **Performance:** capture is asynchronous and batched; a PostHog outage must not slow or fail a request. `shutdown()` runs in the existing shutdown path so the last batch is flushed.
- **Security:** no tenant text or source lines in outgoing events (AC3).
- **Privacy:** the scrub rules are covered by a test that fails if a new field leaks fixture text.
- **Cost:** within PostHog's 100,000 free exceptions per month; the story notes the per-error event count observed in test.
- **Accessibility:** not applicable.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared
- [ ] Benefit linkage is written
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified
- [ ] Human oversight level confirmed from parent epic
