# DoR Contract — lab-s1.3 — Multi-provider auth registry (GitHub primary)

**Story:** lab-s1.3
**Feature:** 2026-07-01-landing-auth-billing
**Contract approved:** 2026-07-01

---

## What will be built

A provider registry pattern in `src/web-ui/auth/oauth-adapter.js` (modified or replaced, depending on spike outcome) supporting multiple providers. GitHub OAuth continues to work through this registry. The registry introduces an injectable provider adapter (`setProviderAdapter()`) whose default stub throws. Production wiring is performed in `server.js` (a separate implementation task). `authGuard` is updated to read `req.session.accessToken` (canonical field — already correct in most code, verified here). `rotateSessionId` call confirmed present after every GitHub OAuth callback.

## What will NOT be built

- Google OAuth or email/password providers (lab-s2.1 and lab-s2.2 respectively)
- The `/welcome` onboarding flow (lab-s2.3)
- Stripe or billing integration (lab-e3)
- Migration of existing session data (none exists — ARCH-003)

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | GitHub OAuth happy path end-to-end with monkeypatched provider adapter → session contains `accessToken`, `userId`, `tenantId`, redirect to `/dashboard` | Integration |
| AC2 | Monkeypatch `rotateSessionId` spy → assert called after callback + new `Set-Cookie` header present | Unit |
| AC3 | Pre-deploy session cookie (without new session fields) → `authGuard` returns 302 to `/` | Unit |
| AC4 | `authGuard` called with `req.session.accessToken` (present) → allows; `req.session.token` (no `accessToken`) → denies. T4.2 explicitly asserts `req.session.token` alone is rejected. | Unit |
| AC5 | `setProviderAdapter()` not called → call to adapter method throws with "Adapter not wired" | Unit |
| AC6 | `server.js` wiring: call `setProviderAdapter(realImpl)` on startup → startup log contains "provider registry initialised" | Unit |
| AC7 | Run `node tests/check-wuce1-oauth-flow.js` → 0 failures | Regression |

## Assumptions

- lab-s1.1 is complete and spike outcome doc (ARCH-002 updated) is in place before implementation begins
- Chosen path is determined by spike exit (Path A, B, or C); contract is path-agnostic at the AC level
- No existing beta users — forced re-auth is safe (ARCH-003)
- `rotateSessionId` function already exists in `session.js`

## Estimated touchpoints

Files: `src/web-ui/auth/oauth-adapter.js` (modified/replaced), `src/web-ui/routes/auth.js` (modified — callback uses registry, rotateSessionId confirmed), `src/web-ui/server.js` (modified — production wiring), decisions.md (ARCH-002 update if spike changed it)
Services: GitHub OAuth (monkeypatched in tests)
APIs: GitHub `/login/oauth/access_token`, GitHub `/user` (monkeypatched)

## schemaDepends

`dorStatus` — upstream story lab-s1.1 must be in `dorStatus: "signed-off"` state (spike must be complete) before implementation of this story begins. `dorStatus` is a valid field in `pipeline-state.schema.json` under `features[].stories[]`.
