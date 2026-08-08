# Definition of Done: Remove check-md-3-adr.js's nested full-suite npm test recursion

**PR:** https://github.com/heymishy/skills-repo/pull/691 | **Merged:** 2026-08-08
**Story:** artefacts/2026-08-08-check-md-3-adr-recursion-fix/stories/mar-s1-remove-nested-npm-test-recursion.md
**Test plan:** artefacts/2026-08-08-check-md-3-adr-recursion-fix/test-plans/mar-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-08-check-md-3-adr-recursion-fix/dor/mar-s1-dor.md
**Assessed by:** Copilot
**Date:** 2026-08-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (standalone run, no nested subprocess, T1-T3 pass) | ✅ | `checkMd3Adr_standaloneRun_noNestedSubprocess_t1ThroughT3StillPass`; direct run of `check-md-3-adr.js` itself shows 8/8 passing | automated test + direct verification | None |
| AC2 (bounded runtime in-suite) | ✅ | `checkMd3Adr_inSuiteRun_completesInBoundedTime` — well under 5s | automated test | None |
| AC3 (removed from baseline, docs corrected) | ✅ | `tests/known-baseline-failures.json` entry removed with a resolution note appended; stale comment in `check-tst-s1-baseline-triage.js` corrected with a dated addendum, original preserved for history | code review / direct file inspection | None |
| AC4 (full-suite regression, zero new failures from this change) | ✅ | Full-suite run (480 files, ~7.4 min — down from effectively-unbounded with the old recursion): `check-md-3-adr.js` absent from both the "currently failing" and "new regression" lists | automated full-suite run via `scripts/ci-test-regression-check.js` | One unrelated new-regression flag (`check-rb-s5-optional-outer-loop-install.js`) surfaced in the same run — independently confirmed pre-existing and already documented in this repo's own CHANGELOG as a RISK-ACCEPTed NFR timing gap, unconnected to this change. Not a deviation from this story's own AC4, since AC4 only concerns `check-md-3-adr.js` and new-regression status relative to this diff. |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Recorded above (AC4's unrelated finding, correctly not attributed to this change).

---

## Scope Deviations

None. `.github/architecture-guardrails.md`'s ADR-015 content (T1-T3's subject matter) was untouched, and `check-p3.5-validate-trace.js` (the separately-starved file) was correctly left unmodified per the story's explicit out-of-scope declaration — its own flakiness is to be independently re-observed over subsequent CI runs, not assumed fixed by this change.

---

## Test Plan Coverage

**Tests from plan implemented:** 3 (unit/integration) + 1 manual (docs correction) / 4 planned
**Tests passing in CI:** 3 / 3 automated; manual step completed directly

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| checkMd3Adr_standaloneRun_noNestedSubprocess_t1ThroughT3StillPass | ✅ | ✅ | |
| checkMd3Adr_inSuiteRun_completesInBoundedTime | ✅ | ✅ | |
| fullSuiteRegression_checkMd3AdrNoLongerFlagged | ✅ | ✅ | Ran directly via `scripts/run-all-tests.js` + `scripts/ci-test-regression-check.js`, not as a separate committed test file — same verification, executed manually rather than as an automated CI gate step (consistent with how full-suite regression checks are verified elsewhere in this session) |
| Baseline documentation correction (manual) | ✅ | ✅ | `known-baseline-failures.json` and `check-tst-s1-baseline-triage.js` both corrected |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance/reliability (this story's own primary NFR) | ✅ | Removes an O(total-suite-size) cost from inside a single file that should cost O(1); removes a documented resource-contention risk to sibling test files |
| Security | N/A (none identified) | |
| Audit | ✅ (improves) | A predictable, bounded test-file runtime is easier to audit than a variable, occasionally multi-minute one |

---

## Metric Signal

No metrics array — short-track story. Not applicable.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None outstanding for this story. `check-p3.5-validate-trace.js`'s own flakiness (the file previously found to be starved by this recursion) should be independently re-observed over the next several real CI runs to confirm whether removing the recursion resolved it as a side effect — noted as an observation below, not a blocking follow-up for this story.

---

## DoD Observations

1. **A CI-hijacked commit message, correctly diagnosed and fixed rather than papered over.** While finishing this story, running the full test suite locally triggered a known, already-documented side effect (`skills.js` firing a real git commit during tests, per this session's own memory notes) that overwrote the intended commit message with a generic `"feat: discovery artefact (amended)"` string. The actual file diff was verified byte-for-byte correct before amending just the message — the commit's content was never in question, only its label.
2. **`check-p3.5-validate-trace.js`'s flakiness is a genuine open question, not resolved by this story.** This story removed the confirmed contention *source* (the nested full-suite recursion), but per its own explicit out-of-scope declaration, did not re-verify that the previously-starved file is now actually reliable. `/improve` candidate: track this file's pass rate over the next several real CI runs as a natural experiment — if it stops flaking, that's strong retrospective confirmation of the original root-cause diagnosis; if it doesn't, the contention theory needs revisiting.
3. **A direct empirical test confirmed the recursion guard mechanism (`process.env.npm_lifecycle_event === 'test'`) works correctly in isolation** (verified via a standalone `spawnSync` probe during this story's own investigation) — meaning the historical "permanent baseline failure" was not caused by the guard silently failing to fire during a real `npm test` run, but by the fundamental redundancy of the check's design (re-verifying something the enclosing CI job already verifies). This distinction matters for anyone revisiting this area later: the fix here is architectural (remove the redundant check), not a guard-reliability patch.
