## Contract Proposal — Surface pending/merged PR state in the guardrails/standards view

**What will be built:**
A new small tracking table (`guardrail_pending_prs`) recording `wugs-s6`'s returned PR references. On each view render, a live GitHub PR-status check per pending row; state (pending/merged/closed) rendered accordingly, with the tracking row cleared on merge or close.

**What will NOT be built:**
Real-time push updates. Notifications.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test, mock tracking row + mocked "open" PR status | unit |
| AC2 | Unit test, mocked "merged" status | unit |
| AC3 | Unit test, mocked "closed" status | unit |
| AC4 | Integration test, two mock rows, two different mocked states | integration |

**Assumptions:**
None beyond `wugs-s6`'s already-established PR-number/URL return shape.

**Estimated touch points:**
Files: `src/web-ui/routes/products.js`, `scripts/migrate-schema-pg.js` (new table), `tests/check-wugs-s7-*.js` (new)
Services: None
APIs: GitHub Pulls API (status check, read-only)
