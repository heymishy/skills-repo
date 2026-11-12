## Story: Incident record created for each production error GitHub issue

**Status:** DRAFT, awaiting operator review. Split out of coha-s6 (its former AC4) on 2026-11-13 after `review/coha-s6-review-1.md` finding 1-H2: the running app cannot use `scripts/lib/incident-store.js` because `scripts/` is not copied into the image, and the app cannot write `workspace/incidents.json`.
**Epic reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/epics/coha-e1-detect-and-alert.md
**Discovery reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/benefit-metric.md
**Related feature:** artefacts/2026-11-08-incident-triage-and-respond (consumes the incident records)
**Decision reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/decisions.md (entries dated 2026-11-13)

## User Story

As a **delivery engineer**,
I want to **an incident record created automatically for each production error issue the bridge opens**,
So that **the incident-triage feature has a real recorded incident to work from, which is also what pins the triage drafter's provisional similarity threshold**.

## Benefit Linkage

**Metric moved:** Production-defect detection latency (Metric 4), indirectly; it also delivers the first real incident the incident-triage feature's discovery says it is waiting for.
**How:** after coha-s6 opens an issue, this story ensures the issue becomes a record that triage, handoff and post-fix confirmation (itar-s3 and itar-s4) can act on.

## Architecture Constraints

- **Decision made 2026-11-13 (operator): option A, a workflow writes the record** (see `decisions.md`). The options considered were: (A) A GitHub Actions workflow triggered when an issue with the `production-error` label is opened, running the existing `scripts/lib/incident-store.js` (the store stays in `scripts/`, which the workflow can use) and committing the record. (B) The running app writes the record through the GitHub Contents API, as `pipeline-state-github-writer.js` does for pipeline state, which needs the store's rules re-implemented in `src/` because `scripts/` is not in the image. Chosen: (A), because it reuses the store and its tests unchanged and keeps the app free of repository writes it does not otherwise perform; its cost is that committing to the default branch needs the repo's ruleset to allow the bookkeeping path (CLAUDE.md describes a path-based bypass for `workspace/**`).
- **The record is created from issue fields only** (the fixed code, first seen, count, environment, link), never from the exception message or stack, because the source is a public issue.
- **Idempotent:** one record per PostHog issue id (carried in the issue body or a label); a re-run of the workflow must not create a second record.
- **Triggered and bounded, never a standing process** (`product/constraints.md` #11): the workflow runs and exits.
- **Credentials (`product/constraints.md` #12):** any token used is a GitHub Actions secret or the workflow's own token, never a tracked file.
- **Platform change policy:** the workflow file and any change under `scripts/` merge through a pull request.

## Dependencies

- **Upstream:** coha-s6 (issues carry the `production-error` label and the PostHog issue id).
- **Related:** `scripts/create-incident.js` and `scripts/lib/incident-store.js` from the incident-triage feature (itar-s1).
- **Downstream:** itar-s3 renders the record; itar-s4 hands it off and confirms the fix.

## Acceptance Criteria

**AC1:** Given the bridge opens an issue labelled `production-error`, When the creation path runs, Then exactly one incident record exists with the issue's link, fixed code, first-seen time and environment, and it appears in `workspace/incidents.json` in the format the incident store defines.

**AC2:** Given the creation path runs a second time for the same issue (a re-run, or a duplicate trigger), When it completes, Then no second record is created.

**AC3:** Given an issue that does not carry the `production-error` label, or whose body lacks the expected fields, When the creation path runs, Then no record is created and the reason is logged.

**AC4:** Given a record created by this story, When the incident-triage feature's existing record validation and the product page rendering (itar-s3) read it, Then both accept it without error, tested against the real validation code and the real committed format.

## Out of Scope

- Opening the GitHub issue (coha-s6) and capturing the error (coha-s5).
- Triage, handoff and fix confirmation (itar features).
- Closing the record when the issue is closed.
- Teams notification (on hold until Teams is in use).

## NFRs

- **Security:** no exception message, stack or tenant data in the record; the record is built from fixed issue fields only.
- **Audit:** every creation attempt is logged by the workflow run itself.
- **Reliability:** idempotent (AC2); a failed commit leaves no partial record.
- **Accessibility:** not applicable.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable, subject to the ruleset bypass for `workspace/**` being granted.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared
- [ ] Benefit linkage is written
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story (coha-s6)
- [ ] NFRs identified
- [ ] Human oversight level confirmed from parent epic
- [ ] Ruleset path bypass for `workspace/**` confirmed by the operator (option A needs it)
