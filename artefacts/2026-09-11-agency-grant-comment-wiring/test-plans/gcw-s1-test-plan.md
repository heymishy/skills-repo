## Test Plan: Wire the already-built shared-access grant and client-agency comment routes into live URLs

**Story reference:** artefacts/2026-09-11-agency-grant-comment-wiring/stories/gcw-s1-wire-grant-and-comment-routes.md
**Epic reference:** None — short-track
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-09-11

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Grant creation reachable via live route, ownership enforced | — | 2 tests | — | Live Chrome smoke check (staging) | — | 🟢 |
| AC2 | Shared-product listing/get reachable, 404 for no-grant | — | 3 tests | — | Live Chrome smoke check (staging) | — | 🟢 |
| AC3 | Mutation always 403 on the wired route | — | 1 test | — | — | — | 🟢 |
| AC4 | Comment create/list reachable, grant-gated | — | 3 tests | — | Live Chrome smoke check (staging) | — | 🟢 |
| AC5 (security regression) | CSRF required on all 3 mutating routes | — | 3 tests | — | — | — | 🟢 |
| AC6 (end-to-end confirmation) | Full chain: activate → create client → grant → client sees it | — | 1 test | — | Live Chrome smoke check (staging) | — | 🟢 |

All ACs are integration-level (full route-stack: real `server.js`-style dispatch shape, not just calling the handler function directly — since the whole point of this story is confirming the *wiring*, not re-testing logic already covered by `check-story2-relationship-grants-enforcement.js`/`check-story5-client-agency-comments.js`). A live Chrome smoke check on staging closes the loop for AC1/AC2/AC4/AC6, matching the standard set by `asa-s1` and `jgls-s1` earlier this session — not because any of this is CSS-layout-dependent (it isn't, these are JSON API routes), but because "does this actually work for a real user over the real network" is exactly the class of gap this story exists to fix.

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** In-process fake pool, mirroring `tests/check-story2-relationship-grants-enforcement.js`'s and `tests/check-story5-client-agency-comments.js`'s own existing `makeFakePool` conventions, extended minimally for route-level dispatch (calling the handler exactly as the new `server.js` wiring would, including the `csrfGuard` preamble for mutating routes).
**PCI/sensitivity in scope:** No.
**Availability:** N/A.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | An Agency org, a Client org, an `agency_client_relationships` row between them | In-test fixture | None | |
| AC2 | AC1's fixture plus a `shared_access_grants` row (granted) and a resource with no grant (for the 404 case) | In-test fixture | None | |
| AC3 | AC2's fixture | In-test fixture | None | |
| AC4 | AC2's fixture | In-test fixture | None | |
| AC5 | AC1's fixture, plus a session with/without a valid `_csrf` token | In-test fixture | None | |
| AC6 | A fresh `standalone` org (for the full activate → create-client → grant → view chain) | In-test fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Integration Tests

### grantCreationReachableViaLiveRouteWithOwnershipEnforced (AC1)

- **Verifies:** AC1
- **Action:** Dispatch a mocked request matching the new route-registration shape (method + pathname + params, mirroring exactly what `server.js`'s wiring will do) to `handleCreateGrant` for a relationship the caller's org owns, and separately for one it does not.
- **Expected result:** Owner succeeds (200, grant created); non-owner gets 404 (matching the handler's own existing, already-tested behaviour) — this test confirms the *route* reaches the handler correctly, not new logic.

### grantOwnershipRejectedAtRouteLevel (AC1 negative)

- **Verifies:** AC1
- **Action:** Same as above, caller org is not the relationship's `agency_org_id`.
- **Expected result:** 404, no grant created.

### sharedProductsListAndGetReachableViaLiveRoute (AC2)

- **Verifies:** AC2
- **Action:** Dispatch to `handleListSharedProducts` and `handleGetSharedProduct` via the new route shapes for a Client-org session with an active grant.
- **Expected result:** 200, resource(s) returned.

### sharedProductGetReturns404ForNoGrant (AC2 negative)

- **Verifies:** AC2
- **Action:** Same as above, no grant exists for the requested resource.
- **Expected result:** 404 (never 403).

### sharedProductsListEmptyForNoGrants (AC2 edge)

- **Verifies:** AC2
- **Action:** `handleListSharedProducts` for a Client org with zero grants.
- **Expected result:** 200, empty `resources` array.

### mutationAlwaysRejectedOnWiredRoute (AC3)

- **Verifies:** AC3
- **Action:** Dispatch PUT/POST/DELETE to `/client/shared-products/:id` via the new route shape.
- **Expected result:** 403 for all three methods, no pool mutation attempted.

### sharedCommentCreateAndListReachableViaLiveRoute (AC4)

- **Verifies:** AC4
- **Action:** Dispatch to `handleCreateSharedComment` and `handleListSharedComments` via the new route shapes for a Client-org session with an active grant.
- **Expected result:** 200, comment created and visible in the list.

### agencyCommentCreateAndListReachableViaLiveRoute (AC4)

- **Verifies:** AC4
- **Action:** Dispatch to `handleCreateAgencyComment` and `handleListAgencyComments` via the new route shapes for the Agency-org session.
- **Expected result:** 200, comment created and visible in the list (including the Client-org's own comment from the prior test, confirming both sides see the same thread).

### sharedCommentCreateReturns404ForNoGrant (AC4 negative)

- **Verifies:** AC4
- **Action:** `handleCreateSharedComment` for a Client org with no grant on the target resource.
- **Expected result:** 404, no comment created.

### csrfRequiredOnCreateGrant (AC5)

- **Verifies:** AC5
- **Action:** Dispatch to the wired `POST /api/agency/grants` route (through the new `csrfGuard` preamble, not calling `handleCreateGrant` directly) with a missing/invalid `_csrf` token.
- **Expected result:** 403 "Forbidden", no grant created.

### csrfRequiredOnCreateSharedComment (AC5)

- **Verifies:** AC5
- **Action:** Same as above for `POST /client/comments`.
- **Expected result:** 403, no comment created.

### csrfRequiredOnCreateAgencyComment (AC5)

- **Verifies:** AC5
- **Action:** Same as above for `POST /api/agency/comments`.
- **Expected result:** 403, no comment created.

### fullChainActivateCreateClientGrantAndClientViewSucceeds (AC6)

- **Verifies:** AC6
- **Action:** Chain: `activateOrganisationAsAgency` (asa-s1) → `handlePostCreateClient` (Story 3) → the new wired `POST /api/agency/grants` route → the new wired `GET /client/shared-products` route, all through the real handler functions in sequence, mirroring a real end-to-end user journey.
- **Expected result:** The Client org's `GET /client/shared-products` call returns the shared resource — confirming the full chain this story exists to unblock.

---

## Wiring regression test

### serverWiresGrantAndCommentRoutes

- **Verifies:** all ACs (wiring presence)
- **Action:** Source-scan `server.js`, mirroring `check-story6-conversion-to-independent.js`'s own `serverWiresOrgConversionRoutes` convention.
- **Expected result:** All 9 route paths (`/api/agency/grants`, `/api/agency/grants/:grantId/revoke`-shaped match, `/api/agency/comments`, `/client/shared-products`-shaped matches, `/client/comments`-shaped matches) and all 9 handler names appear wired.

---

## NFR Tests

None beyond AC5's own CSRF coverage, which is this story's one material NFR.

---

## Out of Scope for This Test Plan

- Re-testing the internal logic of any of the 9 handler functions — already covered by `check-story2-relationship-grants-enforcement.js` and `check-story5-client-agency-comments.js`, unmodified by this story.
- Any UI-level test — no UI in this story.

---

## Test Gaps and Risks

None identified.
