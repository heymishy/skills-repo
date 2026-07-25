## Test Plan: Local pipeline-state schema checks (C10-C14)

**Story reference:** artefacts/2026-07-25-pipeline-state-schema-validation/stories/pss-s1-schema-required-field-checks.md

## AC Coverage

| AC | Description | Integration | Gap type | Risk |
|----|-------------|-------------|----------|------|
| AC1 | Flat story missing `id` -> C10 fires | 2 tests (fires, and no-fire when present) | — | 🟢 |
| AC2 | Feature missing `track` -> C11 fires | 2 tests | — | 🟢 |
| AC3 | Invalid `dodStatus` -> C12 fires | 3 tests (null, invalid string, valid value) | — | 🟢 |
| AC4 | Invalid `prStatus` -> C13 fires | 3 tests (invalid enum, valid value, absent) | — | 🟢 |
| AC5 | `acVerified` wrong type -> C14 fires | 3 tests (string, valid integer, absent) | — | 🟢 |
| AC6 | Fully-valid fixture -> no C10-C14 | 1 test | — | 🟢 |

## Integration Tests

### flatStoryMissingIdFiresC10
- **Verifies:** AC1
- **Precondition:** `feature.stories: [{ slug: 'x', name: 'X' }]` (no `id`)
- **Expected:** result includes `{ code: 'C10' }` naming the feature slug and story slug

### flatStoryWithIdNoC10
- **Verifies:** AC1 (non-regression)
- **Precondition:** `feature.stories: [{ id: 'x', slug: 'x', name: 'X' }]`
- **Expected:** no `C10` in result

### featureMissingTrackFiresC11
- **Verifies:** AC2
- **Precondition:** feature object with no `track` key
- **Expected:** result includes `{ code: 'C11' }` naming the feature slug

### featureWithTrackNoC11
- **Verifies:** AC2 (non-regression)
- **Precondition:** feature object with `track: 'short'`
- **Expected:** no `C11` in result

### dodStatusNullFiresC12
- **Verifies:** AC3
- **Precondition:** story with `dodStatus: null`
- **Expected:** result includes `{ code: 'C12' }`

### dodStatusInvalidStringFiresC12
- **Verifies:** AC3
- **Precondition:** story with `dodStatus: 'done'`
- **Expected:** result includes `{ code: 'C12' }`

### dodStatusValidNoC12
- **Verifies:** AC3 (non-regression)
- **Precondition:** story with `dodStatus: 'not-started'` and separately `'complete'`
- **Expected:** no `C12` in result for either

### prStatusInvalidFiresC13
- **Verifies:** AC4
- **Precondition:** story with `prStatus: 'not-started'`
- **Expected:** result includes `{ code: 'C13' }`

### prStatusValidNoC13
- **Verifies:** AC4 (non-regression)
- **Precondition:** story with each of `none|draft|open|merged`
- **Expected:** no `C13` in result

### prStatusAbsentNoC13
- **Verifies:** AC4 (non-regression)
- **Precondition:** story with no `prStatus` key at all
- **Expected:** no `C13` in result

### acVerifiedStringFiresC14
- **Verifies:** AC5
- **Precondition:** story with `acVerified: "true"`
- **Expected:** result includes `{ code: 'C14' }`

### acVerifiedIntegerNoC14
- **Verifies:** AC5 (non-regression)
- **Precondition:** story with `acVerified: 3`
- **Expected:** no `C14` in result

### acVerifiedAbsentNoC14
- **Verifies:** AC5 (non-regression)
- **Precondition:** story with no `acVerified` key
- **Expected:** no `C14` in result

### fullyValidFixtureNoNewChecks
- **Verifies:** AC6
- **Precondition:** a feature/story fixture with `track`, story `id`, valid `dodStatus`, valid `prStatus`, integer `acVerified`
- **Expected:** none of C10, C11, C12, C13, C14 appear in result

## Out of Scope for This Test Plan

- Re-testing C1-C9 -- pre-existing, unchanged.
