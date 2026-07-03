# Definition of Done: lab-s1.3 — Multi-provider auth registry (GitHub primary)

**PR:** https://github.com/heymishy/skills-repo/pull/428 | **Merged:** 2026-07-02
**Story:** artefacts/2026-07-01-landing-auth-billing/stories/lab-s1.3-auth-provider-registry.md
**Test plan:** artefacts/2026-07-01-landing-auth-billing/test-plans/lab-s1.3-test-plan.md
**DoR artefact:** artefacts/2026-07-01-landing-auth-billing/dor/lab-s1.3-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-07-03

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — GitHub OAuth continues to work after provider registry introduced | ✅ | 29/29 tests pass. GitHub happy path test asserts session fields (`accessToken`, `userId`, `tenantId`) set correctly after callback. | Automated test | None |
| AC2 — `rotateSessionId` called after every successful provider login | ✅ | Test asserts `rotateSessionId` invoked in GitHub callback flow. `check-sec5-session-rotation.js` continues to pass. | Automated test | None |
| AC3 — Existing sessions invalidated after provider registry deploy (forced re-auth) | ✅ | Session is keyed by `session_id` cookie; pre-deploy sessions lack the provider-registry session shape. `authGuard` checks `req.session.accessToken` — absent in old sessions → 302 to `/`. Verified by test asserting unauthenticated access behaviour. | Automated test + architecture guarantee | None |
| AC4 — `authGuard` uses `req.session.accessToken` for all providers | ✅ | Test asserts `authGuard` reads `req.session.accessToken` (canonical field per CLAUDE.md). No `req.session.token` references — confirmed by grep in test. | Automated test | None |
| AC5 — Provider adapter is injectable (D37); default stub throws | ✅ | Test asserts default stub throws `Error('Adapter not wired: ...')`. D37 rule met. | Automated test | None |
| AC6 — Provider registry wiring in `server.js`; startup log confirms initialised | ✅ | `server.js` calls `setProviderAdapter(gitHubProviderAdapter)` with log `[auth] provider registry initialised`. Test verifies wiring by running with `WIRE_SKILL_ADAPTERS=true`. | Automated test | None |
| AC7 — No regression on existing `check-wuce1-oauth-flow.js` tests | ✅ | Test file runs regression check against existing OAuth flow tests. All pass. | Automated regression test | None |

## Scope Deviations

None. Google OAuth and email/password correctly deferred to s2.1 and s2.2. No `/welcome` flow, no billing touches.

---

## Test Plan Coverage

**Tests from plan implemented:** 29 / 29
**Tests passing:** 29 / 29

**Test gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No `accessToken` in Redis | ✅ | `_sanitiseForRedis` strips `accessToken` before Redis writes — unchanged by this story. NFR1 test passes (T29 in test suite). |
| No credentials committed | ✅ | GitHub Client ID/Secret are env vars. `git grep GITHUB_CLIENT_SECRET` returns zero results in committed files. |
| Session rotation after login | ✅ | `check-sec5-session-rotation.js` continues to pass (AC2 regression guard). |

---

## Metric Signal

| Metric | Signal | Evidence note | Date measured |
|--------|--------|---------------|---------------|
| M1 — Self-serve signup conversion | not-yet-measured | Provider registry enables multi-provider auth funnel. Platform not yet live with real beta users. | null |
| M2 — Credits enforcement | not-yet-measured | `tenantId` session field established by this story — required by credits guard. Platform not live; no production credit queries run yet. | null |

---

## Outcome: COMPLETE ✅

ACs satisfied: 7/7
Scope deviations: None
Test gaps: None
