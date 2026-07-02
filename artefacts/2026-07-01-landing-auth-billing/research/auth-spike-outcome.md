# Auth Tech Spike Outcome — ESM/CJS Path Recommendation

**Feature:** 2026-07-01-landing-auth-billing
**Story:** lab-s1.1
**Date:** 2026-07-02
**Status:** COMPLETE — Path C recommended

---

## 1. Recommended Path

**Path C — Roll-your-own thin OAuth abstraction using `fetch()` calls** is recommended for this project. The existing `src/web-ui/auth/oauth-adapter.js` already implements GitHub OAuth using this pattern (authorize redirect, CSRF state, code-exchange, user-identity fetch) and is working in production. Extending that pattern to additional providers (Google, GitLab, etc.) is lower risk, lower cost, and preserves the CJS runtime with zero new npm dependencies for auth.

---

## 2. Rationale

**Why Path C over Path A (dynamic import() wrapper):** Better Auth is not currently in `package.json`. Adopting it via a dynamic `import()` shim adds a new external dependency whose ESM interop behaviour must be validated for every upgrade. The `jose` cryptography dependency inside Better Auth is a deep ESM chain — dynamic import works in Node 18+ but adds a layer of indirection at the auth boundary, making stack traces and debugging harder. The project does not currently need Better Auth's advanced features (magic links, 2FA, session revocation dashboard) for MVP — multi-provider OAuth via `fetch()` is the entire requirement.

**Why Path C over Path B (full ESM migration):** A full ESM migration requires converting 200 `require()` call sites across 48 files in `src/web-ui/`, replacing all `module.exports` with named exports, and substituting `__dirname`/`__filename` usage with `import.meta.url` + `path.dirname(fileURLToPath(...))` idiom. The existing test suite (150+ test files registered in `package.json`) would all need re-verification after the migration. This is a 2–3 day migration for a well-understood CJS codebase with no payoff proportional to the cost — the sole driver would be Better Auth adoption, which is not required if Path C is taken.

**Why Path C is viable:** The existing `oauth-adapter.js` demonstrates that `fetch()`-based OAuth works cleanly. GitHub OAuth is already implemented. Google OAuth, GitLab OAuth, and other providers follow the same three-step flow: (1) redirect to provider's authorize endpoint with `client_id`, `redirect_uri`, `scope`, and CSRF `state`; (2) receive the callback code; (3) exchange code for access token at the provider's token endpoint; (4) fetch user identity from the provider's user API. Each provider needs a thin adapter module (roughly the same size as the existing `oauth-adapter.js`) that reads its own `CLIENT_ID` / `CLIENT_SECRET` from environment variables. The router dispatches to the correct adapter based on the `provider` URL parameter.

---

## 3. Path B Migration Cost Estimate

Path B was not chosen, but the cost analysis that justified rejection is documented here for traceability. The `grep -rn "require(" src/web-ui/ --include="*.js"` count returned **200 require() call lines across 48 files**. Each file would require: conversion of every `require()` to a top-level `import` statement, replacement of `module.exports = { ... }` with named `export` or `export default`, and replacement of any `__dirname` or `__filename` reference with the `import.meta.url` idiom. Estimated effort: **2–3 operator days** including full test-suite re-verification. Risk: any file missed or incorrectly converted produces a runtime `SyntaxError` that kills the server on startup. Given this cost and the full viability of Path C, Path B is rejected for this feature.

---

## 4. Better Auth Go/No-Go (Paths A and B Only)

Not applicable — Path C was chosen. Better Auth is not required. No `better-auth` package will be installed as part of this feature. The Neon Postgres adapter compatibility question is moot for MVP. If a future feature requires Better Auth (e.g. magic links, 2FA, session revocation), the spike should be re-run at that time with a fresh cost-benefit analysis against the then-current codebase ESM posture.

---

## 5. Session Schema Migration Strategy (Paths A and B Only)

Not applicable — Path C was chosen and the existing session shape is fully preserved. Per ARCH-003, forced re-auth on first post-migration login was the documented strategy for Paths A and B because Better Auth introduces its own `user`/`session`/`account` Postgres tables with a different user-ID namespace from the current GitHub numeric ID stored in Redis sessions. Since Path C extends the existing `oauth-adapter.js` pattern without introducing a new auth framework, there is no session schema change and no migration concern. The `req.session.accessToken` field, `req.session.userId`, and all related session fields remain unchanged. ARCH-003's forced re-auth clause is therefore not triggered for Path C.

---

## 6. Stories Unblocked

This recommendation unblocks the following implementation stories. All auth implementation stories were blocked on this spike exit.

- **lab-s1.3** — Auth provider registry: implement the multi-provider `oauth-adapter` registry that dispatches to per-provider adapters (GitHub, Google, etc.) using the `fetch()`-based pattern confirmed by this spike
- **lab-s2.1** — GitHub OAuth provider adapter: implement the GitHub-specific adapter (extends existing `oauth-adapter.js`)
- **lab-s2.2** — Google OAuth provider adapter: implement the Google-specific adapter following the same three-step `fetch()` flow

---

## Investigation Notes

The spike was conducted on 2026-07-02 within the 1-day time-box. Key observations: (1) `package.json` has no `"type"` field, confirming CJS baseline; (2) `src/web-ui/auth/oauth-adapter.js` exists and already implements GitHub OAuth via `fetch()` — this is the seed for Path C; (3) `better-auth` is absent from `package.json` dependencies, confirming no adoption has begun; (4) the `src/web-ui/server.js` entry point uses `'use strict'` and `require()` throughout — ESM migration would touch the top-level entry point as well as all route and adapter modules. No credentials, client secrets, or connection strings are included in this document — all provider config uses environment variable placeholders (e.g. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DATABASE_URL`).
