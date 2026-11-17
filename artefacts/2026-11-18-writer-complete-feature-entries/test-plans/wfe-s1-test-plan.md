## Test Plan: A feature the web app records in pipeline-state.json is complete enough to pass the repository's own checks

**Story reference:** artefacts/2026-11-18-writer-complete-feature-entries/stories/wfe-s1-writer-creates-complete-feature-entries.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-18
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-wfe-s1-complete-feature-entries.js`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | New entry has all required fields, update values win | 3 (T1a to T1c) | - | - | - | - | 🟢 |
| AC2 | Existing feature untouched by defaults | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | Output passes the integrity check and the schema's required list | - | 2 (T3a, T3b) | - | - | - | 🟢 |
| AC4 | Local-fs writer creates the same entry | 1 (T4) | - | - | - | - | 🟢 |
| AC5 | Existing writer tests unchanged | - | existing suites | - | - | - | 🟢 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| The production write goes through the GitHub Contents API, which a unit test cannot call | AC1 | Live-only | The test drives the writer with its existing injectable fetch/put (as `check-wsd-s2-github-pipeline-state-writer` does) and inspects the content it would PUT; the first live confirmation is the next feature started in the app |

## Tests

- **T1a (AC1).** Through the github writer with the stubbed GitHub API, an update `{ discoveryStatus: 'complete', artefact: 'artefacts/x/discovery.md' }` for an unknown slug PUTs a state in which the new feature has `slug`, `id`, `name` (the slug), `track: 'standard'`, `stage: 'discovery'`, `health: 'green'`, and the update's own two fields.
- **T1b (AC1).** An update that also carries `stage: 'benefit-metric'` and `health: 'amber'` keeps those values; a non-string `name` is ignored.
- **T1c (AC1).** Before the fix this test fails: the same update's PUT lacks `track`, `name`, `stage` and `health` (the failing case that is #1146).
- **T2 (AC2).** An existing feature with `track: 'short'`, a `name` and `stage: 'review'` receives an update `{ health: 'red' }`: only `health` changes.
- **T3a (AC3).** The state the writer would PUT, written to a temporary `.github/pipeline-state.json` beside the real schema, passes `scripts/check-pipeline-state-integrity.js` for the new feature (exit 0 for it; no C11, C15, C16).
- **T3b (AC3).** Every feature in that state has every field in the schema's `features.items.required` list.
- **T4 (AC4).** The local-fs writer, run in a temporary git repository (a real checkout), creates the same complete entry for an unknown slug.
- **Regression (AC5).** `check-wsd-s2-github-pipeline-state-writer`, the local writer's own test, and `scripts/check-pipeline-state-integrity.js` pass unchanged.

## Out of scope for this plan

Whether the app should write an entry for an uncommitted artefact; auditing other entries; refusing invalid pushes.
