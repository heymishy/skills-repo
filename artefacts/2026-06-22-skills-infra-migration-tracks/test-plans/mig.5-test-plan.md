## Test Plan: mig.5 — Write `staging-data-policy` template with three named options and declared-choice field

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.5.md
**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/schema-migration-track.md
**Test plan author:** Claude Sonnet 4.6
**Date:** 2026-06-25
**Test file:** `tests/check-mig5-staging-data-policy.js`
**Test runner:** `node tests/check-mig5-staging-data-policy.js`

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Template contains exactly three named options: synthetic, anonymised, non-PII subset | 3 tests | — | — | — | — | 🟢 |
| AC2 | `Declared choice` field present and requires non-blank selection of exactly one option | 2 tests | — | — | — | — | 🟢 |
| AC3 | Completed template reference satisfies migration-review mandatory field check | 1 test | — | — | — | — | 🟢 |
| AC4 | Tool/process field accepts free-form description | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — tests read `.github/templates/staging-data-policy.md` and assert required sections/fields exist
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

---

## Unit Tests

### staging-data-policy-template-file-exists
- **Verifies:** AC1
- **Action:** Assert `.github/templates/staging-data-policy.md` exists
- **Expected result:** File found
- **Edge case:** No

### template-contains-synthetic-generated-data-option
- **Verifies:** AC1
- **Action:** Assert template content contains an option explicitly named "synthetic generated data" (or equivalent canonical label)
- **Expected result:** Synthetic data option found
- **Edge case:** No

### template-contains-anonymised-snapshot-option
- **Verifies:** AC1
- **Action:** Assert template content contains an option explicitly named "anonymised snapshot" with a reference to a named tool/process field
- **Expected result:** Anonymised snapshot option found
- **Edge case:** No

### template-contains-non-pii-production-subset-option
- **Verifies:** AC1
- **Action:** Assert template content contains an option explicitly named "non-PII production subset"
- **Expected result:** Non-PII subset option found
- **Edge case:** No

### template-contains-declared-choice-field
- **Verifies:** AC2
- **Action:** Assert template content contains a "Declared choice" field (or equivalent label requiring selection)
- **Expected result:** Declared choice field found
- **Edge case:** No

### declared-choice-instructions-prohibit-tbd
- **Verifies:** AC2
- **Action:** Assert template instructions state the declared choice cannot be left blank or marked "TBD" — look for "TBD", "blank", "must select", or equivalent prohibition language
- **Expected result:** Prohibition language present
- **Edge case:** No

### template-references-migration-review-check
- **Verifies:** AC3
- **Action:** Assert template contains language stating it is referenced from `schema-migration-plan` artefacts and that a completed declaration satisfies the mandatory field check
- **Expected result:** Migration-review integration note present
- **Edge case:** No

### template-contains-tool-process-free-form-field
- **Verifies:** AC4
- **Action:** Assert template contains a free-form "tool or process" field (or equivalent) that accepts a text description of the specific implementation
- **Expected result:** Free-form tool/process field present
- **Edge case:** No

---

## Integration Tests

None — deliverable is a template file; all checks are content assertions.

---

## NFR Tests

### template-warns-against-credentials-in-tool-field
- **NFR addressed:** Security — template must warn against committing production credentials or connection strings in the tool/process field
- **Measurement method:** Read template; assert a credentials/connection-string warning appears near or within the tool/process field description
- **Pass threshold:** Warning present
- **Tool:** String search

---

## Out of Scope for This Test Plan

- Enforcement that teams choose a specific option — the template requires declaration, not a prescribed choice
- Data anonymisation tooling — out of scope per story
- Migration-review SKILL.md checks — tested in mig.2

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
