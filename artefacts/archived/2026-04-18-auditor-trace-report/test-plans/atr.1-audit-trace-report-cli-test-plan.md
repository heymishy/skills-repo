# Test Plan: atr.1 — Generate standalone audit trace report from CLI

**Story reference:** artefacts/2026-04-18-auditor-trace-report/stories/atr.1-audit-trace-report-cli.md
**Review status:** PASS (run 1, 2026-04-18)
**Test framework:** Node.js assert (no external deps)
**Test file:** tests/check-trace-report.js

---

## Test Data Strategy

**Source:** Fixtures — static JSON files committed to the test repo
**Fixture file:** tests/fixtures/trace-report-test-fixture.json
**Sensitivity:** None — synthetic pipeline-state data with no real secrets or identifiers
**Approach:** Tests create a temp directory, write fixture JSON files and dummy artefact files, run the report function, then clean up

---

## AC Coverage Table

| AC | Test IDs | Coverage |
|----|----------|----------|
| AC1 (active feature report) | T1, T2 | Unit |
| AC2 (archived feature report) | T3, T4 | Unit |
| AC3 (gate evidence correlation) | T5, T6 | Unit |
| AC4 (missing artefact files) | T7 | Unit |
| AC5 (unknown feature slug) | T8 | Unit |
| AC6 (no arguments / usage) | T9 | Unit |
| AC7 (stage-aware chain links) | T10, T11 | Unit |

---

## Unit Tests

### T1: Active feature produces Markdown report with story sections
**AC:** AC1
**Precondition:** Fixture pipeline-state.json has a feature at `definition-of-done` stage with 2 stories, corresponding artefact files exist on disk
**Action:** Call `generateReport({ feature: 'test-feature', rootDir: tmpDir })`
**Expected:** Returns a string containing: feature name header, stage, health, and one section per story with chain link rows (discovery ✅, benefit-metric ✅, story ✅, test-plan ✅, DoR ✅, DoD ✅)

### T2: Report includes feature-level metadata
**AC:** AC1
**Precondition:** Same fixture as T1
**Action:** Call `generateReport({ feature: 'test-feature', rootDir: tmpDir })`
**Expected:** Output contains feature slug, stage, health status, and story count

### T3: Archived feature found and reported
**AC:** AC2
**Precondition:** Feature exists in pipeline-state-archive.json but NOT in pipeline-state.json, artefact files exist
**Action:** Call `generateReport({ feature: 'archived-feature', rootDir: tmpDir })`
**Expected:** Returns report with same format as T1, includes "[archived]" indicator

### T4: Archive fallback — checks archive when active state misses
**AC:** AC2
**Precondition:** pipeline-state.json has no entry for the feature, pipeline-state-archive.json does
**Action:** Call `generateReport({ feature: 'archived-feature', rootDir: tmpDir })`
**Expected:** Returns valid Markdown report (not an error)

### T5: Gate evidence section populated when trace JSONL matches
**AC:** AC3
**Precondition:** Story has prUrl, workspace/traces/ contains a JSONL file with a `completed` entry whose commitSha matches
**Action:** Call `generateReport({ feature: 'test-feature', rootDir: tmpDir })`
**Expected:** Report contains "Gate Evidence" section with verdict, traceHash, and checks summary

### T6: Gate evidence shows "not found" when no matching trace
**AC:** AC3
**Precondition:** Story has prUrl but no JSONL file in workspace/traces/ matches the commit SHA
**Action:** Call `generateReport({ feature: 'test-feature', rootDir: tmpDir })`
**Expected:** Report contains "Gate Evidence: not found" or equivalent

### T7: Missing artefact files marked as MISSING with path
**AC:** AC4
**Precondition:** pipeline-state.json references artefact paths that do not exist on disk
**Action:** Call `generateReport({ feature: 'test-feature', rootDir: tmpDir })`
**Expected:** Chain link rows show `MISSING` status and display the expected file path

### T8: Unknown feature slug exits with error and lists available slugs
**AC:** AC5
**Precondition:** Feature slug 'nonexistent' does not exist in active or archive state
**Action:** Call `generateReport({ feature: 'nonexistent', rootDir: tmpDir })`
**Expected:** Throws or returns error object containing the slug name and an array of available feature slugs

### T9: No arguments prints usage and exits non-zero
**AC:** AC6
**Precondition:** Script run with no --feature flag
**Action:** Call the CLI entry point with no args (or call `generateReport({})`)
**Expected:** Returns/throws with usage message containing `--feature`

### T10: Story at early stage shows links as "not yet reached"
**AC:** AC7
**Precondition:** Story at `definition` stage — no test-plan, DoR, or DoD expected
**Action:** Call `generateReport({ feature: 'test-feature', rootDir: tmpDir })`
**Expected:** Chain link rows for test-plan, DoR, DoD show `—` or `not yet reached`, NOT `MISSING`

### T11: Story at DoR stage shows DoD as "not yet reached"
**AC:** AC7
**Precondition:** Story at `definition-of-ready` stage — DoD not expected
**Action:** Call `generateReport({ feature: 'test-feature', rootDir: tmpDir })`
**Expected:** DoD chain link shows `not yet reached`

---

## NFR Tests

### NFR1: Report generation completes in under 5 seconds
**NFR:** Performance
**Action:** Time the `generateReport` call for a feature with 20 stories in fixture
**Expected:** Execution time < 5000ms

---

## Gap Table

| AC | Gap | Handling | Risk |
|----|-----|----------|------|
| — | None identified | — | — |

---

**Next step:** /definition-of-ready
