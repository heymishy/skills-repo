# Story: Wire the already-built shared-access grant and client-agency comment routes into live URLs

**Epic reference:** None — short-track (bug/gap fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the finding below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **Agency admin who has provisioned a Client org** (now reachable end-to-end thanks to `asa-s1`),
I want **to actually share a product/feature with that Client org, and for the Client-org user to view and comment on it**,
So that **the original `2026-07-30-agency-client-organisations` epic's actual core value — Agency shares work, Client views and collaborates on it — is reachable, not just the account-provisioning shell around it**.

## Benefit Linkage

**Metric moved:** Both of `2026-07-30-agency-client-organisations`'s benefit metrics — "Agency-led client provisioning" (target explicitly includes "client user logs in and views ≥1 shared product/feature") and "Ongoing client-agency artefact collaboration" (target: "≥1 comment thread with both an Agency-org and a Client-org participant") — found via live Chrome verification on `wuce-staging.fly.dev` (2026-09-11), immediately after confirming `asa-s1`'s fix worked and continuing to validate the rest of the epic.

**How:** `modules/agency-client-grants.js` (Story 2) and the comment functions in `products.js` (Story 5) are fully implemented and unit/integration-tested — but 9 handler functions across both stories are exported and never imported into `server.js`'s live URL dispatch table: `handleCreateGrant`, `handleListSharedProducts`, `handleGetSharedProduct`, `handleMutateSharedProduct`, `handleRevokeGrant` (Story 2), and `handleCreateSharedComment`, `handleListSharedComments`, `handleCreateAgencyComment`, `handleListAgencyComments` (Story 5). Story 2's own scope note explains why: it deliberately deferred wiring to "Story 3 or Story 4, whichever determines the real user-facing URLs" — but neither ever did. Story 3's own Out of Scope section says the opposite: "granting access is a separate action... already modelled by Story 2's grant mechanism" — each story assumed the other owned this. Story 5 (comments) explicitly requires "a valid grant to view a shared product/feature" as its own precondition (AC1), so it inherits the same unreachability. Confirmed live: after activating as an Agency (`asa-s1`) and creating a real Client org (`client-07366a16a309dd14fe42927a`) on staging, there was no live route through which to actually share anything with it.

## Architecture Constraints

- **Pure wiring, no new business logic.** All 9 handler functions already exist, are already exported from `products.js`, and are already covered by `tests/check-story2-relationship-grants-enforcement.js` and `tests/check-story5-client-agency-comments.js` (calling them directly with mock req/res). This story only adds `require`/route-registration in `server.js`, mirroring the exact dispatch pattern already used for every other dynamic-segment route in that file (`pathname.match(/^\/prefix\/[^/]+\/suffix$/)`, `pathname.split('/')` for param extraction).
- **Real, necessary security fix bundled in, not scope creep:** the 3 mutating handlers (`handleCreateGrant`, `handleCreateSharedComment`, `handleCreateAgencyComment`) do not call `middleware/csrf.js`'s `csrfGuard` themselves — every other mutating POST route in `products.js` does (e.g. `handlePostGuardrailsForm`). Wiring these into live, externally-reachable URLs without adding that same guard would ship 3 new CSRF-vulnerable endpoints. This story adds the identical `var csrfOk = await _csrf.csrfGuard(req, res); if (!csrfOk) return; req.body = await _readBody(req);` preamble already established in `products.js` for every other mutating route — not a new pattern, the existing one, applied where it was missing.
- **Pool:** reuses `_pshPool`, the same pool variable already wired for every other `products.js` route in `server.js` — no new pool, no new migration (Story 2's schema migration is already wired).
- **URL design** (new, since neither deferring story ever defined one):
  - Agency-side: `POST /api/agency/grants`, `POST /api/agency/grants/:grantId/revoke`, `POST /api/agency/comments`, `GET /api/agency/comments/:id`
  - Client-side: `GET /client/shared-products`, `GET /client/shared-products/:id`, `PUT`/`POST`/`DELETE /client/shared-products/:id` (→ `handleMutateSharedProduct`, always 403 per Story 2's own AC3), `POST /client/comments`, `GET /client/comments/:id`
  - All behind `authGuard` (session required), matching every other route in this file.

## Dependencies

- **Upstream:** `2026-07-30-agency-client-organisations` Stories 2 and 5 (already DoD-complete) — this story wires their already-shipped, already-tested handler functions; it does not modify their internal logic. `asa-s1` (already merged) — this story's own live verification depends on being able to reach `/agency/clients/new` at all.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given an Agency admin with an existing Agency→Client relationship, When they call `POST /api/agency/grants` with a valid `relationshipId`/`resourceType`/`resourceId`, Then a grant is created and `handleCreateGrant`'s existing relationship-ownership check (the caller's org must be the relationship's `agency_org_id`) is enforced exactly as already tested.

**AC2:** Given a Client-org user with an active grant, When they call `GET /client/shared-products` or `GET /client/shared-products/:id`, Then they see the resources granted to their org — and a Client-org user with NO grant for a given resource gets a 404 (never a 403 that would confirm the resource's existence), matching Story 2's own already-tested AC4 policy.

**AC3:** Given a Client-org user, When they attempt any mutating request (`PUT`/`POST`/`DELETE`) against `/client/shared-products/:id`, Then it is rejected with 403 — shared-access grants are read-only, matching Story 2's own already-tested AC3, now actually reachable over HTTP.

**AC4:** Given a Client-org user with a valid grant, When they call `POST /client/comments`, Then a comment is created and visible via `GET /client/comments/:id` to both the Client-org user and Agency-org users with access to that resource — and a Client-org user with no grant gets 404, matching Story 5's own already-tested AC1/AC2.

**AC5:** (security regression guard, new) Given `POST /api/agency/grants`, `POST /client/comments`, and `POST /api/agency/comments` are now live, externally-reachable routes, When a request is submitted without a valid CSRF token, Then it is rejected — matching every other mutating POST route in this codebase.

**AC6:** (end-to-end confirmation) Given an Agency org has activated (`asa-s1`), created a Client org and relationship (Story 3), and shares a product via this story's new `POST /api/agency/grants` route, When that Client org's session then calls `GET /client/shared-products`, Then the shared product appears — confirming the epic's own core value chain is reachable end-to-end for the first time.

## Out of Scope

- Any change to the internal logic of `handleCreateGrant`, `handleListSharedProducts`, `handleGetSharedProduct`, `handleMutateSharedProduct`, `handleRevokeGrant`, `handleCreateSharedComment`, `handleListSharedComments`, `handleCreateAgencyComment`, or `handleListAgencyComments` — all 9 are wired unmodified.
- Any UI page/form for browsing shared products or posting comments — this story wires the API routes only (matching the original epic's own explicit deferral of "UI/visual design of any agency/client-facing screens").
- Fixing `handleCreateAgencyComment`/`handleListAgencyComments`'s lack of an explicit resource-ownership check (they trust the caller's own `agencyOrgId` without verifying it actually owns the resource) — a separate, smaller finding, out of scope for this wiring story; logged in `decisions.md` as a follow-up.
- Any change to Story 3's or Story 4's own already-shipped routes.

## NFRs

- **Performance:** No new queries beyond what the already-tested handler functions already issue — wiring only.
- **Security:** AC5 is the load-bearing NFR here — CSRF protection is mandatory on all 3 newly-wired mutating routes, not optional. `handleGetSharedProduct`/`handleListSharedProducts`/`handleListSharedComments`/`handleListAgencyComments` are read-only GETs, no CSRF needed (matching this codebase's existing convention of CSRF-guarding only mutating requests).
- **Accessibility:** Not applicable — API routes only, no UI in this story.
- **Audit:** Already covered by the existing, unmodified handler functions (`_sharedAccessLogger`, `logDeniedAccess`) — no new audit requirement from wiring alone.

## Complexity Rating

**Rating:** 2 — mechanical wiring of 9 already-tested handlers plus one well-precedented security addition (an existing `csrfGuard` pattern applied where it was missing), no new business logic. Rated 2 rather than 1 because it introduces new externally-reachable routes touching the same tenant-isolation/grant boundary the original epic's Story 2 was given closer review for.
**Scope stability:** Stable — root cause (deferred wiring, deferred by both stories to each other) confirmed by reading both stories' own text and exhaustive grep, not guessed.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
