## Story: Incident record created for each bridge-opened production error GitHub issue

**Status:** DRAFT run 3, awaiting `/review`. Split out of coha-s6 (its former AC4) on 2026-11-13 after `review/coha-s6-review-1.md` finding 1-H2: the running app cannot use `scripts/lib/incident-store.js` because `scripts/` is not copied into the image, and the app cannot write `workspace/incidents.json`. Revised twice on 2026-11-13: first for PostHog's native GitHub destination, then back to the custom bridge when that route was abandoned (decisions.md, "coha-s6 — native PostHog GitHub destination abandoned, custom bridge reinstated"). The review of run 2 (`review/coha-s7-review-1.md`) was written for the native-route design and is stale; this version needs a new review.
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
**How:** after coha-s6's bridge opens a labelled issue, this story ensures the issue becomes a record that triage, handoff and post-fix confirmation (itar-s3 and itar-s4) can act on.

## Architecture Constraints

- **Decision made 2026-11-13 (operator): option A, a workflow writes the record** (see `decisions.md`). A GitHub Actions workflow triggered when an issue is opened runs the existing `scripts/create-incident.js` (which uses the incident store; the store stays in `scripts/`, which the workflow can use) and commits the record. Option B (the running app writing through the GitHub Contents API) was rejected because it re-implements the store's rules in `src/` and gives the app a repository write it does not otherwise perform. The cost of A is that committing to the default branch needs the repo ruleset to let the workflow's actor push to `workspace/**`. That is an operator action and a DoR prerequisite; the bypass list must name the actor the workflow pushes as (the Actions bot or the token's owner), which the operator confirms, not assumes. The `master` ruleset today requires a pull request and status checks and its only bypass is the repository admin role (read 2026-11-13), so the Actions actor is not yet allowed.
- **Recognition (a public repo means anyone can open an issue that looks right):** an issue is treated as a bridge-opened production error only if all three hold: it carries the label `production-error` at the moment it is opened (the bridge creates the issue with the label in one call, and people without write access to the repo cannot set labels), its author is exactly the account whose token the bridge uses (set as a workflow variable, not hard-coded, and confirmed by the operator at DoR), and its body holds the PostHog issue id marker line the bridge writes (coha-s6). Title or body text alone never creates a record. The workflow reads author and labels from the event payload, not from the issue text.
- **The record is created from issue fields only:** the fixed code (the title), the first-seen time, the environment and the PostHog link, all of which coha-s6's issue body carries, never an exception message or stack, because the source is a public issue. Occurrence count is not recorded (a new-issue event always has a count of 1).
- **No untrusted text in a shell or a script:** issue title and body are passed to the record step as data (environment variables or a JSON file), never interpolated into a shell command or workflow expression that is executed. A test uses a title containing shell metacharacters and newlines.
- **Idempotent on the PostHog issue id:** the incident store has no uniqueness rule, so the workflow itself checks `workspace/incidents.json` for an existing record carrying the tag `posthog:<issue id>` before creating, and skips with a logged reason if found. A re-run or a duplicate trigger therefore creates no second record.
- **Concurrent runs:** two issues opened at once must not lose a record or fail with a rejected push. The workflow uses a concurrency group so runs are serialised, and the commit step pulls and retries a bounded number of times.
- **Logic lives in a testable script, the workflow is thin.** Recognition, idempotency check, record building and the bounded commit-retry live in a module under `scripts/` that is unit-tested against local fixtures and a temporary incident file; the workflow YAML only calls it. A wiring test parses the YAML and asserts the trigger, the job permissions, the concurrency group and that the untrusted fields reach the script as environment data, not as inline expressions. AC6 and AC7 are proved on the module and the YAML's structure; the run on GitHub is AC8 and the first real record.
- **Permission separation (ADR-009 and ADR-010):** a `recognise` job with `contents: read` only outputs the decision, and a `record` job with `contents: write` only runs after recognition succeeds. ADR-009 asks for separate workflow files with non-overlapping triggers; this story keeps one file because the trigger is `issues: opened`, and a commit made with the workflow token starts no other workflow, so the loop that motivated ADR-009 cannot occur. This is a deliberate deviation and needs a RISK-ACCEPT at DoR; if the operator prefers the ADR as written, the two jobs become two workflow files. The record commit message carries `[ci skip]` (ADR-010). The workflow does not edit labels and needs no `issues: write`.
- **Triggered and bounded, never a standing process** (`product/constraints.md` #11): the workflow runs and exits.
- **Credentials (`product/constraints.md` #12):** only the workflow's own token is used; no tracked file holds a credential.
- **Dry run:** the workflow can be started by hand with a dry-run switch that prints the record it would create and commits nothing, so the live check can run against a test issue without writing a test record into the real incident store. Tests and the dry run never write to the real `workspace/incidents.json`; tests use a temporary file through the `--file` option.
- **Platform change policy:** the workflow file and any change under `scripts/` merge through a pull request. Because this story adds a workflow file, it is code and goes through `/branch-setup` onward.
- **Platform-agnostic guardrail (ADR-012):** the GitHub Actions trigger is the vendor-specific edge; the record creation stays in the existing store and CLI, which do not know about GitHub or PostHog.

## Dependencies

- **Upstream:** coha-s6 (the bridge opens the labelled issue with the marker line and the fixed fields; this story's tests are built from coha-s6's issue-content fixture, so `/test-plan` waits for coha-s6's test plan to define it).
- **Related:** `scripts/create-incident.js` and `scripts/lib/incident-store.js` from the incident-triage feature (itar-s1).
- **Operator prerequisites:** the ruleset path bypass for `workspace/**` covers the workflow's pushing actor, confirmed in writing, not assumed; the bridge author account recorded as a workflow variable.
- **Downstream:** itar-s3 renders the record; itar-s4 hands it off and confirms the fix.

## Acceptance Criteria

**AC1:** Given an issue opened by the bridge's account with the `production-error` label and the PostHog issue id marker in its body, When the workflow runs, Then exactly one incident record exists whose trigger names the issue link and PostHog issue id, whose summary is the fixed error code from the title, whose tags include `production-error` and `posthog:<issue id>`, and which appears in the incident file in the format the incident store defines.

**AC2:** Given the workflow runs a second time for the same PostHog issue id (a re-run, or a duplicate trigger), When it completes, Then no second record is created and the skip reason is logged.

**AC3:** Given an issue opened by any other author, even with a matching title, body and label text, When the workflow runs, Then no record is created and the reason is logged.

**AC4:** Given an issue from the bridge's account that lacks the `production-error` label or the marker line, When the workflow runs, Then no record is created and the reason is logged.

**AC5:** Given a record created by this story, When the incident-triage feature's existing record validation and the product page rendering (itar-s3) read it, Then both accept it without error, tested against the real validation code and the real committed format.

**AC6:** Given an issue title that contains shell metacharacters, backticks, `$()` and newlines, When the workflow runs, Then the record holds the text as inert data, nothing in it is executed, and the run completes normally or declines with a logged reason.

**AC7:** Given two recognised issues opened at the same moment, When both runs complete, Then both records exist and neither run fails on a rejected push.

**AC8:** Given the workflow is started by hand with the dry-run switch against a bridge-opened test issue, When it runs, Then the record it would create is printed in the run log, nothing is committed, and the real incident file is unchanged. This is `live-verified` evidence.

## Out of Scope

- Opening the GitHub issue and applying its label (coha-s6) and capturing the error (coha-s5).
- Triage, handoff and fix confirmation (itar features).
- Closing the record when the issue is closed.
- Recording an occurrence count (not carried; always 1 at creation).
- Handling issues from any author other than the bridge's account.
- Teams notification (on hold until Teams is in use).

## NFRs

- **Security:** recognition by label, author and marker, never by title text; no untrusted text executed; no exception message, stack or tenant data in the record; least-privilege workflow token; no credential in a tracked file.
- **Audit:** every attempt (created, duplicate, not recognised, malformed) is logged by the workflow run itself without echoing issue body text.
- **Reliability:** idempotent (AC2); concurrent runs serialised (AC7); a failed commit leaves no partial record.
- **Accessibility:** not applicable.

## Complexity Rating

**Rating:** 2
**Scope stability:** Unstable until coha-s6's issue content is fixed and the ruleset bypass for the workflow's actor is confirmed.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared
- [ ] Benefit linkage is written
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story (coha-s6 issue-content fixture)
- [ ] NFRs identified
- [ ] Human oversight level confirmed from parent epic
- [ ] Ruleset path bypass for `workspace/**` confirmed by the operator for the workflow's pushing actor (option A needs it)
- [ ] RISK-ACCEPT logged for the one-file deviation from ADR-009, or the two-file split chosen instead
- [ ] Bridge author account confirmed and recorded as a workflow variable
