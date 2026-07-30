# Contract Proposal — Client-org dual-path authentication

**What will be built:**
Wiring the existing GitHub OAuth path to resolve Client-org sessions correctly (no change to the OAuth mechanism itself). A magic-link request/redemption flow using the SAME Passport.js + `passport-magic-login` mechanism Story 3 issues invitation links with, scoped to `client` org_type only, with per-IP/per-email rate-limiting mirroring `auth-email.js`'s existing signup limiter.

**What will NOT be built:**
Any password-based authentication. MFA for the magic-link path. Extending magic-link to Agency/Standalone org types.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|----------------|------|
| AC1 | Integration: existing GitHub OAuth resolves Client-org session with matching shape | Integration |
| AC2 | Unit + integration (×2): magic-link request/send + redemption resolves matching session shape | Unit, Integration |
| AC3 | Unit + integration: magic-link path rejected for agency/standalone org types | Unit, Integration |
| AC4 | Unit + integration: single-use token rejected on second click | Unit, Integration |
| AC5 | Unit + integration: adapter stubs throw unwired; wiring verified via two distinct resolved sessions | Unit, Integration |

**Assumptions:**
Story 3 is implemented first or concurrently, since both share the same Passport.js/`passport-magic-login` registration in `server.js` — this story does not duplicate that registration. The rate-limiter can reuse `auth-email.js`'s existing limiter implementation directly (same shape of risk, same threshold), not a new bespoke limiter.

**Estimated touch points:**
Files: `routes/auth.js` (Client-org session-shape confirmation, no behaviour change), a new magic-link request/redemption route module, `server.js` (Passport strategy registration — shared with Story 3, not duplicated), `tests/check-story4-dual-path-authentication.js`.
Services: Resend (shared with Story 3), Passport.js + `passport-magic-login` (shared with Story 3).
APIs: none new beyond what Story 3 introduces.
