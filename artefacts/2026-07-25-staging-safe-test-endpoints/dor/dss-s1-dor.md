## Definition of Ready: Staging-safe test endpoint gate

**Story reference:** artefacts/2026-07-25-staging-safe-test-endpoints/stories/dss-s1-staging-safe-test-endpoint-gate.md
**Test plan reference:** artefacts/2026-07-25-staging-safe-test-endpoints/test-plans/dss-s1-test-plan.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-25

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | |
| H2 | >=3 ACs | ✅ | 7 ACs |
| H3 | Every AC has >=1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage named | ✅ | Direct operator-directed fix ("do it properly please") after being shown the security tradeoff of the blanket-widening shortcut |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH | ✅ | Short-track, security-scoped |
| H8 | No uncovered ACs | ✅ | |

**All hard blocks PASS.**

## Coding Agent Instructions

```
Proceed: Yes
Story: dss-s1 -- artefacts/2026-07-25-staging-safe-test-endpoints/stories/dss-s1-staging-safe-test-endpoint-gate.md
Test plan: artefacts/2026-07-25-staging-safe-test-endpoints/test-plans/dss-s1-test-plan.md

In server.js: add a self-contained gate function pair (matching auth-email.js's
own precedent -- _stagingBypassSecretConfigured/_stagingBypassHeaderMatches
style, NOT a shared cross-module helper) reusing E2E_STAGING_AUTH_STUB_SECRET
with a NEW header x-e2e-test-endpoint-bypass, constant-time compared via
crypto.timingSafeEqual (add the crypto require). Widen exactly these 4 route
conditions from `NODE_ENV === 'test'` to `NODE_ENV === 'test' || <new gate>`:
/test/real-llm-call-count, /test/complete-onboarding,
/test/seed-multi-user-roles, /test/stripe-call-count. Leave the other 4
/test/* routes completely untouched. Relocate the real-LLM-call-counter's
https.request-wrapping instrumentation (currently nested inside the
NODE_ENV=test block) to run unconditionally in every environment.

In tests/e2e/fixtures/staging-auth.js: add a new exported header constant +
small helper (mirroring the existing RATE_LIMIT_BYPASS_HEADER pattern) that
the 4 affected spec files (bri-s3.2, bri-s3.3, bri-s3.4, bri-s3.5) import and
use to conditionally send the new header only when the secret is present in
their own process env.

In .github/workflows/staging-deploy.yml: add E2E_STAGING_AUTH_STUB_SECRET as
an env var to the smoke-test job, matching e2e.yml's existing pattern.

Add an ADR-018 addendum to .github/architecture-guardrails.md, matching the
existing 2026-07-23 (a1-staging-safe-auth-stub) addendum's format exactly.

Oversight level: Medium -- security-sensitive (new bypass mechanism, even
though narrowly scoped and modeled on two already-reviewed precedents in
this exact codebase).
```

## Sign-off

**Oversight level:** Medium
**Signed off by:** Hamish King, Founder/Operator, 2026-07-25 (short-track, operator-directed same session, "I think do it properly please")
