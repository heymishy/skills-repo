## Story: Label and incident record created for each PostHog-opened production error issue

**Status:** DRAFT run 2, awaiting `/review`. Split out of coha-s6 (its former AC4) on 2026-11-13 after `review/coha-s6-review-1.md` finding 1-H2: the running app cannot use `scripts/lib/incident-store.js` because `scripts/` is not copied into the image, and the app cannot write `workspace/incidents.json`. Revised the same day after the decision that coha-s6 uses PostHog's native GitHub destination: PostHog opens the issue and applies no label, and the issue body does not carry first-seen time, count or environment, so the label step, the way an issue is recognised and the record's fields all changed.
**Epic reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/epics/coha-e1-detect-and-alert.md
**Discovery reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/benefit-metric.md
**Related feature:** artefacts/2026-11-08-incident-triage-and-respond (consumes the incident records)
**Decision reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/decisions.md (entries dated 2026-11-13)

## User Story

As a **delivery engineer**,
I want to **a `production-error` label and an incident record created automatically for each production error issue PostHog opens**,
So that **the incident-triage feature has a real recorded incident to work from, which is also what pins the triage drafter's provisional similarity threshold**.

## Benefit Linkage

**Metric moved:** Production-defect detection latency (Metric 4), indirectly; it also delivers the first real incident the incident-triage feature's discovery says it is waiting for.
**How:** after coha-s6 has PostHog open an issue, this story ensures the issue is labelled and becomes a record that triage, handoff and post-fix confirmation (itar-s3 and itar-s4) can act on.

## Architecture Constraints

