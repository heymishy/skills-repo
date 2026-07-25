## Story: `/auth/github/callback` supports a staging-safe named-identity stub so bri-s3.3/bri-s3.6 can run against real staging

**Short-track:** security-scoped infra fix -- bri-s3.3/bri-s3.6 are `@mocked`-tagged and already run in the staging smoke-test job, but currently fail there entirely (found via dss-s1 post-merge live verification, and confirmed by direct investigation this session). Operator explicitly reviewed the security trade-off and chose "build it properly" over skipping or narrowing scope.

## User Story

As **Hamish King (Founder/Operator)**,
I want **`bri-s3.3` (multi-user-shared-tenant RBAC) and `bri-s3.6` (GitHub OAuth first-login journey) to authenticate against real `wuce-staging` the same way they already do locally**,
So that **the staging smoke-test job's pass/fail signal for these two specs is real, not permanently broken by a missing staging-safe auth path**.

## Background / Investigation

Both specs already call the real `GET /auth/github/callback?code=<login>&state=<state>` route directly (not a separate mock endpoint) — locally this works because `server.js`'s `NODE_ENV=test` block wires a deterministic OAuth-provider-adapter stub (`code` IS the login) plus an org-membership stub (`setFetchOrgs`) that makes every login appear to belong to every `TENANT_ORG_ALLOWLIST` org. Neither exists on staging (`NODE_ENV=staging`, no org-allowlist secret configured at all), so both specs currently fail there.

The existing `a1-staging-safe-auth-stub` mechanism (`POST /auth/e2e-stub/github`) cannot cover this: it deliberately always generates a **fresh, isolated-tenant** identity per call (ADR-025) — by design, it has no way to (a) name a specific, reusable login, or (b) put two different logins in the *same* tenant. `bri-s3.3` needs exactly (a)+(b) (alice/bob/viewer sharing one tenant, each with a different pre-seeded role); `bri-s3.6` needs (a) alone (the same login reused across two logins, to exercise first-login vs returning-login).

**Design chosen:** rather than a parallel JSON stub endpoint duplicating `handleAuthCallback`'s logic (credit grant, first-login flag, role lookup, session rotation — all real, all already correct), add a small staging-safe branch *inside* `handleAuthCallback` itself that swaps only the OAuth-provider-exchange step. Everything downstream (role resolution via the real `getRoleForTenant`, first-login handling via the real DB-backed `github_first_login` table, `ftcg-s1`'s credit grant, session rotation, redirect) runs completely unmodified, through the one real code path both specs already exercise.

**Threat-model / blast-radius analysis (why this is safe to ship):**
- Gated by the same `E2E_STAGING_AUTH_STUB_SECRET` (staging-only Fly secret, never set on production) plus a new, distinct header (`x-e2e-named-identity-stub`) — matching the established "same secret, new header per mechanism" convention from `a1`/`dss-s1`/`serlb-s1`.
- **Critical additional guard, not present in the naive design:** both the `code` (used as login) and the optional `stubTenant` query param (used as `tenantId`, bypassing org-allowlist resolution) MUST match `/^e2e-/i`. Without this, an attacker holding the leaked secret could set `stubTenant` to a *real* tenant's identifier (a real customer's GitHub org name, or a real user's own login in solo-tenant mode) and land a session with whatever role `getRoleForTenant` defaults an unrecognised identity to (`'user'`) inside that real tenant — a real cross-tenant read risk. Requiring the `e2e-` prefix means the stub can only ever land inside an unmistakably-synthetic tenant, never a real one, regardless of secret compromise.
- Role is **never** caller-supplied — it is always resolved via the real, unmodified `getRoleForTenant(tenantId, login)` lookup against whatever `person_identities`/`team_memberships` rows already exist (themselves only writable via the already-shipped, already-gated `/test/seed-multi-user-roles` endpoint). This story also hardens that endpoint with the identical `e2e-`-prefix requirement on its `sharedOrg` parameter and its seeded literal identity keys (previously bare `alice`/`bob`/`viewer` — the same class of gap this story closes, left unaddressed when that endpoint shipped under `dss-s1`).

## Architecture Constraints

