# Contract Proposal: PostHog instrumentation for both benefit metrics

**What will be built:**
- `_posthog.capture(tenantId, 'team_invite_created', {tenant_id, role, team_invitation_id})` added into `wsi-s1`'s invite-creation code path.
- `_posthog.capture(tenantId, 'team_invite_accepted', {tenant_id, role, team_invitation_id, elapsed_ms})` added into `wsi-s2`'s acceptance code path.
- `_posthog.capture(tenantId, 'teammate_added_by_admin', {tenant_id, role})` added into `team-management.js`'s existing `addOrUpdateTeammate` (or its calling route in `routes/team-management.js`) — a modification to an existing file from `team-identity-roles`, not this feature's own new code, per AC3's own explicit scope.

**What will NOT be built:**
- No dashboard/visualisation — raw events only.
- No historical backfill of past admin-adds.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test: invite creation → `team_invite_created` captured with correct properties | unit |
| AC2 | Unit test: acceptance → `team_invite_accepted` captured with correct elapsed-time property | unit |
| AC3 | Unit test: admin-add → `teammate_added_by_admin` captured (new — verified this event doesn't already exist) | unit |
| AC4 | Integration test: both metrics computable from mock event data alone | integration |

**Assumptions:**
- `team-management.js`'s `addOrUpdateTeammate` is the correct single insertion point for AC3 (rather than the calling route file) — confirmed by direct reading of that module during /definition.

**Estimated touch points:**
Files: `wsi-s1`'s own new route/module, `wsi-s2`'s own dispatcher extension, `routes/team-management.js` and/or `modules/team-management.js` (existing file from `team-identity-roles`, cross-feature touch — flagged explicitly per review finding 1-M2)
Services: PostHog (via existing `modules/posthog-server.js`)
APIs: None new
