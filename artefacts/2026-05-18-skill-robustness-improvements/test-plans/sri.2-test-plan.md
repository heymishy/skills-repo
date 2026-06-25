# Test Plan — sri.2: Expand DoD entry condition message with actionable guidance

**Story:** artefacts/2026-05-18-skill-robustness-improvements/stories/sri.2.md
**Review:** artefacts/2026-05-18-skill-robustness-improvements/review/sri.2-review-1.md — PASS (Run 1, 2026-06-25)
**Date:** 2026-06-25
**Test runner:** `node tests/check-sri2-dod-entry-condition.js` (file to be created by coding agent)
**Framework:** Plain Node.js — content assertions on `skills/definition-of-done/SKILL.md` read from disk

---

## Test Data Strategy

**Strategy:** Synthetic — tests read `skills/definition-of-done/SKILL.md` from disk and assert text patterns. No external data, no network calls, no runtime session.

**Data owner:** Self-contained.

**PCI/sensitivity:** None.

---

## AC Coverage Table

| AC | Test(s) | Type | Gap |
|----|---------|------|-----|
| AC1 — message includes PR status check guidance | T1 | Unit (content) | None |
| AC2 — message includes next-steps sequence to reach merge | T2 | Unit (content) | None |
| AC3 — message includes gate rationale explanation | T3 | Unit (content) | None |
| AC4 — all three elements in a single readable block | T4 | Unit (content) | None |
| AC5 — guidance absent from post-merge flow | T5 | Unit (content regression guard) | None |

---

## Unit Tests

Test file: `tests/check-sri2-dod-entry-condition.js`

The entry condition block in `skills/definition-of-done/SKILL.md` is identifiable by the text "Entry condition" and the early-exit text currently reading "PR is not yet merged." — lines 33–48 in the current file. After implementation, this block must contain all three required elements.

**T1 — `dod-entry-condition-contains-pr-status-check`** (AC1)
- Precondition: `skills/definition-of-done/SKILL.md` exists
- Action: read file; extract the entry condition section (text between "## Entry condition check" and the next `##` heading); assert presence of a PR status check instruction — pattern: `/gh pr view/i` OR `/check.*PR.*status/i` OR `/PR.*merged.*check/i` OR `/how to check.*merged/i`
- Expected: pattern found in entry condition section
- Currently: FAIL — entry condition block contains "PR is not yet merged" with no check guidance

**T2 — `dod-entry-condition-contains-next-steps-sequence`** (AC2)
- Action: read file; in the entry condition section, assert presence of a next-steps instruction — pattern: `/mark.*ready/i` OR `/ready for review/i` OR `/get.*approval/i` OR `/next steps/i` OR `/what to do/i`
- Expected: pattern found
- Currently: FAIL — no next-steps text in entry condition

**T3 — `dod-entry-condition-contains-gate-rationale`** (AC3)
- Action: read file; in the entry condition section, assert presence of an explanation of why the gate exists — pattern: `/what.*actually.*shipped/i` OR `/validates.*merged/i` OR `/after merge/i.*because/i` OR `/why.*this.*gate/i` OR `/not.*open.*PR/i`
- Expected: pattern found
- Currently: FAIL — entry condition contains no rationale

**T4 — `dod-entry-condition-all-three-elements-present`** (AC4)
- Action: read file; extract the entry condition section; assert all three patterns from T1, T2, and T3 are all found within that same bounded section — not scattered across the file
- This test fails if any one of the three is absent from the section, or if elements are spread into separate section blocks outside the entry condition
- Expected: all three found within the entry condition section
- Currently: FAIL — none of the three are present

**T5 — `dod-post-merge-flow-unchanged`** (AC5)
- Action: read `skills/definition-of-done/SKILL.md`; assert that the section following the entry condition (starting with "## Step 1" or the first substantive step) still contains the primary DoD steps — pattern: `/AC coverage/i` AND `/test plan/i` AND `/metric/i`
- Expected: patterns found (post-merge flow not accidentally removed or truncated)
- Currently: PASS (regression guard — passes before and after implementation)
- Note: comment in test file: `// regression guard — verifies the post-merge flow was not accidentally modified`

---

## NFR Tests

No NFRs were identified for sri.2 (text-only change, no data, no security surface). NFR section is intentionally empty.

---

## Gap Table

No gaps. All 5 ACs testable via content assertion on the SKILL.md file.

---

## Integration Tests

None — single file change, no cross-component handoff.

---

## Test count summary

| Type | Count |
|------|-------|
| Unit (content assertion — must fail before impl) | 4 |
| Unit (regression guard — pass before and after) | 1 |
| NFR | 0 |
| **Total** | **5** |
| Integration | 0 |
