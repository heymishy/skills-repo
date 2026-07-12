# Cross-tenant isolation journey spec (bri-s3.4) — Implementation Plan

> **For agent execution:** Executed in this session via /tdd discipline per task (no subagents dispatched).

**Goal:** Make every test in the test plan pass — deliver a real, `@mocked`/`@multi-tenant`-tagged Playwright spec plus unit/integration coverage proving tenant A cannot read, list, or write tenant B's data across journeys/products/standards/credits/user_roles, without adding scope beyond the ACs.
**Branch:** `feature/bri-s3.4`
**Worktree:** `.worktrees/bri-s3.4`
**Test command:** `node scripts/run-all-tests.js` (full suite — has 70 pre-existing, documented failures per pcr-s1/bri-s1.4 decisions.md; verify by running individual affected files directly)

---

## File map

```
Create:
  tests/check-bri-s3.4-cross-tenant-isolation.js        — unit + integration tests for AC1-AC3, credits/user_roles structural checks
  tests/e2e/bri-s3.4-cross-tenant-isolation-journey.spec.js — Playwright @mocked @multi-tenant E2E spec (AC1, AC2, AC3, AC5)
  .github/workflows/cross-tenant-repeat-gate.yml         — CI job: --repeat-each=20, zero-tolerance gate (AC4)

Modify:
  src/web-ui/routes/products.js       — add tenant ownership check to handleGetProductView, handleGetProductKanban (real pre-existing leak)
  src/web-ui/routes/standards.js      — add tenant ownership check to standardsPost, standardsList, standardsPut (real pre-existing leak)
  src/web-ui/adapters/fake-test-db.js — add narrow `standards` table branches so the @mocked E2E spec can exercise standards without live Postgres
  tests/check-psh-s4-navigation.js    — extend mock pool + T2 test data so the new tenant check on handleGetProductView doesn't break existing coverage
  tests/check-psh-s6-product-kanban.js — extend mock pool + all test cases so the new tenant check on handleGetProductKanban doesn't break existing coverage
  tests/check-psh-s8-standards-management.js — extend mock pool + T5 test data so the new tenant checks on standardsPost/standardsPut don't break existing coverage
  artefacts/2026-07-09-beta-readiness-infra/decisions.md — SCOPE entries for the production fixes; ambiguity note on isSameTenant vs. test-plan wording
```

---

## Task 1 — Unit test: `isSameTenant` boolean correctness (AC1 unit layer)

