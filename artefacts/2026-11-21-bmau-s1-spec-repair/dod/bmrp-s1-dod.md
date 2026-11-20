# bmrp-s1 Definition of Done

Date: 2026-11-21. Story: the bulk-assign E2E spec opens the collapsed group it clicks in, so it passes instead of timing out. Pull request #1172 merged 2026-11-21 (`255830384`). No issue.

## Result: COMPLETE. All 6 acceptance criteria met, AC5 closed on 2026-11-21 by the wkrp-s1 pull request (see AC5). The repaired spec passed in the CI E2E report on its first run, the first CI pass it has ever had. History: the first version of this DoD wrongly said the matrix move had merged; it had not (see AC5), and it was delivered later by #1173.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | `tests/e2e/bmau-s1-bulk-assign-rerender.spec.js` run alone: before the change, failed at the first `check()` with "element is not visible" after 30 s (measured on master `7ff0618ff`); after, 3 of 3 passes (8.4 s, 5.2 s, 5.1 s) | automated | none |
| AC2 | ✅ | the spec clicks the Unclassified group's header and asserts `aria-expanded="true"` before it uses the checkboxes (read in the diff, M2) | manual (diff read) | none |
| AC3 | ✅ | every original assertion is kept: rows move into the target module's body (2) with the URL unchanged, Unclassified ends at 0, headers read (2) and (0). The second half of the spec had never run in this harness before; it passes | automated + diff read | none |
| AC4 | ✅ | the stale "KNOWN GAP ... Adapter not wired: modulesDb" header is replaced. It was wrong: the spec creates the module (201) and reaches the checkbox | manual (diff read) | none |
| AC5 | ✅ with deviation | CI E2E report for the pull request's spec commit (`5a9e27800`, run `44799391089`): `bmau-s1` 1 passed, 0 failed. The matrix move (commit `52a9cb493`, `quarantined` to `extended`) was pushed to the pull request branch after that run, but the pull request was squash-merged from the spec commit only: **the matrix change is not on master** (checked 2026-11-21: `bmau-s1` is `quarantined` on `origin/master`) | automated (CI report) | the matrix half was not in this pull request. It was delivered by the wkrp-s1 pull request (#1173, merged `5ca3cc5f6`) with CI evidence on its final commit: `bmau-s1` passed in the E2E reports for #1172 and #1173, and master now has it in `extended` (checked after that merge) |
| AC6 | ✅ | the merged pull request changed the spec only (plus artefacts); the matrix file was not part of the merge | manual (diff check) | none |

## CI evidence

All 9 checks passed on the spec commit, including `Lint, typecheck, test, build` (no new regression against the known baseline), Core browser tests and both scenario jobs. In the E2E report, the quarantined specs read: `bmau-s1` passes; `dsa-s2` (2 failures), `ep3-s1`, `fpd-s4` and `wuce18` (1 failure) still fail, as before. A wider local `npm test` showed only the two known local-only failures (`check-pcr-s1-test-runner`, `check-p3.5-validate-trace`), which also fail on the master checkout.

## Observations and follow-ups

- **The second half of the spec was untested until now**, and it passed first time. The risk named in the DoR (W1, a further failure behind the first) did not materialise.
- **`bmau-s1` is now `extended` on master** (non-blocking), delivered by #1173. Moving it to `core` is the operator's call.
- **Three specs remain quarantined** (`wuce18` was repaired in wkrp-s1): `fpd-s4` (needs a playback fixture that does not exist), `ep3-s1` (product bug, issue #1042) and `dsa-s2` (counts shared-tenant journeys).
- **The process gap:** a commit pushed to a draft pull request just before the merge was left out of the squash merge, and I reported it as merged without checking master. After a merge, check the changed files on master, not only the pull request state. Found while preparing the `wuce18` matrix move.

## Scope Deviations

None.
