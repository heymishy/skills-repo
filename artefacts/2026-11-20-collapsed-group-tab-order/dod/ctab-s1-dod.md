# ctab-s1 Definition of Done

Date: 2026-11-20. Story: content inside a collapsed product-view group is not reachable by keyboard or screen reader until the group is opened. Pull request #1169 merged 2026-11-20 (`edda66045`). No issue.

## Result: COMPLETE for the keyboard path. The screen-reader effect follows from the CSS but was not separately checked. The first CI run failed one check (a missing matrix entry); fixed in the same pull request, second CI run all green.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | `tests/e2e/ctab-s1-collapsed-group-tab-order.spec.js` T-E1: 120 Tab presses on a product page with one feature, no stop inside a collapsed group. Red first: before the change it failed with the row link, the rename button and the pods button inside collapsed groups (the same 6 stops of 78 as the original probe). Passes locally and in the first CI run | automated | none |
| AC2 | ✅ | T-E2: the header opens the group with Enter (`aria-expanded="true"`) and the next Tab stop is inside that group. Passed before and after, as the test plan predicted (the header was never the problem); passes locally and in CI | automated | none |
| AC3 | ✅ | T-E3: closing the group again sets `aria-expanded="false"`, its body resolves to `visibility: hidden`, and no Tab stop inside it in 40 presses from the header. Red first: failed before the change at the `visibility` assertion; passes after, locally and in CI | automated | none |
| AC4 | ✅ | `tests/check-ctab-s1-collapsed-group-not-focusable.js` (in the `npm test` chain), T1 to T3: a collapsed body is `visibility: hidden` with the visibility change delayed by 0.25 s; an expanded body resolves to not hidden, with a 0 s delay; the header sits outside the body and keeps `aria-expanded` and `aria-controls`. Before the change 1 passed, 2 failed; after, 3 passed | automated | A first draft of T2 failed for the wrong reason (its rule-extraction regex did not allow `>` before the first selector); fixed in the test before the product change, so the red result is for the right reason |
| AC5 | ✅ with deviation | `check-pdt-s1-consolidate-epic-list` (7 passed) and `check-pflx-s1-auto-expand-search-match` (5 passed) pass unchanged; all 93 node checks that reference `routes/products` pass; `frsr-s1` (2 tests) passes; `a4-module-expand-collapse` is skipped by its own `test.skip` before and after; `ep2-s1` and `ep2-s2` pass when run with `bmau-s1` and `a4` (once on master, twice on the branch; the pull request text says three, which was one too many) | automated | `bmau-s1` fails before and after, identically on master (see observations). And a spec that creates a product and a feature, run in parallel with `ep2-s1` or `ep2-s2`, makes an `ep2` spec fail: reproduced on plain master with `frsr-s1` alone (3 of 3), and with the new spec on the branch (3 of 3). Existing behaviour, not caused by this change |
| AC6 | ✅ | T-E4: a search whose text matches a feature opens the group (`aria-expanded="true"`) and Tab from its header enters it. Passed before and after (the search path removes the same class); passes locally and in CI. `check-pflx-s1` proves the class removal in jsdom | automated | none |
| AC7 | ✅ with deviation | the pull request changed `src/web-ui/routes/products.js` (the two stylesheet strings and a comment; no markup or script), the new check, the new spec, one entry in `tests/e2e/capability-matrix.json`, and artefacts (`decisions.md`, the story and the test plan) | manual (diff check) | The matrix entry was not in the DoR contract. CI caught it: `check-lpw-s2-capability-matrix` requires every spec file to appear once in the matrix with a lane. Added as a six-line entry in lane `extended` (not core: the new spec makes the core spec `ep2-s2` fail when run alongside it); the artefacts were updated to name the matrix as a touchpoint (`decisions.md` D2) |

## CI evidence

| Run | Result |
|---|---|
| First (head `196a2722c`) | `Lint, typecheck, test, build` failed: `tests/check-lpw-s2-capability-matrix.js`, the one new regression against the known baseline ("spec file is missing from the matrix"). Core browser tests, the E2E job, both scenario jobs and the others passed. In the E2E report: the 4 new tests, `frsr-s1` (2) and `ep2-s2` (2) passed; 13 failures, none involving this change: `bmau-s1`, `dsa-s2` x2, `ep3-s1`, `fpd-s4`, `wuce18`, `s1.1`, `s3.2`, `spdr-s2` (consistent or already known intermittent) and `ep1-s2`, `ep2-s1`, `ic-s2`, `jasb-s1` (intermittent) |
| Second (head `704b423b8`, with the matrix entry) | all 10 checks passed, including `Lint, typecheck, test, build` and Core browser tests |

- **A wider local `npm test` run** showed two failing files, `check-pcr-s1-test-runner.js` and `check-p3.5-validate-trace.js`, that CI did not flag. Both also fail on the master checkout (`pcr-s1` every time; `p3.5` failed in the full run and in one of two standalone runs, once passing in the worktree and once failing on master), so they are effects of the local environment, not of this change.
- **My first sweep missed the matrix check** because I only ran node checks that reference `routes/products`; the failing check does not. Running the full `npm test` and CI's regression script (`scripts/ci-test-regression-check.js`) before pushing would have caught it.

## Observations and follow-ups

- **`bmau-s1` is another stale spec of the same kind as `frsr-s1`:** it clicks `.bmau-item-checkbox` inside a collapsed group without opening it first. On master it timed out with the cause "not found"; with this change the error reads "element is not visible". Quarantined in the matrix as "cause not found". A candidate for a short spec repair (open the group first), not done here.
- **The capability matrix still lists the five specs repaired in esh-s1 as `quarantined`** (`ep1-s3`, `ep1-s4`, `fpux.1`, `jcx-s6`, `frsr-s1`), with reasons recorded on 2026-11-17 that are now wrong. They pass now, so the entries should move out of quarantine, to `extended` (non-blocking) or `core` (blocking: the operator's call). This was not known when esh-s1 was closed. Recorded in `decisions.md` D2.
- **Test isolation is the next story.** The `ep2` interference reproduced here (any spec that creates a product and feature, run in parallel with `ep2-s1` or `ep2-s2`, makes an `ep2` spec fail, on master too) is the clearest, cheapest case to start from: it is reproducible in about 12 seconds with three specs, and the message is "No default pod set." in `#default-pod-display`.
- **Not checked:** a screen reader, or an accessibility-tree snapshot. `visibility: hidden` removes content from the accessibility tree by specification; it was not verified in a browser.
- **No visual change:** the group animates and looks as before; `visibility` does not alter layout. Not separately measured, because `a4-module-expand-collapse`, the spec that measures the height mid-animation, is skipped.

## Scope Deviations

- One file beyond the contract: `tests/e2e/capability-matrix.json` (one entry), required by an existing repository check. Listed under AC7.
