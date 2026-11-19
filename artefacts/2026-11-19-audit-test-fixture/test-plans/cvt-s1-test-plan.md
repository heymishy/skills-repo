## Test Plan: The live npm audit test checks the shape of the audit

**Story reference:** artefacts/2026-11-19-audit-test-fixture/stories/cvt-s1-live-audit-test-independent-of-findings.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-19
**Test runner (read from package.json):** `npm test` runs `scripts/run-all-tests.js`, which runs `tests/check-*.js`. New file: `tests/check-cvt-s1-live-audit-shape.js`, plain Node. It reads the coha-s3 test as text, reuses the shape rule on fixtures, and runs the two existing tests as child processes.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | the live case passes on any parseable, non-error audit with the expected shape | - | 1 (T1: runs the coha-s3 test) | - | - | - | 🟢 |
| AC2 | the case names no specific package or severity as required | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | a registry error or non-JSON output still fails the case | 1 (T3) | - | - | - | - | 🟢 |
| AC4 | the coha-s3 and bkn-s1 tests exit 0 | - | 1 (T4, T1 covers coha-s3) | - | - | - | 🟢 |

## Red-first plan

T1 and T4 fail now (the case demands a critical dompurify finding the live audit no longer reports; bkn-s1 T5 re-runs it). T2 fails now (the source names `vulnerabilities.dompurify`). T3 reads the live case's source and asserts it calls `isAuditCommandError`, checks the `vulnerabilities` object and `metadata.vulnerabilities.total`, and calls `filterNewHighOrCriticalFindings`; it also asserts `isAuditCommandError` is true for a registry-error fixture, so the repaired case can still fail. T3 fails now because the case does none of those checks.

## Manual step

None. The case needs the npm registry, as before.
