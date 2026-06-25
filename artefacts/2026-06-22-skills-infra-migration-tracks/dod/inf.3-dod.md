# Definition of Done: Write `infra-plan` SKILL.md as the infra track sign-off skill

**PR:** https://github.com/heymishy/skills-repo/pull/402 | **Merged:** 2026-06-25
**Story:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.3.md
**Test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/inf.3-test-plan.md
**DoR artefact:** artefacts/2026-06-22-skills-infra-migration-tracks/dor/inf.3-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — SKILL.md produces a sign-off artefact at `artefacts/[feature]/infra/[story-id]-infra-plan.md` when the entry condition (passing infra-review artefact) is met | ✅ | Tests `infra-plan-skill-file-exists`, `skill-specifies-entry-condition-passing-review`, and `skill-specifies-output-path-convention` pass | Automated test (10/10 passing) | None |
| AC2 — Sign-off artefact includes: tier execution sequence, per-tier validation checkpoints, and operator execution checklist | ✅ | Tests `skill-contains-tier-execution-sequence`, `skill-contains-per-tier-validation-checkpoints`, and `skill-contains-operator-execution-checklist` pass | Automated test | None |
| AC3 — Unacknowledged DESTRUCTIVE finding from infra-review blocks infra-plan sign-off; finding is re-surfaced to the operator | ✅ | Tests `skill-blocks-sign-off-on-unacknowledged-destructive` and `skill-surfaces-unacknowledged-finding-on-block` pass | Automated test | None |
| AC4 — Sign-off artefact contains `Status: PASS` or equivalent status field readable by H-INF (Infra-plan gate check at DoR — inf.4) | ✅ | Test `sign-off-artefact-has-status-pass` passes | Automated test | None |

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 10 / 10
**Tests passing in CI:** 10 / 10

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| infra-plan-skill-file-exists | ✅ | ✅ | |
| skill-specifies-entry-condition-passing-review | ✅ | ✅ | |
| skill-specifies-output-path-convention | ✅ | ✅ | |
| skill-contains-tier-execution-sequence | ✅ | ✅ | |
| skill-contains-per-tier-validation-checkpoints | ✅ | ✅ | |
| skill-contains-operator-execution-checklist | ✅ | ✅ | |
| skill-blocks-sign-off-on-unacknowledged-destructive | ✅ | ✅ | |
| skill-surfaces-unacknowledged-finding-on-block | ✅ | ✅ | |
| sign-off-artefact-has-status-pass | ✅ | ✅ | |
| infra-plan-artefact-path-follows-audit-convention (NFR) | ✅ | ✅ | Path convention consistent with /trace requirements |

**Test gaps:** 1 — AI instruction-text runtime verification. Accepted by design.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Audit — artefact path follows convention so /trace can reference it | ✅ | NFR test `infra-plan-artefact-path-follows-audit-convention` passes; output path `artefacts/[feature]/infra/[story-id]-infra-plan.md` documented and consistent with inf.1 and inf.2 conventions |

---

## Metric Signal

| Metric | Signal | Evidence | Date measured |
|--------|--------|----------|---------------|
| M1 — Infra track completion time (under 30 minutes end-to-end) | not-yet-measured | `infra-plan` is the final skill in the infra track — its sign-off artefact is the measurement point for M1. The skill is delivered and verified by test suite. Measurement requires 3 real operator sessions. No real sessions have run yet. | null |

---

## Outcome: COMPLETE ✅

ACs satisfied: 4/4
Scope deviations: None
Test gaps: 1 (AI runtime — accepted by design)
