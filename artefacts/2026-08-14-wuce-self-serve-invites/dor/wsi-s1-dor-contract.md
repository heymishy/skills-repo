# Contract Proposal: Admin creates a per-person team invite, which sends the invite email

**What will be built:**
- New Postgres table `team_invitations` (`team_invitation_id` PK, `tenant_id`, `email`, `role`, `created_at`, `expires_at`, `redeemed_at`), created via an idempotent `migrateTeamInvitationsSchema(pool)` matching `client-invitations.js`'s own `CREATE TABLE IF NOT EXISTS` convention.
- New module `modules/team-invitations.js` mirroring `client-invitations.js`'s function shapes: `createInvitation(pool, tenantId, email, role, adminId, logger)`, `getInvitationById`.
- A new route handler (e.g. `POST /products/:id/team/invite` or equivalent under an existing team-management route file) that: reads `tenantId` from `req.session`, validates `role` against `team-management.js`'s `VALID_ROLES`, writes the invite row, then calls `invitation-email.js`'s existing `sendInvitationEmail(email, link, code)` with a link containing a signed JWT carrying `teamInvitationId`.
- Wiring the new route in `server.js`.

**What will NOT be built:**
- No new email adapter — `sendInvitationEmail`/`setSendInvitationEmail`/the Resend wiring are reused completely unchanged.
- No invite-management UI (revoke/resend/list) — matching the epic's own Out of Scope.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test asserting the INSERT's parameters (tenant_id from session, role, expires_at = created_at + 24h) | unit |
| AC2 | Unit test asserting `sendInvitationEmail` called with correct email + token-bearing link | unit |
| AC3 | Unit test: invalid role → `InvalidRoleError`, no INSERT | unit |
| AC4 | Unit test: missing role → rejected, no INSERT | unit |
| AC5 | Unit test: mock `sendInvitationEmail` throws → clear error surfaced, row already written | unit |

**Assumptions:**
- The new route lives under the existing team-management route file (`routes/team-management.js`) or a new sibling file — implementer's choice, since the story doesn't mandate a specific file.
- The invite email's copy (subject/body) will reference "team" rather than "Client organisation" — a content-only change to `createResendSendInvitationEmail`'s template string or an added parameter, not a new adapter (per the story's own Architecture Constraints).

**Estimated touch points:**
Files: new `modules/team-invitations.js`, new/extended route handler file, `server.js` (route wiring, schema migration call), possibly `modules/invitation-email.js` (template parameterisation)
Services: Postgres (`team_invitations` table), Resend (via existing adapter)
APIs: `sendInvitationEmail` (existing, unchanged), new internal route
