# Contract Proposal: /subagent-execution runs spec-compliance and code-quality review in parallel, with symmetric discard-and-re-dispatch on either reviewer's fix

**What will be built:**
A `decideReviewOutcome(specResult, qualityResult)` pure decision function (same extraction pattern as `fhff-s2`'s `isDeployGroupEviction()`) that returns `{action: 'accept-both' | 'redispatch-quality' | 'redispatch-spec'}`. `/subagent-execution`'s dispatch step is changed to issue both review dispatches in the same turn, then route through this function; a discard-and-re-dispatch path re-runs whichever reviewer's pre-fix result the other side's fix invalidated. Task-completion records are updated to retain only the post-fix result when a redispatch occurred.

**What will NOT be built:**
Any change to what spec-compliance or code-quality review evaluate, or their pass/fail bar; any complexity-based skipping of either review.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration test: both dispatches issued in the same turn | integration |
| AC2 | Unit test: both-clean → accept-both | unit |
| AC3 | Unit tests: both directions of redispatch | unit |
| AC4 | Unit + integration test: only post-fix result retained | unit/integration |
| AC5 | Integration test: timing records produced for first dispatched tasks | integration |

**Assumptions:**
`ilce-s1`'s/`ilce-s2`'s timing-log mechanism is merged first, so this story's own dispatch events can be logged for Metric 1's measurement — this is a measurement dependency, not a functional one (the parallel-dispatch mechanism itself doesn't require the log to exist to work correctly).

**Estimated touch points:**
Files: `skills/subagent-execution/SKILL.md`, a new `scripts/lib/review-outcome.js` (the pure decision function), `tests/check-ilce-s3-review-outcome.js` (new). Services: none. APIs: none.

**schemaDepends:** `[]` — the upstream dependency on Epic 1 is for measurement data (timing records in `pipeline-timings.jsonl`), not a `pipeline-state.json` schema field. No fields to validate against `pipeline-state.schema.json`.
