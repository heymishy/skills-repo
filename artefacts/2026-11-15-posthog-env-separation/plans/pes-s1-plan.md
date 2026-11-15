# Give every captured error an environment-specific fingerprint - Implementation Plan

> Executed in this session with /tdd (a few lines of production code; tests first). Two tasks.

**Goal:** `scrubEvent` sets `$exception_fingerprint` to `[fpEnv, code, route]` built only from fixed or allow-listed values.
**Branch:** `feature/pes-s1-environment-specific-error-fingerprint`
**Worktree:** `.worktrees/pes-s1-environment-specific-error-fingerprint` (verify this prefix before every edit)
**Test command:** `node tests/check-coha-s5-error-capture.js`

## File map
```
Modify:
  src/web-ui/modules/error-capture.js     - KEPT_KEYS (line 7-8), one line after `out.environment = environment;` (line 85), the comment at line 82
  tests/check-coha-s5-error-capture.js    - sorted key list in scrubEvent_keepsOnlyNamedKeys_andFixedDistinctId (line ~27-28); new tests appended above the "// ---- runner" comment
```

## Task 1: Tests UT1 to UT4 and IT1, plus the key-list edit (red)
- [ ] Append UT1 to UT4 and IT1 (from the test plan) above the `// ---- runner` comment, reusing `sdkEvent`, `seed`, `spawnChild`, `get`, `waitFor`, `sinkLib`, `FAKE_PROD`.
- [ ] Add `'$exception_fingerprint'` to the sorted key array in `scrubEvent_keepsOnlyNamedKeys_andFixedDistinctId`.
- [ ] Run: expect UT1, UT2, UT3 (fingerprint assertions), UT4 (the unknown-environment case), IT1 and the key-list test to fail. The two `ec.KEPT_KEYS` comparisons still pass until Task 2.
- [ ] Commit `test: pes-s1 environment-specific fingerprint tests (red)`.

## Task 2: The fingerprint (green)
- [ ] `KEPT_KEYS` gains `'$exception_fingerprint'`.
- [ ] After `out.environment = environment;` add: `out.$exception_fingerprint = [(environment === 'staging' || environment === 'production') ? environment : 'unknown', code, out.route];`
- [ ] Update the comment above to say the incoming fingerprint is still ignored and the scrubber builds its own from fixed values.
- [ ] Run: 83 existing + 5 new = 88 passed, 0 failed; coha-s6 file unchanged (83 passed, 7 skipped); non-ASCII 0.
- [ ] Commit `feat: environment-specific error fingerprint so production errors never join a staging issue`.