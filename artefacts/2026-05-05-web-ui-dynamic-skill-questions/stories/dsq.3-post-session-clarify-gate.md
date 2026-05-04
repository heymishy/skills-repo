## Story: Post-session /clarify gate for web UI skill sessions

**Epic reference:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/epics/dsq-epic-1.md
**Discovery reference:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/discovery.md
**Benefit-metric reference:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/benefit-metric.md

## User Story

As a **web UI operator who has just completed all questions in a skill session**,
I want to **see a "Draft complete" confirmation with a prompt to run /clarify before I commit**,
So that **I know the session is done and I am reminded that clarification is available before the artefact is committed**.

## Benefit Linkage

**Metric moved:** P1 — Skill session completion rate (> 50%)
**How:** Operators who reach the end of a session and see a clear "complete" state with a structured next-step prompt (commit or clarify) are more likely to commit than those who transition directly to the commit-preview page — which can feel abrupt and cause them to abandon rather than finalise.

## Architecture Constraints

- **No new npm dependencies** — Node built-ins only.
- **No Express** — raw `http.createServer` only.
- **Route change scope:** The intermediate "session complete" page is rendered at the same URL as the current commit-preview (`/skills/:name/sessions/:id/commit-preview`) or at a new route segment (`/skills/:name/sessions/:id/complete`) — the choice must not break existing test assertions against the commit-preview URL.
- `req.session.accessToken` canonical — never `req.session.token`.

## Dependencies

- **Upstream:** dsq.1 must be DoD-complete — the `done` flag in `htmlRecordAnswer` is the trigger. dsq.2 is not a hard dependency for this story (the clarify gate fires regardless of whether section confirmation is present).
- **Downstream:** None — this is the last user-facing step before commit.

## Acceptance Criteria

**AC1:** Given a web UI skill session where the operator has submitted the final answer, when `htmlRecordAnswer` sets `done = true`, then the `nextUrl` returned points to a new `/complete` route segment (e.g. `/skills/:name/sessions/:id/complete`) rather than directly to `/commit-preview`.

**AC2:** Given the operator navigates to the `/complete` route, when the page is rendered, then it displays: (a) "Draft complete ✅" heading, (b) a brief summary showing the skill name and number of questions answered, (c) a prominent "Commit artefact" button that links to the existing commit-preview URL, and (d) a secondary "Run /clarify first" link or button.

**AC3:** Given the operator clicks "Commit artefact" on the complete page, when the browser navigates to the commit-preview URL, then the existing commit-preview and commit flow works exactly as it did before this story — no change to commit behaviour.

**AC4:** Given the operator clicks "Run /clarify first", when the browser navigates, then the operator is taken to the skill launcher page for the `clarify` skill (i.e. `/skills/clarify`) — the current session is not destroyed and remains resumable.

**AC5:** Given the complete page is rendered, when it is inspected, then the "Run /clarify first" option is visually secondary to the "Commit artefact" action — commit is the primary call to action.

**AC6:** Given all tests passing before this story (including dsq.1 and dsq.2 tests), when this story's implementation is merged, then all prior tests continue to pass with no regressions — in particular, any test that asserts the `nextUrl` from `htmlRecordAnswer` for the final answer must be updated to expect the `/complete` URL.

## Out of Scope

- Any model call on the complete page — the gate is a static UI prompt, not a model-generated summary
- Automatically launching a /clarify session — the operator must choose to navigate there; no session handoff is implemented in this story
- Resuming a session after navigating away from the complete page (session resume is a separate concern)

## NFRs

- **Accessibility:** "Commit artefact" and "Run /clarify first" must be rendered as `<a>` or `<button>` elements — not plain text links — so they are keyboard-navigable.
- **Security:** No session data (token, answer content) is rendered in the complete page HTML — the page shows only the skill name and question count.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
