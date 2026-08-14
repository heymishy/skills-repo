# Contract Proposal: Expired invites (past 24 hours) are rejected cleanly

**What will be built:**
- An additional `expires_at > NOW()` condition added directly into `wsi-s2`'s own redemption query/check, evaluated together with the existing `redeemed_at IS NULL` atomic check.
- A distinct "this invite has expired" error message surfaced when the expiry condition fails.

**What will NOT be built:**
- No new table, column, route, or dispatcher branch — purely a refinement of `wsi-s2`'s own existing redemption logic.
- No extend/renew mechanism for an expired invite.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test: expired + unredeemed → rejected with specific message | unit |
| AC2 | Unit test: expired → no membership created, redeemed_at stays NULL | unit |
| AC3 | Unit test: within-window invite → unaffected (regression) | unit |

**Assumptions:**
- `wsi-s2`'s own redemption code path is a single, identifiable function/query this story can extend in place, not something requiring a structural refactor first.

**Estimated touch points:**
Files: same file(s) `wsi-s2` modifies for redemption logic (extends, doesn't add new files)
Services: None new
APIs: None new
