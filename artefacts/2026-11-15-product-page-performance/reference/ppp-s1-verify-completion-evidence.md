# ppp-s1 verify-completion evidence

Date: 2026-11-15. Branch: `feature/ppp-s1-product-page-performance` (commits f28f1dcfd red tests, 0afa772c1 implementation). Draft PR: #1105.

## Result

7 of 8 acceptance criteria verified by automated tests. AC8 (live timing of the skills-framework product page, second and later loads under 3 s) can only be observed after deploy and is left open for the DoD.

## Tests

- `tests/check-ppp-s1-decisions-cache.js`: 11 passed, 0 failed. Written first and run red (all 11 failed, the cache function and seams did not exist); after the cache module was added 10 passed and T6 (parallel reads) still failed for the right reason (only 1 query in flight); after the handler change 11 passed. Mapping: T1 and T9 AC1, T2 AC2, T3 AC3, T4a and T4b AC4, T5 AC5, T6 AC6, T7 AC7, T8a and T8b the token and slug-validation NFRs.
- Related handler tests: urpv-s3 16/16, urpv-s4 17/17, itar-s3 14/14, ep4-s2 6/6. urpv-s3 and urpv-s4 initially failed (4 and 2 tests) because the process-wide cache survived between scenarios that reuse the same slug with different mocks; fixed with one `_clearDecisionsCache()` line in each file's render helper, as the test plan anticipated, with no assertion changes.

## Full suite

856 files, 9 failed on the one full run. Five are the baseline acknowledged at branch-setup for the previous story (`scripts/check-pipeline-state-integrity.js`, `tests/check-cat-s1-core-trace-builder.js`, `tests/check-p3.5-validate-trace.js`, `tests/check-pcr-s1-test-runner.js`, `tests/check-rtvap-s1-archived-test-plan-coverage.js`). The other four were not caused by this change: `check-ic-s1-canvas-render`, `check-ic-s3-canvas-pan-zoom` and `check-ic-s4-keyboard-node-movement` failed because the new worktree had no `node_modules` (the `drawflow` package was missing); after linking the main checkout's `node_modules` into the worktree they pass. `check-p4-enf-second-line` passes alone (21 passed, 1 skipped) and failed only under full-suite load.

Side effect noted: the full suite modified tracked `artefacts/test-slug/ideate.md`; reverted with `git checkout --`.

## Design note

Parallelism was added by starting each independent read as a promise early (guarded so an earlier failure cannot leave an unhandled rejection) and awaiting it at the point it was awaited before, so every try/catch and fallback value is unchanged. The cached decisions fetch starts as soon as the feature slugs are known, so it overlaps the artefact-count and session-origin reads.

## Open

AC8: after merge, staging deploy and operator promotion, a read-only timing of `/products/<skills-framework id>` three times; expect the first load after deploy to be slow and the second and third under 3 s (baseline 16.3 s and 15.7 s, 2,972 KB).
