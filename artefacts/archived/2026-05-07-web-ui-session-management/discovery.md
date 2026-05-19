# Discovery: Web UI Session Management

**Feature slug:** 2026-05-07-web-ui-session-management
**Date:** 2026-05-07
**Status:** Approved — short-track

## Problem Statement

The web UI journey is a stateless experience: closing the browser tab or restarting the server loses all in-progress work. Journeys cannot be resumed, cannot be shared with a colleague, and offer no way to revisit or loop back to a prior stage. These three gaps prevent the tool from being used for real delivery work — they are not edge-case limitations but core usability failures for any session longer than 30 minutes.

## Scope

Three stories in scope:

1. **wsm.1 — Session persistence:** Journey state and skill session turns persisted to local disk on every mutation. Restored on server restart and page reload. `accessToken` never written to disk. Stale sessions cleaned up on startup.

2. **wsm.2 — Collaborative sessions:** A shareable journey URL that lets any authenticated user see the current state of a journey. Updates visible within 5 seconds (polling or SSE). Concurrent turns serialised. User count indicator.

3. **wsm.3 — Non-happy-path branching:** Breadcrumb/stage list allowing back-navigation. Stages flagged "needs review" when a prior stage is re-committed. Confirmation prompt before overwriting a prior stage. Turn history shows a "Previous session" separator when a session is resumed. Compatible with wsm.1 (state persisted through back-navigation).

## Out of Scope

- Role-based permissions within a shared session (wsm.2) — any authenticated user with the URL has equal access.
- Conflict resolution for simultaneous edits (wsm.2) — concurrent turns are serialised (last write wins); no merge UI.
- Automatic re-running of downstream AI turns when an upstream stage is changed (wsm.3) — flagging only.
- Multi-device sync beyond what the polling/SSE mechanism already provides.

## Success Criteria

- An operator can restart the Node.js server and continue a journey without re-entering any prior turns (wsm.1).
- An operator can share a journey URL with a colleague who then sees the current state within 5 seconds (wsm.2).
- An operator can click back to a prior stage, re-commit an artefact, and continue forward — with all downstream stages visually flagged (wsm.3).

## Artefact Location

`artefacts/2026-05-07-web-ui-session-management/`

## Reviewers

- Hamis — Platform operator / product owner

## Approved By

- Hamis — Platform operator / product owner — 2026-05-07

---

## Short-Track Justification

All three stories are well-understood, bounded in scope, directly implement known user needs identified during wuce/ougl/wusl delivery sessions, and carry no architectural uncertainty requiring a full discovery → benefit-metric → review cycle.

## Reviewers

- Hamis — Platform operator / product owner

## Approved By

- Hamis — Platform operator / product owner — 2026-05-07
