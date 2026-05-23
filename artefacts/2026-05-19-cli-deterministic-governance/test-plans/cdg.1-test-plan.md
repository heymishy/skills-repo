# Test Plan: `skills validate` CLI — entry point, exit code framework, and governance check

**Story reference:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.1.md
**Epic reference:** artefacts/2026-05-19-cli-deterministic-governance/epics/cdg-phase1-validate-cli.md
**Test plan author:** Copilot (GitHub Copilot — Claude Sonnet 4.6)
**Date:** 2026-05-23

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | exit 0 + "validate OK" message on clean artefact | 3 tests | — | — | — | — | 🟢 |
| AC2 | exit 8 + UNSUPPORTED_GATE + supported gate list | 3 tests | — | — | — | — | 🟢 |
| AC3 | exit non-zero + usage string when < 2 args | — | 4 tests | — | — | — | 🟢 |
| AC4 | exit 1-7 + H1 FAIL message on missing story file | 3 tests | — | — | — | — | 🟢 |
| AC5 | governance check: file existence + validate export | 3 tests | — | — | — | — | 🟢 |
| AC6 | exit 8 + no raw path on path traversal attempt | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All ACs are automatable with synthetic test data. No CSS-layout-dependent or browser-rendering-dependent behaviour.

---

## Test Data Strategy

**Source:** Synthetic — all test data is generated in-memory or written to `os.tmpdir()` during test setup and cleaned up after. No external services, databases, or production artefacts are required.

**PCI/sensitivity in scope:** No

**Availability:** Available now — no dependency on external systems

**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A small markdown file with no story slug references (well-formed artefact) | Synthetic — written to tmp dir in test | None | Use a minimal markdown string: `# Discovery\n\nNo story references.` |
| AC2 | Any valid file path + a non-existent gate name string | Synthetic — same tmp file as AC1; gate = `'unknown-gate'` | None | |
| AC3 | Zero args and one arg invocation of `node bin/skills validate` | CLI spawn (spawnSync) — no file needed | None | Uses the actual bin/skills entry point |
| AC4 | A markdown file that references a story slug whose `.md` does not exist on disk | Synthetic — file written to tmp dir; slug `nonexistent-story-cdg1-test` chosen to never exist | None | File content: `## Story slug\n\nRef: artefacts/2026-05-19-cli-deterministic-governance/stories/nonexistent-story-cdg1-test.md` |
| AC5 | Existence of `bin/skills`, `src/enforcement/cli-outer-loop.js`, and the `validate` export | Live filesystem (reads from project root) | None | These files do not exist pre-implementation — tests correctly FAIL before coding |
| AC6 | A path string that resolves outside the repository root: `'../../etc/passwd'` | Constructed string — no real file read | None | Test asserts the resolved absolute path does not appear in stderr |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Test Files

Two test files are produced by this test plan:

| File | Added to `npm test` | Purpose |
|------|---------------------|---------|
| `tests/check-cli-outer-loop.js` | Yes — append to `package.json` test chain | Unit + integration + NFR tests (21 tests) |
| `tests/check-cli-governance.js` | Yes — append to `package.json` test chain | Governance structure check — AC5 (3 tests) |

**Note on test failure baseline:** Both files must fail (`process.exit(1)`) before `bin/skills` and `src/enforcement/cli-outer-loop.js` are implemented. Tests T1–T7 and G1 fail because the target files do not exist. Integration tests IT1–IT2 fail because `bin/skills` cannot be found. NFR tests fail for the same reason. This is the expected TDD red state.

---

## Unit Tests

### T1 — bin/skills file exists on disk

- **Verifies:** AC5
- **Test file:** `tests/check-cli-outer-loop.js`
- **Precondition:** Repository root is known (`path.join(__dirname, '..')`)
- **Action:** `fs.existsSync(path.join(ROOT, 'bin', 'skills'))`
- **Expected result:** `true`
- **Edge case:** No — straightforward file existence check
- **Fails before implementation:** Yes — file does not exist

---

### T2 — src/enforcement/cli-outer-loop.js file exists on disk

- **Verifies:** AC5
- **Test file:** `tests/check-cli-outer-loop.js`
- **Precondition:** Repository root is known
- **Action:** `fs.existsSync(path.join(ROOT, 'src', 'enforcement', 'cli-outer-loop.js'))`
- **Expected result:** `true`
- **Edge case:** No
- **Fails before implementation:** Yes — file does not exist

