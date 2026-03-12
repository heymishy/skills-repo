# Test Plan Template

<!--
  USAGE: Canonical format for test plans produced by the /test-plan skill.
  One test plan per story. Created after /review passes and before /definition-of-ready.
  Tests should be written to FAIL before coding begins — red/green/refactor discipline.

  To evolve this format: update this file, open a PR, tag QA lead + engineering lead.
-->

## Test Plan: [Story Title]

**Story reference:** [Link to story artefact]
**Epic reference:** [Link to parent epic]
**Test plan author:** [Copilot / human — record which]
**Date:** [YYYY-MM-DD]

---

## AC Coverage

<!--
  Every AC from the story must map to at least one test.
  Use the exact AC identifier from the story (AC1, AC2, AC3...).
  If an AC has no test, it is a gap — flag it, do not silently skip.
-->

| AC | Test(s) covering it | Coverage status |
|----|---------------------|-----------------|
| AC1 | [Test name(s)] | ✅ Covered / ⚠️ Gap |
| AC2 | [Test name(s)] | ✅ Covered / ⚠️ Gap |
| AC3 | [Test name(s)] | ✅ Covered / ⚠️ Gap |

---

## Unit Tests

<!--
  Scope: individual functions, components, or modules in isolation.
  Each test: name, what it verifies, expected state before/after.
  Written to fail — implementation does not exist yet.
-->

### [Test name — verb + what + condition]

- **Verifies:** [Which AC or NFR]
- **Precondition:** [System state before test runs]
- **Action:** [What the test does]
- **Expected result:** [Specific, observable outcome]
- **Edge case:** [Yes / No — if yes, describe]

---

## Integration Tests

<!--
  Scope: interactions between components, services, or data layers.
  Focus on seams — where one thing hands off to another.
-->

### [Test name]

- **Verifies:** [Which AC or NFR]
- **Components involved:** [List]
- **Precondition:** [System state]
- **Action:** [What the test does]
- **Expected result:** [Observable outcome]

---

## NFR Tests

<!--
  One test per NFR from the story. 
  If no NFRs: write "None — confirmed with story owner."
  Do not leave blank.
-->

### [NFR test name — e.g. "Export completes within 3 seconds"]

- **NFR addressed:** [Performance / Security / Accessibility / Audit / other]
- **Measurement method:** [How this is tested — load test, axe scan, log check, etc.]
- **Pass threshold:** [Specific value]
- **Tool:** [Jest / k6 / axe / manual / etc.]

---

## Out of Scope for This Test Plan

<!--
  Explicitly state what is NOT tested here and why.
  Common exclusions: end-to-end user journey (separate test), 
  adjacent stories not yet implemented, manual exploratory testing.
-->

- [What is not tested and why]

---

## Test Gaps and Risks

<!--
  Honest assessment of what cannot be tested pre-implementation and why.
  A gap is not a failure — an unacknowledged gap is.
-->

| Gap | Reason | Mitigation |
|-----|--------|------------|
| [What can't be tested] | [Why] | [How risk is managed] |
