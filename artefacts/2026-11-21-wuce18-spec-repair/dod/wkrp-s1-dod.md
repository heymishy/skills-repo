# wkrp-s1 Definition of Done

Date: 2026-11-21. Story: the keyboard-navigation E2E spec checks the nav links the sidebar has today, so it passes instead of timing out. Pull request #1173 merged 2026-11-21 (`5ca3cc5f6`). No issue.

## Result: COMPLETE. All 5 acceptance criteria met. CI ran on the pull request's final commit (`e9b15d635`), and the changed files were checked on master after the merge.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | `tests/e2e/wuce18-keyboard-nav.spec.ts` run alone: before the change, test 1 timed out at 30 s waiting for the "Run a Skill" link and test 2 passed (measured on master `7ff0618ff`); after, 3 of 3 runs with both tests passing (17.0 s, 7.2 s, 7.3 s). In CI: 2 passed, 0 failed in the E2E reports for the spec commit (`a49ec1d1f`) and for the final commit (`e9b15d635`) | automated | none |
| AC2 | ✅ | the label list is `['Org board', 'Pod Manager', 'Signals', 'Journeys']`, compared against `NAV_ITEMS` in `src/web-ui/utils/html-shell.js`: the non-account, non-admin rows (M2). A removed or renamed link fails test 1 | manual (diff read) | none |
| AC3 | ✅ | only the label list and a comment changed (3 lines added, 1 removed); the `locator.focus()` mechanism, the contains-label assertion and test 2 are untouched | manual (diff read) | none |
| AC4 | ✅ | CI E2E report: `wuce18` 2 passed, 0 failed on both commits. The matrix entry moved from `quarantined` to `extended` with a rewritten reason in the second commit; CI then ran on that final commit (all 9 checks passed) | automated (CI report) | none |
| AC5 | ✅ with deviation | the merged pull request changed the spec and `tests/e2e/capability-matrix.json` (checked on master: both files, 7 insertions, 11 deletions) | manual (diff check) | the matrix file also carries the `bmau-s1` move that the bmrp-s1 pull request left out (see observations) |

## CI evidence

All 9 checks passed on the spec commit and again on the final commit, including `Lint, typecheck, test, build` (no new regression against the known baseline). A wider local `npm test` showed only the two known local-only failures (`check-pcr-s1-test-runner`, `check-p3.5-validate-trace`), which also fail on the master checkout.

## Observations and follow-ups

- **The `bmau-s1` matrix move was delivered here.** The bmrp-s1 pull request was squash-merged from its spec commit only, so its matrix commit never reached master; found while preparing this move, recorded in the bmrp-s1 DoD, and the move was included in this pull request with its own CI evidence (`bmau-s1` passed in the reports for #1172 and #1173). Both specs are now `extended` on master.
- **Three specs remain quarantined:** `dsa-s2` (counts shared-tenant journeys), `ep3-s1` (product bug, issue #1042) and `fpd-s4` (needs a playback fixture that does not exist).
- **The nav labels are now tied to the spec by hand.** A later nav change fails this spec again, which is its purpose; a shared source of truth for the labels was out of scope.
- **Process change that worked:** CI was confirmed on the final commit before the merge was requested, and master was checked after the merge.

## Scope Deviations

One addition beyond the contract: the `bmau-s1` matrix move (above), same file, same kind of change.