- **No new parallel auth-handling logic.** The stub swaps only the OAuth-adapter-exchange step inside the existing `handleAuthCallback`; all downstream logic (credit grant, first-login, role lookup, session rotation, redirect) is the exact same, unduplicated code path used by real logins.
- **`e2e-` prefix enforcement is mandatory, not optional**, on every caller-controlled identity/tenant value this mechanism touches (`code`/login, `stubTenant`, and `/test/seed-multi-user-roles`'s `sharedOrg` + its seeded identity keys).
- **No change to `a1`'s existing stub** (`routes/auth-stub.js`) — its "always fresh, isolated tenant" design stays exactly as-is for its own consumers (a1-a4, b1).
- **No `TENANT_ORG_ALLOWLIST` secret added to staging.** The `stubTenant` mechanism achieves shared-tenant testing without needing staging to run in org-allowlist mode at all, avoiding a larger, unrelated security-posture change to the whole app.

## Dependencies

- **Upstream:** `dss-s1` (staging-safe test endpoints) — established the double-gate secret+header convention this story follows; also the post-merge live verification that first surfaced this gap.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `E2E_STAGING_AUTH_STUB_SECRET` is unset, When any request hits `/auth/github/callback` with the new header, Then the stub branch never activates — behaviour is identical to today (real OAuth exchange attempted, and fails/proceeds exactly as before).

**AC2:** Given the secret is set and the request carries a matching `x-e2e-named-identity-stub` header AND `code` starts with `e2e-` (case-insensitive), When `/auth/github/callback` is called, Then the stub branch activates: the real OAuth-provider adapter is never invoked, and the session is populated with a deterministic `userId`/`login` derived from `code`.

**AC3:** Given the stub branch is active and no `stubTenant` query param is supplied, When the session is populated, Then `tenantId` defaults to the login itself (isolated tenant), matching the non-allowlist production default.

**AC4:** Given the stub branch is active and `stubTenant` IS supplied, When it does NOT start with `e2e-` (case-insensitive), Then the request is rejected (400) and no session is established.

**AC5:** Given the stub branch is active and `stubTenant` starts with `e2e-`, When the session is populated, Then `tenantId` is set to that value directly (bypassing `TENANT_ORG_ALLOWLIST` resolution), enabling two different logins to land in the same tenant.

**AC6:** Given the stub branch is active, When role, first-login, and credit-grant logic run, Then they call the exact same, unmodified `getRoleForTenant`/`getFirstLoginFlag`/`clearFirstLoginFlag`/`grantFreeTierIfNew` functions a real login would — no caller-supplied role, no duplicated logic.

**AC7:** Given `/test/seed-multi-user-roles` (already `dss-s1`-gated), When called with a `sharedOrg` value that does NOT start with `e2e-`, Then it is rejected (400) and nothing is written; When called with no `sharedOrg` (default), Then it uses `e2e-shared-org`, and its seeded identity keys are `e2e-alice`/`e2e-bob`/`e2e-viewer`.

**AC8:** Given `tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js` and `tests/e2e/bri-s3.6-auth-journey.spec.js`, When run locally (`NODE_ENV=test`, no secret present), Then both pass exactly as before — zero behaviour change for the existing local harness path.

## Out of Scope

- Adding `TENANT_ORG_ALLOWLIST` as a real staging secret — the `stubTenant` mechanism avoids needing this.
- Modifying `a1`'s existing stub (`routes/auth-stub.js`) or its consumers (a1-a4, b1).
- A live re-run against real `wuce-staging` to confirm the fix end-to-end — deferred to a post-merge verification step (matching the `dss-s1` precedent), since it requires the operator's staging secret access.

## NFRs

- **Security:** every caller-controlled identity/tenant value this mechanism can influence must be validated against the `e2e-` prefix requirement — no exceptions. This is the single most important property of this story.
- **Backward compatibility:** zero behaviour change for the real production OAuth path (secret unset) and the local `NODE_ENV=test` harness path (AC8).

## Complexity Rating

**Rating:** 3 -- touches a real auth code path (`handleAuthCallback`) and requires a careful, explicit threat-model justification; higher ambiguity than a pure CI-config change.
**Scope stability:** Stable (design reviewed and approved before implementation began).
