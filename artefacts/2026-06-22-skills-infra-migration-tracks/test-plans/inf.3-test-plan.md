## Test Plan: inf.3 — Write `infra-plan` SKILL.md as the infra track sign-off skill

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.3.md
**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/infra-track.md
**Test plan author:** Claude Sonnet 4.6
**Date:** 2026-06-25
**Test file:** `tests/check-inf3-infra-plan-skill.js`
**Test runner:** `node tests/check-inf3-infra-plan-skill.js`

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | SKILL.md produces sign-off artefact at correct path when entry condition (passing infra-review) is met | 3 tests | — | — | — | — | 🟢 |
| AC2 | Sign-off artefact includes tier execution sequence, per-tier checkpoints, and operator checklist | 3 tests | — | — | — | — | 🟢 |
| AC3 | Unacknowledged DESTRUCTIVE finding from infra-review blocks sign-off | 2 tests | — | — | — | — | 🟢 |
| AC4 | infra-plan artefact at infraPlanPath with status PASS → H-INF reads it | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — tests read `.github/skills/infra-plan/SKILL.md`
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

---

## Unit Tests

### infra-plan-skill-file-exists
- **Verifies:** AC1
- **Action:** Assert `.github/skills/infra-plan/SKILL.md` exists
- **Expected result:** File found
- **Edge case:** No

### skill-specifies-entry-condition-passing-review
- **Verifies:** AC1
- **Action:** Assert SKILL.md states that a passing infra-review artefact (status PASS) is required before infra-plan can proceed
- **Expected result:** Entry condition described
- **Edge case:** No

### skill-specifies-output-path-convention
- **Verifies:** AC1
- **Action:** Assert SKILL.md specifies artefact output path `artefacts/[feature]/infra/[story-id]-infra-plan.md`
- **Expected result:** Path convention present
- **Edge case:** No

### skill-contains-tier-execution-sequence
- **Verifies:** AC2
- **Action:** Assert SKILL.md contains a section for tier execution sequence (ordered tiers for applying the change)
- **Expected result:** Tier execution sequence section present
- **Edge case:** No

### skill-contains-per-tier-validation-checkpoints
- **Verifies:** AC2
- **Action:** Assert SKILL.md contains per-tier validation checkpoints — what to verify before proceeding to the next tier
- **Expected result:** Checkpoint section or field present
- **Edge case:** No

### skill-contains-operator-execution-checklist
- **Verifies:** AC2
- **Action:** Assert SKILL.md contains an operator execution checklist (discrete steps to apply the change)
- **Expected result:** Checklist section present
- **Edge case:** No

### skill-blocks-sign-off-on-unacknowledged-destructive
- **Verifies:** AC3
- **Action:** Assert SKILL.md explicitly states that if the infra-review artefact has an unacknowledged DESTRUCTIVE finding, infra-plan cannot produce a sign-off
- **Expected result:** Block condition documented
- **Edge case:** No

### skill-surfaces-unacknowledged-finding-on-block
- **Verifies:** AC3
- **Action:** Assert SKILL.md instructs the skill to surface the unacknowledged finding to the operator when blocking
- **Expected result:** Finding re-surfaced on block
- **Edge case:** No

### sign-off-artefact-has-status-pass
- **Verifies:** AC4
- **Action:** Assert SKILL.md specifies that the produced sign-off artefact contains a "status: PASS" or equivalent status field readable by H-INF
- **Expected result:** Status field documented
- **Edge case:** No

---

## Integration Tests

None — deliverable is a SKILL.md file.

---

## NFR Tests

### infra-plan-artefact-path-follows-audit-convention
- **NFR addressed:** Audit — artefact path follows convention so /trace can reference it
- **Measurement method:** Read SKILL.md; confirm output path matches `artefacts/[feature]/infra/[story-id]-infra-plan.md`
- **Pass threshold:** Path convention documented and consistent with inf.1 and inf.2 conventions
- **Tool:** String search

---

## Out of Scope for This Test Plan

- Executing or applying the infrastructure change — out of scope per story
- Rollback plan derivation — infra-plan references rollback from infra-definition, does not re-derive
- H-INF gate logic — tested in inf.4

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
