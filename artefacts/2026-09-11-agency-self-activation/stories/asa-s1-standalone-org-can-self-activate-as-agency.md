# Story: A standalone organisation's admin can self-activate it as an Agency

**Epic reference:** None — short-track (bug/gap fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the finding below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **consultancy admin whose organisation is `org_type = 'standalone'`**,
I want **a way to activate my own organisation as an Agency**,
So that **I can actually reach the "Create Client" flow (`/agency/clients/new`) and the rest of `2026-07-30-agency-client-organisations`'s already-shipped, already-merged capability — which today is completely unreachable, because nothing in the shipped code ever sets any organisation's `org_type` to `'agency'`**.

## Benefit Linkage

**Metric moved:** Agency-led client provisioning (`2026-07-30-agency-client-organisations`, epic status `complete`, all 6 stories DoD-complete) — this story closes a gap found via live Chrome verification on `wuce-staging.fly.dev` (2026-09-11): every one of that epic's 6 stories assumes the caller's organisation already has `org_type = 'agency'` as a precondition, but no story in that epic — nor anything else in the shipped codebase — ever sets it. Confirmed by exhaustive grep across `src/web-ui/`: `modules/organisations.js` only ever creates rows with `org_type = 'standalone'` (default) or `org_type = 'client'` (the Create-Client flow's own new row); all 4 `org_type !== 'agency'` checks in `routes/agency-provisioning.js` only *read* the value. No admin panel, signup-time choice, seed script, or migration sets it either. As shipped, the entire epic is unreachable by any real user — which also explains why that epic's own DoD metric-signal sections all say "not-yet-measured, no real Agency has used it yet" (accurately: no one *can*, not just no one has tried).

**How:** Story 1 of the original epic explicitly named this as Story 3's responsibility ("Setting `org_type = 'agency'`... happens in Story 3"), but Story 3's shipped scope (`stories/story-3-self-service-provisioning.md`, that epic's own folder) only ever sets the *newly-created Client org's* type to `'client'` — it never touches the calling Agency admin's own org. This story adds the missing piece: a minimal, self-service activation action, mirroring the already-shipped, already-reviewed `org-conversion.js` (`client → standalone`) pattern closely enough to carry the same low implementation risk.

## Architecture Constraints

- **Mirror `org-conversion.js`'s existing, already-reviewed pattern exactly:** same admin-gate shape (`_isAdminOfOwnOrg`-equivalent: `modules/user-roles.js`'s `resolveRoleForPerson(pool, identityKey, orgId)`, called directly, never the injectable `getRoleForTenant`/`requireAdmin` layer — same reasoning as `decisions.md`'s 2026-07-31 ARCH entry for Stories 3+6), same single-statement atomic `UPDATE ... WHERE org_id = $1 AND org_type = 'X' RETURNING ...` shape in `modules/organisations.js` (idempotent-safe by construction, same as `convertOrganisationToStandalone`), same audit-log shape (`event`, `org_id`, `person_id`, `timestamp`).
- **One-way, `standalone`-only starting point:** the `UPDATE`'s `WHERE` clause only matches `org_type = 'standalone'` — an org that is already `'agency'` or `'client'` cannot be affected by this action (no re-triggering, no client-org role confusion). Reversal (agency → standalone) is out of scope, matching Story 6's own precedent of not building reversal for its conversion direction.
- **No new table touched:** this action touches only the `organisations` row's own `org_type` column — it must never read, write, or otherwise touch `agency_client_relationships` or `shared_access_grants` (mirrors Story 6's AC3 "touches ONLY the organisations row" guarantee, satisfied by construction).
- **No billing/Stripe involvement:** unlike Story 6's conversion (which redirects into checkout), becoming an Agency does not change what the org pays — reuses today's existing 1-tenant-1-Stripe-customer model unchanged, per the original epic's own Out of Scope ("Billing model redesign... deferred").
- Route naming mirrors `/organisations/convert`'s own convention: `GET/POST /organisations/become-agency`.

## Dependencies

- **Upstream:** `2026-07-30-agency-client-organisations` (all 6 stories) — already DoD-complete. This story is a direct correction closing a gap in that epic's own delivered scope, not a new feature built on top of it.
- **Downstream:** None. Once this ships, the original epic's own `/agency/clients/new` flow (Story 3) becomes reachable for the first time by any real user who activates their org this way.

## Acceptance Criteria

**AC1:** Given a logged-in admin of an organisation with `org_type = 'standalone'`, When they access "Become an Agency" and confirm, Then that same `org_id` row's `org_type` flips to `'agency'` in place (never a new row, never a data migration), and the action is audited (`org_id`, admin's `person_id`, timestamp).

**AC2:** (regression guard, admin gate) Given a logged-in user of a `standalone` org who is NOT that org's admin, When they attempt this action (GET or POST, e.g. by direct URL), Then the request is rejected (403) — the admin check is server-side only, never a client-supplied flag, matching `org-conversion.js`'s own established NFR-Security pattern. Denials are audited too.

**AC3:** (regression guard, one-way/scoped) Given an organisation whose `org_type` is already `'agency'` or `'client'` (not `'standalone'`), When an admin of that org attempts this action, Then the request is rejected (the `UPDATE`'s `WHERE org_type = 'standalone'` clause matches no row) — this action never affects an org that isn't currently `standalone`.

**AC4:** (regression guard, isolation) Given this action runs successfully, When the resulting database state is inspected, Then `agency_client_relationships` and `shared_access_grants` are completely untouched — this story only ever writes to the `organisations` table's own `org_type` column.

**AC5:** (end-to-end confirmation) Given an org has just self-activated as an Agency via this story, When that same admin then navigates to `/agency/clients/new` (the original epic's own Story 3 entry point), Then they reach the real Create-Client form — not the "only reachable by Agency-type organisations" rejection — confirming this story actually closes the gap it exists to close.

## Out of Scope

- Reversal (agency → standalone) — not built, matching Story 6's own precedent of one-directional conversion only.
- Any UI/visual design polish — a minimal, functional, keyboard-navigable form only, matching the original epic's own explicit deferral of visual design.
- Any change to `2026-07-30-agency-client-organisations`'s own 6 shipped stories — this story adds the missing precondition-setter, it does not modify any of their already-merged code.
- Bulk/admin-operator-driven activation (e.g. a platform-operator panel to flag specific orgs as agencies) — self-service only, matching the original discovery's own stated intent ("A consultancy can sign up as an Agency").

## NFRs

- **Performance:** Single indexed `UPDATE` on `organisations` by primary key — negligible, matches `convertOrganisationToStandalone`'s own established cost profile.
- **Security:** Server-side-only admin gate (AC2); one-way `standalone`-only transition prevents privilege confusion with existing `client`-type orgs (AC3). This directly extends the same tenant-isolation boundary (ADR-025) the original epic's Story 2 was given closer review for — this story's own narrow, single-column, precedent-mirroring scope keeps that risk low, but the DoR sign-off below is not skipped.
- **Accessibility:** Real `<form>`/`<input>` elements, keyboard-navigable, matching `org-conversion.js`'s own established pattern.
- **Audit:** Activation (and denied attempts) logged with admin identity, org ID, and timestamp, matching the original epic's own established audit conventions.

## Complexity Rating

**Rating:** 2 — a small, isolated addition that closely mirrors an already-shipped, already-reviewed sibling function (`convertOrganisationToStandalone` → `activateOrganisationAsAgency`), but touches the same security-sensitive org-type boundary the original epic flagged for closer review (Medium oversight), so it is not rated 1.
**Scope stability:** Stable — root cause (the missing precondition-setter) was confirmed via exhaustive code search and live reproduction before this story was written, not guessed.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
