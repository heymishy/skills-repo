# AC Verification Script: inf.2 — Write `infra-review` SKILL.md with DESTRUCTIVE/REVERSIBLE-HIGH/ADVISORY severity scale

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.2.md
**Technical test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/inf.2-test-plan.md
**Script version:** 1
**Verified by:** ________ | **Date:** ________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open `.github/skills/infra-review/SKILL.md` in a text editor

**Reset between scenarios:** Not required — all scenarios read the same file

---

## Scenarios

---

### Scenario 1: DESTRUCTIVE finding hard-blocks and requires explicit acknowledgement

**Covers:** AC1, AC5

**Steps:**
1. Find the severity scale section in the SKILL.md
2. Check that "DESTRUCTIVE" is listed as the highest severity
3. Check that the review instructions say the operator must explicitly acknowledge (e.g. type "PROCEED: Yes" with the finding text, or equivalent) before the review can continue past a DESTRUCTIVE finding
4. Confirm that the instructions say: if a DESTRUCTIVE finding remains unacknowledged, the review cannot reach sign-off

**Expected outcome:**
> DESTRUCTIVE is named as a severity level. An explicit acknowledgement step is required — the operator cannot skip past a DESTRUCTIVE finding. The instructions state that an unacknowledged DESTRUCTIVE finding blocks the PASS artefact.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Tier-coherence check flags production-before-CI ordering as ADVISORY

**Covers:** AC2

**Steps:**
1. Find the review checklist or checklist items in the SKILL.md
2. Check that there is a coherence check for tier validation ordering
3. Check that the specific case where production shows "Validated" before CI/test shows "Validated" is described as producing an ADVISORY finding (not DESTRUCTIVE or REVERSIBLE-HIGH)

**Expected outcome:**
> The SKILL.md describes a tier-coherence check. Validating production before CI is flagged as an ADVISORY finding — the system has been validated out of the expected sequence, which is suspicious but not necessarily destructive.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Secret pattern in plan/preview attachment raises REVERSIBLE-HIGH

**Covers:** AC3

**Steps:**
1. Find the checklist item for detecting secrets in the plan/preview attachment
2. Confirm that detecting strings like `password=`, `token=`, or `secret=` followed by a non-placeholder value raises a finding
3. Confirm the finding severity is REVERSIBLE-HIGH (not ADVISORY or DESTRUCTIVE)

**Expected outcome:**
> The review checklist includes a check for secret patterns (at minimum: `password=`, `token=`, `secret=` patterns). When detected, the severity is REVERSIBLE-HIGH — serious enough to block sign-off unless explicitly acknowledged, but does not permanently destroy data.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Zero unacknowledged findings results in PASS artefact at the correct path

**Covers:** AC4

**Steps:**
1. Find the PASS/sign-off section in the SKILL.md
2. Confirm the conditions for PASS: zero unacknowledged DESTRUCTIVE and zero unacknowledged REVERSIBLE-HIGH findings
3. Confirm the output artefact path is documented as `artefacts/[feature]/infra/[story-id]-infra-review.md`

**Expected outcome:**
> The SKILL.md states that when no DESTRUCTIVE or REVERSIBLE-HIGH findings remain unacknowledged, the review produces a PASS artefact. The path follows the `artefacts/[feature]/infra/[story-id]-infra-review.md` convention.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Review checklist contains no tool CLI commands as requirements

**Covers:** NFR (ADR-004)

**Steps:**
1. Read through all checklist items in the SKILL.md
2. Check for any instructions like "run terraform plan", "execute pulumi preview", or any CLI command from a specific tool
3. If tool names appear, check whether they are in an example list (acceptable) or as required commands (not acceptable)

**Expected outcome:**
> No checklist item requires the operator to run a specific tool's CLI command. Tool references, if present, appear only in example lists using language like "e.g. your plan output" or "run your plan/preview tool and check the output."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — DESTRUCTIVE hard-blocks with explicit ack required | | |
| Scenario 2 — tier-coherence check ADVISORY | | |
| Scenario 3 — secret pattern → REVERSIBLE-HIGH | | |
| Scenario 4 — zero findings → PASS at correct path | | |
| Scenario 5 — no tool CLI requirements | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | | |
