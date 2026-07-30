# Contract Proposal — Self-service Agency-to-Client provisioning

**What will be built:**
A "Create Client" route/flow (Agency-only, server-side `org_type` check), an invite-user flow that issues a Passport.js + `passport-magic-login` token, sends it via a new injectable `sendInvitationEmail` adapter wired to Resend in `server.js`, and on redemption creates the Client-org user account plus a `team_memberships` row with `role = 'admin'` scoped to the new org's `tenant_id`.

**What will NOT be built:**
The ongoing authentication mechanism itself beyond invitation redemption (GitHub OAuth / repeat magic-link sign-in is Story 4). No email/user-management beyond the first invited user — inviting a second user is explicitly out of scope.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|----------------|------|
| AC1 | Unit + integration: Agency user creates Client org + relationship row | Unit, Integration |
| AC2 | Unit + integration (parametrised over standalone/client): non-Agency rejected | Unit, Integration |
| AC3 | Unit + integration (×2): invitation issued via shared mechanism; redemption creates `role='admin'` membership | Unit, Integration |
| AC4 | Unit + integration: blank/invalid name rejected | Unit, Integration |
| AC5 | Unit + integration: `sendInvitationEmail` stub throws unwired; `server.js` wiring verified via two distinct, correctly-addressed calls | Unit, Integration |

**Assumptions:**
Resend API key (`RESEND_API_KEY`) is provisioned in the deployment environment before this story reaches implementation (named as an External dependency in the story). The `team_memberships` table already exists (built in the `team-identity-roles` epic) — this story inserts into it, it does not create it.

**Estimated touch points:**
Files: `routes/` (new create-client + invite-user handlers), a new `sendInvitationEmail` adapter module, `server.js` (Passport strategy registration + adapter wiring), `modules/user-roles.js`/`team-management.js` (reused, not modified), `tests/check-story3-self-service-provisioning.js`.
Services: Resend (new), Passport.js + `passport-magic-login` (new dependency).
APIs: Resend send API.
