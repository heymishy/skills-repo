## Story: Skill launcher and guided question flow (step-by-step form UI)

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e4-phase2-guided-ui.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **non-technical stakeholder (business lead, product owner, or BA)**,
I want to launch a pipeline skill from the web UI and answer its questions in a guided step-by-step form,
So that I can initiate a governed pipeline artefact without opening VS Code, a terminal, or knowing any skill syntax.

## Benefit Linkage

**Metric moved:** P2 — Unassisted /discovery completion rate
**How:** This story is the browser entry point for P2 — a non-technical stakeholder who can launch `/discovery` and answer each question in a web form, without assistance, is the direct measurement event for P2.

## Architecture Constraints

- ADR-012: the UI launcher must call the backend execution engine (wuce.9/wuce.10/wuce.11) via a defined API contract — not by directly invoking CLI commands from the browser
- Mandatory security constraint: skill name submitted from the browser must be validated against the discovered skill list (wuce.11) on the server before any execution begins — client-supplied skill names are not trusted
- Mandatory security constraint: all question responses submitted from the browser must be sanitised server-side before being assembled into the CLI prompt — prompt injection via form field content must be mitigated (maximum field length enforced, disallowed prompt metacharacters stripped)
- ACP server is public preview — the primary path is the `-p` subprocess (wuce.9); any ACP-dependent behaviour in this story must be noted: "Reinstate/remove preview caveat when ACP reaches GA"

## Dependencies

- **Upstream:** wuce.9 (execution engine), wuce.10 (session isolation), wuce.11 (skill discovery for launcher list)
- **Downstream:** wuce.14 (artefact preview builds on the execution output this story triggers), wuce.16 (session persistence lets users resume a session started here)

## Acceptance Criteria

**AC1:** Given an authenticated user with a Copilot subscription navigates to `/skills`, When the page loads, Then they see a list of available skills discovered from the repository's `.github/skills/` directory (via wuce.11), each showing the skill name and a "Launch" button.

**AC2:** Given a user clicks "Launch" on the `/discovery` skill, When the skill session starts, Then the UI presents the first question from the skill's question sequence as a labelled text input with a "Submit answer" button — the user is not shown the raw SKILL.md prompt or any CLI output.

**AC3:** Given a user submits an answer to a skill question, When the server receives the response, Then the answer is validated (length ≤ 1000 characters, no disallowed prompt metacharacters), appended to the in-progress session context, and the next question (if any) is presented.

**AC4:** Given a user submits a form field containing prompt injection content (e.g. `--allow-all; delete all artefacts`), When the server sanitises the input, Then the metacharacters are stripped before the content is assembled into the CLI prompt — the CLI subprocess receives only sanitised content.

**AC5:** Given an authenticated user does not hold a Copilot subscription (as detected by a failed token validation against the Copilot API), When they attempt to launch a skill, Then they see a clear "Copilot licence required for skill execution — Phase 1 features are available without a licence" message and the launcher is disabled.

## Out of Scope

- Rendering the artefact as it builds — that is wuce.14
- Persisting the session for resume — that is wuce.16
- Launching skills other than `/discovery` in this story — the launcher supports all discovered skills, but end-to-end testing focuses on `/discovery`; other skills do not require additional launcher code

## NFRs

- **Security:** Server-side skill name allowlist validation. Server-side prompt input sanitisation. Length limits enforced server-side.
- **Performance:** Skill question form renders within 1 second of session start. Answer submission round-trip under 3 seconds (excluding CLI execution time).
- **Accessibility:** Multi-step form meets WCAG 2.1 AA — current step indicated, progress communicated to screen readers, keyboard-navigable.
- **Audit:** Skill session start events logged with user ID, skill name, and session ID. No question content or answer content logged.

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
