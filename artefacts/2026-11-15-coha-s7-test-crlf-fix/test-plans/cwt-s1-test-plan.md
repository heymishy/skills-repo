## Test Plan: Make the coha-s7 structural tests pass in a Windows checkout with CRLF line endings

**Story reference:** artefacts/2026-11-15-coha-s7-test-crlf-fix/stories/cwt-s1-make-the-coha-s7-test-line-ending-safe.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-15
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; each file is a plain Node assert script. File changed: `tests/check-coha-s7-error-issue-incident.js`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | CRLF checkout: all tests pass | 1 (UT1) | - | - | 1 (run in the Windows checkout) | - | 🟢 |
| AC2 | LF checkout (CI): all tests still pass | - | - | - | 1 (CI result on the PR) | - | 🟢 |
| AC3 | Normalisation does not weaken the pin: CRLF copy passes W3, broken copy still fails W3 | 1 (UT2) | - | - | - | - | 🟢 |

## Coverage gaps

No gaps. AC1 and AC2 are proven by running the same file on both line-ending kinds (the Windows checkout now, CI on the PR).

## Test Data Strategy

**Source:** Synthetic. The tests derive CRLF and broken variants in memory from the real workflow text; no files are written. **PCI/sensitivity:** No. **Availability:** self-contained. **Owner:** self-contained.

## Unit Tests (in `tests/check-coha-s7-error-issue-incident.js`, added after the existing `wf`/`topText` declarations)

### UT1 - the workflow text the structural tests read contains no carriage return
- **Verifies:** AC1
- **Action:** assert `wf.indexOf('\r') === -1`
- **Expected result:** passes once the read is normalised. Fails today in a Windows checkout (autocrlf gives CRLF); passes in LF checkouts, so the red state is only visible on Windows, which is the bug.
- **Edge case:** Yes

### UT2 - normalising keeps the W3 pin strong
- **Verifies:** AC3
- **Action:** build `crlf = wf.replace(/\n/g, '\r\n')`, normalise it with the same function the file uses for the read; apply the W3 pattern (`/^concurrency:\s*\n  group:\s*(.+)\n  cancel-in-progress:\s*false\s*$/m` against the text before `jobs:`); then build `broken = wf.replace('cancel-in-progress: false', 'cancel-in-progress: true')` and apply the same
- **Expected result:** pattern matches the normalised CRLF text; does not match the broken text
- **Edge case:** Yes (negative control)

## Integration Tests

None. The existing W-tests are the integration of the structural pins and already run in CI.

## NFR Tests

None - confirmed (Security: none; Performance: none; Correctness: covered by UT2's negative control).

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Only the one workflow read is normalised | Only `error-issue-incident-record.yml` is read by this file | Other files with the same sensitivity are out of scope (separate decision) |

**Total automated tests:** 2 new (the 44 existing must all pass on CRLF and LF).