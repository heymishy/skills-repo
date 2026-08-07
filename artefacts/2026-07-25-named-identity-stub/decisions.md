## Decisions: named-identity staging stub (nis-s1)

### Decision: swap only the OAuth-provider-exchange step inside `handleAuthCallback`, not a parallel JSON endpoint

**Date:** 2026-07-25
**Context:** `bri-s3.3` and `bri-s3.6` both already call the real `GET /auth/github/callback?code=<login>&state=<state>` route directly, relying locally on `server.js`'s `NODE_ENV=test` block (`code` IS the login). Neither the local mechanism nor the existing `a1` staging-safe stub (`POST /auth/e2e-stub/github`, always a fresh isolated-tenant identity) can support these specs against real staging: `bri-s3.3` needs named, reusable, shared-tenant identities with distinct pre-seeded roles; `bri-s3.6` needs one login reused across two logins.
**Decision:** Add a small staging-safe branch directly inside `handleAuthCallback` (`routes/auth.js`) that swaps only the token/user-identity derivation step. Every downstream line — credit grant (`ftcg-s1`), first-login handling (real DB-backed `github_first_login` table), role resolution (`getRoleForTenant`), session rotation, redirect — is the exact same, unduplicated code a real login runs.
**Rationale:** A parallel JSON stub endpoint (mirroring `a1`'s shape) would have to re-implement all of that downstream logic itself, risking drift from the real path and doubling the surface needing security review. Reusing the real function end-to-end means both specs exercise genuinely real production behaviour, not a hand-rolled approximation of it.

### Decision: require an `e2e-` prefix on every caller-controlled identity/tenant value

**Date:** 2026-07-25
**Context:** The naive design (accept an arbitrary `code` as login and an arbitrary `stubTenant` as tenantId) has a real risk: an attacker holding the leaked `E2E_STAGING_AUTH_STUB_SECRET` could set `stubTenant` to a *real* customer's tenant identifier (a real GitHub org name, or a real user's own solo-tenant login) and land a session there. Tracing `getRoleForTenant`'s fallback behaviour (`resolveRoleForPerson` → `resolveRoleForTenant`) confirmed an unrecognised identity/tenant pair defaults to role `'user'` rather than rejecting — meaning this would grant real, if limited, read access to a real tenant's data.
**Decision:** Require both `code` (login) and, when supplied, `stubTenant` to match `/^e2e-/i`. Reject (400) otherwise, even with a valid secret+header. Applied the identical guard to the already-shipped `/test/seed-multi-user-roles` endpoint's `sharedOrg` parameter, which had the same unaddressed gap (a WRITE operation, arguably higher risk than this story's READ-only role lookup) since it shipped under `dss-s1` without this restriction. Renamed its seeded literal identity keys from `alice`/`bob`/`viewer` to `e2e-alice`/`e2e-bob`/`e2e-viewer` for consistency, and its default `sharedOrg` to `e2e-shared-org`.
**Rationale:** This is the single load-bearing security property of the whole mechanism: even with the secret compromised, an attacker can never reach a real tenant, because every string this mechanism could point at is provably synthetic. Role itself is never caller-supplied at all — it always comes from the real `getRoleForTenant` lookup against whatever's genuinely seeded, closing off the most obvious alternative attack (claim an arbitrary elevated role directly).

### Decision: no `TENANT_ORG_ALLOWLIST` secret added to staging

**Date:** 2026-07-25
**Context:** `bri-s3.3` needs 2+ identities sharing one tenant. The "obvious" way to get that on staging would be configuring `TENANT_ORG_ALLOWLIST` as a real Fly secret there.
**Decision:** Not done. The `stubTenant` query param lets the stub branch set `tenantId` directly, bypassing the whole org-allowlist resolution path, so shared-tenant testing works without staging ever running in org-allowlist mode.
**Rationale:** Turning on `TENANT_ORG_ALLOWLIST` for the whole staging app is a real, unrelated security-posture change (it would make ANY real GitHub login belonging to that org land in a shared tenant) — a much larger blast radius than this story's actual need, which is purely test-infrastructure-scoped.

### Decision: `playwright.config.js`'s local `TENANT_ORG_ALLOWLIST` value updated in lockstep

**Date:** 2026-07-25
**Context:** Renaming `bri-s3.3`'s `SHARED_ORG` constant (used for the seed call and, against staging, `stubTenant`) to `e2e-shared-org` would silently desync from the LOCAL harness's own `TENANT_ORG_ALLOWLIST` value (`playwright.config.js`, previously `'shared-org'`) — locally, tenant resolution runs through the real `resolveTenant`/`setFetchOrgs` org-allowlist path (the stub branch never activates without the secret), so a mismatch would make `e2e-alice`/`e2e-bob` resolve to a *different* tenantId than the one `/test/seed-multi-user-roles` seeded team_memberships rows against, breaking role resolution locally.
**Decision:** Updated `playwright.config.js`'s `TENANT_ORG_ALLOWLIST` to `'e2e-shared-org'` to match.
**Rationale:** Caught via manual trace-through before running the specs, not via a test failure — a good reminder that renaming a test-only constant used by two different code paths (local org-allowlist resolution vs. staging stub bypass) needs both paths checked, not just the one being actively worked on.
