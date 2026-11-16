## Test Plan: Stop opening an incident PR per production error issue; record the incident in the fix PR instead

**Story reference:** artefacts/2026-11-16-ci-regression-review/stories/inc-s2-record-incidents-in-the-fix-pr.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-inc-s2-record-incident-locally.js`. It reads the workflow as text with the same small `on:` extractor used by `tests/check-ciw-s2-deprecated-workflows.js`, and runs `scripts/record-incident-from-issue.js` as a child process against fixture issue files and temporary incident files (never the real `workspace/incidents.json`). The existing `tests/check-coha-s7-error-issue-incident.js` is edited at W1 only.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Workflow triggers: only workflow_dispatch with the three inputs | 1 (T1) | - | - | - | - | 🟢 |
| AC2 | Header documents the retirement and both alternatives | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | Local script records one incident from a recognised issue | - | 1 (T3) | - | - | - | 🟢 |
| AC4 | Second run is a no-op | - | 1 (T4) | - | - | - | 🟢 |
| AC5 | Unrecognised issue or no author: file unchanged, exit 1 | - | 1 (T5, several cases) | - | - | - | 🟢 |
| AC6 | No git, no PR, one read API call, only the incident file changes | 1 (T6 source scan) | 1 (T6 directory diff) | - | - | - | 🟢 |
| AC7 | Existing coha-s7 tests pass with only W1 changed | - | the full suite | - | - | - | 🟢 |
| AC8 | Live: next production error opens no incident PR | - | - | - | 1 | Live-only | 🟡 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs the next natural production error | AC8 | Live-only | Verification scenario 9; no deliberate error is created |

## Tests (new file `tests/check-inc-s2-record-incident-locally.js`)

- **T1 (AC1).** `error-issue-incident-record.yml`: top-level trigger names are exactly `['workflow_dispatch']` and the three inputs (`issue_number`, `dry_run`, `rebuild`) remain. Fails today (`issues` is a trigger).
- **T2 (AC2).** The leading comment block contains `inc-s2`, `2026-11-16`, `retired`, `workflow_dispatch` and `record-incident-from-issue`. Fails today.
- **T3 (AC3).** Fixture bridge issue (made-up author `Example-Bot`, label `production-error`, body with `PostHog issue id: <uuid>`, `First seen:`, `Environment:`, `PostHog:` lines, a valid `html_url` and number) written to a temp file; empty incident file `[]`; run with `--event`, `--author Example-Bot`, `--incidents`: exit 0, the file now has exactly 1 record with tags `production-error` and `posthog:<uuid>`, stdout names the file to include in the fix PR. Fails today (script missing).
- **T4 (AC4).** The same command again: exit 0, still exactly 1 record, stdout says `already recorded`.
- **T5 (AC5).** Each of: wrong author, missing label, missing marker, a title with a control character, and no author given (env cleared): exit 1, the file is byte-identical, stderr or stdout names a reason; the "no author" case never calls `gh`.
- **T6 (AC6).** The script source has no `git ` command, no `gh pr`, no `--method`, `-f`, `-F` or `--input` on a `gh` call, and its only `gh` call is `api repos/{owner}/{repo}/issues/<n>`; after a run in a temp dir the directory contains no file other than the fixture issue and the incident file.

AC7 is verified by the full suite (`check-coha-s7-error-issue-incident` with W1 changed: it asserts the retired trigger list `['workflow_dispatch']`).

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| The real `gh api` call is not exercised | No network in tests | `--event` takes the same JSON shape `gh api` returns (a bare REST issue object, which `normaliseEvent` already accepts); the live use is the operator's first run |

**Total automated tests:** 6 (T1 to T6) plus the edited W1 and AC8 live.
