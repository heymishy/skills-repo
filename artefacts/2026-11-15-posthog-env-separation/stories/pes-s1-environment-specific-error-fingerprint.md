## Story: Give every captured error an environment-specific fingerprint so a production error never joins a staging error group

**Epic reference:** None - short-track (bounded fix for a defect found in live use, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery; scope stated directly below. Parent: `artefacts/2026-11-08-cicd-observability-hardening-automation/` (stories coha-s5 and coha-s6; finding in that feature's `decisions.md`, 2026-11-15, "the first real production error was absorbed into a staging-created PostHog issue").
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui, observability, privacy]

## User Story

As **the operator relying on production error alerts**,
I want **the scrubber to set a fingerprint on every event that includes the environment, so staging and production errors never share a PostHog issue**,
So that **the first time a production error happens it always creates its own Error Tracking issue and therefore fires the alert, the GitHub issue and the incident record, with no second PostHog project and no extra cost (the free plan allows one project)**.

## Benefit Linkage

**Metric moved:** Metric 4 (Production-defect detection latency) of `artefacts/2026-11-08-cicd-observability-hardening-automation/benefit-metric.md`. Without this, a production error that matches an error group first created by staging test traffic is never alerted.
**How:** On 2026-11-15 the first real production error (a login-time `tenant_admin_bootstrap_failed`, 02:52:51 UTC) was accepted by PostHog but grouped into issue 01a1dd12-795d-7763-827f-9a246fad8d00, created at 02:38 by a staging event, so `$error_tracking_issue_created` never fired. Staging and production share one PostHog project (the free plan allows one), and PostHog groups by fingerprint across the whole project. PostHog documents that a client-set `$exception_fingerprint` has the highest grouping priority and may be set in a `before_send` hook, which the scrubber already is (https://posthog.com/docs/error-tracking/grouping-issues.md).

## Architecture Constraints

- **Fixed values only.** The fingerprint is built from three values the scrubber already validates against allow-lists or patterns: `environment` (the app's own constant `staging` or `production`), `code` (allow-listed codes only) and `route` (the sanitised route pattern with `:p` placeholders). No message text, no stack text and no PostHog-computed hex fingerprint is read or copied (the existing rule, `$exception_fingerprint is deliberately never copied`, is about not copying the incoming value; this story writes a value the scrubber itself builds).
- **Shape:** `$exception_fingerprint` is an array of strings, as PostHog's docs show: `[environment, code, route]`.
- **Existing tests that pin the exact output keys change deliberately.** `KEPT_KEYS` and the tests `scrubEvent_keepsOnlyNamedKeys_andFixedDistinctId`, `scrubEvent_outputTopLevel_isExactlyFixedShape` and the exact-keys assertion in `throwingRequest_producesExactlyOneEvent_andReturns500` gain `$exception_fingerprint`; every canary and leak test must still pass unchanged.
- **Mock-shape rule (CLAUDE.md):** the test fixtures use the real captured event shape from PostHog (`tests/fixtures/sff-s1-posthog-frames.json` and the processed property list recorded on 2026-11-15).
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-025 (multi-tenancy at the application layer) is why nothing tenant-derived may enter the fingerprint (the three inputs above are fixed or allow-listed); ADR-011 (artefact-first) is satisfied by this story's own chain; no other Active ADR is engaged.
- **Zero new npm dependencies.**

## Dependencies

- **Upstream:** coha-s5 (scrubber), sff-s1 (filename fix), merged.
- **Operator involvement:** merge, and after the staging deploy the production promotion (the Staging Deploy workflow approval).

## Acceptance Criteria

**AC1:** Given a scrubbed event for environment `production` with code `tenant_admin_bootstrap_failed` and route `/auth/:p`, When it is scrubbed, Then `properties.$exception_fingerprint` equals `['production', 'tenant_admin_bootstrap_failed', '/auth/:p']`; and for environment `staging` the first element is `staging`.

**AC2:** Given two otherwise identical events from different environments, When both are scrubbed, Then their fingerprints differ (so they cannot share an issue).

**AC3:** Given canary tenant text in every field of the input (message, stack, URL, headers, an incoming `$exception_fingerprint`), When the event is scrubbed, Then no canary text appears anywhere in the output, and the incoming fingerprint is ignored (the output fingerprint is the one built from the three fixed values).

**AC4:** Given the scrubber is wired the way the real startup wires it, When a request that throws is captured through the real `createApp()` in a child process, Then the sink event carries the fingerprint for that environment (end-to-end version of AC1).

**AC5:** Given the change is deployed to staging, When staging produces an error, Then within 30 minutes a PostHog query shows the new events accepted (no `$cymbal_errors`), each with an issue id that differs from issue 01a1dd12-795d-7763-827f-9a246fad8d00, and Error Tracking lists a NEW issue for staging. Evidence class `live-verified`.

**AC6:** Given the change is deployed to production, When a production error with the same code and route occurs (the known login-time error, with the operator's approval), Then PostHog creates a NEW production issue, `$error_tracking_issue_created` fires, and the bridge opens one GitHub issue (and the coha-s7 workflow opens one record pull request, which the operator closes if it is a test). This also closes coha-s6 AC9. Evidence class `production-observed`.

## Out of Scope

- A second PostHog project (not possible on the free plan; not needed).
- Alerting on `$error_tracking_issue_reopened` (separate decision, logged).
- Any change to the bridge, the coha-s7 workflow or the PostHog destination.
- The "see all products" redirect bug (separate story).
- Deleting or migrating existing events; the old issue 01a1dd12... stays resolved.

## NFRs

- **Security and privacy:** the fingerprint is built only from the three fixed or allow-listed values; the canary tests prove no input text reaches it.
- **Cost:** none: no new project, no new event, one extra property per event (within the free allowance).
- **Performance:** one array literal per event; the existing 200 ms capture bound is unaffected.

## Complexity Rating

**Rating:** 2 - a small change, but the exact-key tests change and the live proof (AC5, AC6) depends on how PostHog applies the fingerprint.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity (AC5 and AC6 are live queries with stated windows)
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic