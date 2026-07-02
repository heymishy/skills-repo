# DoR Contract — lab-s2.1 — Google OAuth — second auth provider

**Story:** lab-s2.1
**Feature:** 2026-07-01-landing-auth-billing
**Contract approved:** 2026-07-01

---

## What will be built

Google OAuth 2.0 provider added to the auth registry (established by lab-s1.3). Two new route handlers: `handleAuthGoogle` (`GET /auth/google` — builds redirect URL with `state` CSRF parameter stored in session) and `handleAuthGoogleCallback` (`GET /auth/google/callback` — validates state, exchanges code for token, fetches userinfo, creates session, calls `rotateSessionId`, redirects to `/dashboard` or `/welcome`). The Google provider adapter is injectable for tests (re-uses registry pattern from lab-s1.3). Auth chooser UI template updated with "Continue with Google" button. Routes registered in `server.js`.

## What will NOT be built

- Email/password auth (lab-s2.2)
- The /welcome onboarding flow (lab-s2.3)
- Google Workspace domain restrictions, sign-in-with-Apple, Microsoft OAuth
- Google token refresh (access token only, no refresh token in MVP)

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | GET /auth/google → assert 302 to Google OAuth URL with correct params (`client_id`, `redirect_uri`, `scope=openid email`, `response_type=code`, `state`); assert `state` stored in session | Unit |
| AC2 | Callback with valid state + monkeypatched code exchange → assert state validation, userinfo fetch called; callback with mismatched state → assert 403 | Unit |
| AC3 | Successful callback → `req.session.accessToken` = Google access token, `req.session.userId` = Google `sub`, `req.session.tenantId` set, `req.session.login` = email | Unit |
| AC4 | Monkeypatch `rotateSessionId` spy → assert called after successful callback + new Set-Cookie header | Unit |
| AC5 | GET /auth/google callback page HTML → assert "Continue with Google" button/link present in DOM (not CSS layout) | Unit |
| AC6 | GitHub flow regression: `node tests/check-wuce1-oauth-flow.js` → 0 failures | Regression |
| AC7 | Callback with state mismatch → 403; `oauth_state_mismatch` in audit log; no token stored in session | Unit |

## Assumptions

- lab-s1.3 is complete — provider registry pattern and `rotateSessionId` are in place
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` are available as env vars in test runs (mocked in unit tests)
- The Google userinfo endpoint (`https://www.googleapis.com/userinfo/v2/me`) is monkeypatched in tests — no real Google API calls in unit tests

## Estimated touchpoints

Files: `src/web-ui/auth/oauth-adapter.js` or provider-specific file (modified — Google provider config), `src/web-ui/routes/auth.js` or new `src/web-ui/routes/auth-google.js` (new/modified — Google handlers), `src/web-ui/server.js` (modified — register Google routes), `src/web-ui/templates/` (modified — add "Continue with Google" button)
Services: Google OAuth APIs (monkeypatched in tests)
APIs: `https://accounts.google.com/o/oauth2/v2/auth`, `https://oauth2.googleapis.com/token`, Google userinfo endpoint

## schemaDepends

`dorStatus` — upstream story lab-s1.3 must be `dorStatus: "signed-off"` before implementation begins. `dorStatus` is a valid field in `pipeline-state.schema.json` under `features[].stories[]`.
