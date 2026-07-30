# Agency-Client relationships, shared-access grants, and read-only enforcement — Implementation Plan

> **For agent execution:** Executed directly in this session (/tdd per task, no subagent fan-out — single coding agent dispatch).

**Goal:** Build two new tables (`agency_client_relationships`, `shared_access_grants`) and one dedicated grant-check adapter function that every new Client-org read path must go through; extend the existing `requireJourneyAccess`/`isSameTenant` guard pattern (`middleware/journey-access.js`) rather than replacing it; no caching layer anywhere.
**Branch:** `feature/story-2-relationship-grants-enforcement`
**Worktree:** current worktree (already isolated)
**Test command:** `node tests/check-story2-relationship-grants-enforcement.js` (single file); `node scripts/run-all-tests.js` (full suite, includes AC6 regression run)

---

## File map

```
Create:
  src/web-ui/modules/agency-client-grants.js       — schema migration, relationship/grant CRUD, the ONE dedicated grant-check adapter, denial-audit logging
  tests/check-story2-relationship-grants-enforcement.js — 13 tests across 6 ACs + 3 NFR tests (per test plan)

Modify:
  src/web-ui/middleware/journey-access.js           — add requireGrantAccess(grant), extending the existing requireJourneyAccess/isSameTenant guard pattern (ADR-025)
  src/web-ui/routes/products.js                     — add handleCreateGrant, handleListSharedProducts, handleGetSharedProduct, handleMutateSharedProduct, handleRevokeGrant (all route logic reads/writes go through modules/agency-client-grants.js only — no ad hoc queries in the route file itself)
  src/web-ui/server.js                              — wire migrateAgencyClientGrantsSchema(pool) at startup (mirrors story-1's organisations-table migration wiring); no live URL dispatch registration for the new handlers yet (see decisions.md ambiguity note — Story 3/4 own the user-facing wiring)
  artefacts/2026-07-30-agency-client-organisations/decisions.md — log the no-live-routing-yet scope decision
```

---

## Task 1: Schema migration + relationship/grant adapter core (AC1)

**Files:**
- Create: `src/web-ui/modules/agency-client-grants.js`
- Test: `tests/check-story2-relationship-grants-enforcement.js`

