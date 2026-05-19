## Story: Submit attributed sign-off via GitHub Contents API

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e1-walking-skeleton.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **business lead or product owner**,
I want to submit a sign-off on a pipeline artefact from the web UI,
So that my approval is committed to the repository under my own GitHub identity — creating a permanent, auditable governance record without requiring git access or engineer involvement.

## Benefit Linkage

**Metric moved:** P1 — Non-engineer self-service sign-off rate
**How:** This story is the direct delivery mechanism for P1 — it is the first path by which a non-technical stakeholder can complete a sign-off without involving an engineer; every sign-off submitted via this story counts toward the ≥80% target.

## Architecture Constraints

- ADR-009: the Contents API write-back operation uses a separate, narrowly scoped permission from the read path — the OAuth scope granted in wuce.1 (`repo`) covers both, but the write operation must be in a separately structured handler to preserve separation of concerns and to allow future tightening to a fine-grained PAT write scope
- ADR-012: the write-back operation must use the SCM adapter pattern — a `commitSignOff(artefactPath, signOffPayload, token)` adapter function, not an inline GitHub API call in the route handler
- Mandatory security constraint: the commit author and committer identity must be set to the authenticated user's GitHub identity — never the server's identity or a service account; the server must not have write access in its own right
- Mandatory security constraint: all sign-off submission inputs (artefact path, sign-off text, approver name) must be validated server-side before the Contents API call — path traversal attacks must be mitigated
- ADR-003: if a new `signoffs` or `approvals` field is added to `pipeline-state.json`, it must be added to the schema first (this story does NOT add pipeline-state fields — sign-off is committed to the artefact file only)

## Dependencies

- **Upstream:** wuce.2 (sign-off is submitted from the artefact view rendered by wuce.2)
- **Downstream:** wuce.5 (action queue must be able to mark a sign-off as completed)

## Acceptance Criteria

**AC1:** Given an authenticated user is viewing a discovery artefact that has not yet been signed off, When they click "Sign off this artefact" and confirm the dialog, Then the server constructs a sign-off commit (appending an `## Approved by` section to the artefact markdown with the user's GitHub display name and ISO 8601 timestamp), commits it to the default branch via the GitHub Contents API under the user's identity, and returns a success confirmation to the browser.

**AC2:** Given a successful sign-off commit, When the artefact page is refreshed, Then the `## Approved by` section is visible in the rendered artefact with the correct name and timestamp, confirming the commit was persisted.

**AC3:** Given an authenticated user submits a sign-off, When the GitHub Contents API call succeeds, Then the git commit shows the user's GitHub identity as both author and committer — not a service account or bot identity.

**AC4:** Given a sign-off submission includes an artefact path that contains path traversal characters (e.g. `../`), When the server validates the input, Then the request is rejected with a 400 error and no GitHub API call is made.

**AC5:** Given the GitHub Contents API returns a conflict error (the artefact file was updated since the page loaded), When the sign-off commit fails, Then the user is shown a clear "Artefact was updated — please reload and try again" message, and the browser reloads the latest artefact version.

**AC6:** Given an artefact already has an `## Approved by` section, When the user attempts to sign off again, Then the UI displays "Already signed off by [name] on [date]" and the sign-off button is disabled — preventing duplicate approval commits.

## Out of Scope

- Multi-approver sign-off workflows (requiring N approvals) — post-MVP
- Sign-off rejection or challenge action — post-MVP; sign-off is a one-way approval action in Phase 1
- Signing off on artefact types beyond discovery in this story — the mechanism is the same; extension is configuration, not a new story
- Pipeline-state.json updates triggered by sign-off — sign-off is recorded in the artefact file only; pipeline-state orchestration is a separate operator action

## NFRs

- **Security:** Server-side validation of all inputs. Commit author/committer is authenticated user only. No service account write access. Rate limit the sign-off endpoint (max 10 sign-off attempts per user per minute).
- **Performance:** Sign-off commit completes within 5 seconds under normal GitHub API conditions.
- **Accessibility:** Sign-off confirmation dialog meets WCAG 2.1 AA — keyboard-accessible, focus trapped in modal, descriptive labels.
- **Audit:** Sign-off submission events (attempt, success, failure, duplicate-block) logged with user ID, artefact path, and timestamp.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
