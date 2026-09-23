# Discovery: Wire Pod/Team Pickers to the Real Team Roster

**Status:** Clarified — awaiting approval
**Created:** 2026-09-23
**Approved by:** Pending
**Author:** Claude (session-driven, grounded in direct code investigation)

---

## Problem Statement

Every pod/team-membership feature in this app — `pod-manager.html`'s member picker (since `ep1-s1`) and `ep4-s1`'s multi-pod-assignment collaborator picker (`new-feature-2b74a292`) — selects members from a hardcoded, client-side-only array (`ORG_ROSTER` in `pod-manager.html`: `hamish-uuid`/`susan-uuid`/`darren-uuid`) that has no relationship to this app's real, authenticated, tenant-scoped users. This means every pod ever created in production contains only these 3 fictional names, never a real teammate. The gap was found live during `ep4-s1`'s Definition of Done and confirmed by the operator's own independent poking at staging (`workspace/capture-log.md`, 2026-09-23).

Separately, this app already has a real, already-shipped people/roles system — `people`, `team_memberships`, `person_identities` tables (from a distinct, prior epic, `team-identity-roles`, `tir-s1` onward) — populated whenever a real teammate is invited or explicitly added (`team-invitations.js`, `client-invitations.js`, `team-management.js`), keyed by their real login identity (GitHub login, Google email, or email/password email). This real system was never wired to any pod/team picker. A `/team/members` page already exists but currently only offers an add-teammate form — it renders no list of existing members at all, a related, adjacent gap in the same real system.

## Who It Affects

- **Product owners and feature leads** assigning pods (`ep1-s1`/`ep4-s1`): they can only ever select from 3 fake names, so no pod they create ever reflects their real team — the feature is functionally cosmetic in production.
- **Real, authenticated tenant users** (invited/added via the existing team-management flows, with real rows in `team_memberships`): they exist in this app's real identity system but have no way to appear in any pod/roster picker, so they can never actually be added to a team through the pod-management UI, regardless of their real membership status.

## Why Now

`ep4-s2` ("Dynamically Add/Remove Pod Members Mid-Feature") is directly blocked — its AC1 requires "a picker allowing selection of any org member," and the only "list of people" anywhere in this app is the same 3-name fictional fixture. Rather than build a third feature on top of that known-fictional data (compounding the gap), the operator's own explicit call was to pause `ep4-s2` and address the real roster gap first.

## MVP Scope

1. **One new read function** — list the real team members for a tenant, joining `team_memberships` (role, tenant scope) with `person_identities` (identity_key as the real, displayable name/handle) — reusing the already-real, already-tested schema from `tir-s1`/`tir-s2` exactly as-is, no new tables. A `team_memberships` row with no matching `person_identities` row is silently omitted from the result — matches this app's own existing "no auto-creation, fall through unchanged" philosophy for unresolvable identities (`user-roles.js`'s `resolveRoleForPerson`, AC4).
2. **One new fetch endpoint** (e.g. `GET /api/team/members`) exposing that function's result — `pod-manager.html` currently has zero server-rendered dynamic data (its whole roster is a static client-side array), so the real roster must reach it via a client-side fetch, matching the same pattern `ep4-s1`'s own `GET /products/:id/features/:id/pods` already established (not a server-render injection, which would be a bigger change to a page that has never had one).
3. **Wire `pod-manager.html`'s roster picker** to fetch from this new endpoint instead of reading the hardcoded `ORG_ROSTER` array.
4. **Wire `ep4-s1`'s "Assign pods" modal's implicit collaborator-sourcing** (pod membership, which flows into `feature_collaborators`) to real pod members once `pod-manager.html` itself sources real people — no separate `ep4-s1` code change is expected to be needed, since it already reads whatever `pod_members` contains; the fix is upstream, at pod-creation time.
5. **Fix `/team/members` to actually render a real member list**, using the same new read function (server-side render, matching that page's own existing convention) — closing the adjacent, already-identified gap in the same real system while it's being touched anyway.

No new invite, signup, or role-management system — all of that machinery already exists and is reused read-only.

## Out of Scope

- **Building a new invite/signup/roles system** — already exists (`team-identity-roles` epic, `tir-s1` onward); this MVP only adds a read path on top of it.
- **Auto-creating `people`/`team_memberships` rows on raw login** — deliberately not how the existing system works today (confirmed directly: `auth.js`/`auth-email.js` never write to these tables). Membership stays invite/add-driven, matching the existing system's own established semantics; changing that is a distinct, unrequested feature.
- **Resuming `ep4-s2` itself** — a separate story, to be resumed once this MVP ships and its own picker can be re-grounded against real data instead of `ORG_ROSTER`.

## Assumptions and Risks

**Real risk (not hypothetical):** `pod_members.user_id` currently always stores one of the 3 fake `ORG_ROSTER` ids (`hamish-uuid`, `susan-uuid`, `darren-uuid`, or `me-uuid` for the pod creator) — never a real `person_identities.identity_key`. Wiring the *picker* to real data only affects pods created **after** this MVP ships; every pod created before it keeps pointing at fake ids indefinitely unless separately migrated. This is a genuine, deferred risk, flagged here rather than silently dropped — a future backfill/migration story may be needed if any pre-existing pod data needs to be corrected rather than treated as disposable.

**Resolved via `/clarify`:** a `team_memberships` row with no matching `person_identities` row (possible via `user-roles.js`'s legacy `_backfillOne` migration path, which inserts directly into `people`/`team_memberships` without necessarily creating a matching `person_identities` row) is silently omitted from the real roster list — see MVP Scope item 1. Not treated as an error or shown with a fallback label; matches this app's own established convention for unresolvable identities.

## Directional Success Indicators

1. **Real pod picks.** Baseline: 0% of `pod_members` rows reference a real `identity_key` (100% reference fake `ORG_ROSTER` ids today, confirmed by direct inspection). Target: 100% of *newly-created* `pod_members` rows reference a real `identity_key`. Measured via: a query comparing `pod_members.user_id` against `person_identities.identity_key` for pods created after this ships.
2. **`/team/members` shows a real list.** Baseline: 0 (the page currently renders no member list at all — add-form only, confirmed by direct code inspection). Target: the page renders every real `team_memberships` row for the current tenant. Measured via: direct inspection of the rendered page against the tenant's known `team_memberships` rows.

## Constraints

1. **No new schema** — reuse `people`/`team_memberships`/`person_identities` exactly as they exist today; no new tables, no migrations beyond what `tir-s1`/`tir-s2` already shipped.
2. **Tenant isolation (ADR-025)** — the new list-members query must scope strictly by `tenant_id`, matching every existing `team_memberships` query's own established convention.
3. **No changes to the invite/add-teammate flow itself** (`team-invitations.js`, `client-invitations.js`, `team-management.js`) — reused read-only; this MVP adds a read path, not a write path, to the existing real system.

## Contributors

- Hamish King — Operator/Product Owner

## Reviewers

- [Pending]

## Approved By

Pending

## Clarification log

[2026-09-23] Clarified via /clarify:
- Q: If a `team_memberships` row has no matching `person_identities` row, how should the picker handle it?  A: Skip it silently — matches this app's existing "no auto-creation, fall through unchanged" philosophy for unresolvable identities.
- Q: `pod-manager.html` has zero server-rendered dynamic data today — how should the real roster reach it?  A: A new fetch endpoint (`GET /api/team/members`-style), matching `ep4-s1`'s own `GET /products/:id/features/:id/pods` pattern — not a server-render injection.

---

**Next step:** Human review and approval → /benefit-metric
