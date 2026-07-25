## Definition of Ready: Named-identity staging stub (nis-s1)

**Story reference:** artefacts/2026-07-25-named-identity-stub/stories/nis-s1-named-identity-staging-stub.md
**Test plan reference:** artefacts/2026-07-25-named-identity-stub/test-plans/nis-s1-test-plan.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-25

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | |
| H2 | >=3 ACs | ✅ | 8 ACs |
| H3 | Every AC has >=1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage named | ✅ | dss-s1 post-merge finding + direct investigation this session |
| H6 | Complexity rated | ✅ | 3 |
| H7 | No unresolved HIGH | ✅ | Threat-model reviewed inline in story; operator explicitly chose "build it properly" over narrower options via AskUserQuestion |
| H8 | No uncovered ACs | ✅ | |
| H9 (security) | Security-scoped design explicit | ✅ | Full blast-radius analysis in story; `e2e-` prefix enforcement is the load-bearing guard |

**All hard blocks PASS.**

## Coding Agent Instructions

```
Proceed: Yes
Story: nis-s1 -- artefacts/2026-07-25-named-identity-stub/stories/nis-s1-named-identity-staging-stub.md
Test plan: artefacts/2026-07-25-named-identity-stub/test-plans/nis-s1-test-plan.md

1. In src/web-ui/routes/auth.js's handleAuthCallback, add a staging-safe
   named-identity stub branch, gated by process.env.E2E_STAGING_AUTH_STUB_SECRET
   set AND req.headers['x-e2e-named-identity-stub'] timing-safe-matching it
   (mirror server.js's _testEndpointBypassSecretConfigured/_testEndpointBypassHeaderMatches
   pattern from dss-s1, adapted for this file). When active:
     - Require `code` (query.code) to match /^e2e-/i -- if it doesn't, fall
       through to the real provider-adapter path unchanged (do not silently
       accept a non-prefixed login).
     - Derive user = { id: <deterministic hash of code, matching bri-s3.6's
       existing NODE_ENV=test formula: id = (id*31+charCode)%900000, offset
       +900000000>, login: code }; token = 'e2e-named-stub-token-' + code.
     - Read optional query.stubTenant. If present and does NOT match /^e2e-/i,
       respond 400 and return (no session established). If present and valid,
       req.session.tenantId = stubTenant. If absent, fall through to the
       existing isolated-tenant default (tenantId = user.login) -- do NOT
       run the TENANT_ORG_ALLOWLIST resolveTenant() branch when the stub is
       active (stubTenant, when supplied, IS the tenant -- no org lookup).
     - Everything after this point (credit grant, role lookup via
       getRoleForTenant, first-login via _userFlags, session rotation,
       redirect) must be the exact same code already there -- no duplication.
2. In src/web-ui/server.js's /test/seed-multi-user-roles handler: default
   sharedOrg to 'e2e-shared-org' (was 'shared-org'); reject (400) any
   caller-supplied sharedOrg not matching /^e2e-/i; rename seeded
   identity_key values from 'alice'/'bob'/'viewer' to
   'e2e-alice'/'e2e-bob'/'e2e-viewer'.
3. Update tests/e2e/fixtures/staging-auth.js: add the new header constant
   and a namedIdentityStubHeaders() helper mirroring testEndpointBypassHeaders().
4. Update tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js: rename
   login constants to e2e-alice/e2e-bob/e2e-viewer, update the seed call's
   sharedOrg to e2e-shared-org, and have githubLogin() send the new header +
   stubTenant=e2e-shared-org query param via the staging-auth fixture.
5. Update tests/e2e/bri-s3.6-auth-journey.spec.js's login helper to send the
   new header (SYNTHETIC_LOGIN already starts with e2e-, no rename needed).
6. Write tests/check-nis-s1-named-identity-stub.js covering all 8 ACs,
   mirroring tests/check-bri-s3.6-auth-journey.js's mockReq/mockRes/
   freshRequire conventions.
7. Re-run tests/check-bri-s3.6-auth-journey.js and both local Playwright
   specs to confirm zero regression (AC8).

Oversight level: High -- real auth code path change. Security review is the
story's own threat-model section; do not weaken the e2e- prefix guard for
convenience.
```

## Sign-off

**Oversight level:** High
**Signed off by:** Hamish King, Founder/Operator, 2026-07-25 (explicit "build it properly" selection via AskUserQuestion after being shown the security trade-off; short-track, operator-directed, part of capture-log review batch)
