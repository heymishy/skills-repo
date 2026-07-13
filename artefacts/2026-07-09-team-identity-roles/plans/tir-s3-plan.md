## Implementation Plan: An admin adds a teammate by identity and assigns a role

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s3.md
**Test plan reference:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s3-admin-adds-teammate-test-plan.md
**DoR contract reference:** artefacts/2026-07-09-team-identity-roles/dor/tir-s3-dor-contract.md

---

## Ground-truth check (actual shipped shape of tir-s1/tir-s2, read from origin/master before planning)

- `people` table (tir-s1) is `(id, created_at)` only — no identity columns. A person's identity is resolved either via `person_identities.identity_key` (tir-s2, explicit links only) or, as a fallback, via `team_memberships.tenant_id` (tir-s1's migration/backfill convention, one row per legacy solo tenant).
- `team_memberships` (tir-s1) has composite PK `(person_id, tenant_id)` — the schema already supports multiple people sharing one `tenant_id` with different roles. Nothing needs to change here.
- `identity-links.js` (tir-s2) exports `resolvePersonForIdentity(pool, identityKey)`, which is exactly the existing-person lookup this story needs for AC1/AC4/AC5 — no new lookup module required.
- **Known, deliberate epic-level gap (not this story's job):** `requireAdmin` and the live login flow (`auth.js` → `getRoleForTenant(tenantId)` → `resolveRoleForTenant(pool, tenantId)`) resolve role by `tenant_id` alone (`LIMIT 1`, no `person_id` filter) — confirmed by tir-s1's own test (T6) and by `epics/tir-e1.md`, which states tir-s4's explicit job is "extends `requireAdmin` to check the per-person role from Story 1's schema" (current baseline: "requireAdmin only checks tenant-wide role"). tir-s3 therefore does **not** modify `auth.js`, `user-roles.js`, or `server.js`'s existing role-adapter wiring — it only needs to prove the *data model* holds a distinct per-person role (AC2), via a new person-scoped read helper added alongside the write path. Wiring that into the live login/admin-gate is tir-s4's job. This is flagged explicitly in the PR description as a carried-forward scope note, not silently assumed.

---

## Tasks

### Task 1 — `src/web-ui/modules/team-management.js` (new module)

- `addOrUpdateTeammate(pool, adminTenantId, identityKey, role, logger)`:
  - Validates `role` is one of `admin/engineer/product/viewer` (`InvalidRoleError`, 400).
  - Resolves `personId` via `identityLinks.resolvePersonForIdentity(pool, identityKey)`; throws `UnknownIdentityError` (400, AC5) if `null` — never creates a placeholder `people` row.
  - Upserts `team_memberships (person_id, tenant_id, role)` via `INSERT ... ON CONFLICT (person_id, tenant_id) DO UPDATE SET role = EXCLUDED.role` (AC1 + AC4, single write path per the DoR contract's Assumption).
  - Audit-logs `{ targetPersonId, role, tenantId, updated, timestamp }` (Audit NFR). Admin identifier uses `req.session.userId` at the route layer (see Task 2) rather than a DB `people.id` lookup for the admin — resolving the admin's own `people.id` would require the same tenantId-as-identity-key fallback `identity-links.js` already documents as ambiguous once a tenant has more than one member; the session-level id is already stable and avoids an extra, ambiguous round trip.
- `getRoleForPersonInTenant(pool, tenantId, personId)`: `SELECT role FROM team_memberships WHERE tenant_id = $1 AND person_id = $2` — the person-scoped read used by the AC2 test (see ground-truth note above: not wired into live login in this story).
- No D37 adapter — plain `pool` parameter, matching tir-s1/tir-s2 precedent (DoR H-ADAPTER: N/A).

**TDD:** RED — write failing tests for AC1, AC4, AC5, Audit NFR against this module directly. GREEN — implement. REFACTOR — none anticipated (small module).

### Task 2 — `src/web-ui/routes/team-management.js` (new route file)

- `createTeamManagementHandlers(pool)` factory (mirrors `account-linking.js`'s `createLinkCallbackHandlers(pool)`), returning:
  - `handleGetTeamMembers(req, res)` — minimal HTML page (mirrors `account-linking.js`/`admin-credits.js`'s inline-HTML convention): labelled `identity` text input + `role` select + submit button, posting to `/api/team/members`. Satisfies the Accessibility NFR informally (native labelled controls); verified manually per the test plan.
  - `handleAddTeammate(req, res)` — reads `identity`/`role` from the form-urlencoded body (same `_readBody` convention as `admin-credits.js`), always uses `req.session.tenantId` as the tenant to write to (**never** a client-supplied tenant field — this is what makes ADR-025 hold structurally: there is no "target tenant" input to spoof), calls `teamManagement.addOrUpdateTeammate`, maps `UnknownIdentityError`/`InvalidRoleError` to 400 JSON responses.
- Admin gating (`requireAdmin`) applied at the mount point in `server.js`, not inside the handler — matches `admin-credits.js`'s convention exactly (AC3).

**TDD:** RED — write failing tests for AC3 (403 via `requireAdmin`) and the ADR-025 dedicated test (spoofed tenant field in the body is ignored; the row is written for the admin's real session tenant only). GREEN — implement. REFACTOR — none anticipated.

### Task 3 — Wire into `server.js` (production wiring — distinct task per D37 convention, even though no new adapter is introduced, to keep wiring change reviewable separately from handler logic)

- Add `let _teamManagementHandlers = null;` module-level reference (mirrors `_handleGoogleLinkCallback`/`_handleGithubLinkCallback`).
- Inside the existing `if (process.env.DATABASE_URL)` block, immediately after the tir-s2 `_linkCallbackHandlers` wiring: `_teamManagementHandlers = createTeamManagementHandlers(_userRolesPool);` (same pool reuse pattern as tir-s1/tir-s2 — real-Postgres-only, no `NODE_ENV=test` fallback, matching precedent exactly since neither tir-s1 nor tir-s2 wired anything in the fake-test-db branch either).
- Add two route-dispatch branches: `GET /team/members` and `POST /api/team/members`, both gated with the same `requireAdmin(req, res, () => { _raOk = true; })` / `if (!_raOk) return;` pattern used for `/admin/credits` and `/api/admin/credits/adjust`, with a 503 fallback if `_teamManagementHandlers` is unset (DATABASE_URL not configured) — mirrors the `/settings/link-account/*/callback` 503 fallback pattern.

**TDD:** covered by Task 2's tests reading `server.js` source directly for the wiring assertions (mirrors tir-s1's own T2 test, which asserts `setGetRoleForTenant(` appears before `.listen(` by reading `server.js` as text) — no separate task-3-only test needed beyond what Task 2's test file already asserts.

### Task 4 — `tests/check-tir-s3-admin-adds-teammate.js` (new test file)

Hand-rolled `test()`/`assert` harness (no Jest/Mocha), following `tests/check-tir-s2-cross-provider-linking.js`'s exact conventions: a narrow inline fake pool (not `fake-test-db.js`), `freshRequire`, `mockReq`/`mockRes` helpers.

- AC1: admin adds an existing person (seeded via `_seedPerson`) with role `engineer` → asserts a `team_memberships` row `{person_id, tenant_id: 'acme', role: 'engineer'}` exists.
- AC2: after AC1's add, call `getRoleForPersonInTenant(pool, 'acme', teammatePersonId)` → asserts `'engineer'`, distinct from the admin's own `'admin'` role for the same tenant (also seeded/asserted).
- AC3: a non-admin session (`role: 'engineer'`) is denied 403 by `requireAdmin`; the handler under test is never reached; no `team_memberships` change.
- AC4: re-add the same person with role `product` → asserts exactly one `team_memberships` row for that `(person_id, tenant_id)` pair, now `role: 'product'`.
- AC5: identity descriptor with no existing `people` row (never seeded) → asserts rejection with a clear error message, and that no `people` or `team_memberships` row was created.
- ADR-025 dedicated test: admin session `tenantId: 'acme'`; POST body includes a spoofed `tenantId: 'other-tenant'` field alongside `identity`/`role` → asserts the resulting membership is written for `'acme'` (the session's real tenant) and that zero rows exist for `'other-tenant'`.
- Audit NFR: spy logger asserts all 5 required fields (admin id, target person id, role, tenant, timestamp) are present on a successful add.

**TDD:** this file *is* the RED phase for Tasks 1–2 — write it first, confirm every assertion fails against not-yet-implemented modules, then implement Tasks 1–3 until all pass.

---

## Task sequencing

1. Task 4 test file skeleton written first (RED) against Tasks 1–2's not-yet-existing modules.
2. Task 1 (module) implemented — AC1/AC4/AC5/Audit tests go GREEN.
3. Task 2 (route handlers) implemented — AC3/ADR-025 tests go GREEN; AC2 already green from Task 1's `getRoleForPersonInTenant`.
4. Task 3 (server.js wiring) implemented — no behavioural test depends on it beyond source-text assertions folded into Task 4's file if needed; primarily verified via `/verify-completion`'s full-suite regression run (server.js must still load/parse correctly).
5. `/verify-completion`: all 7 planned assertions + full regression suite diffed against `tests/known-baseline-failures.json`.

---

## Risk / deviation notes carried into implementation

- The AC2 "simulate the teammate's next login" mechanic is implemented as a direct call to the new `getRoleForPersonInTenant` helper, not a full drive through `auth.js`'s HTTP login handlers — see the ground-truth note above. This will be called out explicitly in the PR description as a known, epic-sequenced gap (tir-s4's job to wire person-aware resolution into the live login/admin gate), not a silent shortcut.
- Audit log's "admin id" field uses `req.session.userId` (session-level), not a resolved DB `people.id` — also called out above and in the PR description.
