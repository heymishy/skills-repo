# Contract Proposal — Render a real member list on /team/members

**Story:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s3.md
**Test plan:** artefacts/2026-09-23-team-roster-integration/test-plans/rtri-s3-test-plan.md
**Date:** 2026-09-24

---

## What will be built

- `handleGetTeamMembers` (`src/web-ui/routes/team-management.js`, already exists) extended to call `teamManagement.listTeamMembers(pool, req.session.tenantId)` (the function `rtri-s1` adds) and build a member-list HTML fragment, inserted into `bodyContent` above the existing add-teammate form.
- Each member row's identity and role are concatenated into the fragment via `htmlShell.escHtml()` — the exact mechanism `handleGetTeamMembers` already uses for its role `<option>` values (`htmlShell.escHtml(r)`), extended to the new identity/role values (AC5, MC-SEC-01).
- Empty state: if `listTeamMembers` returns `[]`, render an explicit "No team members yet" paragraph instead of an empty list container (AC2).

## What will NOT be built

- No change to the add-teammate form or its handler (`handleAddTeammate`) — reused unmodified.
- No change to the invite flow (`team-invitations.js`, `client-invitations.js`).
- No member-removal capability — does not exist anywhere in this app; not introduced here.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit: fake pool with 2 resolvable members; assert response HTML contains both identity+role pairs | Unit |
| AC2 | Unit: fake pool with 0 members; assert explicit empty-state string present, form still renders | Unit |
| AC3 | Integration: call handler (empty state), then call real `addOrUpdateTeammate`, then call handler again on the same pool instance; assert the second response includes the new member | Integration |
| AC4 | Unit: fake pool with members split across 2 tenants; assert tenant-A's response never contains tenant-B's identity | Unit |
| AC5 | Unit: fake pool with a payload identity string (`<img src=x onerror=alert(1)>`); assert the raw substring never appears unescaped in the response | Unit |

## Assumptions

- `listTeamMembers` (from `rtri-s1`) is assumed complete and merged before this story's implementation begins (Dependencies: Upstream `rtri-s1`).
- The list is rendered as a real `<ul>`/`<table>` (semantic markup, not `<div>`-as-row), matching this page's existing native-controls convention (Accessibility NFR).

## Estimated touch points

**Files:** `src/web-ui/routes/team-management.js`
**Services:** None
**APIs:** None new — this story calls `listTeamMembers` server-side directly, no new client-facing endpoint

## Schema Dependencies

`schemaDepends: ["reviewStatus", "testPlan", "stage"]`

This story's DoR sign-off depends on `rtri-s1`'s pipeline-state entry showing `reviewStatus: "passed"` and `testPlan.status: "written"` before its own function contract can be trusted as stable. These fields must remain in `pipeline-state.schema.json` with their current enum definitions.
