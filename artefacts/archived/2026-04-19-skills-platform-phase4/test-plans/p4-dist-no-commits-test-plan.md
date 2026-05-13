# Test Plan: Install generates zero commits — CI-verifiable assertion

**Story reference:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-no-commits.md
**Epic:** E2 — Distribution model
**Complexity:** 1 (Stable)
**Test type:** Unit + governance check

---

## Test matrix

| ID | Description | Type | AC | Method | Pass condition |
|----|-------------|------|----|--------|----------------|
| T1 | CI assertion module exists | Unit | — | `fs.existsSync` | `src/distribution/ci-assert.js` present |
| T2 | `getCommitCount` parses `git rev-list --count HEAD` output correctly | Unit | AC1 | Pass mock output `"7\n"` | Returns integer 7 |
| T3 | `assertZeroCommits` detects commit count increase → fails | Unit | AC1 | before=5, after=6 | Returns/throws error with count "1 commit(s) added" |
| T4 | `assertZeroCommits` passes when count unchanged | Unit | AC1 | before=5, after=5 | Returns null / no error |
| T5 | All four distribution commands registered in assertion suite | Governance | AC2 | Read `getCommandRegistry()` | Array includes `init`, `fetch`, `pin`, `verify` |
| T6 | Error message format matches AC1 specification | Unit | AC1 | Inspect error from T3 | Contains "Distribution command generated unexpected commit(s):" |
| T7 | `verify` is classified as read-only in registry | Unit | AC3 | Inspect registry entry for `verify` | `readOnly: true` or equivalent flag |
| T8 | `assertReadOnly` for verify: no staged files, no unstaged modifications | Unit | AC3 | Pass mock git status showing clean state | Passes |
| T-NFR1 | Assertion output does not log sidecar path contents to stdout | Security | NFR | Run assertion with fixture, capture stdout | No `.skills-repo/` directory listing in output |

---

## Test descriptions

### T1 — Module exists
`src/distribution/ci-assert.js` must exist. All subsequent tests depend on this module. If absent, remaining tests fail as not-yet-implemented.

### T2 — getCommitCount parses output
`getCommitCount` must parse the string output of `git rev-list --count HEAD` (e.g. `"7\n"`) and return the integer 7.

### T3 — Count increase detected
`assertZeroCommits('init', 5, 6)` must return an error object or throw. The error message must match `"Distribution command generated unexpected commit(s): 1 commit(s) added"`.

### T4 — Count unchanged passes
`assertZeroCommits('init', 5, 5)` must return `null` or `undefined` (no error).

### T5 — All four commands in registry
`getCommandRegistry()` must return an array (or object) whose keys/entries include all of: `init`, `fetch`, `pin`, `verify`.

### T6 — Error message format
The error returned by T3 must include the phrase "Distribution command generated unexpected commit(s):" followed by the count. Format must match AC1 exactly.

### T7 — verify classified read-only
The registry entry for `verify` must have a `readOnly` flag (or equivalent) set to `true`. The `init`, `fetch`, and `pin` commands may have `readOnly: false` or omit the flag.

### T8 — Read-only assertion clean state
`assertReadOnly(gitStatusOutput)` where `gitStatusOutput` is a string from `git status --porcelain` (empty string = clean) must return null / no error.

### T-NFR1 — No sidecar content in output
Run the assertion logic with a mock stdout capture. The output must not include directory listing of sidecar contents (no `.skills-repo/` path fragments in the assertion output).

---

## Coverage

| AC | Tests |
|----|-------|
| AC1 | T2, T3, T4, T6 |
| AC2 | T5 |
| AC3 | T7, T8 |
| NFR: Security | T-NFR1 |
| NFR: Correctness | T3, T4 |
