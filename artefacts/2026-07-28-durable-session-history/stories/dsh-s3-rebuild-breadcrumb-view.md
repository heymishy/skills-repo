## Story: Rebuild the breadcrumb "view a completed stage" page into a chat+artefact split view

**Epic reference:** artefacts/2026-07-28-durable-session-history/epics/dsh-e1-durable-session-history.md
**Discovery reference:** artefacts/2026-07-28-durable-session-history/discovery.md
**Benefit-metric reference:** artefacts/2026-07-28-durable-session-history/benefit-metric.md

## User Story

As a **pipeline operator reviewing a feature's history**,
I want to **see the actual conversation that produced a completed stage's artefact, laid out chat-left/artefact-right like the live chat page**,
So that **I can understand why a decision was made without being limited to a bare artefact-plus-edit-toggle page that shows no conversation at all**.

## Benefit Linkage

**Metric moved:** Breadcrumb view-completed-stage shows real conversation
**How:** This story is the direct fix — it replaces the current artefact-only page (`handleGetJourneyStageView` in `routes/journey.js`) with a rendering that calls dsh-s2's shared read function and displays the returned turns in a chat panel alongside the artefact, moving the metric from its 0% baseline toward the 100% target.

## Architecture Constraints

- **ADR-025** (multi-tenancy): must preserve `handleGetJourneyStageView`'s existing cross-tenant 404 behaviour (already covered by `check-p0.2-journey-guard-wiring.js`) — this story must not regress that guard while rebuilding the rendering.
- **Reuse existing rendering, don't invent a new layout:** the chat-left/artefact-right split must reuse the visual pattern already established by the live chat page's rendering (`_renderChatPage` in `routes/skills.js`), not a third, novel layout.
- **jsvr-s1 dependency:** this route (`GET /journey/:journeyId/stage/:stageName`) was only wired into `server.js`'s router as of jsvr-s1 (PR #623) — this story builds on that fix, it does not need to re-wire the route itself.

## Dependencies

- **Upstream:** dsh-s2 (shared read function); jsvr-s1 (route registration, already merged)
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given a completed stage whose turns are durably available (via dsh-s2's read function), When `GET /journey/:journeyId/stage/:stageName` is requested by the tenant owner, Then the response renders that stage's historical chat turns in a chat-left panel and the artefact content in an artefact-right panel.

**AC2:** Given a completed stage whose turns are NOT available (e.g. the stage completed before this fix shipped, per discovery's explicit "no retroactive recovery" scope boundary), When the same route is requested, Then the page falls back to rendering the artefact-only view (today's existing behaviour) rather than erroring or showing an empty/broken panel.

**AC3:** Given the rebuilt page is displayed, When the operator clicks "Edit artefact", Then the existing inline artefact-edit functionality (`POST /api/journey/:journeyId/stage/:stageName/artefact`, already built and unmodified by this story) continues to work exactly as before.

**AC4:** Given a request for a stage belonging to a different tenant than the requester, When the route is requested, Then the response is 404 (not 403) — the existing cross-tenant guard behaviour, unregressed by this rebuild.

**AC5:** Given the chat panel renders historical turns, When the page is displayed, Then no message-input control is shown — this MVP is read-only history; live interactivity is an explicit fast-follow, not part of this story.

## Out of Scope

- Any ability to send a new message against this historical conversation — deferred to the fast-follow epic per discovery's MVP scope decision.
- Rehydrating an archived stage's turns — that's dsh-s6; this story assumes turns are either in the hot table or genuinely absent.
- Any change to the "Resume conversation" link's own behaviour — that's dsh-s4, a separate entry point.

## NFRs

- **Performance:** Page render must not add more than ~300ms versus today's artefact-only render (one additional read-function call, already scoped for sub-200ms in dsh-s2).
- **Security:** No new security surface — reuses dsh-s2's tenant-scoped read and the existing page's own auth/ownership guard, unmodified.
- **Accessibility:** The rebuilt split layout must meet WCAG 2.1 AA, matching this repo's existing accessibility floor applied to the live chat page.
- **Audit:** None identified — viewing one's own historical conversation is not separately audited, consistent with dsh-s2.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
