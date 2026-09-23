## Story: Render a real member list on /team/members
**Epic reference:** artefacts/2026-09-23-team-roster-integration/epics/real-team-roster.md
**Discovery reference:** artefacts/2026-09-23-team-roster-integration/discovery.md
**Benefit-metric reference:** artefacts/2026-09-23-team-roster-integration/benefit-metric.md
**Domain:** web-ui

## User Story

As a **tenant admin viewing `/team/members`**,
I want **to see who is actually on my team, not just a form to add someone**,
So that **I can confirm who has been invited/added before assigning them to pods or features elsewhere in the app**.

## Benefit Linkage

**Metric moved:** /team/members shows a real list
**How:** This story wires `handleGetTeamMembers` (already rendering the page, already titled "Team members") to `rtri-s1`'s new read function, moving the metric from its confirmed 0-baseline (no list rendered at all today) to rendering every real member.

## Architecture Constraints

- **ADR-025 (tenant isolation):** the page must render only `req.session.tenantId`'s own members — reuses `rtri-s1`'s already tenant-scoped function directly, no new scoping logic.
- **ADR-026 (reuse an existing entity/pattern):** reads `rtri-s1`'s function directly server-side (this page is already server-rendered, unlike `pod-manager.html`) — no new client-side fetch endpoint needed for this story specifically, matching this page's own existing rendering convention exactly.
- No change to the existing add-teammate form (`POST /api/team/members`) or its handler — this story only adds a list above/alongside the existing form, reusing `handleGetTeamMembers`'s own existing shell-rendering call.

## Dependencies

- **Upstream:** `rtri-s1` (the real roster read function) must be complete — this story calls it directly, server-side.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a tenant with 2 real `team_memberships` rows, When `/team/members` is rendered, Then the response HTML contains a row for each of the 2 real members, showing their real identity and role.

**AC2:** Given a tenant with zero `team_memberships` rows, When `/team/members` is rendered, Then the page shows a real, explicit empty state (e.g. "No team members yet") — not a broken/blank render, and not the old add-form-only appearance with no indication of the (empty) list.

**AC3:** Given the existing add-teammate form on this same page, When a new teammate is added via that form (existing, unmodified flow) and the page is reloaded, Then the newly-added member now appears in the rendered list — proving the list reads live data, not a cached/stale snapshot.

**AC4:** Given two different tenants each with their own real members, When tenant A's admin views `/team/members`, Then only tenant A's members are shown — tenant B's members never appear (tenant isolation, ADR-025, reusing `rtri-s1`'s own already-scoped function).

**AC5:** Given a real identity string containing HTML-significant characters (e.g. an identity_key containing `<`, `>`, or `'`), When the member list is rendered, Then the value is passed through `html-shell.js`'s own existing `escHtml()` helper before being concatenated into the response HTML — this page is built via manual string concatenation (no auto-escaping template engine), and `escHtml()` is already this codebase's established mechanism for exactly this (used for `login`/`initial` and other identity-adjacent values elsewhere in `html-shell.js`). Matches `ep4-s1`'s own fixed pattern (commit `6adfb5b2`) and satisfies MC-SEC-01. Verified by a test asserting the payload string is never interpreted as markup in the rendered response.

## Out of Scope

- Any change to the add-teammate form itself, or the invite flow (`team-invitations.js`, `client-invitations.js`) — reused entirely unmodified.
- Removing a team member from this page — no such capability exists anywhere in this app today; out of scope for this story to introduce.
- Visual/design polish beyond a functional, correct list — this page's own existing story (`wsi-s6` and predecessors) already established "minimal, functional... no polished UI required" as its bar; this story matches that same bar for the new list.

## NFRs

- **Performance:** Page render time is not meaningfully affected — one additional indexed query, matching every other already-fast page in this app.
- **Security:** No new data exposure — only the viewing tenant's own real members are shown (ADR-025). Real identity strings rendered into the list MUST be passed through `html-shell.js`'s `escHtml()` helper, never concatenated into HTML raw (MC-SEC-01) — see AC5.
- **Accessibility:** The new member list uses real, semantic markup (a list or table, not divs-as-rows) — matches this page's own existing native-controls convention (labelled inputs, real `<button>`s) rather than introducing a new, less-accessible pattern.
- **Audit:** Not applicable — this story is read-only; the add-teammate action it displays results from is unaffected and remains unaudited as before (unchanged from today).

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
