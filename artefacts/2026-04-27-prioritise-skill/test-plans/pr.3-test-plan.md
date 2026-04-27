# Test Plan: Detect ambiguous single-framework results and explain divergence when multiple frameworks are run

**Story reference:** artefacts/2026-04-27-prioritise-skill/stories/pr.3.md
**Epic reference:** artefacts/2026-04-27-prioritise-skill/epics/pr-e1.md
**Test plan author:** Copilot
**Date:** 2026-04-27

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Tie detection: identifies tied items, offers three options | 2 tests | — | — | — | — | 🟢 |
| AC2 | Divergence threshold: items shifting ≥2 positions flagged | 2 tests | — | — | — | — | 🟢 |
| AC3 | Divergence explanation names model difference (WSJF vs RICE specific language) | 2 tests | — | — | 1 scenario | Untestable-by-nature (quality) | 🟡 |
| AC4 | Three-option resolution offer after divergence explanation | 2 tests | — | — | — | — | 🟢 |
| AC5 | Divergence explanation and resolution choice preserved in scoring record | 1 test | — | — | — | — | 🟢 |
| AC6 | No second-pass prompt when one pass, no tie | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| Quality of divergence explanation language | AC3 | Untestable-by-nature (quality) | A text-pattern check can confirm required framework model terms appear in the SKILL.md instruction, but cannot validate whether the explanation language is actually clear and accurate to a non-engineer reader | Manual scenario 3 in verification script — domain expert reviews explanation during pre-code sign-off and post-merge smoke test 🟡 |

---

## Test Data Strategy

**Source:** Synthetic / self-contained — `.github/skills/prioritise/SKILL.md` is the artifact under test.
**PCI/sensitivity in scope:** No
**Availability:** Available when implementation exists
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1–AC6 | SKILL.md file contents | File system read | None | All checks are text pattern assertions |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### instructs the skill to identify tied items explicitly

- **Verifies:** AC1
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction to detect and name tied items (check for one of: `tie`, `identical scores`, `tied items`, `same score`)
- **Expected result:** Tie detection instruction present
- **Edge case:** No

### instructs the skill to offer three specific options when a tie is detected

- **Verifies:** AC1
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction for a three-option tie-break offer — check that all three are mentioned: tiebreaker pass, manual reorder, and accept as deliberate draw (check for: `tiebreaker`, `manually reorder`, `deliberate draw` or `accept the tie`)
- **Expected result:** All three tie-resolution options present in instruction
- **Edge case:** No

### instructs the skill to flag divergence only for items shifting two or more positions

- **Verifies:** AC2
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains the two-position threshold for divergence flagging (check for: `two or more positions`, `2 or more positions`, `rank changed by two`, `shifted by two`)
- **Expected result:** Two-position threshold explicitly stated in divergence detection instruction
- **Edge case:** No

### instructs the skill not to flag every minor reorder as a divergence

- **Verifies:** AC2
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction to avoid flagging minor reorders (check for: `does not flag every`, `not flag every`, `minor reorder`, `every minor`)
- **Expected result:** Minor-reorder exclusion instruction present
- **Edge case:** No

### instructs the divergence explanation to name WSJF model characteristic

- **Verifies:** AC3
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check that the divergence explanation instruction references WSJF's model characteristic — check for one of: `job-size efficiency`, `small high-value`, `WSJF prioritises`, `efficiency`
- **Expected result:** WSJF model characteristic named in divergence explanation instruction
- **Edge case:** No

### instructs the divergence explanation to name RICE model characteristic involving confidence

- **Verifies:** AC3
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check that the divergence explanation instruction references RICE's confidence weighting (check for: `confidence`, `RICE weights confidence`, `low confidence`)
- **Expected result:** RICE confidence characteristic named in divergence explanation instruction
- **Edge case:** No

### instructs the skill to offer three specific resolution options after divergence explanation

- **Verifies:** AC4
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction for a three-option divergence resolution — check for all three: accept one framework as primary, manually reorder, run a third framework tiebreaker (check for: `accept one framework`, `manually reorder`, `tiebreaker` or `third framework`)
- **Expected result:** All three resolution options present in divergence resolution instruction
- **Edge case:** No

### instructs the skill not to choose the resolution on the operator's behalf

- **Verifies:** AC4
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction that the operator decides the resolution (check for: `operator decides`, `the skill does not choose`, `does not choose`, `operator resolves`)
- **Expected result:** Operator-decides instruction present
- **Edge case:** No

### instructs the skill to preserve both the divergence explanation and resolution choice in the scoring record

- **Verifies:** AC5
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction to preserve divergence explanation and resolution in the record (check for: `preserved in the scoring record`, `record the resolution`, `divergence explanation.*preserved`, `include.*divergence.*artefact`)
- **Expected result:** Preservation instruction present for both divergence explanation and operator choice
- **Edge case:** No

### instructs the skill not to prompt for a second pass when one pass has no tie

- **Verifies:** AC6
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction to proceed directly to output offer when no tie and no second pass requested (check for: `does not prompt for a second pass`, `no second pass unless`, `only if the operator requests`, `proceeds directly to output`)
- **Expected result:** No-unsolicited-second-pass instruction present
- **Edge case:** No

---

## Integration Tests

None beyond the contract check inherited from pr.1/pr.2. pr.3 adds to the existing SKILL.md — no new file seams.

---

## NFR Tests

### SKILL.md additions contain no embedded HTML except HTML comments

- **NFR addressed:** Architecture constraint — Markdown only
- **Measurement method:** Read SKILL.md; assert no non-comment HTML tags present (cumulative check)
- **Pass threshold:** 0 non-comment HTML tags found
- **Tool:** Node.js regex check

---

## Out of Scope for This Test Plan

- Workshopping mode facilitation of divergence discussion — covered by pr.4 test plan
- Inclusion of divergence record in the saved artefact — covered by pr.5 test plan (AC3)

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Accuracy of model-level explanation language | The explanation of why WSJF and RICE diverge requires accurate characterisation of each framework's ranking model — errors here produce misleading explanations; text pattern checks only confirm the required terms appear | Manual scenario 3 in verification script — domain expert reviews the explanation wording for accuracy during pre-code sign-off |
