Slicing strategy: walking-skeleton

## Epic 1 — Receipt Foundation

Goal: The refactor receipt write mechanism is proven end-to-end. `pipeline-state.schema.json` declares the `refactorReceipt` and `designHealth` fields. `bin/skills advance` supports JSON-object values via dot-notation. The `/tdd` REFACTOR step requires a structured receipt or an explicit skip reason, and `/verify-completion` allows structural-only rewrites of files already in the DoR contract. A skipped refactor and a completed one are distinguishable in pipeline state for the first time.
Out of scope:
- Stage 3 design lens in `/implementation-review`
- Design health dimension computation at DoD or `/improve`
- `/workflow` silent-skip warnings
- Automated detection of whether a diff is structural-only
- Any CI enforcement of receipt presence

Oversight: High
Oversight rationale: Solo operator context; schema and shared CLI changes (`bin/skills advance`) affect all skills and all delivery; any regression here would silently corrupt pipeline state across the whole framework.
Complexity: 2
Scope stability: Stable

### ep1-s1 — Schema co-evolution and `advance` JSON-object write verification
Persona: Platform maintainer
Domain: software-engineering

So that receipt data can be written atomically and read consistently by all downstream skills, I need `pipeline-state.schema.json` to declare the `refactorReceipt` and `designHealth` fields, and `bin/skills advance` to support JSON-object values via dot-notation.

Benefit linkage: Receipt coverage rate (Metric 1 — percentage of tasks with a receipt or explicit skip reason) — without a writable, schema-valid receipt field, no coverage can be measured.
Architecture constraints: ADR-003 (schema-first: fields declared before use); ADR-011 (artefact-first: this story is the artefact chain for the schema change).

Given `pipeline-state.schema.json` is updated to declare `tddState.refactorReceipt` as an object with required fields (`status`, `changes`, `testResult`, `diffScope`, `notes`, `reason`) and `feature.designHealth` as an object,
When a schema validation tool runs against a `pipeline-state.json` containing a completed receipt or a skip receipt,
Then validation passes with zero errors.

Given the `bin/skills advance` CLI is invoked with a dot-notation path and a JSON-string value (e.g. `tddState.refactorReceipt='{"status":"completed","changes":["..."],"testResult":"pass","diffScope":"internal"}'`),
When the advance command processes the argument,
Then the nested object is written correctly to `pipeline-state.json` at the specified path (not stored as a raw string).

Given `bin/skills advance` is invoked with an invalid JSON string as the value,
When the advance command processes the argument,
Then it exits with a non-zero code and a descriptive error message, and `pipeline-state.json` is not modified.

Out of scope:
- Any skill instruction changes (those are ep1-s2)
- The `designHealth` computation logic (that is ep2-s2)
- Any CI enforcement of receipt presence

Dependencies: None
NFR: The advance command must not break existing scalar writes when the JSON-object extension is added.
Complexity: 2
Scope stability: Stable

### ep1-s2 — `/tdd` REFACTOR step receipt protocol
Persona: Developer / engineer
Domain: software-engineering

So that refactor discipline is visible and measurable (receipt coverage rate ≥80%, zero silent skips), I need the `/tdd` REFACTOR step to require a structured receipt or an explicit skip reason, and the `/verify-completion` scope-creep check to allow structural-only file rewrites that are already in the DoR contract.

Benefit linkage: Receipt coverage rate (Metric 1 — percentage of tasks with a receipt or explicit skip reason) and skipped-without-reason rate (Metric 2 — percentage of tasks with neither a receipt nor an explicit skip reason) — this story is the primary driver of both.
Architecture constraints: ADR-011 (artefact-first: SKILL.md behavioural change requires story chain); Platform change policy (SKILL.md changes via PR with tech lead review); PAT-07 (group instruction-text-only changes at the same exit point — the `/tdd` REFACTOR exit and the `/verify-completion` refactor carve-out are co-located concerns grouped here).

Given an agent has completed the GREEN step and the full test suite is passing,
When the agent reaches the REFACTOR step in `/tdd`,
Then the SKILL.md instructs the agent to either (a) apply structural improvements and produce a completed receipt with `changes[]`, `testResult`, and `diffScope`, or (b) write an explicit skip receipt with a `reason` — and a silent skip (no receipt field) is explicitly named as a protocol violation.

Given the agent writes a completed receipt after a successful refactor,
When `bin/skills advance` is invoked with the receipt as a JSON-object value,
Then `pipeline-state.json` records the receipt at `tddState.refactorReceipt` with all required fields present.

Given the agent writes a skip receipt,
When `bin/skills advance` is invoked with `status: "skipped"` and a non-empty `reason`,
Then `pipeline-state.json` records the skip receipt and the task is considered complete.

