## Test Plan: A review checklist, seeded from recorded defects, shows the items a change's diff is likely to need

**Story reference:** artefacts/2026-11-18-review-checklist/stories/rvc-s1-diff-triggered-review-checklist.md
**Epic reference:** None - short-track
**Test plan author:** Claude Haiku 5.5
**Date:** 2026-11-18
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`. New file: `tests/check-rvc-s1-review-checklist.js`. Fixture checklists and fixture diffs are inline strings, so the parser, matcher and output are tested without git. One live test reads the committed `REVIEW.md` and the real `git ls-files`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Parse entries; report a missing `paths`, `check` or `source` | 2 (T1a valid entries parse; T1b missing fields reported) | - | - | - | - | 🟢 |
| AC2 | Path and added-line match lists the entry with file and line | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | Path matches but no added line matches `match`: not listed | 1 (T3) | - | - | - | - | 🟢 |
| AC4 | Entry without `match`: listed for any matching file | 1 (T4) | - | - | - | - | 🟢 |
| AC5 | `--check` fails on a source that is not tracked, naming entry and path | 1 (T5, with an injected tracked-file lookup) | - | - | - | - | 🟢 |
| AC6 | Committed `REVIEW.md` validates and every source is tracked | 1 (T6, real files and real `git ls-files`) | - | - | - | - | 🟢 |
| AC7 | No matching entry: says so, exits 0 | 1 (T7) | - | - | - | - | 🟢 |
| Glob | `*` stays within a segment, `**` crosses segments | 1 (T8) | - | - | - | - | 🟢 |
| Diff | Added lines and the file they belong to are read from unified-0 diff text | 1 (T9) | - | - | - | - | 🟢 |

## Red-first plan

The test file requires `scripts/review-checklist.js` and calls its exports. Before the script exists, `node tests/check-rvc-s1-review-checklist.js` fails at `require`; that is the red state recorded in the DoD.
