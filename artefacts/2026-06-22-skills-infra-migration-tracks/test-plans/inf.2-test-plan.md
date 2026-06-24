## Test Plan: inf.2 — Write `infra-review` SKILL.md with DESTRUCTIVE/REVERSIBLE-HIGH/ADVISORY severity scale

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.2.md
**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/infra-track.md
**Test plan author:** Claude Sonnet 4.6
**Date:** 2026-06-25
**Test file:** `tests/check-inf2-infra-review-skill.js`
**Test runner:** `node tests/check-inf2-infra-review-skill.js`

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | DESTRUCTIVE finding hard-blocks; requires explicit PROCEED acknowledgement | 3 tests | — | — | — | — | 🟢 |
| AC2 | Tier-coherence check detects production-before-CI ordering issue as ADVISORY | 2 tests | — | — | — | — | 🟢 |
| AC3 | Secret pattern in plan/preview attachment raises REVERSIBLE-HIGH | 2 tests | — | — | — | — | 🟢 |
| AC4 | Zero unacknowledged findings → PASS artefact at correct path | 2 tests | — | — | — | — | 🟢 |
| AC5 | Unacknowledged DESTRUCTIVE finding blocks sign-off | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — tests read `.github/skills/infra-review/SKILL.md` content; assert required instructions exist
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1–AC5 | Content of `.github/skills/infra-review/SKILL.md` | Read file | None | |

---

## Unit Tests

### infra-review-skill-file-exists
- **Verifies:** AC1
- **Action:** Assert `.github/skills/infra-review/SKILL.md` exists
- **Expected result:** File found
- **Edge case:** No

### skill-defines-destructive-severity
- **Verifies:** AC1
- **Action:** Assert SKILL.md content contains the word "DESTRUCTIVE" as a named severity level
- **Expected result:** "DESTRUCTIVE" found in severity scale definition
- **Edge case:** No

### skill-requires-explicit-acknowledgement-for-destructive
- **Verifies:** AC1, AC5
- **Action:** Assert SKILL.md contains language requiring explicit acknowledgement for DESTRUCTIVE findings — grep for "acknowledge", "PROCEED: Yes", or equivalent explicit consent requirement
- **Expected result:** Acknowledgement requirement present
- **Edge case:** No

### skill-defines-tier-coherence-check
- **Verifies:** AC2
- **Action:** Assert SKILL.md contains "coherence" or "tier" + "order" or "sequence" in the context of a review check — detects the production-before-CI out-of-order validation issue
- **Expected result:** Coherence check described
- **Edge case:** No

### skill-classifies-out-of-order-tiers-as-advisory
- **Verifies:** AC2
- **Action:** Assert SKILL.md contains "ADVISORY" and that this severity level is associated with tier ordering issues (not just DESTRUCTIVE or REVERSIBLE-HIGH)
- **Expected result:** "ADVISORY" severity present and linked to tier-coherence findings
- **Edge case:** No

### skill-defines-reversible-high-severity
- **Verifies:** AC3
- **Action:** Assert SKILL.md contains "REVERSIBLE-HIGH" as a named severity level
- **Expected result:** Match found
- **Edge case:** No

### skill-checks-for-secret-patterns-in-attachment
- **Verifies:** AC3
- **Action:** Assert SKILL.md contains a check for secret patterns in the plan/preview attachment — look for "password=", "token=", "secret=" or similar pattern descriptions
- **Expected result:** Secret pattern check described in review checklist
- **Edge case:** No

### skill-specifies-pass-artefact-path
- **Verifies:** AC4
- **Action:** Assert SKILL.md specifies output path `artefacts/[feature]/infra/[story-id]-infra-review.md` for the PASS artefact
- **Expected result:** Path pattern found
- **Edge case:** No

### skill-requires-status-pass-on-zero-findings
- **Verifies:** AC4
- **Action:** Assert SKILL.md states that zero unacknowledged DESTRUCTIVE/REVERSIBLE-HIGH findings results in a PASS artefact
- **Expected result:** PASS condition documented
- **Edge case:** No

### skill-blocks-sign-off-with-unacknowledged-destructive
- **Verifies:** AC5
- **Action:** Assert SKILL.md explicitly states the review cannot reach sign-off (or cannot produce a PASS artefact) if a DESTRUCTIVE finding remains unacknowledged
- **Expected result:** Block condition documented
- **Edge case:** No

### skill-no-tool-cli-references-in-checklist
- **Verifies:** ADR-004 compliance
- **Action:** Assert no specific tool CLI commands appear as required actions in the review checklist — grep for "terraform", "pulumi", "kubectl" in instructional (non-example) contexts
- **Expected result:** Zero required-tool CLI references
- **Edge case:** No

---

## Integration Tests

None — deliverable is a SKILL.md file; all checks are content assertions.

---

## NFR Tests

### review-checklist-includes-mandatory-secrets-check
- **NFR addressed:** Security
- **Measurement method:** Read SKILL.md; confirm the review checklist section explicitly lists a secrets/credentials check as a mandatory step (not optional or advisory-only)
- **Pass threshold:** Mandatory secrets check found in checklist
- **Tool:** Node.js string search

---

## Out of Scope for This Test Plan

- infra-plan sign-off skill — tested in inf.3
- Automated blast-radius severity calculation — out of scope per story
- Code review checklist items — out of scope per story

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
