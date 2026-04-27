# Test Plan: Score candidate items conversationally across WSJF, RICE, and MoSCoW with suggested values and rationale elicitation

**Story reference:** artefacts/2026-04-27-prioritise-skill/stories/pr.2.md
**Epic reference:** artefacts/2026-04-27-prioritise-skill/epics/pr-e1.md
**Test plan author:** Copilot
**Date:** 2026-04-27

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | WSJF pass: one dimension at a time, suggested value + reasoning, confirm/override | 3 tests | — | — | — | — | 🟢 |
| AC2 | RICE pass: one dimension at a time, same pattern | 2 tests | — | — | — | — | 🟢 |
| AC3 | MoSCoW pass: one item at a time, bucket + rationale, confirm/override | 2 tests | — | — | — | — | 🟢 |
| AC4 | Override accepted without re-arguing; corrected value used in calculations | 1 test | — | — | — | — | 🟢 |
| AC5 | Rationale elicitation: at least one question per item before proceeding to output | 2 tests | — | — | — | — | 🟢 |
| AC6 | Non-answer to rationale prompt records placeholder, does not block | 2 tests | — | — | — | — | 🟢 |
| AC7 | Scored list presented in descending order with score + rationale; offers next step | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

None — all ACs are covered by automated tests against SKILL.md text content. Quality of suggested values (whether the heuristics are well-calibrated for real-world use) is out of scope for automated testing and is captured in manual verification scenarios.

---

## Test Data Strategy

**Source:** Synthetic / self-contained — `.github/skills/prioritise/SKILL.md` is the artifact under test. Tests read the file and assert required instruction patterns are present.
**PCI/sensitivity in scope:** No
**Availability:** Available when implementation exists (tests written to fail before implementation)
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1–AC7 | SKILL.md file contents | File system read | None | All checks are text pattern assertions |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### instructs WSJF scoring to present Cost of Delay and its sub-components individually

- **Verifies:** AC1
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains an instruction to present WSJF Cost of Delay components individually — check for all of: `User`, `Business Value`, `Time Criticality`, `Risk Reduction`
- **Expected result:** All three CoD component terms present in the SKILL.md — skill names the WSJF sub-components
- **Edge case:** No

### instructs WSJF scoring to include Job Size as a separate dimension

- **Verifies:** AC1
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains `Job Size` as a named dimension in WSJF scoring
- **Expected result:** `Job Size` present — skill covers all four WSJF scoring dimensions
- **Edge case:** No

### instructs WSJF scoring to suggest a value with reasoning and invite override

- **Verifies:** AC1
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains an instruction to suggest a value with a reasoning sentence for WSJF (check for one of: `suggesting a plausible value`, `suggested value`, `suggest a score`)
- **Expected result:** Suggested-value-with-reasoning instruction present in WSJF section
- **Edge case:** No

### instructs RICE scoring to present all four dimensions individually

- **Verifies:** AC2
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction for RICE scoring with all four dimensions: `Reach`, `Impact`, `Confidence`, `Effort` — each named as a separate scoring dimension
- **Expected result:** All four dimensions present as individual scoring steps in RICE instruction
- **Edge case:** No

### instructs RICE scoring to follow the same suggest-and-invite pattern as WSJF

- **Verifies:** AC2
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check that the RICE scoring section contains a suggested-value-and-invite-override instruction (same pattern as WSJF) — check for `confirm or override` or equivalent in the context of RICE scoring
- **Expected result:** RICE scoring section includes override invitation instruction
- **Edge case:** No

### instructs MoSCoW scoring to assign each item to a bucket with a rationale sentence

- **Verifies:** AC3
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction to assign items to MoSCoW buckets one at a time with a rationale (check for: `one-sentence rationale` or `rationale` within MoSCoW section)
- **Expected result:** Per-item rationale instruction present in MoSCoW section
- **Edge case:** No

### instructs MoSCoW scoring not to present all items simultaneously

- **Verifies:** AC3
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains an instruction that MoSCoW does not present all items at once (check for: `does not present all items simultaneously`, `one at a time`, `item by item`)
- **Expected result:** One-at-a-time constraint instruction present in MoSCoW section
- **Edge case:** No

### instructs the skill to accept a score override and use it in subsequent calculations

- **Verifies:** AC4
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction for override acceptance that includes using the corrected value (check for one of: `uses it in all subsequent`, `uses the corrected value`, `corrected value is used`)
- **Expected result:** Override-and-use instruction present
- **Edge case:** No

### instructs the skill to ask at least one rationale question per item before proceeding to output

- **Verifies:** AC5
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction to elicit rationale from the operator during scoring (check for: `rationale question`, `What's driving`, `elicit`, `rationale elicitation`)
- **Expected result:** Rationale elicitation instruction present
- **Edge case:** No

### instructs the skill not to skip rationale elicitation even when the operator is moving quickly

- **Verifies:** AC5
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains an instruction that rationale is not skipped (check for: `does not skip rationale`, `even if the operator is moving quickly`, `not skip`)
- **Expected result:** No-skip constraint on rationale elicitation present
- **Edge case:** No

### instructs the skill to record a placeholder marker when rationale is not provided

- **Verifies:** AC6
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains a placeholder instruction for absent rationale (check for: `[rationale not provided]`, `placeholder`, `placeholder rationale`)
- **Expected result:** Placeholder marker instruction present with the specific text `[rationale not provided]` or equivalent
- **Edge case:** No

### instructs the skill not to block progress when rationale is not provided

- **Verifies:** AC6
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains an instruction that the skill proceeds after recording the placeholder (check for: `does not block progress`, `proceeds`, `does not block`)
- **Expected result:** Proceed-without-blocking instruction present alongside the placeholder instruction
- **Edge case:** No

### instructs the scored list to be presented in descending score order

- **Verifies:** AC7
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction to present scored items in descending order (check for: `descending score order`, `descending order`, `highest to lowest`, `ranked order`)
- **Expected result:** Descending-order presentation instruction present
- **Edge case:** No

### instructs the scored list to include a next-step offer after presenting results

- **Verifies:** AC7
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains an offer to proceed to output or run another framework pass after presenting the scored list (check for: `proceed to output`, `run another framework`, `another pass`, `offers to proceed`)
- **Expected result:** Next-step offer instruction present after scored list presentation
- **Edge case:** No

---

## Integration Tests

None beyond the contract check inherited from pr.1 (partial SKILL.md contract). pr.2 adds to the existing SKILL.md — no new file seams introduced.

---

## NFR Tests

### SKILL.md additions contain no embedded HTML except HTML comments

- **NFR addressed:** Architecture constraint — Markdown only
- **Measurement method:** Read SKILL.md; assert no non-comment HTML tags present (same check as pr.1 NFR test — cumulative)
- **Pass threshold:** 0 non-comment HTML tags found in the complete file at this stage
- **Tool:** Node.js regex check

---

## Out of Scope for This Test Plan

- Whether the skill's suggested WSJF/RICE/MoSCoW heuristics are well-calibrated for real-world use — that is a quality concern validated by M1/M2 metrics in production
- Multi-framework pass orchestration — covered by pr.3 test plan
- Workshopping/group mode — covered by pr.4 test plan
- Generating the saved artefact — covered by pr.5 test plan

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Calibration quality of suggested values | No automated test can validate whether "3 is a plausible WSJF Job Size for a medium-complexity API" — this requires domain judgment | Manual verification scenarios 1–3 in the verification script cover scoring-pass quality |
| Rationale elicitation effectiveness | Text pattern checks confirm the instruction exists; they cannot validate the quality of the prompting language during a live session | Manual verification scenario 4 in the verification script covers this |
