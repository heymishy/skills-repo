# Implementation Plan: gav-s1 — Extend gate-advance structural validation to all 7 canonical gate names

**Story:** artefacts/2026-07-18-gate-advance-validation/stories/gav-s1.md
**DoR contract:** artefacts/2026-07-18-gate-advance-validation/dor/gav-s1-dor-contract.md
**Date:** 2026-07-29

---

## Tasks

**Task 1 — Extend `SUPPORTED_GATES` and add the `dor-signed-off` alias (AC1)**
- File: `src/enforcement/cli-outer-loop.js`
- `SUPPORTED_GATES` becomes 8 entries: `definition-of-ready` (legacy alias, unchanged), `dor-signed-off` (new canonical name), `discovery-approved`, `benefit-metric-active`, `definition-complete`, `test-plan-complete`, `branch-complete`, `definition-of-done`.
- Both `definition-of-ready` and `dor-signed-off` route to the exact same existing H1-H9 code path (a single early `if` normalizing the gate name before the existing logic runs).
- New EXIT constants for the 6 new gate types, non-colliding with existing 0-8: `DISCOVERY: 9, BENEFIT_METRIC: 10, DEFINITION_COMPLETE: 11, TEST_PLAN_COMPLETE: 12, BRANCH_COMPLETE: 13, DOD: 14`.

**Task 2 — `validateDiscoveryApproved()` (AC2)**
- Reads the artefact (discovery.md) directly.
- Checks 5 required `## ` sections are present with non-blank bodies: `Problem Statement`, `Who It Affects`, `Why Now`, `MVP Scope`, `Out of Scope`.
- Checks `## Approved By` section is present, non-blank, and not a placeholder (`[FILL IN]`, `TBD`, or the literal template placeholder `[Name — Role — Date]`).

**Task 3 — `validateBenefitMetricActive()` (AC3)**
- Reads the artefact (benefit-metric.md) directly.
- Finds the `## Tier 1: Product Metrics` section, then every `### Metric N:` subsection within it.
- Passes if **at least one** metric subsection has all 4 fields (`What we measure`, `Baseline`, `Target`, `Measurement method`) non-blank and non-placeholder — not "all metrics," matching the DoR contract's Assumptions.

**Task 4 — `validateDefinitionComplete()` (AC4)**
- Reads the artefact (story.md) directly.
- Checks `## Acceptance Criteria` has ≥3 `**AC[n]:**` markers (count only, no GWT check — that's H2's job for the DoR gate specifically, not this gate).
- Checks `## Out of Scope` is present and non-blank (reuse the existing H4 body-extraction helper).
- Checks a Complexity Rating value of 1, 2, or 3 is present (reuse existing H6 regex).

**Task 5 — `validateTestPlanComplete()` (AC5)**
- Reads the artefact (test-plan.md) directly.
- Extracts its own `**Story reference:**` header, resolves and reads that story file.
- Extracts every `**AC[n]:**` marker from the story, checks each appears somewhere in the test-plan content (generalizes the existing H3/H8 coverage-check logic to run standalone, without requiring a DoR wrapper).

**Task 6 — `validateBranchComplete()` (AC6)**
- Reads the artefact path as a JSON file (not Markdown) — a story-scoped state extract containing at minimum `prUrl` and `verifyStatus` fields (see decisions.md design-clarification entry: `validate()`'s single-path signature has no separate feature/story parameter, so for this gate the artefact IS the minimal per-story JSON snapshot needed, not the full multi-feature `pipeline-state.json`).
- Passes if `prUrl` is non-empty AND `verifyStatus === "passed"`.

**Task 7 — `validateDefinitionOfDone()` (AC7)**
- Reads the artefact (dod.md) directly.
- Parses the `## AC Coverage` Markdown table's rows (`| AC[n] | <status> | ... | ... | <deviation> |`).
- Passes only if every row's status is `✅` (regardless of deviation text), or `⚠️` with a non-blank, non-"None" deviation cell. Any `❌` row, or a blank/missing status, fails — naming the specific AC row in the error message.

**Task 8 — Dispatch wiring**
- `validate()`'s gate check becomes a switch/dispatch: normalize `definition-of-ready` → `dor-signed-off`, then either run the existing H1-H9 body (unchanged) for `dor-signed-off`, or call the matching new function for the other 6 gate names.
- `UNSUPPORTED_GATE` error message lists all 8 accepted strings.

**Task 9 — Test file**
- New file `tests/check-gav-s1-gate-advance-validation.js`, following `check-cli-outer-loop.js`'s fixture convention (`fs.mkdtempSync(path.join(ROOT, '.tmp-test-gav-s1-'))`, cleaned up at the end).
- Implements all 25 unit tests (U1-U25) and 4 integration tests (IT1-IT4) from the test plan.
- IT2-IT4 exercise `gateAdvance()` end-to-end (state written only on success), reusing `src/enforcement/cli-advance.js`'s existing atomic-write pipeline-state fixture pattern.

**Task 10 — Verification**
- Run the new test file standalone; run the full suite once to confirm the established 37-pre-existing-failure baseline is unaffected.
- Re-run `tests/check-cdg7-gate-advance.js` and `tests/check-cli-outer-loop.js` to confirm no regression on the existing, unchanged `definition-of-ready` path.

---

## Design clarification (logged per DoR contract's W4 instruction)

The DoR contract's Assumptions section states AC6's artefact path is "repurposed to mean 'the feature-slug context to look up'" but `validate(artefactPath, gateName, repoRoot)`'s signature has no separate feature/story parameter — only a single path. Resolved as: for `branch-complete`, `artefactPath` points to a minimal JSON file containing exactly the fields this gate checks (`prUrl`, `verifyStatus`) for one story — not the full `.github/pipeline-state.json` (which `validate()` has no story-identifying parameter to index into). This is the simplest design consistent with the fixed function signature and matches the test plan's own fixture wording ("Temp pipeline-state.json fixture with the story's prUrl set"). Logged as a decisions.md entry alongside this plan.
