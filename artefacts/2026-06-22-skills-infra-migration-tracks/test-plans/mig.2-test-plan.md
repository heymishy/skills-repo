## Test Plan: mig.2 — Write `schema-migration-review` SKILL.md with rollback evidence check and classification validation

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.2.md
**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/schema-migration-track.md
**Test plan author:** Claude Sonnet 4.6
**Date:** 2026-06-25
**Test file:** `tests/check-mig2-migration-review-skill.js`
**Test runner:** `node tests/check-mig2-migration-review-skill.js`

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Breaking migration requires CI-tier rollback execution evidence before PASS | 3 tests | — | — | — | — | 🟢 |
| AC2 | Additive-only accepts declaration as rollback evidence — execution not required | 2 tests | — | — | — | — | 🟢 |
| AC3 | Blank staging-snapshot-privacy blocks PASS when staging tier in scope | 2 tests | — | — | — | — | 🟢 |
| AC4 | Classification coherence check flags additive-only with DROP/ALTER statements | 2 tests | — | — | — | — | 🟢 |
| AC5 | Zero findings → PASS artefact at correct path | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — tests read `.github/skills/schema-migration-review/SKILL.md` and assert required instructions exist
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

---

## Unit Tests

### migration-review-skill-file-exists
- **Verifies:** AC1
- **Action:** Assert `.github/skills/schema-migration-review/SKILL.md` exists
- **Expected result:** File found
- **Edge case:** No

### skill-requires-ci-rollback-evidence-for-breaking
- **Verifies:** AC1
- **Action:** Assert SKILL.md states that breaking migrations require CI-tier rollback execution evidence — the review cannot reach PASS without this evidence
- **Expected result:** CI-tier rollback evidence requirement present for breaking classification
- **Edge case:** No

### skill-defines-acceptable-rollback-evidence-formats
- **Verifies:** AC1
- **Action:** Assert SKILL.md describes acceptable forms of rollback evidence — at minimum: log snippet, test result, or operator attestation of CI-equivalent execution
- **Expected result:** Evidence formats described
- **Edge case:** No

### skill-accepts-declaration-for-additive-rollback
- **Verifies:** AC2
- **Action:** Assert SKILL.md states that for additive-only migrations, a declaration ("rollback command declared and reviewed — not yet executed") is sufficient rollback evidence
- **Expected result:** Declaration-sufficient language present for additive-only
- **Edge case:** No

### skill-distinguishes-evidence-requirements-by-classification
- **Verifies:** AC2
- **Action:** Assert SKILL.md distinguishes between breaking (execution required) and additive-only (declaration sufficient) rollback evidence requirements
- **Expected result:** Distinction clearly documented
- **Edge case:** No

### skill-blocks-pass-on-blank-staging-privacy
- **Verifies:** AC3
- **Action:** Assert SKILL.md states that when staging tier is in scope and the staging-snapshot-privacy field is blank or missing, the review cannot reach PASS
- **Expected result:** Staging privacy block condition documented
- **Edge case:** No

### skill-staging-privacy-check-tied-to-staging-scope
- **Verifies:** AC3
- **Action:** Assert SKILL.md staging-snapshot-privacy check is conditional on staging tier being in scope — when staging is "Not applicable", the check is skipped
- **Expected result:** Conditional privacy check documented
- **Edge case:** No

### skill-coherence-check-flags-breaking-in-additive
- **Verifies:** AC4
- **Action:** Assert SKILL.md includes a classification coherence check that flags when an "additive-only" artefact contains DROP COLUMN or ALTER COLUMN TYPE statements
- **Expected result:** Coherence check described
- **Edge case:** No

### skill-coherence-check-produces-finding
- **Verifies:** AC4
- **Action:** Assert SKILL.md states the coherence check result is a finding (not silent acceptance) — the misclassification must be resolved before the review can proceed
- **Expected result:** Coherence mismatch produces a finding, not a warning-only
- **Edge case:** No

### skill-specifies-pass-artefact-path
- **Verifies:** AC5
- **Action:** Assert SKILL.md specifies the PASS artefact output path as `artefacts/[feature]/migrations/[story-id]-migration-review.md`
- **Expected result:** Path convention documented
- **Edge case:** No

### skill-pass-requires-zero-unresolved-findings
- **Verifies:** AC5
- **Action:** Assert SKILL.md states the review produces a PASS artefact only when zero unresolved findings remain
- **Expected result:** Zero-findings PASS condition documented
- **Edge case:** No

### skill-no-hardcoded-tool-cli-references
- **Verifies:** ADR-004 compliance
- **Action:** Assert no checklist item requires a specific tool CLI command — grep for "Alembic downgrade", "Flyway repair", "redis-cli", "psql" in required-step contexts
- **Expected result:** Zero required-tool CLI references
- **Edge case:** No

---

## Integration Tests

None — deliverable is a SKILL.md file; all checks are content assertions.

---

## NFR Tests

### skill-checklist-includes-credentials-check
- **NFR addressed:** Security — review checklist must include a step confirming no production credentials appear in migration command fields
- **Measurement method:** Read SKILL.md; assert the review checklist contains a step checking for credentials/connection strings in migration command fields
- **Pass threshold:** Mandatory credentials check present in checklist
- **Tool:** String search

---

## Out of Scope for This Test Plan

- Executing the migration or rollback — review validates the plan; operators execute
- Automated SQL parsing — coherence check is a manual review step
- H-MIG gate logic — tested in mig.3
- Trace emission on sign-off — tested in mig.4

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
