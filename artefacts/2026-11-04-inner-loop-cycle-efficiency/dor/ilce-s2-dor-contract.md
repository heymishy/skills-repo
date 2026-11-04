# Contract Proposal: /branch-complete skips the redundant full-suite rerun when a fresh result exists

**What will be built:**
A freshness-check function inside `/branch-complete`'s Step 1 that reads the most recent `verify-completion`-stage record for the current story from `.github/pipeline-timings.jsonl` (via `ilce-s1`'s reader), and skips the full-suite rerun only if both hold: no commit has happened since that record's timestamp, and the record's `fullSuite` field is `true`. Appends a `{skipped: true|false}` record for this decision.

**What will NOT be built:**
Any change to `/verify-completion`'s own freshness-check implementation (it is read, not modified); any cross-session caching mechanism.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit + integration test: skip when no-commit + full-suite record exists | unit/integration |
| AC2 | Unit test: rerun forced by a commit after the record | unit |
| AC3 | Unit test: rerun forced when `fullSuite: false` | unit |
| AC4 | Unit test: skip/ran flag appended correctly in both branches | unit |

**Assumptions:**
`ilce-s1`'s `appendTimingRecord`/reader API, including the `fullSuite` field (added at this DoR run), is available and stable before this story's implementation begins.

**Estimated touch points:**
Files: `skills/branch-complete/SKILL.md`, `scripts/lib/pipeline-timings.js` (read-only usage), `tests/check-ilce-s2-branch-complete-freshness.js` (new). Services: none. APIs: none.

**schemaDepends:** `[]` — this story's upstream dependency on `ilce-s1` is on `.github/pipeline-timings.jsonl`'s record format (specifically the `fullSuite` field), not on any `pipeline-state.json` schema field. `pipeline-state.schema.json` is not implicated by this dependency, so no fields are declared against it.