**Finding during planning:** `tests/check-p0.1-journey-access.js` (existing, passing) already pins `isSameTenant({}, {}) === true` and `isSameTenant({tenantId:'org-a'},{tenantId:undefined}) === true` as deliberate "ADR-025 Phase 0 passthrough" behaviour — the opposite of this story's test-plan wording ("null/undefined tenant ID must resolve to false"). Rewriting `isSameTenant` to return `false` on null/undefined would regress those two existing, intentional tests and the Phase-0 rollout safety net they protect. Resolution: write the new unit test to pin and document *actual* behaviour (matching check-p0.1), not the test-plan's literal wording, and log the conflict in decisions.md for tech-lead visibility (this story's Medium oversight level exists exactly for this kind of judgment call).

**Files:**
- Create: `tests/check-bri-s3.4-cross-tenant-isolation.js` (this task writes the first section only)

- [ ] Write unit tests: matching-tenant pair → `true`; mismatched-tenant pair → `false`; both-null/undefined → `true` (Phase 0 passthrough, matches check-p0.1 Test 14/15 — pinned, not re-derived)
- [ ] Run: `node tests/check-bri-s3.4-cross-tenant-isolation.js` — expect these to pass immediately (no production change needed, behaviour already correct/documented)
- [ ] Commit: `test(bri-s3.4): pin isSameTenant boolean correctness incl. Phase 0 passthrough`

---

## Task 2 — Fix real cross-tenant read leak: `handleGetProductView` (AC1)

**Finding:** `GET /products/:id` looks up `SELECT name FROM products WHERE product_id = $1` with **no tenant_id filter at all** — any authenticated user of any tenant can view any other tenant's product (and its feature list) by guessing/knowing the product ID. This is exactly the AC1 defect class.

**Files:**
- Modify: `src/web-ui/routes/products.js` (`handleGetProductView`)
- Modify: `tests/check-psh-s4-navigation.js` (T2's mock pool didn't simulate a real product row at all — extend it so the new tenant check is exercised both ways)

- [ ] Add failing test to `tests/check-bri-s3.4-cross-tenant-isolation.js`: tenant A session + tenant B's productId → `handleGetProductView` returns 404 (via `res.status`/`res.json` test-mock path)
- [ ] Run — must fail (currently returns 200 with tenant B's data)
- [ ] Fix `handleGetProductView`: query `SELECT name, tenant_id FROM products WHERE product_id = $1`; if row missing OR `row.tenant_id !== req.session.tenantId` → respond 404 `{error:'not found'}` (both `res.status`/raw-http paths) and return before touching journeys
- [ ] Update `tests/check-psh-s4-navigation.js`: add a `products` array to T2 with `{product_id:'prod-1', tenant_id:'ty'}` (matches T2's existing session tenantId `ty`) and extend `makeMockPool` with a branch matching `SELECT name, tenant_id FROM products WHERE product_id` returning the matching row
- [ ] Run both test files — all pass
- [ ] Commit: `fix(products): scope GET /products/:id by tenant_id — was a cross-tenant read leak`

---

## Task 3 — Fix real cross-tenant read leak: `handleGetProductKanban` (AC1 defence-in-depth)

**Finding:** Same shape of gap — `GET /products/:id/kanban` never checks the product belongs to the caller's tenant before returning its journeys/features.

**Files:**
- Modify: `src/web-ui/routes/products.js` (`handleGetProductKanban`)
- Modify: `tests/check-psh-s6-product-kanban.js` (every existing test needs a matching product/tenant row added to the mock pool)

- [ ] Add failing test: tenant A + tenant B's productId → `handleGetProductKanban` returns 404
- [ ] Fix: add the same `SELECT tenant_id FROM products WHERE product_id = $1` ownership check before running the journeys query; 404 on mismatch/missing
- [ ] Update `tests/check-psh-s6-product-kanban.js`: extend `makeMockPool(journeys, products)` to accept a `products` array (`{product_id, tenant_id}`) and add a matching branch; update all 7 existing test cases to pass a `products` entry whose `tenant_id` matches that test's `req.session.tenantId`
- [ ] Run both — all pass
- [ ] Commit: `fix(products): scope GET /products/:id/kanban by tenant_id — was a cross-tenant read leak`

---

## Task 4 — Fix real cross-tenant list/write leaks: `standards.js` (AC2, AC3)

**Findings:**
1. `standardsList` (`GET /products/:id/standards`) has no tenant filter — AC2 list-leak.
2. `standardsPut` (`PUT /standards/:id`) blindly updates by `standard_id` with no ownership check at all — AC3 write vulnerability.
3. `standardsPost` (`POST /products/:id/standards`) never verifies the target `productId` belongs to the caller's tenant before inserting — lets tenant A attach data to tenant B's product.

**Files:**
- Modify: `src/web-ui/routes/standards.js`
- Modify: `tests/check-psh-s8-standards-management.js`

- [ ] Add failing tests: (a) tenant A lists standards for tenant B's product → empty/404; (b) tenant A PUTs tenant B's standard → rejected, standard unchanged on re-read; (c) tenant A POSTs a standard against tenant B's productId → rejected, no row inserted
- [ ] Fix `standardsPost`: before inserting, `SELECT tenant_id FROM products WHERE product_id = $1`; if missing or `!== req.session.tenantId` → 404, no insert
- [ ] Fix `standardsList`: add `AND org_id = $2` to the query, passing `req.session.tenantId`
- [ ] Fix `standardsPut`: before updating, `SELECT org_id FROM standards WHERE standard_id = $1`; if missing or `!== req.session.tenantId` → 404, no update
- [ ] Update `tests/check-psh-s8-standards-management.js`: extend `makeMockPool` with branches for `SELECT tenant_id FROM products WHERE product_id` (return session's own tenantId for existing tests) and `SELECT org_id FROM standards WHERE standard_id`; give T5 a real backing standard row (`{standard_id:'std-1', org_id:'org-1'}`)
- [ ] Run both — all pass
- [ ] Commit: `fix(standards): scope list/create/update by tenant — were cross-tenant list/write leaks`

---

## Task 5 — Extend `fake-test-db.js` for standards (E2E enablement only)

**Files:**
- Modify: `src/web-ui/adapters/fake-test-db.js`

- [ ] Add narrow branches (mirroring the existing products/users pattern): `INSERT INTO standards`, `SELECT ... FROM standards WHERE product_id ... AND org_id`, `SELECT ... FROM standards WHERE standard_id`, `UPDATE standards SET ...`, plus the `SELECT tenant_id FROM products WHERE product_id` ownership-check query used by Tasks 2–4
- [ ] Commit: `feat(fake-test-db): add narrow standards + product-ownership branches for @mocked E2E`

---

## Task 6 — Integration tests: journeys, credits, user_roles (AC1–AC3 remaining resource types)

**Files:**
- Modify: `tests/check-bri-s3.4-cross-tenant-isolation.js`

- [ ] Journey read: two in-memory journeys (different `tenantId`/`ownerId`) via `_journeyStore` test hooks; call `handleGetJourneyState`/`handleGetJourneyById` as tenant A against tenant B's journey → 404 (positive confirmation — `requireJourneyAccess` already enforces this)
- [ ] Journey list: confirm `_listJourneys(tenantId)` wiring (`setListJourneys` in `server.js`) filters — exercised indirectly via the wired filter function shape (unit-level, since the wiring itself is a closure in `server.js`)
- [ ] Credits: confirm `getBalance`/`adjustBalance`/`creditsGuard` are always called with `req.session.tenantId`, never a request-supplied ID — simulate two tenant sessions hitting `creditsGuard` and assert each only ever reads/writes its own balance
- [ ] user_roles: confirm `getUserRole` is only ever invoked with the caller's own tenantId/email — no route accepts a foreign tenantId
- [ ] Run — all pass (no production change expected for this task; these are confirming/regression tests over already-correct code)
- [ ] Commit: `test(bri-s3.4): confirm existing journey/credits/user_roles tenant isolation`

---

## Task 7 — E2E spec (AC1, AC2, AC3, AC5)

**Files:**
- Create: `tests/e2e/bri-s3.4-cross-tenant-isolation-journey.spec.js`

- [ ] Sign up two distinct users (tenant A, tenant B) via `/auth/email/signup` + `/test/complete-onboarding` (bri-s3.2 pattern)
- [ ] Each creates a product (`/products/new` + `/products/confirm`), a journey (`POST /api/journey` — disk-store backed, not the Postgres-only `/products/:id/features` path), and a standard (`/products/:id/standards`)
- [ ] AC1: tenant A session → `GET /products/:tenantBProductId` → 404; `GET /api/journey/:tenantBJourneyId` → 404
- [ ] AC2: tenant A session → `GET /dashboard` and `GET /journeys` contain zero tenant B items
- [ ] AC3: tenant A session → `PUT /standards/:tenantBStandardId` → rejected; re-list as tenant B confirms unchanged
- [ ] AC5: tag `@mocked` `@multi-tenant`; assert `/test/real-llm-call-count` unchanged across the run
- [ ] Run: `npx playwright test tests/e2e/bri-s3.4-cross-tenant-isolation-journey.spec.js`
- [ ] Commit: `test(bri-s3.4): add cross-tenant isolation E2E spec`

---

## Task 8 — CI configuration for AC4 (20-run zero-tolerance gate)

**Files:**
- Create: `.github/workflows/cross-tenant-repeat-gate.yml`

- [ ] Add a CI job that runs `npx playwright test tests/e2e/bri-s3.4-cross-tenant-isolation-journey.spec.js --repeat-each=20` and fails the job on any skip/flake
- [ ] Commit: `ci: add 20-run zero-tolerance repeat gate for bri-s3.4 cross-tenant spec`

---

## Task 9 — Decisions log

**Files:**
- Modify: `artefacts/2026-07-09-beta-readiness-infra/decisions.md`

- [ ] SCOPE entry: products.js / standards.js pre-existing cross-tenant leaks found + fixed
- [ ] ASSUMPTION/ambiguity entry: isSameTenant test-plan wording vs. ADR-025 Phase 0 passthrough — resolved in favour of existing, tested behaviour
- [ ] Commit alongside the state/artefact bundle at branch-complete
