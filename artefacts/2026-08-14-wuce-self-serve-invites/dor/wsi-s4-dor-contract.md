# Contract Proposal: Invite acceptance is blocked if the tenant is at its member-count cap

**What will be built:**
- A hardcoded per-plan-tier cap constant (e.g. `{trial: 3, paid: 25}` — exact values are an implementation decision).
- A `COUNT(*) FROM team_memberships WHERE tenant_id = $1` check, added into `wsi-s2`'s own redemption logic, gated on `tenant-plan.js`'s existing `getPlanState(tenantId)` to determine which cap applies.
- A clear "member limit reached" error surfaced when the count is at or above the cap.

**What will NOT be built:**
- No Stripe integration, no metered quantity, no per-tenant configurable cap, no proactive "approaching your limit" UI — all explicitly deferred per the story's Out of Scope.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test: at-cap trial tenant → blocked, invite not consumed | unit |
| AC2 | Unit test: below-cap tenant → unaffected (regression) | unit |
| AC3 | Unit test: paid cap materially higher than trial cap | unit |
| AC4 | Unit test: exactly-at-cap boundary → still blocked (inclusive) | unit |

**Assumptions:**
- The exact cap numbers (trial/paid) are the implementer's own reasonable choice, not fixed by the ACs — the story's own Architecture Constraints explicitly say so.

**Estimated touch points:**
Files: same file(s) `wsi-s2` modifies for redemption logic
Services: Postgres (`team_memberships` COUNT query), reuses `tenant-plan.js`'s existing `getPlanState`
APIs: None new
