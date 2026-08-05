## Test Plan: Bootstrap a minimal fresh repo with one init command

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s1-minimal-fresh-repo-init.md
**Epic reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/epics/rb-e1-no-fork-bootstrap-core.md
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-05

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | init via npx populates target dir with platform-init.js's output plus context.yml/pipeline-state.json | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | PLATFORM_ROOT resolves to bundled package files, not a local checkout env var | 2 tests | 1 test | — | — | — | 🟢 |
| AC3 | Re-running init against an existing bootstrap skips existing files, reports skips | 2 tests | — | — | — | — | 🟢 |
| AC4 | /branch-setup runs successfully using only bootstrapped files | — | — | — | 1 scenario | External-dependency | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| Running the real `/branch-setup` skill end-to-end | AC4 | External-dependency | `/branch-setup` invokes an AI agent turn, not a pure function — cannot be driven by this repo's own test runner (`node scripts/run-all-tests.js`) without a live model call | Manual scenario — see verification script |

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Empty temp directory as init target | Synthetic (`fs.mkdtempSync`) | None | Created and torn down per test |
| AC2 | A second temp directory standing in for "package's own bundled files" vs. a real repo checkout | Synthetic | None | Two fixture directories with distinguishable marker files |
| AC3 | A temp directory pre-populated with a prior bootstrap's output | Synthetic | None | Built by running the init command once, then reusing its output as the AC3 test's precondition |
| AC4 | N/A — manual scenario | — | — | — |

### PCI / sensitivity constraints

None.

### Gaps

None — all test data is self-contained and generated in test setup/teardown.

---

## Unit Tests

### resolvesPlatformRootToBundledFiles_whenRunViaNpx

- **Verifies:** AC2
- **Precondition:** CLI entry point invoked with no `PLATFORM_ROOT` env var set and no local platform-repo checkout on the test machine's path
- **Action:** Call the CLI's root-resolution function directly
- **Expected result:** Returns the path to the package's own bundled files (a fixture directory standing in for the published package's bundled copy), not `process.cwd()`-relative or env-var-derived
- **Edge case:** No

### rejectsWhenTargetDirIsAFileNotADirectory

- **Verifies:** AC1
- **Precondition:** Target path exists as a regular file, not a directory
- **Action:** Run the init command against that path
- **Expected result:** Exits non-zero with an error naming the conflict; does not attempt to write into the file
- **Edge case:** Yes — malformed target path

### seedsContextYmlAndPipelineStateJson_onFreshInit

- **Verifies:** AC1
- **Precondition:** Empty target directory
- **Action:** Run the init command
- **Expected result:** `context.yml` and `.github/pipeline-state.json` exist in the target directory with valid, parseable content matching the seed templates
- **Edge case:** No

### skipsExistingFilesOnSecondRun_reportsWhichWereSkipped

- **Verifies:** AC3
- **Precondition:** Target directory already contains a completed bootstrap from a prior run
- **Action:** Run the init command a second time against the same directory
- **Expected result:** Existing files are untouched (content unchanged, verified by checksum before/after); stdout lists every skipped file by relative path
- **Edge case:** No

### secondRunDoesNotReferenceUndefinedUpdateMechanism

- **Verifies:** AC3
- **Precondition:** Same as above
- **Action:** Run the init command a second time
- **Expected result:** Output message references `platform:fetch` by name (the real, existing mechanism) — does not use vague language like "a future update mechanism"
- **Edge case:** No

---

## Integration Tests

### initCommand_wrapsPlatformInitJs_producesIdenticalOutputToDirectInvocation

- **Verifies:** AC1, AC2
- **Components involved:** CLI entry point, `scripts/platform-init.js` (existing), bundled package files
- **Precondition:** Two empty target directories
- **Action:** Run `platform-init.js` directly against one target (with `PLATFORM_ROOT` set to a real checkout fixture), and the new CLI wrapper against the other target (with no `PLATFORM_ROOT` set, resolving to bundled files instead)
- **Expected result:** Both target directories contain the same relative file set with identical content (the CLI wrapper doesn't diverge from `platform-init.js`'s existing behaviour, just its root-resolution)

### rerunInitAfterFirstBootstrap_fileSystemStateUnchanged

- **Verifies:** AC3
- **Components involved:** CLI entry point, target directory file system state
- **Precondition:** Target directory bootstrapped once already
- **Action:** Run init again
- **Expected result:** `fs.statSync` mtimes on all pre-existing files are unchanged after the second run (proves no rewrite occurred, not just that content matches)

---

## NFR Tests

### initCompletesUnder30Seconds

- **NFR addressed:** Performance
- **Measurement method:** Wall-clock timing around the init command's execution, excluding any `npm install` step in the target repo
- **Pass threshold:** < 30 seconds
- **Tool:** `node scripts/run-all-tests.js`'s own timing wrapper (or `console.time`/`console.timeEnd` in the test)

### noCredentialWrittenToAnyGeneratedFile

- **NFR addressed:** Security
- **Measurement method:** After init completes, grep every generated file for common credential-shaped patterns (bearer tokens, `ghp_`-prefixed strings, `.env`-style `KEY=value` secret assignments) — assert zero matches
- **Pass threshold:** Zero matches
- **Tool:** Node script string-search assertion

---

## Out of Scope for This Test Plan

- Testing `platform-init.js`'s own existing copy/skip logic in isolation — that logic already has its own tests from stories i1.2/i1.3; this plan only tests the new CLI wrapper's root-resolution and the new `context.yml`/`pipeline-state.json` seeding on top of it.
- Testing the npm publish/release pipeline itself (package name registration, CI publish workflow) — covered by DoR/DoD process checks, not a unit/integration test concern.
- Testing `/branch-setup`'s own internal behaviour — only that it can be invoked successfully against the bootstrapped output (AC4, manual).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC4 (real `/branch-setup` run) | Requires a live AI agent turn, not drivable by `node scripts/run-all-tests.js` | Manual verification scenario in the AC verification script; also naturally exercised the first time a real user actually uses the shipped command |
