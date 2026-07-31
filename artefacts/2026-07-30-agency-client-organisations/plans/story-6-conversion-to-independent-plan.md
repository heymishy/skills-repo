# Client org self-service conversion to an independent paying account — Implementation Plan

> **For agent execution:** Executed directly (single coding-agent session), task by task, TDD per task.

**Goal:** A conversion route/handler that updates `org_type` from `client` to `standalone` in place on the same `organisations` row, gated by `team_memberships.role === 'admin'` for that org, then redirects into the existing `createCheckoutSession` Stripe flow.
**Branch:** `feature/story-6-conversion-to-independent`
**Worktree:** current session worktree
**Test command:** `node tests/check-story6-conversion-to-independent.js` (and `node scripts/run-all-tests.js` for the full suite)

---

## File map

```
Create:
  src/web-ui/routes/org-conversion.js               — GET/POST /organisations/convert handlers (AC1, AC2, NFR-Accessibility, NFR-Audit)
  tests/check-story6-conversion-to-independent.js   — all 13 tests (4 ACs + 4 NFRs + wiring)

Modify:
  src/web-ui/modules/organisations.js                — add convertOrganisationToStandalone(pool, orgId, logger)
  src/web-ui/server.js                                — require + instantiate org-conversion handlers; wire GET/POST /organisations/convert behind authGuard (mirrors Story 3's real-URL wiring precedent, now that Story 3 has resolved the Client-org session shape ambiguity Story 2/5 flagged)
  artefacts/2026-07-30-agency-client-organisations/decisions.md — log the role-check reuse mechanism, the AC2 same-function-reuse mechanism, and the server.js wiring touch-point deviation
```

---

## Task 1: `convertOrganisationToStandalone` — AC1's data mutation, in place, same `org_id`

**Files:**
- Modify: `src/web-ui/modules/organisations.js`
- Test: `tests/check-story6-conversion-to-independent.js` (`convertsOrgTypeInPlaceRetainingSameOrgId`)

- [ ] **Step 1: Write the failing test** — seed a `client`-type org, call the not-yet-existing `organisations.convertOrganisationToStandalone(pool, orgId)`, assert `org_type === 'standalone'` on the SAME `org_id` row.
- [ ] **Step 2: Run test — must fail** — `TypeError: organisations.convertOrganisationToStandalone is not a function`
- [ ] **Step 3: Write minimal implementation** — single-statement `UPDATE organisations SET org_type = 'standalone' WHERE org_id = $1 AND org_type = 'client' RETURNING ...` (atomic; returns `null` if not currently `client`), with an `organisation_converted_to_standalone` audit log entry on success.
- [ ] **Step 4: Run test — must pass**
- [ ] **Step 5: Run full suite — no regressions**
- [ ] **Step 6: Commit** — `feat: add convertOrganisationToStandalone (org_type flip, same org_id)`

---

## Task 2: Admin-role gate — reuse `resolveRoleForPerson`, no new permission mechanism

**Files:**
- Create: `src/web-ui/routes/org-conversion.js`
- Test: `tests/check-story6-conversion-to-independent.js` (`conversionRejectedForNonAdminRole`, `conversionRestrictedToAdminRoleServerSide`)

