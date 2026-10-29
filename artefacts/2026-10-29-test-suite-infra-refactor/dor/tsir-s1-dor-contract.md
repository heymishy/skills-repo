## Contract Proposal — Extract a shared mockReq/mockRes fixture module for journey.js tests

**What will be built:**
- `tests/helpers/journey-fixture.js` — a new module exporting `journeyFixture(overrides)`, a factory function returning a `mockReq`-shaped object. Its default `session` includes `login`, `tenantId`, `accessToken`, `userId`, `role`, each with a non-empty synthetic default (grounded in the real fields `src/web-ui/routes/journey.js` reads from `req.session`, confirmed via `grep -n "req\.session\." src/web-ui/routes/journey.js`). `overrides` is a deep-merge-style parameter (at minimum supporting `{ session: { ... } }`) that replaces specific fields without requiring the caller to reconstruct the whole object. Each call returns a fresh object — no shared mutable reference across calls.
- `tests/check-tsir-s1-shared-journey-fixture.js` — new unit test file covering AC1, AC3, AC4, and the fresh-object-per-call edge case.
- `tests/check-ep1-s1-journey-feature-merge.js` — existing file, modified in place to replace its own hand-rolled `mockReq` with `journeyFixture(...)` calls (AC2), preserving every per-test override its existing assertions depend on.

**What will NOT be built:**
- Migration of any of the other 41 existing `journey.js`-touching test files — only this one example migration is in scope (story Out of Scope).
- The dedicated self-test for the fixture module itself (`tsir-s2`) or the structural `/review` check (`tsir-s3`) — separate stories in this same epic.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test asserting `journeyFixture().session` has all five grounded fields defined | unit |
| AC2 | Run `node tests/check-ep1-s1-journey-feature-merge.js` after migration, confirm same pass count as before | integration |
| AC3 | Unit test asserting `session.tenantId` is non-empty and not `undefined` | unit |
| AC4 | Unit test asserting an override merges correctly without discarding other defaults | unit |

**Assumptions:**
- `tests/check-ep1-s1-journey-feature-merge.js`'s current hand-rolled `mockReq` does not depend on any field outside the five grounded fields in a way that would break when switched to the shared fixture — if it does, the migration preserves that field as an additional override rather than dropping it silently.
- No other file imports or depends on `tests/check-ep1-s1-journey-feature-merge.js`'s internal `mockReq` implementation directly (confirmed: each `check-*.js` file is self-contained per this repo's existing convention).

**Estimated touch points:**
Files: `tests/helpers/journey-fixture.js` (new), `tests/check-tsir-s1-shared-journey-fixture.js` (new), `tests/check-ep1-s1-journey-feature-merge.js` (modified)
Services: None
APIs: None
