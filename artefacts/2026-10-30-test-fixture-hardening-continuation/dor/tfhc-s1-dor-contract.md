## Contract Proposal — Extract a shared E2E fixture for seeding an approval journey

**What will be built:**
- `tests/e2e/fixtures/seed-journey.js` — new Playwright fixture module exporting `seedApprovalJourney(request, overrides)`, which POSTs to `/test/seed-approval-journey` with sensible defaults and returns the parsed response (incl. `journeyId`).
- Migration edits to `tests/e2e/ep3-s1-regression.spec.js` and `tests/e2e/ep2-s4-concurrent-merge.spec.js` — replacing each file's inline `page.request.post('/test/seed-approval-journey', {...})` block with a call to the new fixture, preserving each file's existing override values exactly.

**What will NOT be built:**
- Migration of the other 2 real callers (`tests/e2e/dsa-s2-dashboard-restyle.spec.js`, `tests/e2e/ep2-s3-approval.spec.js`) — fast-follow, per the story's own Out of Scope section.
- Any change to the real `/test/seed-approval-journey` server route (`src/web-ui/server.js:2663`) — this story wraps the existing endpoint, it does not modify it.
- A standing flakiness-measurement test — AC4 as revised asserts only the deterministic pass/fail outcome; flakiness is monitored observationally post-merge.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | E2E test — fixture seeds a journey and returns a usable `journeyId` | E2E |
| AC2 | E2E test — overrides parameter changes the seeded journey's stage | E2E |
| AC3 | E2E test — both migrated specs pass unchanged (2 tests, one per file) | E2E |
| AC4 | E2E test — pre/post-migration pass/fail outcome diff (deterministic claim only) | E2E |

**Assumptions:**
- The real `/test/seed-approval-journey` endpoint's shape (`{ featureSlug, stage, completedStages }` → `{ journeyId, ... }`) is stable for the duration of this story — confirmed via direct read of `src/web-ui/server.js:2663-2688`, not assumed.
- `NODE_ENV=test` is set when running the E2E suite locally and in CI — this is the existing, unchanged precondition for every one of the endpoint's 4 current callers, not a new requirement introduced by this story.

**Estimated touch points:**
Files: `tests/e2e/fixtures/seed-journey.js` (new), `tests/e2e/ep3-s1-regression.spec.js` (modified), `tests/e2e/ep2-s4-concurrent-merge.spec.js` (modified)
Services: None
APIs: `/test/seed-approval-journey` (consumed, not modified)

**schemaDepends:** Not applicable — Dependencies block states "None"; no upstream story referenced.
