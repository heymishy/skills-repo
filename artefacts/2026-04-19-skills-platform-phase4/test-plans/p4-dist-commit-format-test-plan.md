# Test Plan: Operator-configured commit-format validation

**Story reference:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-commit-format.md
**Epic:** E2 — Distribution model
**Complexity:** 1 (Stable)
**Test type:** Unit

---

## Test matrix

| ID | Description | Type | AC | Method | Pass condition |
|----|-------------|------|----|--------|----------------|
| T1 | commit-format module exists | Unit | — | `fs.existsSync` | `src/distribution/commit-format.js` present |
| T2 | `validateCommitFormat` with non-matching HEAD message → returns error | Unit | AC1 | regex=`^JIRA-[0-9]+`, sha=`abc12345`, msg=`"fix typo"` | Returns error object |
| T3 | Error message includes 8-char SHA, 72-char excerpt, and regex | Unit | AC1 | Inspect error from T2 | Contains SHA, excerpt, regex string |
| T4 | `validateCommitFormat` with matching HEAD message → returns null | Unit | AC3 | regex=`^JIRA-[0-9]+`, msg=`"JIRA-123 fix typo"` | Returns null / no error |
| T5 | No regex in config → `validateCommitFormat` returns null without checking | Unit | AC2 | Call with `commitFormatRegex = null` | Returns null immediately |
| T6 | Invalid regex string → `validateCommitFormat` returns named error (not exception) | Unit | AC4 | Pass `"[invalid"` as regex | Returns error, not thrown RegExp exception |
| T7 | Invalid regex error message identifies the bad regex and context.yml location | Unit | AC4 | Inspect error from T6 | Contains `"distribution.commit_format_regex"` and `"context.yml"` |
| T8 | ADR-004 — module does not accept regex via CLI arg or env var | Governance | AC1 | Source-scan commit-format.js | No `process.argv` or `process.env` reads for regex value |
| T-NFR1 | Commit message not passed to any external network call | Security | NFR | Source-scan commit-format.js | No `http`, `https`, `fetch`, or external process spawn with message as arg |

---

## Test descriptions

### T1 — Module exists
`src/distribution/commit-format.js` must exist. If absent, all remaining tests fail.

### T2 — Non-matching commit → error
`validateCommitFormat({ regex: '^JIRA-[0-9]+', sha: 'abc12345ffffffff', message: 'fix typo in README' })` must return an error (non-null) or throw.

### T3 — Error content
The error returned in T2 must contain all three elements required by AC1:
1. The first 8 characters of the SHA (`abc12345`)
2. The first 72 characters of the commit message excerpt
3. The regex string (`^JIRA-[0-9]+`)

### T4 — Matching commit passes
`validateCommitFormat({ regex: '^JIRA-[0-9]+', sha: 'abc12345', message: 'JIRA-123 fix typo' })` must return `null` or `undefined`.

### T5 — No regex → skip validation
`validateCommitFormat({ regex: null, sha: 'abc12345', message: 'any message' })` must return `null` without performing a regex test.

### T6 — Invalid regex handled gracefully
`validateCommitFormat({ regex: '[invalid', sha: 'abc12345', message: 'any message' })` must return an error object (not throw a `SyntaxError` from the `RegExp` constructor).

### T7 — Invalid regex error message
The error from T6 must contain the string `"distribution.commit_format_regex"` and `"context.yml"` so the consumer knows where to fix the config.

### T8 — ADR-004 source scan
Read `src/distribution/commit-format.js`. Confirm the regex is not sourced from `process.argv` or `process.env`. Only `context.yml` (injected as a parameter) is the config source.

### T-NFR1 — No external logging of commit messages
Read `src/distribution/commit-format.js`. Confirm no `http`, `https`, `fetch`, or external `spawn`/`exec` with the commit message as an argument.

---

## Coverage

| AC | Tests |
|----|-------|
| AC1 | T2, T3, T4 |
| AC2 | T5 |
| AC3 | T4 |
| AC4 | T6, T7 |
| NFR: Security | T-NFR1 |
| NFR: Correctness | T8 |