Given a refactor step results in a test failure (`testResult: "fail"`),
When the agent records the receipt,
Then the SKILL.md instructs the agent to revert the refactor, record the `fail` receipt as evidence (not overwrite it), and write a follow-up skip receipt with `reason: "refactor caused test failure — reverted"`.

Given a `/verify-completion` scope-creep check runs on a task that applied a refactor,
When the diff touches files already listed in the DoR contract and the test suite is green,
Then the scope-creep check does not flag structural-only rewrites of those files as scope violations.

Out of scope:
- Automated detection of whether a diff is structural-only (advisory instruction only, not a code check)
- Any changes to Stage 3 design lens (that is ep2-s1)
- Any changes to `/workflow` silent-skip warnings (that is ep2-s3)

Dependencies: ep1-s1 (schema and `advance` JSON-object write must be in place)
NFR: SKILL.md changes must preserve all existing RED and GREEN step behaviour; no existing TDD workflow instruction is removed or weakened.
Complexity: 1
Scope stability: Stable

## Epic 2 — Receipt Readers

Goal: The three skills that consume receipt data are live. `/implementation-review` has a Stage 3 design lens that reads receipts and surfaces cross-task design findings. `/definition-of-done` confirms and records the design health dimension in the health roll-up. `/improve` computes Metrics 1–4 and snapshots the design dimension time series. `/workflow` surfaces silent-skip warnings during active delivery. The design dimension is present in pipeline state for every feature run under the new protocol.
Out of scope:
- The design dimension ever becoming a hard block (advisory only in v0)
- Static-analysis metrics (deferred to Phase 5+)
- The `/refactor` skill for post-DoD merged features (next epic)
- Automated diff parsing or static analysis in Stage 3

Oversight: High
Oversight rationale: Solo operator context; changes touch five skills with existing complex logic; any regression in `/definition-of-done` or `/improve` would silently degrade all feature health reporting.
Complexity: 2
Scope stability: Stable

### ep2-s1 — Stage 3 design lens in `/implementation-review`
Persona: Tech lead / squad lead
Domain: software-engineering

So that cross-task design findings are surfaced before a PR merges (design lens findings per feature ≥1 per feature), I need `/implementation-review` to include a Stage 3 that reads refactor receipts from `pipeline-state.json` and examines the task batch for cross-task duplication, emerging abstractions, and receipt coherence.

Benefit linkage: Design lens findings per feature (Metric 3 — count of distinct findings produced by Stage 3 per feature) — this story is the sole driver of this metric.
Architecture constraints: ADR-011 (artefact-first: SKILL.md behavioural change requires story chain); Platform change policy (SKILL.md changes via PR with tech lead review); PAT-07 (Stage 3 is a distinct exit point in `/implementation-review` — grouped as one story because all Stage 3 instruction text lands at the same exit sequence).

Given an agent or tech lead runs `/implementation-review` on a task batch where at least one task has a `refactorReceipt` in `pipeline-state.json`,
When Stage 3 executes,
Then the review reads the `refactorReceipt` entries for all tasks in the batch and examines: cross-task duplication, emerging abstractions named across receipts, `changes[]` coherence against the actual diff, and `diffScope` patterns.

Given Stage 3 identifies at least one design finding,
When the review artefact is written,
Then the finding is recorded in a Stage 3 section of the artefact with a description, the affected task(s), and a recommended action (advisory — does not block the review from proceeding).

Given Stage 3 finds no design issues,
When the review artefact is written,
Then Stage 3 records "No design findings" explicitly — the stage must run and record its conclusion whether or not findings exist.

Given a task batch where no tasks have any `refactorReceipt` entry (e.g. first feature under the new protocol, or ep1-s2 not yet merged),
When Stage 3 executes,
Then it records "No receipts available for this batch — Stage 3 cannot assess receipt coherence" and proceeds without error.

Out of scope:
- Automated diff parsing or static analysis (Stage 3 is an instruction-level review, not a code tool)
- Any changes to the DoD gate (that is ep2-s2)
- Any changes to `/improve` or `/workflow` (those are ep2-s3)

Dependencies: ep1-s1 (schema must declare `refactorReceipt`); ep1-s2 (receipts must be writable so Stage 3 has data to read)
NFR: Stage 1 and Stage 2 behaviour in `/implementation-review` must be unchanged; Stage 3 is purely additive.
Complexity: 1
Scope stability: Stable

### ep2-s2 — Design health dimension at DoD and `/improve`
Persona: Tech lead / squad lead
Domain: software-engineering

