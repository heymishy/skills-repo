# Definition of Done: lab-s2.1 — Google OAuth — second auth provider

**PR:** https://github.com/heymishy/skills-repo/pull/429 | **Merged:** 2026-07-02
**Story:** artefacts/2026-07-01-landing-auth-billing/stories/lab-s2.1-google-oauth.md
**Test plan:** artefacts/2026-07-01-landing-auth-billing/test-plans/lab-s2.1-test-plan.md
**DoR artefact:** artefacts/2026-07-01-landing-auth-billing/dor/lab-s2.1-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-07-03

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `GET /auth/google` redirects to Google OAuth authorisation URL with `client_id`, `redirect_uri`, `scope` (openid email), `response_type=code`, and random `state` stored in session | ✅ | Test asserts 302 to `accounts.google.com/o/oauth2/v2/auth` with all required query params. `state` stored in `req.session.oauthState`. 35/35 pass. | Automated test | None |
| AC2 — Callback validates CSRF state; exchanges code for Google access token; retrieves identity from userinfo endpoint | ✅ | Test: state mismatch → 403; matching state + mock code exchange → session populated with access token and user identity. | Automated test | None |
| AC3 — Session contains `accessToken` (Google access token), `userId` (Google sub), `tenantId`, `login` (email) | ✅ | Test asserts all four fields present after successful callback. `req.session.accessToken` is the canonical field (CLAUDE.md). | Automated test | None |
| AC4 — `rotateSessionId` called after Google OAuth login | ✅ | Test asserts `rotateSessionId` invoked in callback handler. New `Set-Cookie` header sent. | Automated test | None |
| AC5 — "Continue with Google" button visible in auth chooser UI | ✅ | `html-shell.js` updated with Google OAuth button rendered in the sign-in panel. Test asserts button element present in HTML output. | Automated test | None |
| AC6 — Existing GitHub OAuth flow unbroken after Google provider addition | ✅ | Regression test asserts GitHub auth happy path produces identical session fields and `rotateSessionId` call. | Automated regression test | None |
| AC7 — State mismatch → 403; `oauth_state_mismatch` audit-logged | ✅ | Test with non-matching `state` asserts 403 and audit log event `oauth_state_mismatch` emitted with no token in payload. | Automated test | None |

## Scope Deviations

None. Email/password deferred to s2.2. `/welcome` flow deferred to s2.3. No Google Workspace org restrictions, no token refresh.

---

## Test Plan Coverage

**Tests from plan implemented:** 35 / 35
**Tests passing:** 35 / 35

**Test gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No credentials committed | ✅ | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` confirmed absent from committed files. NFR test (T35) passes. |
| Audit log: `login` event on successful Google OAuth | ✅ | Test asserts `_logger.info('login', { userId, timestamp })` called after successful callback. No token value in log. |

---

## Metric Signal

| Metric | Signal | Evidence note | Date measured |
|--------|--------|---------------|---------------|
| M1 — Self-serve signup conversion | not-yet-measured | Google OAuth implemented and tested. Widens addressable signup population beyond GitHub users. Platform not yet live with real beta users — no PostHog funnel data. | null |

---

## Outcome: COMPLETE ✅

ACs satisfied: 7/7
Scope deviations: None
Test gaps: None
