## Test Plan: Loud story-creation warning in `skills advance`

**Story reference:** artefacts/2026-07-25-advance-cli-visibility/stories/acv-s1-loud-story-creation-warning.md

## AC Coverage

| AC | Description | Integration | Gap type | Risk |
|----|-------------|-------------|----------|------|
| AC1 | Existing story match -> unchanged stdout, empty stderr | 2 tests (flat, epic-nested) | — | 🟢 |
| AC2 | No match -> loud stderr warning + distinct stdout message | 1 test | — | 🟢 |
| AC3 | No-match case still exits 0 | 1 test | — | 🟢 |
| AC4 | Feature-only fields never trigger story lookup/warning | 1 test | — | 🟢 |

## Integration Tests

### existingFlatStoryUnchangedOutput
- **Verifies:** AC1
- **Precondition:** A feature with a flat `stories: [{ slug: 'my-story', ... }]`
- **Action:** `advance(featureSlug, 'my-story', ['prStatus=open'], repoRoot)`
- **Expected result:** `stdout` starts with `Advanced: `; `stderr` is `''`

### existingEpicNestedStoryUnchangedOutput
- **Verifies:** AC1
- **Precondition:** A feature with `epics: [{ stories: [{ slug: 'my-epic-story', ... }] }]`
- **Action:** `advance(featureSlug, 'my-epic-story', ['prStatus=open'], repoRoot)`
- **Expected result:** `stdout` starts with `Advanced: `; `stderr` is `''`

### noMatchCreatesRecordWithLoudWarning
- **Verifies:** AC2
- **Precondition:** A feature with no story matching `'typo-id'` anywhere
- **Action:** `advance(featureSlug, 'typo-id', ['prStatus=open'], repoRoot)`
- **Expected result:** A new story record IS created (write behaviour unchanged); `stderr` contains the feature slug, `'typo-id'`, and a clearly-labelled warning; `stdout` is prefixed distinctly from the plain `Advanced: ` message (e.g. contains `Created NEW story record`)

### noMatchCaseStillExitsZero
- **Verifies:** AC3
- **Action:** Same as above
- **Expected result:** `exitCode === 0`

### featureOnlyFieldsNeverTriggerWarning
- **Verifies:** AC4
- **Action:** `advance(featureSlug, 'any-story-id-even-nonexistent', ['feature.health=green'], repoRoot)` -- no story-scoped fields at all
- **Expected result:** No story lookup/creation happens (matches existing behaviour); `stderr` is `''`; no new entry appears in `feature.stories[]`

## Out of Scope for This Test Plan

- Re-testing the enum/boolean validation, prototype-pollution guard, or dot-notation handling -- pre-existing, unchanged.
