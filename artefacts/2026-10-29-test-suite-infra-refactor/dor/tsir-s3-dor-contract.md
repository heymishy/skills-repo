## Contract Proposal — Add a structural /review check flagging hand-rolled mockReq on journey.js-touching test files

**What will be built:**
- `scripts/check-journey-fixture-usage.js` — new standalone Node.js script (same shape as `scripts/check-design-tokens.js`), exporting a callable function plus a CLI wrapper. Detects a file that requires `journey.js` and defines its own local `mockReq`-shaped object without importing `tests/helpers/journey-fixture.js`.
- `tests/fixtures/tsir-s3-hand-rolled-mockreq.js` and `tests/fixtures/tsir-s3-shared-fixture-usage.js` — two small fixture files for the check's own tests.
- `tests/check-tsir-s3-journey-fixture-usage-check.js` — unit tests for the check script (AC1, AC2, AC4) plus the integration test reading `skills/review/SKILL.md`'s content (AC3).
- `skills/review/SKILL.md` — edited to invoke the new check and surface its result as a new, distinctly-labelled finding category. **This edit goes through a feature-branch PR with platform-team review, per CLAUDE.md's Platform change policy — same governed path as any other SKILL.md change, not bundled as a same-commit bookkeeping update.**

**What will NOT be built:**
- Promotion of this check to a `/definition-of-ready` hard block — explicitly deferred (story Out of Scope, `decisions.md` revisit trigger).
- Extension of this check to `skills.js`/`products.js`/`journeys.js` consumers — separate future slice.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test against `tests/fixtures/tsir-s3-hand-rolled-mockreq.js` | unit |
| AC2 | Unit test against `tests/fixtures/tsir-s3-shared-fixture-usage.js` | unit |
| AC3 | Integration test reading `skills/review/SKILL.md`'s source text | integration |
| AC4 | Unit test, before/after mutation on a temp copy of the AC1 fixture | unit |

**Assumptions:**
- `tsir-s1`'s shared fixture module path (`tests/helpers/journey-fixture.js`) is stable and won't be renamed before this story implements — if it is renamed, the check's detection pattern must be updated in the same PR.
- `skills/review/SKILL.md`'s existing Category A–E structure can accommodate a new category/section without restructuring the whole file — confirmed by reading the file's current structure (flat `### Category X` headings).

**Estimated touch points:**
Files: `scripts/check-journey-fixture-usage.js` (new), `tests/fixtures/tsir-s3-hand-rolled-mockreq.js` (new), `tests/fixtures/tsir-s3-shared-fixture-usage.js` (new), `tests/check-tsir-s3-journey-fixture-usage-check.js` (new), `skills/review/SKILL.md` (modified — governed, PR-gated)
Services: None
APIs: None

**schemaDepends:** `["dorStatus"]` — same judgment-call precedent as `tsir-s2` (functional dependency on `tsir-s1`'s shared fixture module, not a new schema field).