- [ ] **Step 1: Write the failing test** — seed a `team_memberships` row with `role='viewer'` for the org, call `handlePostConvertOrganisation`, assert 403 and `org_type` unchanged.
- [ ] **Step 2: Run test — must fail** — module does not exist yet.
- [ ] **Step 3: Write minimal implementation** — `createOrgConversionHandlers(pool)` factory; `_isAdminOfOwnOrg` resolves `req.session.tenantId` (the org's own tenant_id per Story 3's session shape) and calls `userRoles.resolveRoleForPerson(pool, req.session.login || req.session.tenantId, orgId)` directly (not the injectable `getRoleForTenant`/`requireAdmin` layer, which closes over a single server-wired pool — this route's factory takes `pool` explicitly, mirroring `routes/agency-provisioning.js`). Non-admin → 403, no mutation.
- [ ] **Step 4: Run test — must pass**
- [ ] **Step 5: Run full suite — no regressions**
- [ ] **Step 6: Commit** — `feat: gate conversion on team_memberships.role=admin via resolveRoleForPerson`

---

## Task 3: AC2 — redirect into the EXISTING `createCheckoutSession` flow (same function, not a duplicate)

**Files:**
- Modify: `src/web-ui/routes/org-conversion.js`
- Test: `tests/check-story6-conversion-to-independent.js` (`conversionFlowEndToEndAsOrgAdmin`, `conversionRedirectsToExistingStripeCheckout`)

- [ ] **Step 1: Write the failing test** — mock `stripeClient.setStripeAdapter`, call `handlePostConvertOrganisation` as an admin, assert the mocked Stripe `checkout.sessions.create` was called (via `billing.handlePostCheckout`) with `client_reference_id === orgId`, and the response is a 302 to the Stripe session URL.
- [ ] **Step 2: Run test — must fail** — handler does not yet call billing.
- [ ] **Step 3: Write minimal implementation** — on successful conversion, self-supply `planId` (default `'starter'`) and a valid `_csrf` token (via `csrf.generateCsrfToken(req)` — an internal server-side forward, not a new externally reachable CSRF bypass, since admin status was already verified above) onto `req.body`, then call `billing.handlePostCheckout(req, res)` directly — literally the same function every new `standalone` signup uses.
- [ ] **Step 4: Run test — must pass**
- [ ] **Step 5: Run full suite — no regressions**
- [ ] **Step 6: Commit** — `feat: redirect conversion into the existing billing.handlePostCheckout flow`

---

## Task 4: AC3 — relationships/grants unaffected (by construction — no code touches those tables)

**Files:**
- Test only: `tests/check-story6-conversion-to-independent.js` (`existingRelationshipsAndGrantsSurviveConversion`, `relationshipsAndGrantsFunctionUnchangedPostConversionEndToEnd`)

- [ ] **Step 1: Write the failing test** — seed a relationship + grant for the org, convert it, then assert the relationship/grant rows are byte-identical and `agencyClientGrants.checkGrantAccess` still returns the grant.
- [ ] **Step 2: Run — should already pass** (AC3 is satisfied by construction: `convertOrganisationToStandalone` never touches `agency_client_relationships`/`shared_access_grants`) — confirms rather than implements.
- [ ] **Step 3: N/A — no implementation needed beyond Task 1**
- [ ] **Step 4: Run test — must pass**
- [ ] **Step 5: Run full suite — no regressions**
- [ ] **Step 6: Commit** — bundled with Task 1's commit (same underlying function).

---

## Task 5: AC4 — genuine concurrency test (controlled promise-ordering test double)

**Files:**
- Test only: `tests/check-story6-conversion-to-independent.js` (`concurrentConversionAndGrantCreationDoNotCorruptEachOther`, `concurrencyTestReRunAtRouteLevelUnderLoad`)

- [ ] **Step 1: Write the failing test** — build a "gated pool" wrapper: `query()` pushes `{sql, params, run}` onto a pending queue and returns an unresolved `Promise`; a test-controlled `releaseNext()` executes the queued query against the underlying fake pool and resolves that specific promise. Start `convertOrganisationToStandalone(gatedPool, orgId)` and `agencyClientGrants.createGrant(gatedPool, relId, ...)` WITHOUT awaiting either — both issue exactly one `.query()` call each and are now genuinely in flight simultaneously (2 pending queue entries). Release in one order, run the whole scenario again releasing in the opposite order. Assert in both orderings: `org_type === 'standalone'` exactly once, the grant row exists exactly once with the correct `relationship_id`/`resource_id`, and no duplicate/torn row was produced either table.
- [ ] **Step 2: Run test — must fail** — gated pool / handler don't exist yet.
- [ ] **Step 3: Write minimal implementation** — no production code change needed; both `convertOrganisationToStandalone` and `createGrant` are already single-statement atomic operations (Task 1, and Story 2's existing `createGrant`), so no corruption is structurally possible regardless of interleaving order — the test proves this rather than requiring a new guard.
- [ ] **Step 4: Run test — must pass**
- [ ] **Step 5: Run full suite — no regressions**
- [ ] **Step 6: Commit** — `test: add genuine-interleaving concurrency test for conversion vs grant creation (AC4)`

---

## Task 6: NFR tests + accessible confirmation form + wiring

**Files:**
- Modify: `src/web-ui/routes/org-conversion.js` (GET form), `src/web-ui/server.js` (wiring)
- Test: `tests/check-story6-conversion-to-independent.js` (`conversionFormIsKeyboardNavigable`, `conversionIsAudited`, `conversionHasNoSpecificLatencyTargetBeyondPageLoadNorms`, wiring source-scan)

- [ ] **Step 1: Write the failing tests** — assert real `<form>`/`<input>`/`<label>` elements in the GET form HTML; assert an `organisation_converted` audit log entry with `org_id`, `person_id`, `timestamp`; assert `server.js` requires `org-conversion` and registers `/organisations/convert` GET+POST.
- [ ] **Step 2: Run — must fail**
- [ ] **Step 3: Write minimal implementation** — `handleGetConvertForm` renders a real form; `_logger.info` audit entries on both denial and success; wire `createOrgConversionHandlers(_userRolesPool)` in `server.js` alongside Story 1's organisations wiring, and register the two routes behind `authGuard`, mirroring Story 3's real-URL wiring precedent (now that Story 3 has resolved the session-shape ambiguity Story 2/5 flagged for their own handlers).
- [ ] **Step 4: Run test — must pass**
- [ ] **Step 5: Run full suite — no regressions**
- [ ] **Step 6: Commit** — `feat: wire org-conversion routes into server.js; add NFR tests`

---

## Task 7: Decisions log + capture-log + pipeline-state

- [ ] Append `decisions.md` entries: (1) role-check reuse mechanism (resolveRoleForPerson called directly, not via the injectable getRoleForTenant/requireAdmin layer), (2) AC2 same-function reuse mechanism (self-supplied CSRF token + default planId forwarded into `billing.handlePostCheckout` unmodified), (3) server.js wiring touch-point deviation (DoR contract didn't name server.js; wired anyway, mirroring Story 3's precedent, now that the session-shape blocker is resolved).
- [ ] Append `workspace/capture-log.md` entry (source: agent-auto).
- [ ] Update `.github/pipeline-state.json` for this story (bundled in the same PR branch, per CLAUDE.md's epic-nested-story bookkeeping convention — no standalone PR).
