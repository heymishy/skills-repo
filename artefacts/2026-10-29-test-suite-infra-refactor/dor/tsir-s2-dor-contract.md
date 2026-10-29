## Contract Proposal — Add a dedicated self-test for the shared journey.js fixture module

**What will be built:**
- `tests/check-journey-fixture-self-test.js` — new unit test file asserting: (1) the shared fixture's default `session` fields match an independently-re-derived read of `journey.js`'s real `req.session` usage (not trusting `tsir-s1`'s own test), (2) the overrides-merge behaviour, (3) structurally, via source-text inspection, that the self-test file itself makes no network/filesystem-write/shared-global-state calls.

**What will NOT be built:**
- A standing automated meta-test proving the self-test fails on a real regression (AC2) — this is a one-time manual verification performed during implementation (temporarily break the fixture's default, confirm the self-test fails, then restore it), per `.github/standards/testing/test-design-patterns.md`'s own mutation-test discipline and this story's test plan's documented Coverage gap. Not force-automated via require-cache manipulation.
- Any change to `tests/helpers/journey-fixture.js` itself — this story only tests it, `tsir-s1` builds it.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test, independently re-derived field list against route code | unit |
| AC2 | Manual mutation-test during implementation (documented gap, not automated) | manual |
| AC3 | Unit test, structural source-text inspection (no network/fs/global-state) | unit |
| AC4 | Unit test, overrides-merge assertion | unit |

**Assumptions:**
- `tsir-s1`'s shared fixture module (`tests/helpers/journey-fixture.js`) is already merged/available before this story starts — confirmed via this epic's Walking Skeleton sequencing.
- The mutation-test performed for AC2 is reverted cleanly (verified via `git diff` showing no leftover change) before the PR for this story is opened.

**Estimated touch points:**
Files: `tests/check-journey-fixture-self-test.js` (new)
Services: None
APIs: None

**schemaDepends:** `["dorStatus"]` — functional/code-level dependency on `tsir-s1`'s shared fixture module existing on disk, not a new pipeline-state.json schema field; declared per the established judgment-call precedent (bri-s3.3, 2026-07-10) for exactly this class of dependency.
