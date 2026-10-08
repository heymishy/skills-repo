## Test Plan: Create journey entity: POST route, Postgres insert, and journey canvas shell

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s1.md
**Epic reference:** journey-entity-and-stage-management
**Review status:** PASS (Run 2, 2026-10-08)
**Test plan author:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`.

**Real architecture grounding (confirmed by direct code read, 2026-10-08):**
- New file `src/web-ui/routes/journeys.js` (plural — the existing `src/web-ui/routes/journey.js`, singular, is the platform's own unrelated outer-loop session-tracking route file; confirmed no naming collision between the two).
- Dispatch pattern: `else if (pathname === '...' && req.method === '...')` chain in `src/web-ui/server.js` (~line 3880 area, alongside the equivalent `/products/new`/`/products/:id` entries), wrapped in `authGuard(req, res, async () => {...})`, with `requireNonViewer(req, res, () => {...})` guarding the POST specifically (matching `/products/new` POST's own convention).
- Tenant scoping: `req.session.tenantId` (confirmed canonical field, `products.js` lines 1526/1844/1933/2041).
- DB pool: reuse the existing shared Postgres pool (`_creditsPool`/`_pshPool` in `server.js`, same pattern `products.js`'s own handlers receive as an explicit `pool` argument) — no new pool.
- Dual response-mode convention: handlers check `if (res.status) { res.status(N).json(body); } else { res.writeHead(N, {...}); res.end(...); }` — the first branch is the test-mode mock interface (`check-psh-s3-product-creation.js`'s own convention), the second is the real HTTP response. New handlers must support both.
- Rendering: `renderShellWithNav(pool, tenantId, opts)` (`products.js:2682`) wraps `html-shell.js`'s `renderShell({ title, bodyContent, active, crumbs, user, ... })` with the shared nav/products-sidebar context already wired for every other page.
- **Boot-wiring gap (confirmed, D37-style separate task required):** `scripts/migrate-schema-journeys.js` is NOT wired into `server.js`'s boot sequence (confirmed by grep — zero references), and the deployed production/staging Docker image does not include `scripts/` at all (confirmed via `Dockerfile`'s own explicit COPY allowlist). Every comparable table in this codebase (`credits`, `stripe_events`, `tenant_plan`, `products`) has its `CREATE TABLE IF NOT EXISTS` inlined directly in `server.js`'s own boot sequence (~line 454 area) — `customer_journeys` must follow the same convention, or a genuinely fresh environment (not staging/production, which already have the tables from this session's own manual verification runs) would have a route that inserts into a nonexistent table.

**E2E/browser-layout detection (Step 3a):** N/A — server-rendered HTML, no CSS-layout-dependent AC (the canvas shell's own layout/drag-and-drop styling is `ep1-s4`'s scope, not this story's).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Valid submission inserts customer_journeys record, redirects | 1 test | — | — | — | — | 🟢 |
| AC2 | Missing name → 400, no insert | 1 test | — | — | — | — | 🟢 |
| AC3 | Body tenantId spoofing ignored; session tenantId used | 1 test | — | — | — | — | 🟢 |
| AC4 | Canvas shell renders name + empty state after redirect | 1 test | — | — | — | — | 🟢 |
| (boot) | customer_journeys table creation wired into server.js boot | 1 test | — | — | — | — | 🟢 (D37-style wiring verification, not a story AC but a correctness prerequisite) |

---

## Coverage gaps

None. All ACs are directly unit-testable against the real handler functions with mock `pool`/`req`/`res` objects, matching this repo's own established convention (`check-psh-s3-product-creation.js`) — no external dependency, no DATABASE_URL needed for these tests.

---

## Test Data Strategy

**Source:** Synthetic — mock `pool` object collecting `_ops` (matching `check-psh-s3-product-creation.js`'s own `makeMockPool` convention exactly), mock `req`/`res`.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mock pool returning a generated `id` on `INSERT INTO customer_journeys`; `req.session.tenantId` set | Synthetic | None | Assert INSERT params include the session tenantId, name; assert redirect `Location` header/test-mode equivalent points at `/journeys/:id` using the returned id |
| AC2 | `req.body.name` empty/absent | Synthetic | None | Assert 400, assert zero INSERT ops recorded on the mock pool |
| AC3 | `req.body.tenantId` set to a DIFFERENT value than `req.session.tenantId` | Synthetic | None | Assert the INSERT's own tenant_id param is the session value, never the body value |
| AC4 | Mock pool returning one journey row on the canvas `SELECT`; no stages | Synthetic | None | Assert rendered HTML contains the journey's `name` and the literal empty-state text `"No stages yet. Add your first stage."` |
| (boot) | Raw source text of `server.js` | Real file | None | Regex-match a `CREATE TABLE IF NOT EXISTS customer_journeys` statement present in the boot sequence, matching the `credits`/`tenant_plan` inline-migration convention |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Valid journey creation inserts record and redirects

- **Verifies:** AC1
- **Action:** Call the new POST handler with `req.session.tenantId` set and `req.body.name` provided; mock pool returns a generated id on `INSERT INTO customer_journeys`
- **Expected result:** Exactly one `INSERT INTO customer_journeys` op recorded with the session's `tenantId` and the submitted `name`; response indicates a redirect to `/journeys/<returned-id>`
- **Edge case:** No

### Missing name returns 400, no insert

- **Verifies:** AC2
- **Action:** Call the POST handler with `req.body.name` empty or absent
- **Expected result:** 400 response; zero `INSERT` ops recorded on the mock pool
- **Edge case:** Yes — the validation boundary

### Request-body tenantId is never used for the insert

- **Verifies:** AC3
- **Action:** Call the POST handler with `req.session.tenantId = 'org-A'` and `req.body.tenantId = 'org-B'`
- **Expected result:** The recorded `INSERT` op's `tenant_id` parameter is `'org-A'`, never `'org-B'`
- **Edge case:** Yes — the write-path tenant-spoofing guard this AC exists to prove

### Canvas shell renders journey name and empty state

- **Verifies:** AC4
- **Action:** Call the new GET handler for `/journeys/:id` with a mock pool returning one journey row (known `name`) and no stages
- **Expected result:** Rendered HTML includes the journey's `name` and the literal text `"No stages yet. Add your first stage."`
- **Edge case:** No

### customer_journeys table creation is wired into server.js's boot sequence

- **Verifies:** (boot) — correctness prerequisite, not a story AC, but required for AC1/AC4 to ever work in a genuinely fresh environment
- **Action:** Read `server.js`'s raw source text; regex-match a `CREATE TABLE IF NOT EXISTS customer_journeys` statement present in the startup/boot code block (alongside `credits`/`tenant_plan`'s own inline migrations)
- **Expected result:** Present
- **Edge case:** No — direct structural check, matching this repo's own convention for asserting a literal migration statement exists (see `sch-s1` AC1's own precedent for this evidence class)
