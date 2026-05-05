# Definition of Done: Dynamic next-question generation for web UI skill sessions

**PR:** #309 | **Merged:** 2026-05-05
**Story:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/stories/dsq.1-dynamic-next-question.md
**Test plan:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/test-plans/dsq.1-dynamic-next-question-test-plan.md
**DoR artefact:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/dor/dsq.1-dynamic-next-question-dor.md
**Assessed by:** Copilot
**Date:** 2026-05-05

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (Acceptance Criterion 1: htmlRecordAnswer calls _nextQuestionExecutor with full SKILL.md + history + instruction) | ✅ | T1.1 — executor called once with systemPrompt containing skill content and generation instruction | Automated test `check-dsq1-dynamic-next-question.js` T1.1 | None |
| AC2 (Acceptance Criterion 2: Non-empty executor response stored in session.dynamicQuestions and returned by htmlGetNextQuestion) | ✅ | T1.2 — dynamicQuestions[0] set to executor result; htmlGetNextQuestion returns it | Automated test T1.2 | None |
| AC3 (Acceptance Criterion 3: Executor throws/returns empty/null → static fallback, no error surfaced) | ✅ | T1.3 (executor throws), T1.4 (empty string), T1.5 (null) — all show static fallback, session continues | Automated tests T1.3, T1.4, T1.5 | None |
| AC4 (Acceptance Criterion 4: questionIndex and totalQuestions always reflect static list count regardless of dynamic substitution) | ✅ | T1.6 — progress counters unchanged by dynamic substitution | Automated test T1.6 | None |
| AC5 (Acceptance Criterion 5: setNextQuestionExecutorAdapter exported; production wiring verified) | ✅ | T1.7 — routes exports setNextQuestionExecutorAdapter as a function; wiring confirmed in server.js | Automated test T1.7 | None |
| AC6 (Acceptance Criterion 6: Default stub throws exact required message) | ✅ | T1.8 — default stub throws 'Adapter not wired: _nextQuestionExecutor...' | Automated test T1.8 | None |
| AC7 (Acceptance Criterion 7: All wuce.26 tests continue to pass with no regressions) | ✅ | T1.9 — wuce.26 regression suite passes (9/9 total tests in suite) | Automated test T1.9 | None |

---

## Scope Deviations

None

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9 total
**Tests passing in CI:** 9 / 9

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1.1 — AC1: executor called with correct args | ✅ | ✅ | |
| T1.2 — AC2: dynamic question stored and served | ✅ | ✅ | |
| T1.3 — AC3A: executor throw → static fallback | ✅ | ✅ | |
| T1.4 — AC3B: empty string → static fallback | ✅ | ✅ | |
| T1.5 — AC3C: null → static fallback | ✅ | ✅ | |
| T1.6 — AC4: progress counters reflect static list | ✅ | ✅ | |
| T1.7 — AC5: setNextQuestionExecutorAdapter exported + wired | ✅ | ✅ | |
| T1.8 — AC6: default stub throws exact message | ✅ | ✅ | |
| T1.9 — AC7: wuce.26 regression | ✅ | ✅ | |

**Gaps (tests not implemented):**
None

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: _nextQuestionExecutor timeout ≤ 10 000 ms; static fallback on timeout | ✅ | Timeout guard implemented in htmlRecordAnswer; fallback fires on any exception including timeout |
| Security: token from req.session.accessToken only; never logged or surfaced in errors | ✅ | Code review confirmed: executor receives accessToken; no token in error messages surfaced to operator |
| Resilience: any exception caught at call site; never propagates to HTTP handler | ✅ | T1.3 confirms exception is caught and static fallback fires; session continues normally |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Fallback invisibility rate (> 95% of fallback events invisible to operator) | ❌ | After first real sessions run | New capability; no production sessions yet; baseline not yet established |
| M2 — Model question adaptation rate (> 70% of generated questions show visible adaptation) | ❌ | After first real sessions run | Baseline was 0% (static questions); adaptation mechanism now in production; rate requires session observation |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None — measure M1 and M2 after first real production sessions. Use `/record-signal` when evidence is available.

---

## DoD Observations

1. AC3 was tested with three separate sub-cases (throw, empty string, null) matching all three fallback triggers defined in the NFR. Coverage is thorough.
2. AC7 (regression) was tested via the named wuce.26 baseline count embedded in T1.9 — this gives a concrete regression gate rather than a vague "all prior tests pass" assertion.