---

### T3 — cli-outer-loop.js exports a function named `validate`

- **Verifies:** AC5
- **Test file:** `tests/check-cli-outer-loop.js`
- **Precondition:** `src/enforcement/cli-outer-loop.js` exists (T2 passes)
- **Action:** `require('../src/enforcement/cli-outer-loop')` — inspect exported keys
- **Expected result:** `typeof mod.validate === 'function'`
- **Edge case:** No
- **Fails before implementation:** Yes — file does not exist; require throws

---

### T4a — validate returns exitCode 0 for a clean artefact

- **Verifies:** AC1
- **Test file:** `tests/check-cli-outer-loop.js`
- **Precondition:** A synthetic artefact file is written to `os.tmpdir()` containing valid markdown with no story slug references. The `validate` function is loaded from `cli-outer-loop.js`.
- **Action:** `const result = mod.validate(tmpFilePath, 'definition-of-ready', ROOT)`
- **Expected result:** `result.exitCode === 0`
- **Edge case:** No
- **Fails before implementation:** Yes — module does not exist

---

### T4b — validate stdout contains "validate OK" and gate name for clean artefact

- **Verifies:** AC1
- **Test file:** `tests/check-cli-outer-loop.js`
- **Precondition:** Same as T4a
- **Action:** Inspect `result.stdout`
- **Expected result:** `result.stdout` contains `'validate OK'` and `'definition-of-ready'`
- **Edge case:** No
- **Fails before implementation:** Yes — module does not exist

---

### T4c — validate stdout contains "0 violations found" for clean artefact

- **Verifies:** AC1
- **Test file:** `tests/check-cli-outer-loop.js`
- **Precondition:** Same as T4a
- **Action:** Inspect `result.stdout`
- **Expected result:** `result.stdout` contains `'0 violations'`
- **Edge case:** No
- **Fails before implementation:** Yes — module does not exist

---

### T5a — validate returns exitCode 8 for unsupported gate name

- **Verifies:** AC2
- **Test file:** `tests/check-cli-outer-loop.js`
- **Precondition:** Synthetic artefact file exists in tmp dir. The module is loaded.
- **Action:** `const result = mod.validate(tmpFilePath, 'unknown-gate', ROOT)`
- **Expected result:** `result.exitCode === 8`
- **Edge case:** No
- **Fails before implementation:** Yes — module does not exist

---

### T5b — validate stderr contains UNSUPPORTED_GATE for unknown gate name

- **Verifies:** AC2
- **Test file:** `tests/check-cli-outer-loop.js`
- **Precondition:** Same as T5a
- **Action:** Inspect `result.stderr`
- **Expected result:** `result.stderr` contains `'UNSUPPORTED_GATE'`
- **Edge case:** No
- **Fails before implementation:** Yes — module does not exist

---

### T5c — validate stderr lists supported gates including "definition-of-ready"

- **Verifies:** AC2
- **Test file:** `tests/check-cli-outer-loop.js`
- **Precondition:** Same as T5a
- **Action:** Inspect `result.stderr`
- **Expected result:** `result.stderr` contains `'definition-of-ready'`
- **Edge case:** No
- **Fails before implementation:** Yes — module does not exist

---

### T6a — validate returns exitCode in range 1-7 for H1 violation (missing story file)

- **Verifies:** AC4
- **Test file:** `tests/check-cli-outer-loop.js`
- **Precondition:** A synthetic artefact file is written to `os.tmpdir()` with content that references story slug `nonexistent-story-cdg1-test`. The referenced story file `artefacts/2026-05-19-cli-deterministic-governance/stories/nonexistent-story-cdg1-test.md` does not exist in the repository.
- **Action:** `const result = mod.validate(tmpFilePath, 'definition-of-ready', ROOT)`
- **Expected result:** `result.exitCode >= 1 && result.exitCode <= 7`
- **Edge case:** Yes — exact exit code within the range is implementation-defined in cdg.1 (H1 maps to exit code 1 by convention)
- **Fails before implementation:** Yes — module does not exist

---

### T6b — validate stderr contains "H1 FAIL" for missing story file

- **Verifies:** AC4
- **Test file:** `tests/check-cli-outer-loop.js`
- **Precondition:** Same as T6a
- **Action:** Inspect `result.stderr`
- **Expected result:** `result.stderr` contains `'H1 FAIL'`
- **Edge case:** No
- **Fails before implementation:** Yes — module does not exist

