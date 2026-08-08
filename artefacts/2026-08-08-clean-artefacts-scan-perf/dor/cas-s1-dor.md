## Definition of Ready: cas-s1 — Make clean-local-test-artefacts.js's bare-discovery scan early-exit instead of building a full file list per directory

**Story:** artefacts/2026-08-08-clean-artefacts-scan-perf/stories/cas-s1-early-exit-bare-discovery-scan.md
**Review artefact:** artefacts/2026-08-08-clean-artefacts-scan-perf/review/cas-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-08-clean-artefacts-scan-perf/test-plans/cas-s1-test-plan.md
**Date:** 2026-08-08

---

### Scope contract

**Files in scope (exact touchpoints):**
- `scripts/clean-local-test-artefacts.js` — `findBareDiscoveryDirs`/`listFilesRecursive` (lines 41–56, 72–85): add early-exit once a second file is found, instead of building the complete recursive file list first.
- `tests/check-cas-s1-*.js` (new) — unit tests per the test plan.

**Files explicitly out of scope (must not be touched):**
- `findTestTmpDirs`, `isTracked`, `removeDirRecursive` — not implicated by this finding.
- `tests/check-tdc-s1-clean-local-test-artefacts.js` — consumed as a regression guard, not modified.

### Architecture Constraints

No structural or architectural decision is introduced — a single function gains an early-exit condition; the "bare discovery.md directory" definition itself is unchanged.

### Human oversight

**Low** — single-function fix, complexity 1, no upstream/downstream dependency.

### Coding Agent Instructions

1. In `scripts/clean-local-test-artefacts.js`, replace `listFilesRecursive`'s use inside `findBareDiscoveryDirs` with a new helper (e.g. `hasAtMostOneFile(dirPath)`) that recurses the same way but returns `false` as soon as a second file is found anywhere in the subtree, without continuing to walk the rest of it.
2. Keep `listFilesRecursive` itself if it's used elsewhere (check first) — otherwise it may be removed once nothing calls it, but only if confirmed unused.
3. Write the tests per the test plan, including the instrumented bounded-visits test (AC4) — a spy/counter on `fs.readdirSync`, not a timing assertion.
4. Re-run `tests/check-tdc-s1-clean-local-test-artefacts.js` to confirm AC3.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified (none — backend CLI script, no UI)

**PROCEED: Yes**
