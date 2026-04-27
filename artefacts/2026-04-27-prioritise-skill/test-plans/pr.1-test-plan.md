# Test Plan: Accept candidate items and guide framework selection with rationale at session open

**Story reference:** artefacts/2026-04-27-prioritise-skill/stories/pr.1.md
**Epic reference:** artefacts/2026-04-27-prioritise-skill/epics/pr-e1.md
**Test plan author:** Copilot
**Date:** 2026-04-27

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Opening statement names all 3 frameworks with minimum required content | 3 tests | — | — | — | — | 🟢 |
| AC2 | Candidate intake: acknowledge all items, ask for missing context, confirm before proceeding | 2 tests | — | — | — | — | 🟢 |
| AC3 | Framework suggestion names framework, states reason, invites confirm/override | 2 tests | — | — | — | — | 🟢 |
| AC4 | Override acceptance: no re-arguing, confirms choice, proceeds | 1 test | — | — | — | — | 🟢 |
| AC5 | At most two clarifying questions before suggesting a framework | 1 test | — | — | — | — | 🟢 |
| AC6 | Partial SKILL.md passes `check-skill-contracts.js` with no violations | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None — all ACs are covered by automated tests against SKILL.md text content and script execution.

---

## Test Data Strategy

**Source:** Synthetic / self-contained — the implementation artefact (`.github/skills/prioritise/SKILL.md`) is the object under test. Tests read the file and assert required text patterns are present.
**PCI/sensitivity in scope:** No
**Availability:** Available when implementation exists (tests are written to fail before implementation)
**Owner:** Self-contained — test scripts generate no external data

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | SKILL.md file contents | File system read | None | Checks for specific required strings |
| AC2 | SKILL.md file contents | File system read | None | Checks for intake instruction patterns |
| AC3 | SKILL.md file contents | File system read | None | Checks for suggestion + rationale instruction patterns |
| AC4 | SKILL.md file contents | File system read | None | Checks for override acceptance patterns |
| AC5 | SKILL.md file contents | File system read | None | Checks for question-count constraint |
| AC6 | SKILL.md file + check-skill-contracts.js | File system + script execution | None | Requires partial SKILL.md to exist |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### opens with a statement that names WSJF and mentions cost of delay

- **Verifies:** AC1
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md content; check it contains the string `WSJF` and the string `cost of delay` (case-insensitive) within 200 characters of each other or in the same section
- **Expected result:** Both strings present in proximity — skill names WSJF and its primary signal
- **Edge case:** No — required string

### opens with a statement that names RICE and all four factors

- **Verifies:** AC1
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md content; check it contains `RICE` and contains all four of: `Reach`, `Impact`, `Confidence`, `Effort`
- **Expected result:** All five strings present — skill names RICE with complete factor list
- **Edge case:** No — required strings

### opens with a statement that names MoSCoW and all four buckets

- **Verifies:** AC1
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md content; check it contains `MoSCoW` and contains all four of: `Must-have`, `Should-have`, `Could-have`, `Won't-have` (or `Won't have`)
- **Expected result:** All five strings present — skill names MoSCoW with complete bucket list
- **Edge case:** No — required strings

### instructs the skill to acknowledge all candidate items before proceeding

- **Verifies:** AC2
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md content; check it contains an instruction to acknowledge or confirm the candidate list before proceeding (check for one of: `acknowledge`, `confirm the list`, `candidate list is complete`, `complete the list`)
- **Expected result:** At least one of the required phrases present
- **Edge case:** No

### instructs the skill to ask for missing context before framework selection

- **Verifies:** AC2
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains an instruction to ask for missing context (check for one of: `goals`, `time horizon`, `decision audience`, `missing context`)
- **Expected result:** At least one context-gathering prompt instruction present
- **Edge case:** No

### instructs the skill to name the suggested framework and state a primary reason

- **Verifies:** AC3
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains an instruction that the framework suggestion includes a reason or rationale for the fit (check for one of: `primary reason`, `fits`, `because`, `rationale`, `reason it fits`)
- **Expected result:** Framework suggestion instruction includes reason-stating requirement
- **Edge case:** No

### instructs the skill to invite confirm or override before proceeding to scoring

- **Verifies:** AC3
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains an instruction to wait for operator confirmation before scoring (check for one of: `confirm or override`, `explicit confirm`, `does not proceed without`, `proceed without an explicit`)
- **Expected result:** Confirm-before-proceeding instruction present
- **Edge case:** No

### instructs the skill to accept an override without re-arguing

- **Verifies:** AC4
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains an instruction that overrides are accepted without re-suggesting (check for one of: `without re-arguing`, `accept the choice`, `does not re-suggest`, `accepts`, `override`)
- **Expected result:** Override acceptance instruction present
- **Edge case:** No

### instructs the skill to ask at most two clarifying questions before suggesting

- **Verifies:** AC5
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains a constraint on clarifying questions (check for one of: `at most two`, `two clarifying`, `no more than two`, `maximum two`)
- **Expected result:** Question-count limit instruction present
- **Edge case:** No

---

## Integration Tests

### partial SKILL.md passes check-skill-contracts.js with no contract violations

- **Verifies:** AC6
- **Components involved:** `.github/skills/prioritise/SKILL.md` (partial, as created by pr.1), `.github/scripts/check-skill-contracts.js`
- **Precondition:** SKILL.md exists at the correct path with at least the sections written by pr.1; `check-skill-contracts.js` has a `prioritise` entry in `CONTRACTS[]`
- **Action:** Execute `node .github/scripts/check-skill-contracts.js` and capture exit code and output
- **Expected result:** Exit code 0; output contains no violation lines for the `prioritise` skill
- **Edge case:** Yes — if the `prioritise` contract entry does not yet exist in `CONTRACTS[]` (added by pr.5), this test must be written to skip or to only check that the partial file does not violate any contracts that *are* already defined for it

---

## NFR Tests

### SKILL.md contains no embedded HTML except HTML comments

- **NFR addressed:** Architecture constraint — Markdown only, no embedded HTML except comments
- **Measurement method:** Read SKILL.md; assert no `<` followed by a tag name that is not inside `<!--...-->` comment
- **Pass threshold:** 0 non-comment HTML tags found
- **Tool:** Node.js regex check

---

## Out of Scope for This Test Plan

- Scoring any items — covered by pr.2 test plan
- Multi-framework pass logic — covered by pr.3 test plan
- Workshopping mode — covered by pr.4 test plan
- Output format and save — covered by pr.5 test plan
- Validating the complete SKILL.md contract (requires all pr.* stories implemented) — covered by pr.5 test plan

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC3 quality: whether the *wording* of the framework suggestion is actually clear to a non-engineer | Text pattern checks confirm the instruction exists; they cannot validate the quality or clarity of the instruction text itself | Covered by pr.1 verification script scenario 3 — manual review by domain expert before coding begins |
| AC6 partial-file contract: `check-skill-contracts.js` may not yet have a `prioritise` entry when pr.1 is implemented | The `prioritise` contract entry is added as part of pr.5's implementation scope | Integration test must verify either (a) the entry exists and the file passes, or (b) the entry does not exist yet and the script does not error on an unknown skill — see test note above |
