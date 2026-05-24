## Test Plan: CLI `skills validate --ci` command (SC-03)

**Story reference:** `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-03-cli-validate-ci.md`
**Epic reference:** `artefacts/2026-05-24-governance-platform-architecture/epics/gpa-epic-02-ci-enforcement-compliance.md`
**Test plan author:** Copilot
**Date:** 2026-05-25

---

## Background

`cli-outer-loop.js` already implements H1–H9 DoR gate checks and exports `validate(artefactPath, gateName, repoRoot)`. `bin/skills` already has a `validate` subcommand that calls this. SC-03 extends the CLI with a `--ci` flag so CI (assurance-gate.yml) can invoke `skills validate --story <slug> --ci` to run all H-gates against a story and exit 0/1. ADR-013 requires H-gate check functions to be importable from `governance-package.js`, not from `cli-outer-loop.js` or `bin/skills`. The output must use the canonical format per SC-04: `[skills-validate] Results: N passed, N failed`.

**D4 RISK-ACCEPT note:** For multi-story features (stories nested under epics), slug resolution may not correctly locate the story artefact in all cases. This is acknowledged and logged as D4 in `artefacts/2026-05-24-governance-platform-architecture/decisions.md`. AC6 specifies that if the false-positive rate exceeds 1/20 observed PRs, a RISK-ACCEPT entry is written to decisions.md and scope is restricted to features with flat `stories[]` only.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `skills validate --story <slug> --ci` resolves the story artefact path and runs H1–H9 | 2 tests (T1, T2) + IT1 | 1 test (IT1) | — | — | Multi-story slug resolution: D4 RISK-ACCEPT | 🟡 |
| AC2 | All H1–H9 pass → exit 0, output `[skills-validate] Results: 9 passed, 0 failed` | 1 test (IT1) | — | — | — | — | 🟢 |
| AC3 | Failing H-gate → exit 1, output identifies failing gate by name | 1 test (IT2) | — | — | — | — | 🟢 |
| AC4 | dorStatus=signed-off story → skipped with skip message | 1 test (T5) | — | — | — | — | 🟢 |
| AC5 | 10 consecutive PRs pass gates with 0 false positives | — | — | — | Post-deploy metric | Metric signal | MEDIUM |
| AC6 | False-positive rate monitoring; >1/20 triggers RISK-ACCEPT and scope restriction | — | — | — | Post-deploy observation | Metric signal | MEDIUM |
| AC7 | H-gate check functions importable from `governance-package.js` | 2 tests (T3, T4) | — | — | — | — | 🟢 |

---

## Coverage gaps

| AC | Gap | Gap type | Risk | Mitigation |
|----|-----|----------|------|-----------|
| AC1 | Multi-story epic-nested features: slug resolution may resolve to wrong story file or return H1 FAIL incorrectly | Scope edge case | MEDIUM | D4 RISK-ACCEPT already logged. T2 covers the standard single-story case. IT1 covers integration-level happy path. Post-deploy: observe false-positive rate over first 10 PRs. |
| AC5/AC6 | False-positive rate cannot be measured in automated tests; requires live CI runs against real PRs | Metric signal | MEDIUM | Note in DoD: record pass/fail signal in pipeline-state after 10 observed PRs. If rate >1/20, append RISK-ACCEPT to decisions.md and restrict scope. |

---

## Test Data Strategy

**Source:** Synthetic — minimal story artefact content constructed inline; existing story artefact files from the repo for integration tests.
**PCI/sensitivity in scope:** No.
**Availability:** All tests run in plain `node` process. Integration tests spawn `node bin/skills validate` as subprocess.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Slug that maps to a known story file | Existing artefact | None | Use a simple story slug from this feature or create a minimal synthetic story file |
| AC2 | Fully-passing DoR story (all H1–H9 satisfied) | Existing DoR artefact (e.g. gpa-sc-01) | None | |
| AC3 | Story missing required H1 content (story file absent or no AC section) | Synthetic missing file path | None | |
| AC4 | pipeline-state.json with a story having dorStatus=signed-off | Actual pipeline-state.json | None | |
| AC7 | require governance-package.js; inspect exports | Module import | None | |

### PCI / sensitivity constraints

None.

---

## Unit Tests

### T1 — `governance-package.js` exports H-gate validation function(s)

