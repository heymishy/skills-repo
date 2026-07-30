# Contract Proposal — Client-org lightweight collaboration — comments only

**What will be built:**
A new `comments` table (append-only), a comment-creation and comment-list route pair that goes through Story 2's existing grant-check guard (not a parallel access-control path), and a `client_agency_comment_created` PostHog event fired on every comment creation.

**What will NOT be built:**
Editing/deleting comments. Real-time push. Comment moderation/notification. Comments on resources outside the Story-2 grant model.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|----------------|------|
| AC1 | Unit + integration: comment saved with author metadata, visible both sides | Unit, Integration |
| AC2 | Unit + integration: no-grant submission rejected (404, same guard as Story 2 AC4) | Unit, Integration |
| AC3 | Unit + integration: Agency sees Client comment, reply itself visible | Unit, Integration |
| AC4 | Unit (×2) + integration: data condition + `client_agency_comment_created` event, correct `thread_has_both_org_types` flag | Unit, Integration |

**Assumptions:**
Story 2's grant-check adapter function is imported and called directly by the comment routes — not re-implemented. PostHog capture is already wired elsewhere in this codebase (e.g. `journey_created`); this story adds one more event through the same existing capture mechanism, not a new PostHog integration.

**Estimated touch points:**
Files: new `comments` adapter module, comment route handlers, `tests/check-story5-client-agency-comments.js`.
Services: none new — reuses existing PostHog wiring.
APIs: none new.
