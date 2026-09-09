# Definition of Ready: dmcb-s1 — document matrix spurious/duplicate column bugs

**Track:** Short-track
**Test plan:** artefacts/2026-09-09-doc-matrix-column-bugs/test-plans/dmcb-s1-test-plan.md
**Complexity:** 1 (well understood, clear path — both root causes precisely located via live production data + code trace, fixes are small and localized to one function each)
**Human oversight:** Low

## Readiness checks

- [x] Scope is testable without ambiguity — T1-T4 above, all server-rendered HTML/data assertions.
- [x] Out of scope declared: no change to `_deriveMatrixColumn`'s own per-file classification logic (it is correct as-is; existing tests for it, e.g. `check-fadm-s1-document-matrix.js`'s "bare story file -> story" test, must keep passing unchanged), no change to `artefact-trace.js`'s `walkDir`/`type`-tagging behaviour (also correct as-is — `'epics'` is the accurate subdirectory-derived type for these files; the bug is downstream, in how `_buildGroupedFromTrace` routes that type).
- [x] No dependency on an incomplete upstream story — the affected code (`canonical-artefact-trace`/`fadm-s1`) is already merged and DoD-complete.
- [x] NFRs identified: none beyond the regression coverage itself — this is a pure server-side rendering fix, no new queries, no new user input, no accessibility change (existing `title`/scope semantics on `<th>` unaffected).
- [x] H-ADAPTER check: no adapter changes in this scope — N/A.

## Coding Agent Instructions

1. `src/web-ui/routes/features.js` line ~471 (`_buildGroupedFromTrace`): change the condition `artefact.type === 'feature-level' && !artefact.inferredGroup` to `(artefact.type === 'feature-level' || artefact.type === 'epics') && !artefact.inferredGroup`.
2. `src/web-ui/routes/features.js` line ~608-609 (`renderArtefactMatrix`'s `columns` computation): exclude `'story'` from both parts of the filter/concat chain, since column 0 (`doc-matrix__story-col`) already covers it.
3. Add T1-T3 to `tests/check-cat-s4-features-page-integration.js` (T1, since it already tests `_buildGroupedFromTrace` directly) and `tests/check-fadm-s1-document-matrix.js` (T2, T3, since they test the rendered matrix output) — extend the existing files, do not create a new one, matching this repo's own convention of adding regression coverage to the test file that already owns the affected behaviour.
4. Run T4: confirm both existing suites pass unchanged, plus the full test suite for no other regressions.
5. Once fixed and verified in the worktree, this is a genuinely live-reproducible production bug — after merge, confirm the fix directly on `skills-framework.fly.dev/features/2026-06-22-wuce-multi-tenancy` via Chrome (the exact page the operator reported), not just via automated tests.

## Sign-off

**Proceed:** Yes — signed off directly (short-track, complexity 1, low oversight, root cause independently confirmed against live production data before any code was written).
