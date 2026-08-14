# Contract Proposal: Invitee accepts the invite and joins the tenant with the assigned role

**What will be built:**
- A `verifyTeamInviteRedemption(payload, callback)` function (new, mirroring `_verifyInvitationRedemption`'s own shape), delegating to `team-invitations.js`'s own `redeemInvitation`-equivalent function.
- A `createOrReuseTeamInvitee(pool, tenantId, email, role, logger)` function mirroring `createClientOrgUserAndAdminMembership`'s reuse-or-create logic, but writing `team_memberships` with the invite's own `role` instead of hardcoding `'admin'`.
- Extension of `server.js`'s `_combinedMagicLinkVerify` to a 3-way dispatch: `payload.teamInvitationId` present → `verifyTeamInviteRedemption`; else `payload.invitationId` present → existing `_verifyInvitationRedemption` (unchanged); else → existing `_verifyClientLogin` (unchanged).

**What will NOT be built:**
- No change to `_verifyInvitationRedemption` or `_verifyClientLogin`'s own internal logic — both are called exactly as before, only the dispatch routing gains a new branch ahead of them.
- No new onboarding/welcome UI — the invitee lands in the existing post-login experience.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test: valid token → team_memberships row with invite's tenant_id/role | unit |
| AC2 | Unit test: no existing person_identities → new person created | unit |
| AC3 | Unit test: existing person_identities → reused, no duplicate | unit |
| AC4 | Unit test: second redemption attempt on same token → rejected, no second row | unit |
| AC5 | Integration test (×2): existing invitationId payload and plain login payload both still route correctly | integration |

**Assumptions:**
- The dispatcher extension happens in the same `.then()` callback block in `server.js` where `registerMagicLinkStrategy`/existing `setVerifyCallback` already run, preserving the documented synchronous-ordering requirement.
- `wsi-s1`'s `team_invitations` module is already merged and available before this story's own implementation begins (sequenced dependency, not parallel).

**Estimated touch points:**
Files: `server.js` (`_combinedMagicLinkVerify` extension), new function(s) in `modules/team-invitations.js` (redemption logic)
Services: Postgres (`team_invitations`, `team_memberships`, `people`, `person_identities`)
APIs: None new — extends the existing magic-link verify callback
