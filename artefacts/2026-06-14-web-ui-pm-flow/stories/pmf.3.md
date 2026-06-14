## Story: Context-aware orientation wizard — three-step session start

**Epic reference:** artefacts/2026-06-14-web-ui-pm-flow/discovery.md (pmf-epic-1)
**Discovery reference:** artefacts/2026-06-14-web-ui-pm-flow/discovery.md
**Benefit-metric reference:** artefacts/2026-06-14-web-ui-pm-flow/benefit-metric.md

## User Story

As a **platform operator**,
I want the web UI session entry point to ask what I am here to do and surface the right context for my answer,
So that I can reach the correct skill session in ≤2 clicks without manually navigating the features table (M3).

## Benefit Linkage

**Metric moved:** M3 — Session start click-count
**How:** The three-step wizard (What are you here to do? → Which feature? → Which session?) surfaces the right options for the operator's current intent, eliminating the manual navigation path.

## Architecture Constraints

- Upgrade `handleGetWizard` in `src/web-ui/routes/journey.js`. The existing function signature, redirect behaviour for `activeFeatureSlug`-set sessions, and POST handler (`handlePostWizardSelection`) must be preserved — 20 wucp.4 tests are the regression baseline.
- Step 1 (default, no `req.query.view`): three-option choice card layout.
- Step 2 (`req.query.view === 'existing'`): feature card picker using same card component as Kanban board — health dot, title, slug, stage. Existing wucp.4 T4.6–T4.9/T4.15/T4.19 use `view: 'existing'` and must continue to pass.
- Step 3 (`req.query.view === 'resume'`): active session list — sessions with `done: false` and `lastActivity` within 24h, read from the session store.
- "Start from an idea" sub-option reads from `workspace/ideas.json` (pmf.2 dependency).
- POST `/journey/wizard` must handle two new `selection` values: `from-idea` (redirect to `/skills/discovery/sessions?idea=<ideaId>`) and `resume-session` (redirect to `/skills/<skillName>/sessions/<sessionId>/chat`).
- No new server routes. Upgrade to existing `GET /journey/wizard` and `POST /journey/wizard` handlers only.
- All rendered content HTML-escaped via `escHtml`.

## Dependencies

- **Upstream:** pmf.2 DoD (ideas.json and `_readIdeas` helper must be available)
- **Upstream:** wucp.4 (all 20 tests must continue to pass)
- **No SKILL.md changes:** pmf.3 does not touch any SKILL.md file.

## Acceptance Criteria

**AC1:** Given an unauthenticated session (no `session.activeFeatureSlug`), when the user visits `/journey`, then the orientation wizard Step 1 renders with three named options: "Start something new", "Continue an existing feature", "Resume active session".

**AC2:** Given the user selects "Start something new" and submits, when `POST /journey/wizard` is processed with `selection: 'new'`, then `session.activeFeatureSlug` is not set, `session.stageIndex` is set to 0, and the user is redirected to `/journey`. (Existing wucp.4 AC2 behaviour preserved.)

**AC3:** Given the user selects "Start from an idea" (sub-option under "Start something new") and picks an idea, when `POST /journey/wizard` is processed with `selection: 'from-idea'` and `ideaId`, then the user is redirected to `/skills/discovery/sessions?idea=<ideaId>`.

**AC4:** Given the user selects "Continue an existing feature", when `GET /journey?view=existing` renders, then active features (excluding `released` and `archived`) are shown as cards displaying health-dot colour, title, slug in monospace, and stage — not a plain `<li>` slug list.

**AC5:** Given the user selects a feature card in Step 2 and submits with `featureSlug`, when `POST /journey/wizard` is processed, then `session.activeFeatureSlug` is set to the selected slug (validated against pipeline-state.json allowlist), `session.stageIndex` is set to the feature's current stage index, and the user is redirected to `/journey`. (Existing wucp.4 AC4 behaviour preserved.)

**AC6:** Given the user selects "Resume active session", when `GET /journey?view=resume` renders, then in-progress sessions (where `done !== true` and `lastActivity` is within the last 24h) are listed with skill name and session start time. If no active sessions exist, a "No active sessions" message is shown.

**AC7:** Given the user selects a session from the Step 3 list and submits with `sessionId` and `skillName`, when `POST /journey/wizard` is processed with `selection: 'resume-session'`, then the user is redirected to `/skills/<skillName>/sessions/<sessionId>/chat`.

**AC8:** Given a returning session with `session.activeFeatureSlug` already set, when the user visits `/journey`, then the wizard is skipped and the journey page is shown directly. (Existing wucp.4 AC6 behaviour preserved.)

**AC9:** All 20 existing `check-wucp4-session-wizard.js` tests pass without modification after pmf.3 is implemented.

## Out of Scope

- Drag-and-drop or visual reordering of options
- Session search / filter
- Notifications or alerts about which features need attention (future story)
- Any SKILL.md modifications

## NFRs

- **Performance:** `handleGetWizard` responds in < 200ms for 15 features (wucp.4 T4.19 regression test)
- **Security:** Feature slugs validated against allowlist on POST; `ideaId` and `sessionId` are not used as file paths
- **Regression:** wucp.4 test suite (20 tests) must pass unmodified

## Complexity Rating

**Rating:** 3
**Scope stability:** Stable
