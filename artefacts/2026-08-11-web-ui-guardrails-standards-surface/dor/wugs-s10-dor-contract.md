## Contract Proposal — Audit-log promotion request, approval, and rejection events

**What will be built:**
PostHog `.capture()` calls added to `wugs-s8`'s request handler and `wugs-s9`'s approve/reject handlers, matching the existing capture convention (`kanban_viewed`, etc.). Fail-open — a capture failure never blocks the underlying state change.

**What will NOT be built:**
A dashboard visualising these events. Backfill for pre-existing activity (none exists).

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test, mock PostHog client, request handler | unit |
| AC2 | Unit test, mock PostHog client, approve handler | unit |
| AC3 | Unit test, mock PostHog client, reject handler | unit |
| AC4 | Integration test, mock PostHog client throws, action still completes | integration |

**Assumptions:**
None — matches an already-proven, existing capture pattern.

**Estimated touch points:**
Files: `src/web-ui/routes/products.js` (three call sites added to `wugs-s8`/`wugs-s9`'s handlers), `tests/check-wugs-s10-*.js` (new)
Services: PostHog
APIs: None new
