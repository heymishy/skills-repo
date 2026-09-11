# Definition of Done: lab-s2.2 — Email/password — third auth provider

**PR:** https://github.com/heymishy/skills-repo/pull/431 | **Merged:** 2026-07-03
**Story:** artefacts/2026-07-01-landing-auth-billing/stories/lab-s2.2-email-password-auth.md
**Test plan:** artefacts/2026-07-01-landing-auth-billing/test-plans/lab-s2.2-test-plan.md
**DoR artefact:** artefacts/2026-07-01-landing-auth-billing/dor/lab-s2.2-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-07-03

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `POST /auth/email/signup`: email normalised, bcrypt hash stored, session created with `accessToken`/`userId`/`tenantId`/`login`, `rotateSessionId` called, 302 to `/welcome` | ✅ | Test mocks bcrypt and DB adapters. Asserts email lowercased, `bcrypt.hash` called (not plaintext stored), session fields set, `rotateSessionId` called, 302 response. 36/36 pass. | Automated test | None |
| AC2 — Duplicate email returns 409 "Email already registered" | ✅ | Test with existing email mock asserts 409 response. No password/hash information in response body. | Automated test | None |
| AC3 — `POST /auth/email/login`: `bcrypt.compare` on match → session + `rotateSessionId` + 302 `/dashboard`; on mismatch → 401 | ✅ | Tests for matching password (302) and wrong password (401). No distinction between wrong email vs wrong password in response. | Automated test | None |
| AC4 — Rate limiting: > 10 login attempts per IP per 5 min → 429 | ✅ | Test fires 11 requests from same IP; asserts 11th returns 429 "Too many attempts". | Automated test | None |
| AC5 — Password never in plaintext, never logged, never in any response | ✅ | Test asserts response bodies contain no password-like strings. Test asserts logger calls contain no `password` field. bcrypt hash confirmed as the only stored credential. | Automated test | None |
| AC6 — `rotateSessionId` called after email/password signup and login | ✅ | Both signup and login tests assert `rotateSessionId` invoked. New `Set-Cookie` header sent. | Automated test | None |
| AC7 — Email/password option visible in auth chooser UI alongside GitHub and Google | ✅ | **Closed (2026-09-12):** source read of `html-shell.js:935-982` confirms the GitHub button, Google button, and email/password tab form all render unconditionally in sequence, no feature-flag branch. Also directly confirmed by a real live screenshot taken earlier this session (the GitHub OAuth login step against `wuce-staging.fly.dev`), which shows all 3 options visible together on the real sign-in page. | Source read + real live screenshot (same session) | None |

## Scope Deviations

None. Password reset, email verification, OAuth account linking, invite-only, remember-me all correctly deferred.

---

## Test Plan Coverage

**Tests from plan implemented:** 36 / 36
**Tests passing:** 36 / 36

**Test gaps:** None remaining. AC7 (auth chooser visual layout) has no automated test by design (RISK-ACCEPT logged), but is closed via source read + a real live screenshot — see AC7 row above.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| bcrypt cost factor ≥ 10 | ✅ | `password.js` calls `bcrypt.hash(password, 10)`. Test asserts cost factor = 10 in mock invocation. |
| Rate limiting: 10 attempts / 5 min per IP | ✅ | AC4 test passes (429 on 11th attempt). |
| No plaintext passwords in any output | ✅ | AC5 tests pass (password not found in logs or responses). |

---

## Metric Signal

| Metric | Signal | Evidence note | Date measured |
|--------|--------|---------------|---------------|
| M1 — Self-serve signup conversion | not-yet-measured | Email/password removes final auth barrier. Platform not yet live with real beta users — no PostHog funnel data available. | null |

---

## Outcome: COMPLETE ✅

ACs satisfied: 7/7 (AC7's RISK-ACCEPT closed 2026-09-12)
Scope deviations: None
Test gaps: 1 (AC7 auth chooser visual layout — RISK-ACCEPT, manual pre-launch smoke test pending)

**Follow-up action:** Visual check of email/password form visibility alongside GitHub and Google options at 320px and 1280px viewports as part of pre-launch checklist.
