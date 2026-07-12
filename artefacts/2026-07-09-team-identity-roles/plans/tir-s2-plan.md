## Implementation Plan: tir-s2 — A logged-in user links a second auth provider to their identity

**Story:** artefacts/2026-07-09-team-identity-roles/stories/tir-s2.md
**Test plan:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s2-cross-provider-linking-test-plan.md
**DoR contract:** artefacts/2026-07-09-team-identity-roles/dor/tir-s2-dor-contract.md

---

### Design decisions (judgment calls — flagged for PR review)

**1. tir-s1's shipped `people` table has no identity columns at all.** The story/test-plan assumed the `people` table was the natural place to record "two identities, one row." As actually shipped in PR #463, `people` is just `(id, created_at)` — no `github_id`/`google_sub`/`email` column, no unique per-provider key. The only existing per-tenant lookup is `team_memberships(person_id, tenant_id, role)`, and its PK is `(person_id, tenant_id)` — so a person can already have multiple `tenant_id` rows, but nothing today resolves "which person owns tenant_id X" (only "what role does tenant_id X have" via `resolveRoleForTenant`). There is no existing function that returns a `person_id` for a given identity at all.

**Decision:** add a new join table, `person_identities(identity_key PRIMARY KEY, person_id, provider, created_at)`, in a new module `src/web-ui/modules/identity-links.js` — matching the DoR contract's own stated assumption ("a join-table row... implementation detail left to the coding agent"). `identity_key` reuses the exact same string each login flow already computes as `req.session.tenantId` (GitHub org/login, Google `sub`, or the literal email for email/password — confirmed by reading `auth.js`/`auth-email.js` on master) — so linking never needs to duplicate GitHub's org-resolution logic; it only needs to record "this identity key belongs to this person."

`resolvePersonForIdentity(pool, identityKey)` checks `person_identities` first, then falls back to `team_memberships.tenant_id` (covers identities that were migrated/seeded by tir-s1 but never explicitly linked). This function is new — no existing call site is touched, so tir-s1's login-flow role resolution is completely unaffected (satisfies ADR-025: linking never touches tenant/role state).

**2. No new D37 adapter — confirmed, matches DoR H-ADAPTER.** `resolvePersonForIdentity`/`linkIdentity`/`migrateIdentityLinksSchema` all take `pool` as a plain parameter (mirrors `resolveRoleForTenant(pool, tenantId)` — not a setter/getter pair). The route handler is exposed as a factory, `createLinkAccountHandler(pool)`, so server.js can close over `_userRolesPool` (the same pool tir-s1 already wired) without introducing a new throw-on-unwired module-level adapter. This is a plain factory function, not an injectable D37 adapter, so the D37 stub-throw rule does not apply — there is no unwired-by-default state to mask a misconfiguration.

**3. Audit logging reuses the existing non-throwing logger convention** already established in `auth.js` (`let _logger = {...}; function setLogger(fn) {...}`, default is a safe no-op, not a throw) — a missing audit log is a monitoring gap, not an incorrectness risk, so this does not trigger D37. The identity being linked is logged as a SHA-256 hash (`linkedIdentityHash`), never the raw identity string or any token value, satisfying the NFR ("provider identity hashes — never raw tokens").

**4. `fake-test-db.js` is not extended.** The test plan assumed `people` table state would be "managed via the `fake-test-db.js` extension from tir-s1" — but tir-s1's actual test file (`tests/check-tir-s1-person-team-schema.js`) never touched `fake-test-db.js`; it used its own narrow, inline `makeFakePool()`. This plan follows the actual established convention (inline fake pool in the new test file), not the test plan's assumption.

---

### Tasks

1. **RED — write the failing test file** `tests/check-tir-s2-cross-provider-linking.js` (5 tests per the test plan: AC1, AC2, AC3, AC4 integration tests + 1 audit NFR test). Confirm all 5 fail for the right reason (missing module/exports), not typos.

2. **GREEN — schema + core linking logic** (`src/web-ui/modules/identity-links.js`, new file):
   - `migrateIdentityLinksSchema(pool, logger)` — `CREATE TABLE IF NOT EXISTS person_identities (identity_key VARCHAR PRIMARY KEY, person_id INTEGER NOT NULL REFERENCES people(id), provider VARCHAR NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`.
   - `resolvePersonForIdentity(pool, identityKey)` — `person_identities` lookup, falling back to `team_memberships.tenant_id`. Returns `person_id` or `null`.
   - `linkIdentity(pool, currentIdentityKey, newIdentityKey, provider, logger)` — resolves both identities; rejects (no writes) if `newIdentityKey` already resolves to a **different** person (AC4); no-ops if already linked to the same person; otherwise inserts the new `person_identities` row and audit-logs (hash only, never raw token/identity — Audit NFR). Satisfies AC1, AC3 (by construction — never keys off email across providers), AC4, and the Audit NFR test.

3. **GREEN — route handler** (`src/web-ui/routes/account-linking.js`, new file): `createLinkAccountHandler(pool)` factory returning `handleLinkAccount(req, res)`. Dispatches on a `provider` field (`google` → `oauthAdapter.fetchGoogleUserInfo`; `github` → `oauthAdapter.providerExchangeCode` + `providerGetUserIdentity`) to compute the new identity's key, then calls `linkIdentity`. Uses the existing `_oauthAdapter` module reference (not destructured, matching `auth.js` convention so tests can monkeypatch). Satisfies AC1 (route + second-provider auth confirmation) and AC4 (rejection response).

4. **GREEN — server.js wiring (separate task from the handler, per this repo's D37/wiring-task convention even though this isn't a D37 adapter)** (`src/web-ui/server.js`): require `createLinkAccountHandler`/`migrateIdentityLinksSchema`, mount `POST /settings/link-account` behind the existing `authGuard` (same pattern as `billing.js`'s `/billing/plan-state`), reusing `_userRolesPool`. Chain `migrateIdentityLinksSchema(_userRolesPool)` after `migrateTeamSchema` settles. Satisfies AC2 (unauthenticated → redirect, via the already-tested `authGuard`).

5. **Full regression check** — `node scripts/run-all-tests.js`, diffed against the pre-change baseline captured in `.worktrees/tir-s2` before any edits, and against `tests/known-baseline-failures.json`. Zero new failures required.

6. **/verify-completion** — confirm all 4 ACs verified, all 5 new tests passing, 0 regressions.

7. **/branch-complete** — push, open draft PR, stop (no merge).

---

### Touch points

- `src/web-ui/modules/identity-links.js` (new)
- `src/web-ui/routes/account-linking.js` (new)
- `src/web-ui/server.js` (new wiring block added, task 4)
- `tests/check-tir-s2-cross-provider-linking.js` (new)

### Out of scope (unchanged from story)

Automatic email-based merging (never built, in any form), unlinking, a polished settings UI beyond a functional control.
