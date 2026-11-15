## Story: Send staging errors to a separate PostHog project so production errors always start their own error group

**Epic reference:** None - short-track (bounded configuration fix for a defect found in live use, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery; scope stated directly below. Parent: `artefacts/2026-11-08-cicd-observability-hardening-automation/` (stories coha-s5 and coha-s6; finding in that feature's `decisions.md`, 2026-11-15, "production error grouped into a staging-created issue").
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [observability, operations]

## User Story

As **the operator relying on production error alerts**,
I want **staging and production errors to be recorded in separate PostHog projects**,
So that **the first time a production error happens it always creates its own Error Tracking issue and therefore fires the alert, the GitHub issue and the incident record, instead of being silently absorbed into an issue that staging test traffic created first**.

## Benefit Linkage

**Metric moved:** Metric 4 (Production-defect detection latency) of `artefacts/2026-11-08-cicd-observability-hardening-automation/benefit-metric.md`. Without this, a production error that matches an existing staging error group is never alerted at all, so detection latency is unbounded for exactly the errors the E2E staging runs also produce.
**How:** On 2026-11-15 the first real production error (a login-time `tenant_admin_bootstrap_failed`, 02:52:51 UTC) was accepted by PostHog but grouped into issue 01a1dd12-795d-7763-827f-9a246fad8d00, created at 02:38 by a staging event, so no `$error_tracking_issue_created` event fired. Staging and production share PostHog project 10908 (confirmed 2026-11-13 by identical key digests), and PostHog groups by fingerprint across the whole project.

## Architecture Constraints

- **Configuration only, if possible.** `src/web-ui/modules/error-capture.js` already chooses `POSTHOG_KEY_STAGING` for staging and `POSTHOG_KEY_PROD` for production (coha-s5 AC7). The fix is a new PostHog project for staging plus a different value for the `POSTHOG_KEY_STAGING` Fly secret on `wuce-staging`. No code change is expected; if one proves necessary it must go through its own test plan.
- **The operator types secrets.** The new project's key is set by the operator on Fly and never pasted to the agent (existing rule); the agent verifies by digest comparison (`fly secrets list`) only.
- **Keep the `environment` property** on every event (privacy and filtering behaviour of coha-s5 and coha-s6 is unchanged).
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) is satisfied by this story's own chain; ADR-025 (multi-tenancy at the application layer) is unaffected (no tenant data moves; the scrubber is unchanged); no other Active ADR is engaged.
- **Zero new npm dependencies.**

## Dependencies

- **Upstream:** coha-s5 (capture) and coha-s6 (bridge), merged. sff-s1 (scrubber fix), merged.
- **Operator involvement:** creating the PostHog project and setting one Fly secret. The agent cannot do either.

## Acceptance Criteria

**AC1:** Given the staging app has the new key, When staging produces an error, Then the event appears in the NEW PostHog project (queried by project id) and does not appear in project 10908. Evidence class `live-verified`.

**AC2:** Given an error group (same code and route) already exists in the staging project, When the same error happens in production, Then production's project creates its own new Error Tracking issue with a new `$exception_issue_id`, and `$error_tracking_issue_created` fires for it. Evidence class `live-verified` (checked by the first such production event, or a deliberate one with the operator's approval).

**AC3:** Given the change, When `fly secrets list -a wuce-staging` and `-a skills-framework` are compared, Then `POSTHOG_KEY_STAGING` and `POSTHOG_KEY_PROD` have different digests (the old state had identical digests).

**AC4:** Given the change, When the staging E2E confirmation runs, Then it still passes (no test depends on staging events appearing in project 10908).

**AC5:** Given the change is complete, When the DoD is written, Then the existing PostHog issue 01a1dd12-795d-7763-827f-9a246fad8d00 is recorded as resolved and the staging project id is recorded in `decisions.md` (no key values).

## Out of Scope

- Any change to the scrubber, the bridge, the coha-s7 workflow or the PostHog destination.
- Whether the destination should also listen for `$error_tracking_issue_reopened` (separate decision).
- Migrating or deleting the old staging events in project 10908.
- The "see all products" redirect bug (separate story).

## NFRs

- **Security:** no key value is written to any file, chat or log; digests only.
- **Cost:** a second PostHog project stays within the free tier (staging volume is small).
- **Operations:** the new project is named so it cannot be confused with production (for example "skills-framework staging").

## Complexity Rating

**Rating:** 1 - configuration only, one new project and one secret.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity (AC1 to AC3 are live queries or a digest comparison)
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic