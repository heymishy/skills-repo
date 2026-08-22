# Story: Wire the viewer-write-block gate to edge-case routes (agency client creation/invite, artefact annotations)

**Epic reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/epics/vrne-e1-viewer-write-blocking.md`
**Discovery reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/discovery.md`
**Benefit-metric reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/benefit-metric.md`
**Domain:** [web-ui, security, auth]

## User Story

As an **admin who assigned a teammate the `viewer` role at an Agency-type org**,
I want **that teammate to be denied when they attempt to create or invite a Client org, or annotate an artefact**,
So that **the `viewer` role is consistently enforced even on lower-traffic routes that were only ever gated on org type, not the caller's own role**.

## Benefit Linkage

**Metric moved:** Viewer role actually enforces read-only access (Tier 1); Enumerated viewer-role write actions blocked (Tier 3)
**How:** `/agency/clients/new` and `/agency/clients/:id/invite` are gated on the caller's org being Agency-type, but have no user-role check at all — a `viewer` in an Agency-type org can create or invite Client orgs today. `/api/artefacts/:slug/annotations` is gated only on session presence. Gating all three closes the remaining enumerated gap to 0.

## Architecture Constraints

- **Reuse the shared gate built in `vrne-s1`** — do not duplicate role-check logic in `routes/agency-provisioning.js` or `routes/annotation.js`.
- **Additive, not replacing, the existing org-type check** — `/agency/clients/new` and `/agency/clients/:id/invite` (`routes/agency-provisioning.js:132`, `:196`) must keep their existing `org_type === 'agency'` check; the viewer-write-block gate is applied *in addition to* it, not instead of it. A viewer at a non-Agency org must still be denied for the pre-existing org-type reason, not a different one.
- **Deny by default** — same standard as the other 3 stories in this epic.
- None else identified — checked against `.github/architecture-guardrails.md`.

## Dependencies

- **Upstream:** `vrne-s1` — must be DoD-complete before this story wires the shared gate to these routes.
- **Downstream:** None. This is the last story in the epic — once complete, the epic's enumerated route set (per the operator's `/definition`-time scope decision) is fully covered.

## Acceptance Criteria

**AC1:** Given a session with `role: 'viewer'` at an Agency-type org, When the person submits `POST /agency/clients/new`, Then the response is a real denial — no Client org is created.

**AC2:** Given a session with `role: 'viewer'` at an Agency-type org, When the person submits `POST /agency/clients/:id/invite`, Then the response is a real denial — no invite is sent.

**AC3:** Given a session with `role: 'viewer'`, When the person submits `POST /api/artefacts/:slug/annotations`, Then the response is a real denial — no annotation is created.

**AC4:** Given a session with `role: 'engineer'`, `'product'`, or `'admin'` at an Agency-type org, When that person submits `/agency/clients/new` or `/agency/clients/:id/invite`, Then the request proceeds exactly as before this story (no regression to legitimate Agency-org client provisioning).

**AC5:** Given a session with any role at a non-Agency-type org, When that person submits `/agency/clients/new` or `/agency/clients/:id/invite`, Then the request is still denied for the pre-existing org-type reason (confirms the new gate is additive, not a replacement that could accidentally weaken the existing org-type check).

**AC6:** Given the gate denies a viewer-role request on any of this story's 3 routes, When the denial occurs, Then it is logged the same way as the other stories in this epic (person ID, tenant ID, timestamp, route).

## Out of Scope

- Products/Features, Skill session, and Credits/billing routes — covered by `vrne-s1`/`vrne-s2`/`vrne-s3`.
- Any change to Agency/Client org provisioning logic itself beyond the additive role gate.
- `/journey/wizard`'s missing auth check (flagged during the `/definition` route audit as having zero auth check of any kind) — a broader, separate issue than viewer-role scoping (any unauthenticated caller could hit it today, not just an authenticated viewer); out of scope for this epic, worth its own finding if prioritized later.
- `/api/admin/promotions/:id/approve`/`reject` and `/organisations/convert` — these are internally admin-gated (`isEffectivelyAdmin`/`_isAdminOfOwnOrg`) despite not using `requireAdmin` directly; already effectively admin-only, confirmed at `/definition`, no viewer-role gap exists there.

## NFRs

- **Performance:** No new query pattern — reuses `vrne-s1`'s gate.
- **Security:** Closes the last enumerated gaps, including one (`/agency/clients/*`) that was never role-gated at all, only org-type-gated. AC4 and AC5 are the regression guards — AC5 specifically protects against accidentally weakening the pre-existing org-type check while adding the new role check.
- **Accessibility:** Not applicable.
- **Audit:** AC6 — every denial logged.

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
