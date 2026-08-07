## Test Plan: Add Scenario B to the CI-blocking gate and publish the spec-to-journey-step coverage mapping

**Story reference:** artefacts/2026-07-23-e2e-core-journey-coverage/stories/b2-ci-gate-scenario-b-coverage-mapping.md
**Epic reference:** artefacts/2026-07-23-e2e-core-journey-coverage/epics/epic-b-formed-idea-journey-e2e-full-gate-data-hygiene.md
**Test plan author:** Claude (agent), operator-directed
**Date:** 2026-07-23

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | A broken Scenario B PR is blocked | — | 1 test | — | 1 scenario | External-dependency | 🟡 |
| AC2 | A clean PR passes both gates, unblocked | — | 1 test | — | 1 scenario | External-dependency | 🟡 |
| AC3 | Coverage mapping document lists every journey step | — | 1 test | — | — | — | 🟢 |
| AC4 | Every mapping reference resolves to a real spec/AC | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|---------------------------|---------|
| Real branch-protection blocking behaviour (same class of gap as A5) | AC1, AC2 | External-dependency | Branch protection enforcement is external GitHub platform behaviour | Integration test asserts the structural precondition (required check, no `continue-on-error`); manual scenario rehearses a real red/green PR once at DoD |

---

## Test Data Strategy

**Source:** Fixtures (repo config + artefact files)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | The Scenario B job's workflow YAML config | Fixtures | None | |
| AC2 | Same | Fixtures | None | |
| AC3 | The coverage-mapping document, discovery.md's MVP scope list | Fixtures | None | |
| AC4 | The coverage-mapping document, the actual A1-B1 spec files | Fixtures | None | |

### PCI / sensitivity constraints

None.

### Gaps

None beyond the External-dependency gap already recorded.

---

## Unit Tests

None.

---

## Integration Tests

### Scenario B CI job has no `continue-on-error` and is a required status check

- **Verifies:** AC1, AC2
- **Components involved:** `.github/workflows/e2e.yml`, GitHub branch protection settings (via `gh api`)
- **Precondition:** A5's Scenario A gate mechanism already exists
- **Action:** Same pattern as A5's equivalent test, applied to the new Scenario B job
- **Expected result:** No `continue-on-error`; check name appears in required status checks

### Coverage mapping document lists every journey step from discovery's MVP scope

- **Verifies:** AC3
- **Components involved:** `artefacts/2026-07-23-e2e-core-journey-coverage/coverage/spec-to-journey-step-mapping.md`, `discovery.md`'s MVP Scope section
- **Precondition:** The mapping document exists
- **Action:** A Node script parses discovery.md's MVP Scope list (Scenario A's 7 steps, Scenario B's 4 steps) and the mapping document, and asserts every step has a corresponding row
- **Expected result:** Zero unmapped journey steps

### Every mapping reference resolves to a real spec file and AC

- **Verifies:** AC4
- **Components involved:** The coverage-mapping document, `tests/e2e/*.spec.js` (A1-B1's spec files)
- **Precondition:** AC3's mapping document
- **Action:** A Node script cross-checks each mapping row's cited spec file path and AC reference against the actual spec file content (e.g. a comment or test name containing the AC ID)
- **Expected result:** Every cited reference genuinely exists in the named spec file — the mapping is verified against real code, not hand-asserted

---

## E2E Tests

None — this story is about CI/documentation, not application behaviour.

---

## NFR Tests

### Combined Scenario A + B CI runtime stays under ~10 minutes

- **NFR addressed:** Performance
- **Measurement method:** Read the actual combined CI job duration from a real GitHub Actions run once implemented
- **Pass threshold:** < ~10 minutes total for the E2E portion
- **Tool:** Manual/GitHub Actions UI

---

## Out of Scope for This Test Plan

- Adding a third scenario to this gate
- A fully automated mapping-generation tool

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real branch-protection blocking behaviour can't be proven pre-implementation | Same as A5 | Integration test + one-time manual rehearsal at DoD |
