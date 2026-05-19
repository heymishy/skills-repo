## Epic: Skill launcher HTML form

**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md
**Slicing strategy:** User journey

## Goal

A business lead or BA/facilitator can pick a skill from a browser form, be guided through a step-by-step question flow in plain HTML, and commit the resulting artefact — all without a terminal, without git, and without engineer assistance. The browser form drives the already-built question-loop API (wuce.13–16) via standard HTML form submissions. At the end of the flow the user sees the produced artefact content and a confirmation that it has been written back.

## Context

The Phase 2 question-loop API is fully built and tested (wuce.9–12 spike + wuce.13–16 session management). It exposes: `GET /api/skills` (list skills), `POST /api/skills/:name/sessions` (start session), `GET /api/skills/:name/sessions/:id/next` (next question), `POST /api/skills/:name/sessions/:id/answer` (submit answer), `GET /api/skills/:name/sessions/:id/state` (session state), `POST /api/skills/:name/sessions/:id/commit` (commit artefact). This epic adds the HTML route layer over those API endpoints — standard `<form>` submissions with redirect-after-POST, no JavaScript required for the baseline flow.

## Out of Scope

- JavaScript-enhanced progressive forms, AJAX answer submission, or live artefact preview updates — post-MVP enhancement
- Rich text (Markdown) editor for free-form answers — plain `<textarea>` only in this epic
- Skill management (adding, editing, or disabling skills from the browser) — operator function, not stakeholder function
- Multi-user or collaborative session state — single-user session per authentication token
- Session branching or backtracking to a previous question — linear flow only, matching the underlying API
- Non-GitHub artefact writeback targets — deferred (discovery out-of-scope item 3)

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|------------------------|
| P2 — Unassisted /discovery completion rate | API-only (no browser path) | ≥50% of new discovery sessions started from the web UI | HTML form is the only way a non-technical user can start a skill session — without it P2 cannot move |
| P3 — Non-technical attribution rate | Established baseline | ≥90% of discovery artefacts have non-engineer named | The artefact commit step in this epic attributes the artefact to the authenticated user (userId + login) |
| M2 — Phase 1 stakeholder activation rate | 0% | ≥60% within 30 days | Phase 2 HTML form is the highest-value Phase 1 + Phase 2 cross-story activation driver |

## Stories in This Epic

- [ ] wuce.23 — Skill launcher landing and session start
- [ ] wuce.24 — Guided question form
- [ ] wuce.25 — Session commit and result view

## Human Oversight Level

**Oversight:** High
**Rationale:** The commit step writes artefacts attributed to named users back to the repository. Incorrect attribution or double-commit bugs would corrupt governance records. Human review required at each story PR.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
