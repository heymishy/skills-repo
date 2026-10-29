## Contract Proposal — Migrate a bounded batch of hand-rolled journey.js test files to the shared fixture

**What will be built:**
- Migration edits to 3-5 of the 16 remaining hand-rolled `journey.js`-touching test files (exact batch chosen at implementation time), replacing each file's own local `mockReq`/`mockRes` construction with calls into `tests/helpers/journey-fixture.js` (`tsir-s1`, already merged).

**What will NOT be built:**
- Migration of the remaining 11-13 files beyond this batch — fast-follow, per the story's own Out of Scope section.
- Any change to each migrated file's existing test *intent* — this is a migration-only pass, not a test-quality improvement pass.
- Any change to `tests/helpers/journey-fixture.js` itself — this story consumes it, `tsir-s1` built it.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration test — each migrated file's own assertions still pass | integration |
| AC2 | Unit test — `check-journey-fixture-usage.js` reports 0 findings per migrated file | unit |
| AC3 | Integration test — full regression suite passes with no new failures | integration |
| AC4 | Unit test — hand-rolled count drops from 16 to 11-13 | unit |

**Assumptions:**
- `tests/helpers/journey-fixture.js` (`tsir-s1`) and `scripts/check-journey-fixture-usage.js` (`tsir-s3`) are already merged and available — confirmed on disk at both paths.
- The specific 3-5 files chosen for this batch are selected from the 16 currently flagged by `check-journey-fixture-usage.js`, not pre-named in the story — batch selection is an implementation-time decision within the stated size range.

**Estimated touch points:**
Files: 3-5 of the 16 remaining hand-rolled `journey.js`-touching test files under `tests/` (exact list determined at implementation time)
Services: None
APIs: None

**schemaDepends:** `["dorStatus"]` — functional/code-level dependency on `tsir-s1`'s shared fixture module and `tsir-s3`'s structural check both existing on disk, not a new pipeline-state.json schema field; declared per the established judgment-call precedent (`tsir-s2`'s own DoR contract, 2026-10-29) for exactly this class of dependency.