So that the design dimension is present in the health roll-up for every feature run under the new protocol (health model design dimension coverage = 100%), I need `/definition-of-done` to confirm and record the design dimension status, and `/improve` to compute Metrics 1–4 and snapshot the design dimension time series.

Benefit linkage: Health model design dimension coverage (Metric 5 — percentage of features run under the new protocol that have a design dimension status at DoD) — primary driver; also surfaces receipt coverage rate (Metric 1), skipped-without-reason rate (Metric 2), and refactor-caused test failures (Metric 4 — count of test suite failures caused directly by a refactor step) in the `/improve` summary.
Architecture constraints: ADR-003 (schema-first: `designHealth` object must be declared in schema before DoD or `/improve` writes it — covered by ep1-s1); ADR-011 (artefact-first: SKILL.md behavioural changes require story chain); Platform change policy.

Given a feature has completed all stories and `/definition-of-done` is running,
When the DoD skill reads `pipeline-state.json` for the feature,
Then it computes `designHealth` from the feature's task-level `refactorReceipt` entries using the v0 formula: `receiptCoverageRate`, `silentSkipRate`, `refactorCausedFailures`, `designLensFindingsCount`, and `status` (`green | amber | not-computed`).

Given the computed `designHealth.status` is `green` or `amber`,
When DoD writes the artefact,
Then the design dimension is recorded in the DoD artefact with all five fields and the feature's `pipeline-state.json` is updated with the `designHealth` object via `bin/skills advance`.

Given the computed `designHealth.status` is `not-computed` (no tasks have any `refactorReceipt` field),
When DoD writes the artefact,
Then DoD records "Design dimension: not-computed — no receipts found" as a DoD finding (acknowledged, not a hard block), and `pipeline-state.json` is updated accordingly.

Given `/improve` runs on a feature that has a `designHealth` object in `pipeline-state.json`,
When the improve skill computes its rolling summary,
Then it includes Metrics 1–4 values for the feature and appends a `designHealth` snapshot entry to the time series in the improve artefact.

Given `/improve` runs on a feature with no `designHealth` object (pre-protocol feature),
When the improve skill computes its rolling summary,
Then it skips the design dimension for that feature and notes "Design dimension not available for pre-protocol features."

Out of scope:
- The design dimension ever becoming a hard block (advisory only in v0)
- `/workflow` silent-skip warnings (that is ep2-s3)
- Static-analysis metrics (deferred to Phase 5+)

Dependencies: ep1-s1 (schema must declare `designHealth`); ep1-s2 (receipts must be writable)
NFR: All existing DoD gate checks and `/improve` reporting are unchanged; design dimension is purely additive.
Complexity: 2
Scope stability: Stable

### ep2-s3 — `/workflow` silent-skip warning signal
Persona: Platform maintainer
Domain: software-engineering

So that silent skips (tasks with `tddState` but no `refactorReceipt`) are visible during active delivery and not discovered only at DoD, I need `/workflow` to surface a warning when it detects tasks in the active feature that have a `tddState` record but no `refactorReceipt` entry.

Benefit linkage: Skipped-without-reason rate (Metric 2 — percentage of tasks with neither a receipt nor an explicit skip reason) — `/workflow` is the live signal during delivery; DoD and `/improve` are the retrospective signals.
Architecture constraints: ADR-011 (artefact-first: SKILL.md behavioural change requires story chain); Platform change policy; PAT-07 (the silent-skip check is a single addition at `/workflow`'s health-check exit point — grouped as one story).

Given `/workflow` is run on a feature where at least one task has a `tddState` record in `pipeline-state.json` but no `refactorReceipt` field,
When `/workflow` produces its health summary,
Then it surfaces a warning: "⚠️ Silent skip detected: [task-id] has a tddState record but no refactorReceipt. Add a receipt or an explicit skip reason via `bin/skills advance`."

Given `/workflow` is run on a feature where all tasks with `tddState` also have a `refactorReceipt` (either completed or skip),
When `/workflow` produces its health summary,
Then no silent-skip warning appears in the output.

Given `/workflow` is run on a feature with no tasks that have any `tddState` record (e.g. a feature not yet in the inner loop),
When `/workflow` produces its health summary,
Then no silent-skip warning appears and no error is raised.

Out of scope:
- Automated enforcement or blocking of task completion on silent skips (warning only)
- Any changes to `/improve` or DoD (those are ep2-s2)

Dependencies: ep1-s1 (schema must declare `refactorReceipt` so its absence is detectable); ep1-s2 (protocol establishes what a silent skip means)
NFR: All existing `/workflow` health checks and pipeline state reporting are unchanged; the silent-skip warning is purely additive.
Complexity: 1
Scope stability: Stable