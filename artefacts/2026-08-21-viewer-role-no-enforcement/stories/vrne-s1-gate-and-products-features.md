# Story: Build the shared viewer-write-block gate and wire it to Products + Features/journeys routes

**Epic reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/epics/vrne-e1-viewer-write-blocking.md`
**Discovery reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/discovery.md`
**Benefit-metric reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/benefit-metric.md`
**Domain:** [web-ui, security, auth]

## User Story

As an **admin who assigned a teammate the `viewer` role expecting read-only access** (e.g. an external stakeholder, contractor, or auditor),
I want **that teammate to be denied when they attempt to create, edit, or delete a product or feature/journey**,
So that **`viewer` actually means read-only, closing the gap between the role's name and its real behaviour**.

## Benefit Linkage

**Metric moved:** Viewer role actually enforces read-only access (Tier 1); Enumerated viewer-role write actions blocked (Tier 3)
**How:** This story builds the shared gate mechanism and applies it to the highest-value, most directly "write"-shaped route group (Products + Features/journeys) — the group that most directly matches `bri-s3.3`'s original, never-implemented AC3 promise. Each route gated moves both metrics from 0% toward 100% for this group and proves the mechanism safe before further rollout.

## Architecture Constraints

- **Mirror `requireAdmin`'s existing pattern** (`src/web-ui/middleware/require-admin.js`) — fail-closed by default, checks `req.session.role` with a live-role re-check via an injectable adapter (`setGetCurrentRole`) when wired, self-heals the cached session role, and logs every denial. The new gate (`requireNonViewer` or equivalent) should reuse the *same* live-role-resolution call, not duplicate it — both gates need to observe the same live role on the same request.
- **Deny by default** — this repo's own injected security standard, already applied identically in `jatg-s1`'s `requireJourneyAccess()` fix this same session: an ambiguous or unresolved role state must deny, not silently pass through.
- **D37 injectable-adapter rule (CLAUDE.md)** — if this gate introduces its own new injectable adapter rather than reusing `requireAdmin`'s existing `_getCurrentRole`/`setGetCurrentRole`, the stub default must throw, not return a safe-looking value. Reusing `requireAdmin`'s already-wired adapter avoids this entirely — strongly preferred.
- None else identified beyond the above — checked against `.github/architecture-guardrails.md`.

## Dependencies

- **Upstream:** None
- **Downstream:** `vrne-s2`, `vrne-s3`, `vrne-s4` reuse this story's shared gate function against their own route groups — those stories cannot start implementation until this gate exists.

## Acceptance Criteria

**AC1:** Given a session with `role: 'viewer'`, When the person submits `POST /products/confirm` (or any Products-group write route: `/products/new`, `/products/:id/sync`, `/products/:id/repo`, `/products/:id` PUT/DELETE, `/products/:id/repo/create`, `/products/:id/guardrails/form`, `/products/:id/guardrails/promote`, `/products/:id/modules` POST/PUT/DELETE, `/products/:id/epics/:epicId/module`, `/products/:id/modules/bulk-assign`, `/api/board/journey/:id/advance`), Then the response is a real denial (403, matching `requireAdmin`'s existing status-code convention) — not a silent 200.

**AC2:** Given a session with `role: 'viewer'`, When the person submits `POST /products/:id/features` (create a feature/journey) or any Features/journeys-group write route (`/api/journey`, `/api/journey/:id/gate-confirm`, `/api/journey/:id/stories`, `/api/journey/:id/stage/:stage/artefact`, `/api/journey/:id/reference`, `/api/journey/:id/reference-upload`, `/api/journey/:id/reference-modal/skip`, `/api/journey/:id/side-trip/clarify`, `/api/journey/:id/decisions`, `/api/journey/:id/estimate`, `/api/journey/:id/spikes` POST/PATCH, `/api/journey/:id/side-trip` DELETE, `/api/journey/:id` DELETE, `/api/journey/:id/display-name` PUT, `/api/ideas` POST/DELETE), Then the response is a real denial — not a silent success.

**AC3:** Given a session with `role: 'engineer'` or `role: 'product'` or `role: 'admin'`, When that person submits any of the same routes covered by AC1/AC2, Then the request proceeds exactly as it did before this story (no regression) — proving the gate does not over-broadly restrict non-viewer roles.

**AC4:** Given a session with no role set (`role` missing, null, or any value other than `'admin'`/`'engineer'`/`'product'`/`'viewer'`), When that person submits any gated route, Then the request is denied (fail-closed for ambiguous/unknown role state — matches `requireAdmin`'s own fail-closed default and this repo's "deny by default" standard).

**AC5:** Given the gate denies a viewer-role request, When the denial occurs, Then it is logged with person ID, tenant ID, timestamp, and the attempted route (mirroring `requireAdmin`'s existing `admin_access_denied` audit log pattern — e.g. `viewer_write_denied`).

## Out of Scope

- Skill session routes, Credits/billing routes, and edge-case routes (agency client creation/invite, annotations) — covered by `vrne-s2`/`vrne-s3`/`vrne-s4` respectively.
- Team-management routes — already fully `requireAdmin`-gated, confirmed via codebase audit; no change needed.
- Read-only (`GET`) routes anywhere — `viewer` must retain full read access; this story only touches write (`POST`/`PUT`/`DELETE`) routes.
- Retrofitting `requireAdmin` itself — this story adds a new, separate gate function; it does not modify `requireAdmin`'s own logic.

## NFRs

- **Performance:** The gate's live-role check reuses `requireAdmin`'s existing DB-lookup adapter call — no new query pattern, no additional latency beyond what `requireAdmin`-gated routes already incur today.
- **Security:** This IS the security fix. AC3 and AC4 are the regression guards — AC3 against over-broadly restricting non-viewer roles, AC4 against under-restricting ambiguous role state.
- **Accessibility:** Not applicable — this is a server-side authorization change with no UI surface of its own (the existing route's own UI, if any, is unaffected).
- **Audit:** AC5 — every denial is logged with person ID, tenant ID, timestamp, and route.

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
