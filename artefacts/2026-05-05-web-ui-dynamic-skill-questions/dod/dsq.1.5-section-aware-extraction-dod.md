# Definition of Done: Section-aware question extraction for web UI skill sessions

**PR:** #308 | **Merged:** 2026-05-05
**Story:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/stories/dsq.1.5-section-aware-extraction.md
**Test plan:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/test-plans/dsq.1.5-section-aware-extraction-test-plan.md
**DoR artefact:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/dor/dsq.1.5-section-aware-extraction-dor.md
**Assessed by:** Copilot
**Date:** 2026-05-05

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (Acceptance Criterion 1: extractSections returns array of { heading, questions[] } objects in document order for SKILL.md with H2 headings) | ✅ | T1.5.1 — extractSections returns correct structure with H2 headings and grouped questions | Automated test `check-dsq1-5-section-aware-extraction.js` T1.5.1 | None |
| AC2 (Acceptance Criterion 2: SKILL.md with no H2 headings → single element with heading='' containing all questions) | ✅ | T1.5.2 — no-H2 content returns single section with empty heading | Automated test T1.5.2 | None |
| AC3 (Acceptance Criterion 3: union of all section.questions equals extractQuestions result for same content) | ✅ | T1.5.3 — extractSections question union matches extractQuestions output | Automated test T1.5.3 | None |
| AC4 (Acceptance Criterion 4: extractSections exported from skill-content-adapter.js; registerHtmlSession populates session.sections) | ✅ | T1.5.4 — registerHtmlSession sets session.sections from extractSections; verified in session store | Automated test T1.5.4 | None |
| AC5 (Acceptance Criterion 5: All wuce.26 baseline tests continue to pass — extractQuestions unchanged, no existing session field altered) | ✅ | T1.5.5 — wuce.26 regression suite passes; no existing session field removed or modified | Automated test T1.5.5 | None |

---

## Scope Deviations

None

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7 total
**Tests passing in CI:** 7 / 7

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1.5.1 — AC1: extractSections structure and document order | ✅ | ✅ | |
| T1.5.2 — AC2: no H2 headings → single empty-heading section | ✅ | ✅ | |
| T1.5.3 — AC3: union of section questions = extractQuestions output | ✅ | ✅ | |
| T1.5.4a — AC4: extractSections exported | ✅ | ✅ | |
| T1.5.4b — AC4: session.sections populated by registerHtmlSession | ✅ | ✅ | |
| T1.5.5a — AC5: wuce.26 regression | ✅ | ✅ | |
| T1.5.5b — AC5: extractQuestions unchanged | ✅ | ✅ | |

**Gaps (tests not implemented):**
None

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: extractSections synchronous, < 10 ms for any SKILL.md handled by extractQuestions | ✅ | Implementation is a single-pass synchronous string parse; no I/O; well within 10 ms for any realistic SKILL.md |
| Correctness: questions between two H2 headings belong to preceding heading; questions before first H2 captured under empty-string heading | ✅ | AC1 and AC2 tests confirm correct boundary attribution; T1.5.1 uses a multi-section fixture |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| P1 — Skill session completion rate (> 50%) — enabler story contribution | ❌ | After dsq.2 and dsq.3 are in real use | This story enables dsq.2; P1 signal flows through dsq.2, not directly from dsq.1.5 |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None — enabler story; metric signal measured via dsq.2 and dsq.3.

---

## DoD Observations

1. This is an enabler story with no direct user-visible behaviour. AC coverage is structural (export shape, session field population, regression). All 5 ACs have automated test coverage.
2. The 7-test count slightly exceeds 5 ACs because AC4 and AC5 each have two distinct sub-assertions warranting separate test cases.
