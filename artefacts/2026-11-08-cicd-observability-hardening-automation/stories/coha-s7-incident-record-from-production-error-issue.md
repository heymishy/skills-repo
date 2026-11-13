## Story: Incident record pull request opened for each bridge-opened production error GitHub issue

**Status:** DRAFT run 4, awaiting `/review`. Split out of coha-s6 (its former AC4) on 2026-11-13 after `review/coha-s6-review-1.md` finding 1-H2: the running app cannot use `scripts/lib/incident-store.js` because `scripts/` is not copied into the image, and the app cannot write `workspace/incidents.json`. Revised three times on 2026-11-13: for PostHog's native GitHub destination, back to the custom bridge, and then, after `review/coha-s7-review-2.md` finding 2-H1 showed the `master` ruleset has no path bypass, to delivering the record as a pull request the operator merges (decisions.md, "coha-s7 — incident record reaches the repository through a pull request per record"). Reviews 1 and 2 were written for earlier designs; this version needs a new review.
**Epic reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/epics/coha-e1-detect-and-alert.md
**Discovery reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/benefit-metric.md
**Related feature:** artefacts/2026-11-08-incident-triage-and-respond (consumes the incident records)
**Decision reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/decisions.md (entries dated 2026-11-13)

## User Story

As a **delivery engineer**,
I want to **a pull request containing an incident record opened automatically for each production error issue the bridge opens**,
So that **the incident-triage feature has a real recorded incident to work from once I merge it, which is also what pins the triage drafter's provisional similarity threshold**.

## Benefit Linkage

**Metric moved:** Production-defect detection latency (Metric 4), indirectly; it also delivers the first real incident the incident-triage feature's discovery says it is waiting for.
**How:** after coha-s6's bridge opens a labelled issue, this story turns the issue into a ready-to-merge record that triage, handoff and post-fix confirmation (itar-s3 and itar-s4) can act on.

## Architecture Constraints

