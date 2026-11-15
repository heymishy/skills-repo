## Story: Send the environment-specific fingerprint as a string, because PostHog rejects an array

**Epic reference:** None - short-track (bounded defect fix found by live verification of pes-s1, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery; scope stated directly below. Parent: `artefacts/2026-11-15-posthog-env-separation/stories/pes-s1-environment-specific-error-fingerprint.md`; finding in `artefacts/2026-11-08-cicd-observability-hardening-automation/decisions.md` (2026-11-15, "pes-s1 regression").
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui, observability, privacy]

## User Story

As **the operator relying on production error alerts**,
I want **the scrubber's `$exception_fingerprint` to be one string, not an array**,
So that **PostHog accepts every error event, groups staging and production separately, and a first production error creates its own issue and fires the alert**.

## Benefit Linkage

**Metric moved:** Metric 4 (Production-defect detection latency) of `artefacts/2026-11-08-cicd-observability-hardening-automation/benefit-metric.md`. After pes-s1 merged, PostHog rejected 9 of 9 new staging events with `serde error: invalid type: sequence, expected a string` (PostHog's reference lists the property as a String), so capture is broken again until this ships.
**How:** the fingerprint `[environment, code, route]` becomes the string `environment|code|route` built from the same three fixed or allow-listed values.

## Architecture Constraints

- **Same fixed inputs, new wire type.** `environment` (exactly `staging` or `production`, else `unknown`), `code` (allow-listed) and `route` (sanitised pattern with `:p` placeholders). None can contain `|` (allow-listed codes and the route pattern use letters, digits, `_`, `-`, `/`, `:`, `.` and `...`); a test asserts that exactly two `|` appear in the output.
- **Existing pes-s1 tests change deliberately** (they assert the array). The key-list test and every canary test stay as they are.
- **Mock-shape rule (CLAUDE.md):** the test asserts `typeof` string, and AC4 below is checked against what PostHog actually accepted, not against our own mock. This is the second miss of this kind in this feature (sff-s1 filename, pes-s1 array).
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-025 (multi-tenancy at the application layer) is why nothing tenant-derived may enter the fingerprint (inputs unchanged); ADR-011 (artefact-first) is satisfied by this story's own chain; no other Active ADR is engaged.
- **Zero new npm dependencies.**

## Dependencies

- **Upstream:** pes-s1 (merged), sff-s1 (merged).
- **Operator involvement:** merge; production promotion approval; the production login error repeated once, after staging is proven (this also closes coha-s6 AC9).

## Acceptance Criteria

**AC1:** Given a scrubbed event for `production` with code `tenant_admin_bootstrap_failed` and route `/auth/:p`, When it is scrubbed, Then `properties.$exception_fingerprint` is the string `production|tenant_admin_bootstrap_failed|/auth/:p` (typeof string, exactly two `|`); for `staging` it starts with `staging|`.

**AC2:** Given the same raw event from two environments, When both are scrubbed, Then the fingerprint strings differ.

**AC3:** Given canary text everywhere in the input including an incoming fingerprint (array, string, number, null), When scrubbed, Then no canary appears and the output fingerprint is the string built from the fixed values; an unexpected environment value gives a string starting `unknown|`.

**AC4 (live, staging):** Given the change is merged and deployed to staging, When staging produces errors, Then within 30 minutes a PostHog query shows the new events with NO `$cymbal_errors`, each with an issue id that is not 01a1dd12-795d-7763-827f-9a246fad8d00, and Error Tracking lists a new issue. Evidence class `live-verified`. If PostHog gives a different rejection, the story is INCOMPLETE with the exact message (same rule as sff-s1 AC6).

**AC5 (live, production):** Given AC4 passed and production is promoted, When the operator repeats the known production login error once, Then PostHog creates a new production issue, `$error_tracking_issue_created` fires, and the bridge opens one GitHub issue (and the workflow one record pull request). Evidence class `production-observed`; closes coha-s6 AC9.

## Out of Scope

- Any change to the bridge, the workflow or the PostHog destination; the reopened trigger; a second PostHog project; the see-all-products bug.

## NFRs

- **Security and privacy:** unchanged inputs; canary tests prove no input text reaches the fingerprint.
- **Cost:** none. **Performance:** one string join per event.

## Complexity Rating

**Rating:** 1 - a one-expression change plus test edits; the risk is only in the live proof.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic