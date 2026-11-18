# rvc-s1 Definition of Done

Date: 2026-11-18. Story: a review checklist, seeded from recorded defects, shows the items a change's diff is likely to need. Pull request #1153 merged 2026-11-18 (`334cd834f`). No issue.

## Result: COMPLETE

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 (entries parse; a missing `paths`, `check` or `source` is reported) | ✅ | T1a, T1b in `tests/check-rvc-s1-review-checklist.js` | automated | none |
| AC2 (path and added-line match lists the entry with file and line) | ✅ | T2. Live: the diff for PR #1150 listed the continue-turn entry at four lines of `src/web-ui/routes/skills.js` | automated + live | none |
| AC3 (path matches but no matching added line: not listed) | ✅ | T3 | automated | none |
| AC4 (entry without `match`: listed for any matching file) | ✅ | T4 | automated | none |
| AC5 (`--check` fails on an untracked source, naming entry and path) | ✅ | T5 with an injected tracked-file lookup | automated | none |
| AC6 (committed `REVIEW.md` valid; every source tracked) | ✅ | T6 on the real file and `git ls-files`. Live on master: `10 entries, all complete and every source tracked` | automated + live | none |
| AC7 (no matching entry: says so, exits 0) | ✅ | T7 | automated | none |

Red first: the test file failed at `require` before the script existed.

## Observations and follow-ups

- **Advisory only.** Nothing blocks a merge. Whether to make a checklist item blocking is a separate decision, to be taken once the listings have been seen on real pull requests.
- **Not wired into CI.** The output reaches a reviewer only when someone runs `node scripts/review-checklist.js`. A workflow step that posts the listing on each pull request is the natural follow-up.
- **Ten seeds, by design.** The rest of `workspace/learnings.md` stays out. Entries should be added only with a tracked source that a diff can show.

## Scope Deviations

- One test failed on a field-name mismatch (`line` against `lineNo`). The script was changed to the name the test used. The test was not changed.
