## Test Plan: The skills CLI writes a valid `track` on new features and rejects an invalid one

**Story reference:** artefacts/2026-11-19-cli-track-field/stories/ctk-s1-cli-writes-and-validates-track.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-19
**Test runner (read from package.json):** `npm test` runs `scripts/run-all-tests.js`, which runs `tests/check-*.js`. New file: `tests/check-ctk-s1-cli-track.js`, plain Node, calling `init` and `advance` against a throwaway repo root (a temp directory with its own `.github/pipeline-state.json`) and validating the written feature against `.github/pipeline-state.schema.json`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `init` with no track writes `standard` | 1 (T1) | - | - | - | - | 🟢 |
| AC2 | `init --track <allowed value>` writes that value, for all four values | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | `init --track bogus` exits 1, names `bogus`, changes nothing | 1 (T3) | - | - | - | - | 🟢 |
| AC4 | a feature written by `init` validates against the schema | - | 1 (T4: runs the real `bin/skills init` in a temp repo and checks required fields and the track enum read from the schema) | - | - | - | 🟢 |
| AC5 | `advance track=defect` exits 8, names `track`, changes nothing | 1 (T5) | - | - | - | - | 🟢 |
| AC6 | `advance track=short` exits 0 and writes it | 1 (T6) | - | - | - | - | 🟢 |

## Red-first plan

T1, T2, T4 and T5 fail on current master (no `track` written, no validation). T3 fails (the flag is unknown, so `bogus` is not rejected as a track). T6 passes before and after as a baseline, since `advance` currently accepts any value. The allowed values in T2 are read from the schema, so a schema change cannot leave the test passing against stale values.

## Manual step

None.
