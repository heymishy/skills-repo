## Test Plan: Add `--collect` flag to `trace-report.js` — CI-platform-agnostic artefact assembly

**Story reference:** artefacts/2026-04-23-ci-artefact-attachment/stories/caa.1-collect-flag.md
**Epic reference:** artefacts/2026-04-23-ci-artefact-attachment/epics/e1-ci-artefact-attachment.md
**Test plan author:** Copilot / /test-plan skill
**Date:** 2026-04-23

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | --collect creates staging dir with seq-numbered artefact files | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | manifest.json written with featureSlug, collectedAt, fileCount, files[] | 2 tests | 1 test | — | — | — | 🟢 |
| AC3 | Auto-resolves active feature when --feature flag omitted | 2 tests | — | — | — | — | 🟢 |
| AC4 | Exits code 1 + stderr message when no feature resolved | 2 tests | — | — | — | — | 🟢 |
| AC5 | Idempotent — clears and rebuilds staging dir on second run | 1 test | 1 test | — | — | — | 🟢 |
| AC6 | Zero new npm dependencies required for --collect path | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — tests generate temporary fixture directories with minimal `pipeline-state.json` and `artefacts/[slug]/` structure in test setup; cleaned up in teardown.
**PCI/sensitivity in scope:** No
**Availability:** Available now — self-contained setup/teardown
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | pipeline-state.json with 1 active feature; artefacts/[slug]/ with ≥3 .md files | Synthetic temp dir | None | |
| AC2 | Same as AC1 | Synthetic temp dir | None | manifest.json fields verified by JSON.parse |
| AC3 | pipeline-state.json with exactly 1 active feature | Synthetic temp dir | None | Stage must not be "archived" |
| AC4 | pipeline-state.json with 0 active features; and separately, unknown --feature value | Synthetic temp dir | None | Two sub-cases |
| AC5 | Staging dir already containing a stale file from a prior run | Synthetic temp dir | None | Pre-create a stale file before second run |
| AC6 | A directory where node_modules does not exist | Temp dir or require() inspection | None | Check no new require() calls outside built-ins |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

All tests written to FAIL before implementation. Test file: `tests/check-caa1-collect.js`.

### collectArtefacts — produces sequentially numbered files in staging dir

- **Verifies:** AC1
- **Precondition:** Temp repo dir with `pipeline-state.json` containing one feature `slug: test-feature-caa1`; `artefacts/test-feature-caa1/` contains `discovery.md`, `benefit-metric.md`, `stories/s1.md` (3 files)
- **Action:** Call the collect function (or spawn `node scripts/trace-report.js --collect --feature=test-feature-caa1` with cwd = temp dir)
- **Expected result:** `.ci-artefact-staging/test-feature-caa1/` exists; files `01-discovery.md`, `02-benefit-metric.md`, `03-s1.md` (or similar two-digit-prefixed names) are present; original content is preserved
- **Edge case:** No

### collectArtefacts — does not include pipeline-state.json or context.yml

- **Verifies:** AC1, Security NFR
- **Precondition:** Same temp dir as above
- **Action:** Run collect on the temp dir
- **Expected result:** `.ci-artefact-staging/test-feature-caa1/` does NOT contain `pipeline-state.json` or `context.yml`
- **Edge case:** Yes — security boundary check

### buildManifest — writes required fields to manifest.json

- **Verifies:** AC2
- **Precondition:** Collect has run on a temp dir with 3 artefact files
- **Action:** Read `.ci-artefact-staging/test-feature-caa1/manifest.json`; parse as JSON
- **Expected result:** Object contains `featureSlug: "test-feature-caa1"`, `collectedAt` (valid ISO 8601 string matching `/^\d{4}-\d{2}-\d{2}T/`), `fileCount: 3`, `files: [{filename, sourcePath}, …]` with 3 entries each having non-empty `filename` and `sourcePath`
- **Edge case:** No

### buildManifest — fileCount matches actual file count

- **Verifies:** AC2
- **Precondition:** Collect has run; staging dir contains N files (not counting manifest.json itself)
- **Action:** Parse manifest.json; count actual files in staging dir excluding manifest.json
- **Expected result:** `manifest.fileCount === actual file count === manifest.files.length`
- **Edge case:** No

### resolveActiveFeature — returns slug when exactly one non-archived feature exists

- **Verifies:** AC3
- **Precondition:** `pipeline-state.json` has two features: one with `stage: "archived"`, one with `stage: "review"` (active)
- **Action:** Call the feature-resolution function with no explicit feature argument
- **Expected result:** Returns slug of the `stage: "review"` feature
- **Edge case:** No

### resolveActiveFeature — throws/returns null when no active feature

