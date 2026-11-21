## Test Plan: A week in which the improvement agent finds nothing to review opens no pull request

**Story reference:** artefacts/2026-11-21-dreaming-quiet-weeks/stories/dqw-s1-quiet-weeks-open-no-pull-request.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-21
**Test runner (read from package.json):** `npm test` runs `scripts/run-all-tests.js`, which runs `tests/check-*.js`. New check: `tests/check-dqw-s1-quiet-weeks.js`, in the chain automatically. Like the ciw-s1 check it drives the real `scripts/improvement-agent-deliver.js` in a temporary git repository with a bare `origin` and a stand-in `gh`; no network. The scaffolding is copied from the ciw-s1 check (that file is not edited).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Risk |
|----|-------------|------|-------------|-----|--------|------|
| AC1 | Only state and result changed, attention false: no branch, commit or pull request; "Nothing to review this week"; exit 0 (also CLI); nothing left staged | - | 1 (Q1) | - | - | 🟢 |
| AC2 | `skipped: true` is quiet | - | 1 (Q2) | - | - | 🟢 |
| AC3 | Missing or malformed result with no proposals fails closed naming the file | - | 2 (Q3 missing, Q4 malformed) | - | - | 🟢 |
| AC4 | Proposals open a pull request even if attention is false; attention true opens one without proposals | - | 2 (Q5, Q6) | - | - | 🟢 |
| AC5 | Open dreaming pull request plus a quiet week: branch head unchanged, no create | - | 1 (Q7) | - | - | 🟢 |
| AC6 | Stray staged path still fails closed in a quiet week | - | 1 (Q8) | - | - | 🟢 |
| AC7 | `check-ciw-s1` and `check-bkn-s1` pass unchanged | existing | existing | - | M1: run both and the full chain | 🟢 |

## Red first

Expected on master before the change: Q1 (quiet week), Q2 (skipped), Q3 (missing result), Q4 (malformed result) and Q7 (open pull request plus a quiet week) fail, because the merged script opens a pull request or adds a commit whenever any allowed path changed and never reads the result file. Q5 (proposals with attention false), Q6 (attention true without proposals) and Q8 (stray path in a quiet week) already pass and pin behaviour that must not change. Measured before any implementation.

## Manual steps

- **M1:** run `check-ciw-s1-improvement-agent-delivery`, `check-bkn-s1-bookkeeping-push-noise`, then the full `npm test` plus `scripts/ci-test-regression-check.js`.
- **M2:** list changed files on the pull request and on master after the merge.
- **M3 (optional, operator-approved):** one more `workflow_dispatch` after the merge; expected green with "Nothing to review this week" and no new pull request. The agent does not start it without a go-ahead.
- **M4:** confirm a CI run exists on the final commit before the merge is requested; verify the remote head after every push.

## Gaps

On the real runner the agent's own output decides which branch is taken; the live run (M3) is the only check of that. A run that finds proposals is only exercised by the scratch tests, as the real repository currently has none to find.
