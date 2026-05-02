## Story: Artefact write-back with attribution (commit to repository under user identity)

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e4-phase2-guided-ui.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **non-technical stakeholder who has completed a skill session**,
I want the completed artefact to be committed to the repository under my GitHub identity with a single confirmation action,
So that the artefact appears in the pipeline alongside those produced via VS Code — with my name in the commit history as the attributed author.

## Benefit Linkage

**Metric moved:** P3 — Non-technical attribution rate
**How:** Each Phase 2 artefact committed under the non-technical user's identity counts directly toward the ≥90% attribution target — this write-back is the moment the attribution record is created.

## Architecture Constraints

- Decisions log 2026-05-02 ARCH phase-1: Phase 1 and Phase 2 write-back both use the authenticated user's GitHub OAuth token with `repo:write` scope via the GitHub Contents API — not via the Copilot CLI; the CLI produces the artefact content; the Contents API commits it
- ADR-012: the commit operation must use the SCM adapter pattern — `commitArtefact(artefactPath, content, commitMessage, token)` — same adapter as wuce.3; Phase 2 reuses Phase 1's write-back infrastructure
- ADR-009: write-back is a separate operation from skill execution — the execute endpoint and the commit endpoint are distinct API routes with distinct handlers
- Mandatory security constraint: the commit author and committer must be the authenticated user's GitHub identity — not the server
- Mandatory security constraint: the artefact path must be validated server-side against the expected output path for the skill (e.g. `artefacts/<slug>/discovery.md`) — no client-supplied arbitrary paths; path traversal mitigated

## Dependencies

- **Upstream:** wuce.14 (the preview panel's "Commit artefact" button triggers this story's write-back flow), wuce.3 (this story reuses the SCM adapter established there)
- **Downstream:** None — this is the terminal action in the Phase 2 skill session flow

## Acceptance Criteria

**AC1:** Given a user has completed a skill session and the preview panel shows a "Commit artefact to repository" button, When they click it and confirm the dialog, Then the server commits the artefact to the expected path in the repository (`artefacts/<feature-slug>/discovery.md` for a `/discovery` session) under the user's GitHub identity via the Contents API.

**AC2:** Given a successful artefact commit, When the commit is visible in the repository, Then the git author and committer are the authenticated user's GitHub identity — not a service account or bot.

**AC3:** Given the server computes the target artefact path from the skill name and session context, When a user attempts to trigger write-back to a path outside `artefacts/`, Then the server rejects the request with a 400 error — no write is made.

**AC4:** Given the Contents API returns a conflict error (the target path already has content that has changed since the session started), When the write-back fails, Then the user sees "Artefact already exists — reload and review before committing" and is given the option to view the existing artefact before deciding to overwrite.

**AC5:** Given a successful write-back, When the confirmation page loads, Then the user is shown the repository link to the committed artefact and the commit SHA — confirming their contribution is permanently recorded.

## Out of Scope

- Automatically opening a pull request for the committed artefact — v1 commits directly to the default branch; PR workflow is post-MVP
- Editing the artefact content before commit via the browser — post-MVP; the session output is committed as produced
- Triggering downstream pipeline steps (e.g. benefit-metric run) automatically after commit — out of scope; the operator runs subsequent pipeline steps manually

## NFRs

- **Security:** Server-side path validation. Committer identity is authenticated user only. No server write access in its own right.
- **Performance:** Write-back commit completes within 5 seconds under normal GitHub API conditions.
- **Accessibility:** Confirmation dialog meets WCAG 2.1 AA — keyboard-accessible, focus managed, descriptive confirmation message.
- **Audit:** Write-back events logged with user ID, skill name, artefact path, commit SHA, and timestamp.

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
