## Test Plan: inf.1 — Write `infra-definition` SKILL.md

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.1.md
**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/infra-track.md
**Test plan author:** Claude Sonnet 4.6
**Date:** 2026-06-25
**Test file:** `tests/check-inf1-infra-definition-skill.js`
**Test runner:** `node tests/check-inf1-infra-definition-skill.js`

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | SKILL.md produces artefact at correct path with all 5 mandatory sections | 5 tests | — | — | — | — | 🟢 |
| AC2 | Tier-applicability table contains one row per tier (local, ci, staging, production) | 2 tests | — | — | — | — | 🟢 |
| AC3 | Rollback plan section has discrete steps + time-to-execute (not a single sentence) | 2 tests | — | — | — | — | 🟢 |
| AC4 | Skill accepts `ops/` prefix and produces artefact at correct ops path | 1 test | — | — | — | — | 🟢 |
| AC5 | No hardcoded tool names in required-tool contexts | 3 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — the "implementation" is the SKILL.md file itself; tests read its content and assert structure/presence of required text
**PCI/sensitivity in scope:** No
**Availability:** Available now — file exists when story is implemented
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1–AC5 | Content of `.github/skills/infra-definition/SKILL.md` | Read file in test | None | File must exist for tests to pass |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### infra-definition-skill-file-exists
- **Verifies:** AC1
- **Precondition:** Story is implemented
- **Action:** Assert `.github/skills/infra-definition/SKILL.md` exists on disk
- **Expected result:** File found — exits 0
- **Edge case:** No

### skill-contains-change-description-section
- **Verifies:** AC1
- **Precondition:** SKILL.md exists
- **Action:** Read file content; assert it contains a section heading or label for "change description" (case-insensitive)
- **Expected result:** Match found
- **Edge case:** No

### skill-contains-blast-radius-section
- **Verifies:** AC1
- **Precondition:** SKILL.md exists
- **Action:** Assert content contains "blast-radius" or "blast radius" (case-insensitive)
- **Expected result:** Match found
- **Edge case:** No

### skill-contains-rollback-plan-section
- **Verifies:** AC1, AC3
- **Precondition:** SKILL.md exists
- **Action:** Assert content contains "rollback" section heading
- **Expected result:** Match found
- **Edge case:** No

### skill-contains-tier-applicability-section
- **Verifies:** AC1, AC2
- **Precondition:** SKILL.md exists
- **Action:** Assert content contains "tier" and "applicability" (or "tier-applicability") in a section context
- **Expected result:** Match found
- **Edge case:** No

### skill-contains-plan-preview-attachment-section
- **Verifies:** AC1
- **Precondition:** SKILL.md exists
- **Action:** Assert content contains "plan" and "preview" and "attachment" near each other (or a combined "plan/preview attachment" heading)
- **Expected result:** Match found
- **Edge case:** No

### tier-table-references-local-ci-staging-production
- **Verifies:** AC2
- **Precondition:** SKILL.md exists
- **Action:** Assert content contains all four tier names: "local", "ci", "staging", "production" (case-insensitive, allowing for "local dev" or "local/dev" forms)
- **Expected result:** All four tier names present
- **Edge case:** No

### tier-table-has-validation-status-column
- **Verifies:** AC2
- **Precondition:** SKILL.md exists
- **Action:** Assert content contains "validated" or "validation status" (the column header for the tier table status)
- **Expected result:** Match found
- **Edge case:** No

### rollback-plan-requires-discrete-steps-not-single-sentence
- **Verifies:** AC3
- **Precondition:** SKILL.md exists
- **Action:** Assert the rollback plan section instructs the operator to provide numbered/discrete steps — check for step-list language ("step", "1.", "2.", or markdown list items) in the rollback section context
- **Expected result:** Rollback section template prompts for discrete steps, not a single free-text field
- **Edge case:** No

### rollback-plan-requires-time-to-execute
- **Verifies:** AC3
- **Precondition:** SKILL.md exists
- **Action:** Assert content contains "time-to-execute" or "estimated time" or "time to execute" in rollback context
- **Expected result:** Match found
- **Edge case:** No

### skill-accepts-ops-prefix-in-path-guidance
- **Verifies:** AC4
- **Precondition:** SKILL.md exists
- **Action:** Assert content mentions `ops/` as a valid feature slug form (or does not restrict slugs to the standard date-based pattern)
- **Expected result:** `ops/` prefix is either explicitly documented as accepted or the path guidance uses a generic `[feature]` placeholder that doesn't exclude it
- **Edge case:** No

### skill-no-terraform-in-required-context
- **Verifies:** AC5
- **Precondition:** SKILL.md exists
- **Action:** Search for "Terraform" in the file; any occurrence must appear in a clearly non-exhaustive example list context (e.g. "e.g. Terraform, Pulumi, CDK" or similar), not as a required tool instruction
- **Expected result:** Zero occurrences of "Terraform" as a required tool; any occurrence is in an illustrative list
- **Edge case:** Yes — common false positive

### skill-no-pulumi-cdk-ansible-in-required-context
- **Verifies:** AC5
- **Precondition:** SKILL.md exists
- **Action:** Search for "Pulumi", "CDK", "Ansible", "CloudFormation" in required-tool instruction contexts
- **Expected result:** Zero occurrences as required tools
- **Edge case:** No

### skill-contains-credentials-warning
- **Verifies:** NFR-SEC (inf.1)
- **Precondition:** SKILL.md exists
- **Action:** Assert content contains explicit warning against pasting credentials, tokens, or secrets into the plan/preview attachment section
- **Expected result:** Warning text present (grep for "credential", "token", "secret", or "sensitive" near the plan/preview section)
- **Edge case:** No

---

## Integration Tests

None — this story's deliverable is a SKILL.md file; all assertions are content checks against the file.

---

## NFR Tests

### skill-warns-against-credentials-in-attachment
- **NFR addressed:** Security — no credentials in plan/preview attachment
- **Measurement method:** Read SKILL.md; assert "credential", "token", or "secret" appears in a warning context within the plan/preview attachment guidance section
- **Pass threshold:** Warning text present and located within the attachment section (not only in a general header)
- **Tool:** Node.js `fs.readFileSync` + string search

---

## Out of Scope for This Test Plan

- infra-review checklist content — tested in inf.2
- Executing or applying the infra change — out of scope per story
- Automatic detection of infrastructure changes — out of scope per story

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
