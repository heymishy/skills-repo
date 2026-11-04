# Contract Proposal: Add structured per-skill timing writes to pipeline-timings.jsonl

**What will be built:**
A shared `appendTimingRecord(record)` helper (e.g. `scripts/lib/pipeline-timings.js`) that validates a record against the documented schema and appends it as one JSON line to `.github/pipeline-timings.jsonl`, creating the file fresh if absent, and swallowing (logging, not throwing) any write failure. A new "write timing record" step is added to the "State update — mandatory final step" section of each of: `skills/branch-setup/SKILL.md`, `skills/implementation-plan/SKILL.md`, `skills/subagent-execution/SKILL.md`, `skills/verify-completion/SKILL.md`, `skills/branch-complete/SKILL.md`.

**What will NOT be built:**
A rollup/query script for reading the log back out (needed by downstream stories, not this one); any change to what each skill's own logic does besides the one new append call; retroactive backfill of historical timing data.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit tests on `appendTimingRecord` for required fields, `dispatchCount`, and `fullSuite` (added at DoR) | unit |
| AC2 | Unit test: call against a non-existent file path | unit |
| AC3 | Integration test: two near-simultaneous append calls | integration |
| AC4 | Unit tests: schema validator + mocked write failure | unit |

**Assumptions:**
Each skill's "State update" section can be edited to add one line calling the shared function without disrupting its existing logic. Node's standard `fs` append is sufficient — no cross-process file lock is needed given append-only, low-contention writes.

**Estimated touch points:**
Files: `scripts/lib/pipeline-timings.js` (new), `skills/branch-setup/SKILL.md`, `skills/implementation-plan/SKILL.md`, `skills/subagent-execution/SKILL.md`, `skills/verify-completion/SKILL.md`, `skills/branch-complete/SKILL.md`, `tests/check-ilce-s1-pipeline-timings.js` (new). Services: none. APIs: none.