- **Verifies:** AC7 — H-gate logic importable from `governance-package.js`
- **Precondition:** SC-03 implementation complete; `governance-package.js` has been extended to expose H-gate evaluation
- **Action:** `const mod = require('../src/enforcement/governance-package.js')` and assert `typeof mod.checkHGates === 'function'` (or equivalent exported name per implementation)
- **Expected result:** Module exports an H-gate evaluation function
- **Edge case:** No

### T2 — `governance-package.js` H-gate function is the same implementation invoked by `--ci`

- **Verifies:** AC7 — single canonical implementation, not a copy in `bin/skills`
- **Precondition:** SC-03 implementation complete
- **Action:** Verify that `bin/skills` (or `cli-outer-loop.js` shim) calls the function from `governance-package.js` (grep check: `bin/skills` source contains `require('.../governance-package')` and does NOT re-implement H-gate logic inline)
- **Expected result:** `bin/skills` source contains a `require` reference to `governance-package.js`; no H1/H2/H3 strings defined inline in `bin/skills`
- **Edge case:** No

### T3 — `skills validate --ci` output uses canonical format `[skills-validate] Results: N passed, N failed`

- **Verifies:** AC2, AC3 (output format per SC-04 standard)
- **Precondition:** SC-03 implementation complete; a test story file exists at known path with all H-gates satisfied
- **Action:** Check that the output from running `--ci` mode includes the canonical suffix format `[skills-validate] Results: N passed, N failed`
- **Expected result:** Canonical line is in stdout or stderr (per implementation convention)
- **Edge case:** N=0 (no gates applicable) → still prints `0 passed, 0 failed`

### T4 — Failing H1 (story file missing) → output identifies H1

- **Verifies:** AC3 — failing gate named in output
- **Precondition:** SC-03 implementation complete
- **Action:** Invoke the H-gate evaluation function from `governance-package.js` with a slug pointing to a non-existent file and assert the result object (or output string) contains `H1` and the specific failure message
- **Expected result:** Result identifies `H1: FAIL` and includes the expected path that was not found
- **Edge case:** No

### T5 — dorStatus=signed-off story is skipped by `--ci` run

- **Verifies:** AC4 — signed-off stories skipped
- **Precondition:** SC-03 implementation complete
- **Action:** Invoke the `--ci` path with a slug whose story has `dorStatus: 'signed-off'` in pipeline-state.json; assert output contains `SKIP` (or equivalent skip message) and exit code is 0
- **Expected result:** Output contains `SKIP — dorStatus is signed-off`; exit code 0 (skip is not a failure)
- **Edge case:** Feature slug not found in pipeline-state → report as H1 FAIL, not crash

---

## Integration Tests

### IT1 — `node bin/skills validate --story <slug> --ci` exits 0 for a fully-passing story

- **Verifies:** AC2 — H1–H9 all pass → exit 0
- **Precondition:** SC-03 implementation complete; story slug `gpa-sc-01-trace-contract` exists with valid DoR artefact in repo
- **Action:** Spawn `node bin/skills validate --story gpa-sc-01-trace-contract --ci` in repo root; capture stdout + exit code
- **Expected result:**
  - Exit code 0
  - Stdout/stderr contains `[skills-validate] Results: 9 passed, 0 failed` (or variant with gates applicable to this story)
- **Edge case:** No

### IT2 — `node bin/skills validate --story <nonexistent-slug> --ci` exits 1

- **Verifies:** AC3 — H1 FAIL → exit 1
- **Precondition:** SC-03 implementation complete; slug `nonexistent-test-story-sc03` does not correspond to any artefact file
- **Action:** Spawn `node bin/skills validate --story nonexistent-test-story-sc03 --ci`; capture stderr + exit code
- **Expected result:**
  - Exit code 1
  - Stderr contains `H1 FAIL` and the expected path
- **Edge case:** No

---

## Test output format

```
[gpa-sc03] Results: N passed, 0 failed
```

---

## NFR coverage

| NFR | Test | Verification |
|-----|------|-------------|
| Output format: `[skills-validate] Results: N passed, N failed` (SC-04 standard) | T3, IT1 | Regex match on actual output |
| Exit code 0/1 contract | IT1 (exit 0), IT2 (exit 1) | Process exit code assertion |
| H-gate logic in governance-package.js, not inline in bin/skills (ADR-013) | T2 | Grep check: no inline H1/H2/H3 definitions in bin/skills |
| False-positive rate ≤1/20 over 10 PRs (AC5, AC6) | — (post-deploy) | Record metric signal in pipeline-state.json at DoD; if >1/20 → RISK-ACCEPT + scope restriction |
