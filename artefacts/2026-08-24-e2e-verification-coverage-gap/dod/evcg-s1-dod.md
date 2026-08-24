# Definition of Done: Close the E2E verification blind spot in /verify-completion and /branch-complete

**PR:** https://github.com/heymishy/skills-repo/pull/761 | **Merged:** 2026-08-24
**Story:** artefacts/2026-08-24-e2e-verification-coverage-gap/stories/evcg-s1-verify-completion-route-e2e-check.md
**Test plan:** artefacts/2026-08-24-e2e-verification-coverage-gap/test-plans/evcg-s1-test-plan.md
**DoR:** artefacts/2026-08-24-e2e-verification-coverage-gap/dor/evcg-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-24

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `/verify-completion` Step 1 requires identifying touched routes/handlers and grepping both `tests/*.js` and `tests/e2e/*.spec.js` | ✅ | `routeDiffTriggersGrepBothTestSuites` test, re-run fresh against merged master | Automated content-assertion test | None |
| AC2 — `@mocked`/untagged E2E matches run locally as part of the evidence gate, failure blocks completion | ✅ | `mockedMatchRunsLocallyAndBlocksOnFailure` test | Automated content-assertion test | None |
| AC3 — `@real-staging` matches named as an explicit residual risk, never run locally, never silently omitted | ✅ | `realStagingMatchNamedAsResidualRiskNotRunLocally` test | Automated content-assertion test | None |
| AC4 — `/branch-complete` Step 1 references the check by name, does not duplicate the full instruction text | ✅ | `branchCompleteReferencesVerifyCompletionCheckByReference` test | Automated content-assertion test | None |
| AC5 — `check-skill-contracts.js` guards both new sections so a future edit cannot silently strip this step | ✅ | `skillContractsGuardBothNewSections` + `skillContractsScriptActuallyPasses` (runs the real script), re-run fresh: `41 skill(s), 183 contract(s) OK` | Automated test + integration test | None |

**All 5 ACs satisfied.** 9/9 tests re-run fresh against merged master (commit `bf919f5b`), 0 failures.

---

## Scope Deviations

None. All 9 files in the merged diff (`skills/verify-completion/SKILL.md`, `skills/branch-complete/SKILL.md`, `.github/scripts/check-skill-contracts.js`, the new test file, 3 new artefacts, `.github/pipeline-state.json`, plus `tests/check-md-2-skill-contracts.js`) map directly to the story or its one legitimate collateral fixture repair (the `check-skill-contracts.js` total-contract-count assertion, updated `175 → 179` to match the story's own legitimate addition).

---

## Test Plan Coverage

**Tests passing:** 9/9, re-run fresh 2026-08-24 against merged master (commit `bf919f5b`) — `tests/check-evcg-s1-verify-completion-e2e-check.js`.

**Gaps:** None. This is a `SKILL.md` instruction-text change; per the story's own Architecture Constraints, tests assert on the actual instruction text present in the real files, following this repo's established pattern (`csd-s4`, `dta-s1`).

**Real-world validation beyond the test plan itself:** this fix was proven against the exact failure it was designed to prevent, in the same session it was built. `rcfc-s1`'s PR #760 failed CI's "Cross-tenant isolation spec" job (a `@mocked` E2E regression `/verify-completion`'s old Step 1 never would have caught) and, after that fix, failed "Scenario A E2E (staging)" (a `@real-staging` deploy-lag edge case). Both failure classes are exactly what this story's AC2/AC3 close — this is not a hypothetical fix validated only by content-assertion tests, but a direct response to two real CI-only failures observed the same day.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — zero added local runtime for non-route-touching stories | ✅ | `nonRouteTouchingDiffSkipsCheckExplicitly` test confirms the explicit "N/A" / "do not run unconditionally" language is present |
| Security / Accessibility / Data-residency / Availability | ✅ N/A | Instruction-text-only change, no new code surface (per story's own NFR framing) |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track feature (per the story's own Benefit Linkage field). This story closes a structural gate gap found during `rcfc-s1`'s own post-branch-complete CI remediation — its completion is the fulfilment of that finding, not a new discretionary addition.

---

## Outcome

**COMPLETE**

No deviations, no test gaps, no NFR gaps.

---

## DoD Observations

1. **This is a self-referential fix**: `evcg-s1`'s own `/verify-completion` run (using the OLD, pre-fix instructions, since the fix wasn't live yet during its own inner loop) correctly reported "E2E route coverage: N/A — no route/handler files touched" — the new check would have been a no-op for this story's own diff regardless, since it touches no `src/web-ui/routes/` files. The fix's first real exercise will be the next route-touching story.
2. **Merge-order collision with `psms-s1` (PR #762), handled cleanly**: both PRs independently added a required-string entry to the same `check-skill-contracts.js` array blocks (`verify-completion`, `branch-complete`) and both independently fixed `tests/check-md-2-skill-contracts.js`'s hardcoded contract count. `evcg-s1` merged first (no conflict, since it was first); `psms-s1` then hit — and cleanly resolved — the predicted conflict when it merged second. Confirms the PR description's own advance warning was accurate.
3. Closes a gap surfaced during `rcfc-s1`'s own DoD writeup (`workspace/capture-log.md`, 2026-08-24: "`/verify-completion`'s 'run the full test suite' step never actually covers E2E Playwright specs") — the first of 7 unaddressed process-learning items surfaced by a deliberate scour of this session's own capture log, and the first two (this one, plus `psms-s1`) to be closed.