- [ ] **Step 1: Write the failing test** — `createsGrantScopedToRelationshipNotOrgBroadly` (AC1): seed a relationship row in a fake pool, call `createGrant(pool, relationshipId, 'product', 'product-x')`, assert the returned row's `relationship_id` matches the seeded relationship — not a bare `client_org_id`.
- [ ] **Step 2: Run test — must fail** (`agency-client-grants` module does not exist yet) — `Cannot find module '../src/web-ui/modules/agency-client-grants'`
- [ ] **Step 3: Write implementation** — `migrateAgencyClientGrantsSchema(pool)` (two `CREATE TABLE IF NOT EXISTS` statements matching the story's ERD exactly: `agency_client_relationships(relationship_id PK, agency_org_id, client_org_id, created_at)`, `shared_access_grants(grant_id PK, relationship_id FK, resource_type, resource_id, granted_at, revoked_at)`), `createRelationship`, `getRelationshipById`, `createGrant` (audit-logs `grant_created`).
- [ ] **Step 4: Run test — must pass**
- [ ] **Step 5: Run full suite — no regressions** (full run deferred to Task 6, after all tasks land — running the full ~1000+ file suite after every task is wasteful; run only the new file after each task, full suite once at the end)
- [ ] **Step 6: Commit** — not committed per-task; one commit per this repo's PR-per-story convention (see ADR-008) at branch-complete.

---

## Task 2: The dedicated grant-check adapter — core security property (AC2)

**Files:**
- Modify: `src/web-ui/modules/agency-client-grants.js`
- Test: `tests/check-story2-relationship-grants-enforcement.js`

- [ ] **Step 1: Write the failing test** — `grantCheckDeniesAccessViaWrongRelationship` (AC2): two-Agency/one-Client fixture (Agency A relationship has a grant for Product X, Agency B relationship has none); assert `checkGrantAccess(pool, clientOrgId, 'product', 'product-x')` returns a truthy row (grant reachable via Agency A's relationship), and that a grant scoped only to Agency B's relationship for a DIFFERENT resource is never returned when checking Product X.
- [ ] **Step 2: Run — must fail** (`checkGrantAccess is not a function`)
- [ ] **Step 3: Implement** `checkGrantAccess(pool, clientOrgId, resourceType, resourceId)` — single JOIN query across `shared_access_grants` and `agency_client_relationships`, filtered by `client_org_id`, `resource_type`, `resource_id`, `revoked_at IS NULL`. Also implement `listGrantedResourcesForClient(pool, clientOrgId, resourceType)` for the AC2 list-view integration test.
- [ ] **Step 4: Run — must pass**

---

## Task 3: Read-only enforcement guard extension (AC3, AC4)

**Files:**
- Modify: `src/web-ui/middleware/journey-access.js`
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-story2-relationship-grants-enforcement.js`

- [ ] **Step 1: Write the failing tests** — `grantConveysReadNotWrite` (AC3, unit) and `noGrantReturnsNotFoundNotForbidden` (AC4, unit + integration).
- [ ] **Step 2: Run — must fail**
- [ ] **Step 3: Implement** — add `requireGrantAccess(grant)` to `middleware/journey-access.js` (throws `{code:'NOT_FOUND'}` when `grant` is falsy — reuses the existing `asHttpResponse`/`POLICY` shape so `POLICY.TENANT` maps to 404). Add route handlers to `products.js`: `handleGetSharedProduct` (calls `checkGrantAccess` + `requireGrantAccess`, 404 on denial, audit-logs the denial via `logDeniedAccess`), `handleMutateSharedProduct` (always 403 for any Client-org caller — a shared-access grant is read-only by construction, so this route never consults the grant at all; no mutation is ever attempted).
- [ ] **Step 4: Run — must pass**

---

## Task 4: Immediate revocation, no caching (AC5)

**Files:**
- Modify: `src/web-ui/modules/agency-client-grants.js`
- Test: `tests/check-story2-relationship-grants-enforcement.js`

- [ ] **Step 1: Write the failing test** — `revocationTakesEffectImmediately` (AC5, unit): create a grant, revoke it, call `checkGrantAccess` immediately in the same test tick with no delay; assert it returns falsy. Explicitly assert there is no TTL/cache field or memoization anywhere in the module (structural: `checkGrantAccess` issues a real query every call — confirmed by asserting the fake pool's query log grows by exactly 1 on each call).
- [ ] **Step 2: Run — must fail**
- [ ] **Step 3: Implement** `revokeGrant(pool, grantId, logger)` — `UPDATE ... SET revoked_at = NOW() WHERE grant_id = $1 AND revoked_at IS NULL RETURNING ...`; audit-logs `grant_revoked`.
- [ ] **Step 4: Run — must pass**

---

## Task 5: Full route-level integration tests + NFR tests (AC1/AC2/AC3/AC4/AC5 integration layer, Performance/Security/Audit NFRs)

**Files:**
- Modify: `src/web-ui/routes/products.js` (`handleCreateGrant`, `handleListSharedProducts`, `handleRevokeGrant`)
- Test: `tests/check-story2-relationship-grants-enforcement.js`

- [ ] **Step 1: Write the failing tests** — `agencyShareCreatesGrantEndToEnd`, `clientUserSeesOnlyGrantedProductsAcrossTwoAgencies`, `clientUserSeesOnlyGrantedProductsNotUngranted`, `mutationRouteRejectsGrantedReadOnlyUser`, `directIdAccessWithNoGrantReturns404`, `revokedGrantDeniesAccessOnNextRequest` (integration layer, calling route handlers directly with mock req/res + fake pool — mirrors `tests/check-bri-s3.4-cross-tenant-isolation.js`'s established pattern), plus `grantCheckAddsAtMostOneQueryPerProtectedRoute`, `everyNewReadPathGoesThroughGrantCheckGuard` (source-scan), `deniedAccessAttemptsAreAudited`.
- [ ] **Step 2: Run — must fail**
- [ ] **Step 3: Implement** the remaining route handlers in `products.js`, all reading/writing exclusively through `modules/agency-client-grants.js` (zero direct SQL against the two new tables in the route file — this is what the `everyNewReadPathGoesThroughGrantCheckGuard` NFR test asserts via source scan).
- [ ] **Step 4: Run — must pass**

---

## Task 6: Full suite + AC6 regression guard + server.js wiring

- [ ] **Step 1:** Wire `migrateAgencyClientGrantsSchema(pool)` into `server.js` startup (mirrors story-1's `migrateOrganisationsSchema` wiring — same reused Postgres pool).
- [ ] **Step 2:** Run `node tests/check-story2-relationship-grants-enforcement.js` standalone — all 13 test-plan tests + 3 NFR tests pass.
- [ ] **Step 3 (AC6, hard requirement):** Run `node tests/check-bri-s3.4-cross-tenant-isolation.js` unmodified — must be 100% passing, zero regressions.
- [ ] **Step 4:** Run `node scripts/run-all-tests.js` (full suite) — compare failure count against the pre-implementation baseline captured before Task 1; zero NEW failures.
- [ ] **Step 5:** Log the "no live URL routing yet" scope decision in `decisions.md` (ambiguity flag — see PR description).
- [ ] **Step 6:** Commit, push, open draft PR.

---

<!-- Task granularity note: this plan groups AC-1/AC-2/AC-3-4/AC-5/AC-6+integration into 6 tasks rather than 13 micro-tasks (one per individual test-plan test row), because most of the 13 tests share one implementation unit (the single grant-check adapter) — splitting further would not change what code gets written per step. Each task above still follows RED-GREEN per its own scope. -->
