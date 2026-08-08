## Test Plan: Remove check-md-3-adr.js's nested full-suite npm test recursion

**Story reference:** artefacts/2026-08-08-check-md-3-adr-recursion-fix/stories/mar-s1-remove-nested-npm-test-recursion.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-08

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Standalone run: no nested subprocess, T1-T3 still pass | 1 test | — | — | — | — | 🟢 |
| AC2 | In-suite run: bounded, fast wall-clock time | 1 test | — | — | — | — | 🟢 |
| AC3 | Removed from baseline / historical doc corrected | — | — | — | 1 manual check | — | 🟢 |
| AC4 | Full-suite regression check, zero new failures | — | 1 full-suite run | — | — | — | 🟢 |

---

## Coverage gaps

None. AC3 is manual (editing `tests/known-baseline-failures.json` and a documentation comment is not itself a behaviour worth a unit test — the file's absence from the baseline is verified structurally by AC4's regression check instead).

---

## Test Data Strategy

**Source:** The real `tests/check-md-3-adr.js` file and `.github/architecture-guardrails.md` (already contains ADR-015, unaffected by this fix).
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

---

## Unit Tests

### checkMd3Adr_standaloneRun_noNestedSubprocess_t1ThroughT3StillPass

- **Verifies:** AC1
- **Action:** Spawn `node tests/check-md-3-adr.js` as a child process with `stdio: 'pipe'`, capture stdout
- **Expected result:** Exit code 0; stdout contains the T1/T2/T3 section headers and their pass markers; stdout does NOT contain any indication of a nested `npm test` invocation (e.g. no `[run-all-tests]` summary line, which only the outer suite runner would ever print)

### checkMd3Adr_inSuiteRun_completesInBoundedTime

- **Verifies:** AC2
- **Action:** Time a standalone `node tests/check-md-3-adr.js` invocation
- **Expected result:** Completes in well under 5 seconds (matching the order-of-magnitude of every other file-content-check test in `tests/`, not the multi-minute nested-suite scale this fix removes)

## Integration Tests

### fullSuiteRegression_checkMd3AdrNoLongerFlagged

- **Verifies:** AC4
- **Action:** Run `node scripts/run-all-tests.js`, capture output, run `node scripts/ci-test-regression-check.js` against it
- **Expected result:** `tests/check-md-3-adr.js` does not appear in either the "currently failing" or "new regression" lists; overall new-regression count relative to the pre-fix baseline is zero

## Manual Verification

### Baseline documentation correction

- **Verifies:** AC3
- **Action:** Remove `check-md-3-adr.js` from `tests/known-baseline-failures.json` if present; update or annotate the comment in `tests/check-tst-s1-baseline-triage.js` (lines 127–132) that currently describes it as permanently unfixable
- **Expected result:** No stale documentation claims this file is still a permanent baseline failure