---

### T6c — validate stderr contains the missing story path for H1 FAIL

- **Verifies:** AC4
- **Test file:** `tests/check-cli-outer-loop.js`
- **Precondition:** Same as T6a
- **Action:** Inspect `result.stderr`
- **Expected result:** `result.stderr` contains `'nonexistent-story-cdg1-test'`
- **Edge case:** No
- **Fails before implementation:** Yes — module does not exist

---

### T7a — validate returns exitCode 8 for path traversal attempt

- **Verifies:** AC6
- **Test file:** `tests/check-cli-outer-loop.js`
- **Precondition:** The module is loaded.
- **Action:** `const result = mod.validate('../../etc/passwd', 'definition-of-ready', ROOT)`
- **Expected result:** `result.exitCode === 8`
- **Edge case:** Yes — OWASP A01 security test
- **Fails before implementation:** Yes — module does not exist

---

### T7b — validate stderr does NOT contain the resolved absolute path on traversal

- **Verifies:** AC6 (no raw path logged)
- **Test file:** `tests/check-cli-outer-loop.js`
- **Precondition:** Same as T7a
- **Action:** Compute `resolvedPath = path.resolve(ROOT, '../../etc/passwd')`. Inspect `result.stderr`.
- **Expected result:** `result.stderr` does NOT contain `resolvedPath`
- **Edge case:** Yes — security: asserts path sanitization
- **Fails before implementation:** Yes — module does not exist

---

## Integration Tests

### IT1a — spawn `node bin/skills validate` (0 args) exits non-zero

- **Verifies:** AC3
- **Test file:** `tests/check-cli-outer-loop.js`
- **Components involved:** `bin/skills` entry point, `Node.js child_process.spawnSync`
- **Precondition:** `bin/skills` exists (T1 passes)
- **Action:** `child_process.spawnSync('node', [path.join(ROOT, 'bin', 'skills'), 'validate'], { encoding: 'utf8' })`
- **Expected result:** `spawn.status !== 0`
- **Fails before implementation:** Yes — bin/skills does not exist

---

### IT1b — spawn `node bin/skills validate` (0 args) writes usage string to stderr

- **Verifies:** AC3
- **Test file:** `tests/check-cli-outer-loop.js`
- **Components involved:** `bin/skills`
- **Precondition:** Same as IT1a
- **Action:** Inspect `spawn.stderr`
- **Expected result:** `spawn.stderr` contains `'Usage: skills validate'`
- **Fails before implementation:** Yes — bin/skills does not exist

---

### IT2a — spawn `node bin/skills validate artefacts/x.md` (1 arg, no gate) exits non-zero

- **Verifies:** AC3
- **Test file:** `tests/check-cli-outer-loop.js`
- **Components involved:** `bin/skills`
- **Precondition:** `bin/skills` exists
- **Action:** `child_process.spawnSync('node', [path.join(ROOT, 'bin', 'skills'), 'validate', 'artefacts/x.md'], { encoding: 'utf8' })`
- **Expected result:** `spawn.status !== 0`
- **Fails before implementation:** Yes — bin/skills does not exist

---

### IT2b — spawn with 1 arg writes usage string to stderr

- **Verifies:** AC3
- **Test file:** `tests/check-cli-outer-loop.js`
- **Components involved:** `bin/skills`
- **Precondition:** Same as IT2a
- **Action:** Inspect `spawn.stderr`
- **Expected result:** `spawn.stderr` contains `'Usage: skills validate'`
- **Fails before implementation:** Yes — bin/skills does not exist

---

## NFR Tests

### NFR1 — validate completes in under 2000ms

- **NFR addressed:** Performance — `node bin/skills validate` completes in under 2 seconds for any artefact file in the repository
- **Test file:** `tests/check-cli-outer-loop.js`
- **Measurement method:** Record `Date.now()` before and after calling `mod.validate(tmpFilePath, 'definition-of-ready', ROOT)`. Compute delta.
- **Pass threshold:** `elapsed < 2000` milliseconds
- **Tool:** Node.js `Date.now()`
- **Fails before implementation:** Yes — module does not exist (call throws)
- **Note:** This test validates the pure module call, not the subprocess spawn. subprocess startup adds ~100–300ms overhead on some systems; the NFR applies to the net I/O time of the validate function itself.

---

### NFR2 — bin/skills contains a Unix shebang as its first line