- **Decision made 2026-11-13 (operator): option A, a workflow writes the record** (see `decisions.md`). A GitHub Actions workflow triggered when an issue is opened runs the existing `scripts/create-incident.js` (which uses the incident store; the store stays in `scripts/`, which the workflow can use) and commits the record. Option B (the running app writing through the GitHub Contents API) was rejected because it re-implements the store's rules in `src/` and gives the app a repository write it does not otherwise perform. The cost of A is that committing to the default branch needs the repo ruleset to let the workflow's actor push to `workspace/**`. That is an operator action and a DoR prerequisite; the bypass list must name the actor the workflow pushes as (the Actions bot or the token's owner), which the operator confirms, not assumes.
- **First task, before `/test-plan`: read the coha-s6 fixture.** coha-s6 AC3 records, from a real PostHog-created issue, the author login of the PostHog GitHub App, the title shape and the "View in PostHog" link pattern. This story's recognition rule is written from that fixture, not from the template's documentation. If the fixture does not exist yet, `/test-plan` waits.
- **Recognition (a public repo means anyone can open an issue that looks right):** an issue is treated as a PostHog production error only if its author is exactly the PostHog GitHub App login from the fixture AND its body holds a PostHog issue link of the fixture's shape. A matching title or body from any other author never creates a label or a record. The workflow reads the author from the event payload, not from the issue text.
- **Step 1, label:** the workflow adds `production-error` to a recognised issue (PostHog applies none). The label is created in the repo if it does not exist. The workflow's token is limited to the permissions it needs (`issues: write`, `contents: write`) and nothing else.
- **Step 2, record, from fixed fields only:** the record's trigger text names the issue link and the PostHog issue id; the summary is the fixed error code taken from the title; tags include `production-error` and `posthog:<issue id>`; the first-seen time is the GitHub issue's creation time (the issue body does not carry PostHog's own first-seen time or count, so neither is recorded); the environment is not read from the issue, because the alert already filters on `environment = production` (coha-s6 AC2) and the issue does not show it. No exception message, stack frame, file path or other body text enters the record.
- **No untrusted text in a shell or a script:** issue title and body are passed to the record step as data (environment variables or a JSON file), never interpolated into a shell command or workflow expression that is executed. A test uses a title containing shell metacharacters and newlines.
- **Idempotent on the PostHog issue id:** the incident store has no uniqueness rule, so the workflow itself checks `workspace/incidents.json` for an existing record carrying the tag `posthog:<issue id>` before creating, and skips with a logged reason if found. A re-run or a duplicate trigger therefore creates no second record.
- **Concurrent runs:** two issues opened at once must not lose a record or fail with a rejected push. The workflow uses a concurrency group so runs are serialised, and the commit step pulls and retries a bounded number of times.
- **Triggered and bounded, never a standing process** (`product/constraints.md` #11): the workflow runs and exits.
- **Credentials (`product/constraints.md` #12):** only the workflow's own token is used; no tracked file holds a credential.
- **Dry run:** the workflow can be started by hand with a dry-run switch that prints the record it would create and commits nothing, so the live check can use PostHog's test-function issue (coha-s6 AC3) without writing a test record into the real incident store. Tests and the dry run never write to the real `workspace/incidents.json`; tests use a temporary file through the `--file` option.
- **Platform change policy:** the workflow file and any change under `scripts/` merge through a pull request. Because this story adds a workflow file, it is code and goes through `/branch-setup` onward.
- **Logic lives in a testable script, the workflow is thin.** Recognition, label decision, idempotency check, record building and the bounded commit-retry live in a module under `scripts/` that is unit-tested against local fixtures and a temporary incident file; the workflow YAML only calls it. A wiring test parses the YAML and asserts the trigger, the job permissions, the concurrency group and that the untrusted fields reach the script as environment data, not as inline expressions. AC7 and AC8 are proved on the module and the YAML's structure; the run on GitHub is AC9 and the first real record.
- **Permission separation (ADR-009 and ADR-010):** the workflow is split into jobs with their own permissions: a `recognise` job with `contents: read` only that outputs the decision, a label step with `issues: write` only, and a `record` job with `contents: write` only that runs after recognition succeeds. ADR-009 asks for separate workflow files with non-overlapping triggers; this story keeps one file because the trigger is `issues: opened`, a commit made with the workflow token starts no other workflow, so the loop that motivated ADR-009 cannot occur, and a second file would need a second trigger on the same event. This is a deliberate deviation and needs a RISK-ACCEPT at DoR; if the operator prefers the ADR as written, the label and record steps become two workflow files. The record commit message carries `[ci skip]` (ADR-010).
- **Platform-agnostic guardrail (ADR-012):** the GitHub Actions trigger is the vendor-specific edge; the record creation stays in the existing store and CLI, which do not know about GitHub or PostHog.

## Dependencies

- **Upstream:** coha-s6 (PostHog opens the issue; its AC3 fixture defines how an issue is recognised). Without coha-s6's live check there is no real issue to build against.
- **Related:** `scripts/create-incident.js` and `scripts/lib/incident-store.js` from the incident-triage feature (itar-s1).
- **Operator prerequisites:** the ruleset path bypass for `workspace/**` covers the workflow's pushing actor; confirmed in writing, not assumed.
- **Downstream:** itar-s3 renders the record; itar-s4 hands it off and confirms the fix.

## Acceptance Criteria

**AC1:** Given an issue opened by the PostHog GitHub App with a PostHog issue link in its body, When the workflow runs, Then exactly one incident record exists whose trigger names the issue link and PostHog issue id, whose summary is the fixed error code from the title, whose tags include `production-error` and `posthog:<issue id>`, and which appears in the incident file in the format the incident store defines.

**AC2:** Given the workflow runs a second time for the same PostHog issue id (a re-run, or a duplicate trigger), When it completes, Then no second record is created and the skip reason is logged.

**AC3:** Given an issue opened by any author other than the PostHog GitHub App, even with a matching title and body, When the workflow runs, Then no label is added, no record is created and the reason is logged.

**AC4:** Given an issue from the PostHog GitHub App whose body has no PostHog issue link of the expected shape, When the workflow runs, Then no record is created and the reason is logged.

**AC5:** Given a record created by this story, When the incident-triage feature's existing record validation and the product page rendering (itar-s3) read it, Then both accept it without error, tested against the real validation code and the real committed format.

**AC6:** Given a recognised issue, When the workflow runs, Then the `production-error` label is on the issue afterwards, and an issue that is not recognised does not gain it.

**AC7:** Given an issue title that contains shell metacharacters, backticks, `$()` and newlines, When the workflow runs, Then the record holds the text as inert data, nothing in it is executed, and the run completes normally or declines with a logged reason.

**AC8:** Given two recognised issues opened at the same moment, When both runs complete, Then both records exist and neither run fails on a rejected push.

**AC9:** Given the workflow is started by hand with the dry-run switch against PostHog's test-function issue from coha-s6, When it runs, Then the record it would create is printed in the run log, nothing is committed, and the real incident file is unchanged. This is `live-verified` evidence.

## Out of Scope

- Opening the GitHub issue (coha-s6) and capturing the error (coha-s5).
- Triage, handoff and fix confirmation (itar features).
- Closing the record when the issue is closed.
- Recording PostHog's first-seen time, occurrence count or environment (not carried by the native issue; would need the PostHog API and a read key).
- Handling issues from any author other than the PostHog GitHub App.
- Teams notification (on hold until Teams is in use).

## NFRs

- **Security:** recognition by author and link, never by title text; no untrusted text executed; no exception message, stack or tenant data in the record; least-privilege workflow token; no credential in a tracked file.
- **Audit:** every attempt (created, duplicate, not recognised, malformed) is logged by the workflow run itself without echoing issue body text.
- **Reliability:** idempotent (AC2); concurrent runs serialised (AC8); a failed commit leaves no partial record.
- **Accessibility:** not applicable.

## Complexity Rating

**Rating:** 2
**Scope stability:** Unstable until the coha-s6 fixture exists (recognition rule) and the ruleset bypass for the workflow's actor is confirmed.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared
- [ ] Benefit linkage is written
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story (coha-s6 AC3 fixture)
- [ ] NFRs identified
- [ ] Human oversight level confirmed from parent epic
- [ ] Ruleset path bypass for `workspace/**` confirmed by the operator for the workflow's pushing actor (option A needs it)
- [ ] RISK-ACCEPT logged for the one-file deviation from ADR-009, or the two-file split chosen instead
- [ ] coha-s6 AC3 fixture (author login, title shape, link pattern) read and the recognition rule written from it
