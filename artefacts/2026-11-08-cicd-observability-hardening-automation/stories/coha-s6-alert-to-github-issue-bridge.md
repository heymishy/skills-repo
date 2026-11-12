## Story: Alert-to-GitHub-issue bridge for new production error issues

**Status:** DRAFT, awaiting operator review. Second half of the split of the 2026-11-13 draft; the first half is coha-s5 (capture and scrub). Replaces the notification half of coha-s4 (bounded production-log scan), which is superseded per the 2026-11-13 decision in `decisions.md`.
**Epic reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/epics/coha-e1-detect-and-alert.md
**Discovery reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/benefit-metric.md
**Spike evidence:** artefacts/2026-11-08-cicd-observability-hardening-automation/spikes/production-error-source-outcome.md and production-error-source-working-notes.md

## User Story

As a **delivery engineer**,
I want to **a GitHub issue opened automatically the first time PostHog reports a new production error issue**,
So that **a captured error is queued for a fix and linked to an incident record without anyone having to notice the alert**.

## Benefit Linkage

**Metric moved:** Production-defect detection latency
**How:** with coha-s5 capturing the error, this story makes "time between the error and the GitHub issue existing" measurable, closing the loop the benefit-metric artefact deferred.

## Architecture Constraints

- **The bridge is a route in the running app** that PostHog's webhook destination calls; it runs only when called, never as a standing watcher (`product/mission.md`, `product/constraints.md` #11).
- **Injectable adapter rule (D37):** the GitHub issue creation is an injectable adapter whose stub throws. The DoR must carry an AC for the production wiring, the plan must name the wiring as its own task, and the wiring test must assert observable behaviour (one issue with the correct title and body), not that a function reference was assigned.
- **Credentials (`product/constraints.md` #12):** the webhook shared secret and the GitHub token are Fly or GitHub secrets, never tracked files, never logged. The request is rejected without the shared secret, compared in constant time.
- **Mock-shape rule:** the webhook payload fixture comes from a real payload captured at the live webhook check (AC3), not invented.
- **Incident record:** the running app cannot write `workspace/incidents.json`. Options for DoR: the app writes it through the GitHub Contents API as `pipeline-state-github-writer.js` does, or a workflow triggered from the issue creates it. AC4 depends on this choice.
- **Input safety:** the payload is validated for shape and size; the PostHog issue id is used as a dedupe key only after validation.

## Dependencies

- **Upstream:** coha-s5 (errors must be captured for there to be an issue to report). The bridge can be built and tested against a fixture before coha-s5 ships, but the live check (AC3) needs both.
- **Operator prerequisites:** a PostHog alert destination of type webhook on the existing project (an account configuration change the operator approves), a shared secret set as a Fly secret, and a GitHub token with issue-write access set as a Fly secret.
- **Downstream:** the incident-triage feature's first real recorded incident.

## Acceptance Criteria

**AC1:** Given PostHog calls the bridge with a new-issue alert payload carrying the correct shared secret, When the bridge handles it, Then exactly one GitHub issue is opened in this repo containing the issue title, first-seen time, count and a link to the PostHog issue.

**AC2:** Given the same PostHog issue id arrives again, or a payload arrives with a missing or wrong secret, When the bridge handles it, Then no second issue is opened for the repeat, and a bad secret opens nothing and returns 401, each tested through the real route handler.

**AC3:** Given the alert destination is created on the live PostHog project, When its test function is run against the bridge, Then the request arrives with the secret header intact and the payload shape matches the AC1 fixture. This is `live-verified` evidence and is recorded in the DoD. If the header cannot be sent, the story falls back to a scheduled job reading PostHog's API, per the decision's revisit trigger.

**AC4:** Given a GitHub issue was opened by the bridge, When the incident record is created, Then it is created through the existing incident store with a link to the issue. If the write path is undecided at DoR, AC4 is split into its own story.

## Out of Scope

- Capturing or scrubbing errors (coha-s5).
- Any remediation or auto-fix; issue creation only.
- Teams notification (on hold until Teams is in use).
- Changing PostHog's alert rules beyond creating the one destination.
- OpenTelemetry (OTel) logs, traces or metrics, and any second vendor.

## NFRs

- **Performance:** the route responds quickly and does not block PostHog; a failure to reach GitHub is logged and returned as a retryable error.
- **Security:** shared-secret authentication, payload validation, no secrets in logs or issues, no tenant text in the issue body (the issue is built from PostHog's already-scrubbed fields).
- **Audit:** every bridge call (accepted, duplicate, rejected) is logged without the secret.
- **Reliability:** duplicate delivery from PostHog must not create duplicate issues (AC2).
- **Accessibility:** not applicable.

## Complexity Rating

**Rating:** 2
**Scope stability:** Unstable until the live webhook check (AC3) and the incident write path (AC4) are settled.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity (AC4 needs the write path decided)
- [ ] Out of scope is declared
- [ ] Benefit linkage is written
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story (coha-s5 must be merged before the live check)
- [ ] NFRs identified
- [ ] Human oversight level confirmed from parent epic
- [ ] Operator prerequisites (webhook destination, shared secret, GitHub token) confirmed