- **NFR addressed:** Portability — shebang `#!/usr/bin/env node` must be present in `bin/skills`
- **Test file:** `tests/check-cli-outer-loop.js`
- **Measurement method:** `fs.readFileSync(path.join(ROOT, 'bin', 'skills'), 'utf8').split('\n')[0]`
- **Pass threshold:** First line equals `'#!/usr/bin/env node'`
- **Tool:** Node.js `fs`
- **Fails before implementation:** Yes — file does not exist

---

### NFR3 — no new entries appear in package.json dependencies or devDependencies

- **NFR addressed:** No new runtime dependencies
- **Test file:** `tests/check-cli-outer-loop.js`
- **Measurement method:** Read `package.json`. Assert `Object.keys(pkg.dependencies || {}).length` and `Object.keys(pkg.devDependencies || {})` match the baseline set established at test-plan time. Specifically: assert neither `dependencies` nor `devDependencies` contains any key that was not present before cdg.1 implementation.
- **Pass threshold:** Key count in `dependencies` unchanged; key count in `devDependencies` unchanged (both verified against hardcoded baseline snapshot taken at this test-plan date)
- **Tool:** Node.js `fs` + `JSON.parse`
- **⚠️ Note on pre-implementation failure:** This test **may pass** before implementation if no new deps were accidentally added. It is a protective regression assertion. The test correctly fails if new dependencies are introduced during implementation. Record this as an acknowledged limitation: `NFR3 may not be in TDD red state before implementation begins.`
- **Baseline at test-plan time:** `dependencies = {}`, `devDependencies = { "@playwright/test": "^1.59.1", "jsdom": "^25.0.1" }`

---

## Governance Check Tests (`tests/check-cli-governance.js`)

This is a separate test file per AC5. It is a structural guard: if `bin/skills`, `cli-outer-loop.js`, or the `validate` export are accidentally removed, `npm test` fails immediately with a clear message. The file is intentionally lightweight (3 assertions) because it is a governance signal, not a functional test.

### G1a — bin/skills exists

- **Verifies:** AC5 condition (a)
- **Precondition:** Repository root known
- **Action:** `fs.existsSync(path.join(ROOT, 'bin', 'skills'))`
- **Expected result:** `true` — error message if false: `"AC5 FAIL: bin/skills does not exist"`
- **Fails before implementation:** Yes

---

### G1b — src/enforcement/cli-outer-loop.js exists

- **Verifies:** AC5 condition (b)
- **Precondition:** Repository root known
- **Action:** `fs.existsSync(path.join(ROOT, 'src', 'enforcement', 'cli-outer-loop.js'))`
- **Expected result:** `true` — error message if false: `"AC5 FAIL: src/enforcement/cli-outer-loop.js does not exist"`
- **Fails before implementation:** Yes

---

### G1c — cli-outer-loop.js exports a function named `validate`

- **Verifies:** AC5 condition (c)
- **Precondition:** cli-outer-loop.js exists (G1b passes)
- **Action:** `require('../src/enforcement/cli-outer-loop')` — check `typeof mod.validate === 'function'`
- **Expected result:** `true` — error message if false: `"AC5 FAIL: src/enforcement/cli-outer-loop.js does not export a function named 'validate'"`
- **Fails before implementation:** Yes

---

## Out of Scope for This Test Plan

- H2-H9 check implementations — cdg.2 scope
- Testing `skills advance`, `skills emit-trace`, or any other CLI subcommand — Phase 2
- Testing `cli-adapter.js` (skill-lockfile operations) — separate concern
- End-to-end test of full user journey from CLI to pipeline-state change — no state writes in Phase 1
- Testing on Windows cmd.exe or macOS Terminal with the shebang directly — portability covers Linux and PowerShell node invocation only

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| NFR3 may not be in TDD red state | Dependency count check passes before implementation if no new deps were added | Acceptable — NFR3 is a protective regression guard. Acknowledged in NFR3 note above. |
| AC3 tested via spawnSync, not module call | AC3 tests argument parsing in `bin/skills` — a process boundary, not the module | Integration tests IT1/IT2 use spawnSync which is reliable for this purpose. Acceptable. |
| H1 exit code is "1 by convention" but not yet formally mapped | The H1-H9 → exit code 1-7 mapping is not defined in cdg.1 (finding 2-M2 from review) | For cdg.1, H1 → exit code 1 is the minimal proof-of-pattern. T6a asserts range 1-7. The formal mapping is cdg.2 scope. |