- **Delivery by pull request (decision 2026-11-13, replaces option A).** A GitHub Actions workflow triggered when an issue is opened runs the existing `scripts/create-incident.js` (which uses `scripts/lib/incident-store.js`; the store stays in `scripts/`, which the workflow can use) against a copy of `workspace/incidents.json` on a new branch, and opens a pull request into `master` with that one added record. It never pushes to `master`. Reason: read from GitHub on 2026-11-13, the `master` ruleset has no file-path rule and its only bypass is the repository admin role, so a workflow cannot push there without a blanket bypass, which was rejected. Branches other than `master` and `traces` are not protected by any ruleset, so the workflow can push its own branch.
- **Repository settings the design depends on (read 2026-11-13):** default workflow permissions are `read` (the workflow grants itself what it needs per job) and the setting that lets Actions create pull requests is on (`can_approve_pull_request_reviews: true`). The operator confirms this setting stays on.
- **Known friction, accepted:** a pull request opened with the workflow's own `GITHUB_TOKEN` does not start other workflows, so the three checks the `master` ruleset requires (`Run assurance gate`, `Scenario A E2E (staging)` and `Scenario B E2E (staging)`, read 2026-11-13) will not run on it and the pull request cannot satisfy them normally. The operator, who is a repository admin with bypass, merges it with the bypass option. The change is a data-only record produced by a tested script, so the missing check is a lower risk than usual, but it means the merge needs a conscious bypass each time. Alternatives (a personal token that triggers checks, or a manual workflow dispatch of the checks) are out of scope and noted in `decisions.md`.
- **Recognition (a public repo means anyone can open an issue that looks right):** an issue is treated as a bridge-opened production error only if all three hold: it carries the label `production-error` at the moment it is opened (the bridge creates the issue with the label in one call, and people without write access to the repo cannot set labels), its author is exactly the account whose token the bridge uses (set as a workflow variable, not hard-coded; the token is the operator's personal fine-grained token, so the author is the operator's own login, which also means an issue the operator opens by hand with the label and marker qualifies), and its body holds the PostHog issue id marker line the bridge writes (coha-s6). Title or body text alone never creates a record. The workflow reads author and labels from the event payload, not from the issue text.
- **The record is created from issue fields only:** the fixed code (the title), the first-seen time, the environment and the PostHog link, all of which coha-s6's issue body carries, never an exception message or stack, because the source is a public issue. Occurrence count is not recorded (a new-issue event always has a count of 1).
- **No untrusted text in a shell or a script:** issue title and body are passed to the record step as data (environment variables or a JSON file), never interpolated into a shell command or workflow expression that is executed. The pull request title and body are built from the fixed code and the issue number only. A test uses a title containing shell metacharacters and newlines.
- **The PostHog issue id is validated before use:** the id read from the marker line must match the UUID pattern (`[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`) before it is used in a branch name, a tag or a file path; anything else declines with a logged reason and creates no branch, because the marker comes from issue text.
- **Idempotent on the PostHog issue id:** the incident store has no uniqueness rule, so the workflow itself skips, with a logged reason, when any of these hold: `workspace/incidents.json` on `master` already holds a record tagged `posthog:<issue id>`, a branch named `incident/posthog-<issue id>` already exists, or a pull request for that branch is open. A re-run or a duplicate trigger therefore creates no second branch or pull request.
- **Concurrent runs:** two issues opened at once each get their own branch and pull request; the runs use a concurrency group so they are serialised and neither fails. Because both pull requests change `workspace/incidents.json`, the second may conflict after the first is merged; the workflow can be started by hand for an issue number and rebuilds that record's branch from the current `master`, so a conflicted pull request is replaced rather than hand-resolved.
- **Logic lives in a testable script, the workflow is thin.** Recognition, the idempotency check, record building, branch and pull-request composition (as data) live in a module under `scripts/` that is unit-tested against local fixtures and a temporary incident file; the workflow YAML only calls it and runs the git and GitHub steps. A wiring test parses the YAML and asserts the trigger, the job permissions, the concurrency group and that the untrusted fields reach the script as environment data, not as inline expressions.
- **Permission separation (ADR-009 and ADR-010):** a `recognise` job with `contents: read` only outputs the decision, and a `record` job with `contents: write` and `pull-requests: write` only (no `issues` permission) runs after recognition succeeds. ADR-009 asks for separate workflow files with non-overlapping triggers; this story keeps one file because the trigger is `issues: opened`, and a branch push or pull request made with the workflow token starts no other workflow, so the loop that motivated ADR-009 cannot occur. This is a deliberate deviation and needs a RISK-ACCEPT at DoR; if the operator prefers the ADR as written, the two jobs become two workflow files. ADR-010 (audit records reach `main` through a dedicated write-back, never a feature branch left unmerged) is met once the operator merges; until then the record exists only on its pull request, which the story states.
- **Triggered and bounded, never a standing process** (`product/constraints.md` #11): the workflow runs and exits.
- **Credentials (`product/constraints.md` #12):** only the workflow's own token is used; no tracked file holds a credential.
- **Dry run:** the workflow can be started by hand with a dry-run switch that prints the record and the pull request it would open and creates no branch and no pull request, so the live check can run against a test issue without touching the repository. Tests and the dry run never write to the real `workspace/incidents.json`; tests use a temporary file through the `--file` option.
- **Platform change policy:** the workflow file and any change under `scripts/` merge through a pull request. Because this story adds a workflow file, it is code and goes through `/branch-setup` onward.
- **Platform-agnostic guardrail (ADR-012):** the GitHub Actions trigger and the pull-request step are the vendor-specific edge; the record creation stays in the existing store and CLI, which do not know about GitHub or PostHog.

## Dependencies

- **Upstream:** coha-s6 (the bridge opens the labelled issue with the marker line and the fixed fields; this story's tests are built from coha-s6's issue-content fixture, which the coha-s6 implementation produces).
- **Related:** `scripts/create-incident.js` and `scripts/lib/incident-store.js` from the incident-triage feature (itar-s1).
- **Operator prerequisites:** the bridge author account recorded as a workflow variable; the repository setting that lets Actions create pull requests kept on; the operator accepts merging each record pull request with the admin bypass because the required check does not run on it.
- **Downstream:** itar-s3 renders the record; itar-s4 hands it off and confirms the fix.

## Acceptance Criteria

**AC1:** Given an issue opened by the bridge's account with the `production-error` label and the PostHog issue id marker in its body, When the workflow runs, Then exactly one pull request is opened into `master` from a branch named `incident/posthog-<issue id>` whose only change is one added record in `workspace/incidents.json`, in the format the incident store defines, with a trigger naming the issue link and PostHog issue id, a summary equal to the fixed error code from the title, and tags that include `production-error` and `posthog:<issue id>`.

**AC2:** Given the workflow runs a second time for the same PostHog issue id (a re-run, a duplicate trigger, or after the record is already on `master`), When it completes, Then no second branch and no second pull request is created and the skip reason is logged.

**AC3:** Given an issue opened by any other author, even with a matching title, body and label text, When the workflow runs, Then no branch or pull request is created and the reason is logged.

**AC4:** Given an issue from the bridge's account that lacks the `production-error` label or the marker line, When the workflow runs, Then no branch or pull request is created and the reason is logged.

**AC5:** Given a record created by this story, When the incident-triage feature's existing record validation and the product page rendering (itar-s3) read it, Then both accept it without error, tested against the real validation code and the real committed format.

**AC6:** Given an issue title that contains shell metacharacters, backticks, `$()` and newlines, When the workflow runs, Then the record holds the text as inert data, the pull request title and body contain only the fixed code and issue number, nothing is executed, and the run completes normally or declines with a logged reason; and given a marker line whose id is not a UUID (for example one containing `../` or a space), When the workflow runs, Then it declines with a logged reason and creates no branch.

**AC7:** Given two recognised issues opened at the same moment, When both runs complete, Then each has its own branch and pull request and neither run fails; and given the first pull request has been merged, When the workflow is started by hand for the second issue, Then it rebuilds that record's branch from the current `master` so the pull request no longer conflicts.

**AC8:** Given the workflow is started by hand with the dry-run switch against a bridge-opened test issue, When it runs, Then the record and the pull request it would open are printed in the run log, no branch and no pull request is created, and the real incident file is unchanged. This is `live-verified` evidence.

## Out of Scope

- Opening the GitHub issue and applying its label (coha-s6) and capturing the error (coha-s5).
- Merging the pull request (the operator does it).
- Triage, handoff and fix confirmation (itar features).
- Closing the record when the issue is closed.
- Recording an occurrence count (not carried; always 1 at creation).
- Handling issues from any author other than the bridge's account.
- Making the required checks (`Run assurance gate` and the two staging E2E scenarios) run on the workflow-opened pull request.
- Teams notification (on hold until Teams is in use).

## NFRs

- **Security:** recognition by label, author and marker, never by title text; no untrusted text executed; no exception message, stack or tenant data in the record or the pull request; least-privilege job tokens; no credential in a tracked file; no push to `master`.
- **Audit:** every attempt (opened, duplicate, not recognised, malformed) is logged by the workflow run itself without echoing issue body text.
- **Reliability:** idempotent (AC2); concurrent runs serialised and a conflicted record rebuildable (AC7); a failed run leaves no partial record on `master`.
- **Accessibility:** not applicable.

## Complexity Rating

**Rating:** 2
**Scope stability:** Unstable until coha-s6's issue content is fixed by its implementation; the delivery mechanism is now decided.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared
- [ ] Benefit linkage is written
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story (coha-s6 issue-content fixture)
- [ ] NFRs identified
- [ ] Human oversight level confirmed from parent epic
- [ ] Operator confirms the setting that lets Actions create pull requests stays on, and accepts merging each record pull request with the admin bypass
- [ ] RISK-ACCEPT logged for the one-file deviation from ADR-009, or the two-file split chosen instead
- [ ] Bridge author account confirmed and recorded as a workflow variable
