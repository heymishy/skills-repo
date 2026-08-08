## Definition of Ready: mar-s1 — Remove check-md-3-adr.js's nested full-suite npm test recursion

**Story:** artefacts/2026-08-08-check-md-3-adr-recursion-fix/stories/mar-s1-remove-nested-npm-test-recursion.md
**Review artefact:** artefacts/2026-08-08-check-md-3-adr-recursion-fix/review/mar-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-08-check-md-3-adr-recursion-fix/test-plans/mar-s1-test-plan.md
**Date:** 2026-08-08

---

### Scope contract

**Files in scope (exact touchpoints):**
- `tests/check-md-3-adr.js` — remove `T4`'s `execSync('npm test', ...)` block (lines 93–131) and its `npm_lifecycle_event` guard; T1–T3 unchanged.
- `tests/known-baseline-failures.json` — remove this file's entry, if present.
- `tests/check-tst-s1-baseline-triage.js` — correct or annotate the comment (lines 127–132) documenting this file as permanently unfixable.
- `tests/check-mar-s1-*.js` (new) — unit/integration tests per the test plan.

**Files explicitly out of scope (must not be touched):**
- `.github/architecture-guardrails.md` — the ADR-015 content T1–T3 verify is correct as-is; not touched.
- `tests/check-p3.5-validate-trace.js` — the separately-starved file; not re-tuned as part of this fix.
- `scripts/run-all-tests.js`, `scripts/ci-test-regression-check.js` — consumed, not modified.

### Architecture Constraints

No structural or architectural decision is introduced. This is a deletion of a self-contained, redundant assertion block from one test file. No ADR required.

### Human oversight

**Low** — single-file deletion, well-understood root cause (confirmed via direct testing of the guard mechanism plus this repo's own prior documentation), complexity 1, no upstream/downstream code dependency (only a documentation-consistency dependency, itself part of this story's scope).

### Coding Agent Instructions

1. In `tests/check-md-3-adr.js`, delete `T4`'s entire block (the `console.log` header, the `npm_lifecycle_event` guard, both branches, and the `execSync`/`extractFailedFiles`/`loadBaseline` usage specific to T4). Keep the `require(path.join(ROOT, 'scripts', 'ci-test-regression-check.js'))` line only if still needed elsewhere in the file (it is not — remove the now-unused `execSync` import too if nothing else in the file uses it).
2. Confirm the file's final `Results:` summary line and `process.exit(failed > 0 ? 1 : 0)` still work correctly with only T1–T3's `passed`/`failed` counters.
3. Check `tests/known-baseline-failures.json` for an entry referencing `check-md-3-adr.js`; remove it if present.
4. In `tests/check-tst-s1-baseline-triage.js`, correct the comment at lines 127–132 to state the file has been fixed (with a reference to this story), rather than leaving it describing an unfixable condition.
5. Write the tests per the test plan; run the full suite once to confirm zero new regressions (AC4).

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified (none — this is a backend test-suite fix with no UI)

**PROCEED: Yes**
