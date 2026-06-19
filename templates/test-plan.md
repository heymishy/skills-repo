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
  If an AC has no test, it is a gap — flag it with a gap type, do not silently skip.
  
  Gap types:
    CSS-layout-dependent — relies on real browser rendering (drag-drop, getBoundingClientRect, CSS position)
    DOM-behaviour       — e2e-testable but not jsdom-compatible
    External-dependency — relies on third-party API/service unavailable in test
    Untestable-by-nature — inherently non-automatable (e.g. visual aesthetics, physical hardware)
-->

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | [summary] | [n tests] | [n tests] | — | — | — | 🟢 |
| AC2 | [summary] | — | — | — | [scenario name] | CSS-layout-dependent | 🔴 |
| AC3 | [summary] | [n tests] | — | — | — | — | 🟢 |

---

## Coverage gaps

<!--
  List every AC that cannot be fully covered by automated tests.
  "None" is the ideal and expected value. Every gap needs a gap type and handling decision.
-->

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| [e.g. drag-drop position verified visually] | AC2 | CSS-layout-dependent | `getBoundingClientRect` returns 0 in jsdom | Manual scenario — see AC verification script 🔴 |

---

## Test Data Strategy

<!--
  Record the test data approach decided during /test-plan.
  Complete before writing individual test entries.
  Incomplete test data = incomplete test plan.
  If PCI or sensitive fields are involved, list constraints explicitly.
-->

**Source:** [Synthetic / Fixtures / De-identified / Seeded DB / Mocked / Mixed]
**PCI/sensitivity in scope:** [Yes — constraints below / No]
**Availability:** [Available now / Dependency — see gap note below]
**Owner:** [Self-contained / Platform team / TBD]

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | [description] | [source] | [None / PAN / etc.] | |
| AC2 | [description] | [source] | [None / PAN / etc.] | |

### PCI / sensitivity constraints

[None — or list specific handling requirements]

### Gaps

[None — or list data not yet available with owner and resolution action]

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