- **Verifies:** AC4
- **Precondition:** `pipeline-state.json` has one feature with `stage: "archived"` only
- **Action:** Call feature-resolution with no explicit feature argument
- **Expected result:** Function returns null or throws an error with message matching `"No feature resolved"`; calling code then exits with code 1
- **Edge case:** No

### collectArtefacts — exits with code 1 and stderr message on unknown feature slug

- **Verifies:** AC4
- **Precondition:** `pipeline-state.json` contains no feature with slug `unknown-slug`
- **Action:** Spawn `node scripts/trace-report.js --collect --feature=unknown-slug` with cwd = temp dir; capture exit code and stderr
- **Expected result:** Exit code 1; stderr contains `"[trace-report --collect] No feature resolved"` and `"--feature=<slug>"` or `"pipeline-state.json"`
- **Edge case:** No

### collectArtefacts — idempotent: clears stale files on second run

- **Verifies:** AC5
- **Precondition:** Staging dir `.ci-artefact-staging/test-feature-caa1/` already exists and contains a stale file `99-stale.md` not present in the artefacts tree
- **Action:** Run collect again
- **Expected result:** Staging dir is rebuilt; `99-stale.md` is not present; only current artefact files and `manifest.json` are in the dir
- **Edge case:** No

### collectArtefacts — requires no npm packages beyond Node.js built-ins

- **Verifies:** AC6
- **Precondition:** Read the source of the `--collect` code path in `scripts/trace-report.js`
- **Action:** Inspect all `require()` calls in the collect code path; check each against `['fs', 'path', 'crypto', 'os', 'child_process', 'util']` (Node built-ins)
- **Expected result:** Every `require()` in the collect path uses a Node built-in module name only — no entries from `package.json` `dependencies` or `devDependencies`
- **Edge case:** No

---

## Integration Tests

### end-to-end collect run produces correct staging dir structure

- **Verifies:** AC1, AC2
- **Components involved:** `scripts/trace-report.js` (CLI entry), file-system, manifest builder
- **Precondition:** Temp repo with `pipeline-state.json` (1 active feature), `artefacts/test-feature-caa1/` with `discovery.md`, `stories/caa.1.md`, `test-plans/caa.1-test-plan.md` (3 files across sub-dirs)
- **Action:** `child_process.spawnSync('node', ['scripts/trace-report.js', '--collect', '--feature=test-feature-caa1'], { cwd: tempDir })`
- **Expected result:** Exit code 0; staging dir contains 3 seq-numbered `.md` files; `manifest.json` parses with `fileCount: 3` and `files.length === 3`

### auto-resolve integration: no --feature flag picks up single active feature

- **Verifies:** AC3
- **Components involved:** `scripts/trace-report.js`, `pipeline-state.json` reader
- **Precondition:** Temp repo with `pipeline-state.json` containing exactly one active feature
- **Action:** `spawnSync('node', ['scripts/trace-report.js', '--collect'], { cwd: tempDir })`
- **Expected result:** Exit code 0; staging dir created under the resolved slug

### idempotency integration: second run removes stale file

- **Verifies:** AC5
- **Components involved:** `scripts/trace-report.js`, filesystem
- **Precondition:** Run collect once; manually add `stale.md` to the staging dir
- **Action:** Run collect again
- **Expected result:** `stale.md` no longer present in staging dir; manifest reflects current artefact count

---

## NFR Tests

### collect completes within 2 seconds for 30-file feature

- **NFR addressed:** Performance
- **Measurement method:** `Date.now()` before and after `spawnSync` of the collect command with a synthetic feature containing 30 `.md` files in its artefacts tree
- **Pass threshold:** Elapsed time < 2000 ms
- **Tool:** Node.js built-in timing in `tests/check-caa1-collect.js`

### staging dir excludes pipeline-state.json and context.yml

- **NFR addressed:** Security
- **Measurement method:** List all files in staging dir after collect; assert neither `pipeline-state.json` nor `context.yml` (or any file outside `artefacts/[slug]/`) appears
- **Pass threshold:** Zero forbidden files present
- **Tool:** Node.js `fs.readdirSync` in test

### zero new npm dependencies in package.json after implementation

- **NFR addressed:** MM2 zero-dep constraint
- **Measurement method:** Read `package.json`; count entries in `dependencies` and `devDependencies` before and after; confirm no new entries whose origin traces to this story
- **Pass threshold:** Diff is zero new entries
- **Tool:** `JSON.parse(fs.readFileSync('package.json'))` — checked in test that no new deps are added

---

## Out of Scope for This Test Plan

- Upload to any CI platform (caa.2 scope)
- Content validation or trace-chain correctness of collected files (existing trace-report tests)
- Multi-feature collection (out of MVP scope)

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
