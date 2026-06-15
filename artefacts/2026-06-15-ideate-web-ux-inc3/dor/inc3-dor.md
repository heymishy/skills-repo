# Definition of Ready: inc3 — Reduce clarifying question frequency

**Story:** inc3
**Feature:** 2026-06-15-ideate-web-ux-inc3
**DoR completed:** 2026-06-15
**Signed off by:** Hamish King
**Oversight level:** High (governed file)

---

## H1 — User story format ✅

"As a facilitator or product lead using /ideate, I want the skill to make confident inferences from my context and proceed with substantive output, so that sessions feel like a collaborative conversation rather than an interview."

## H2 — ≥3 Acceptance Criteria ✅

5 ACs. AC1–AC4 automated. AC5 human-in-the-loop.

## H3 — Every AC has ≥1 test ✅

| AC | Test | Method |
|----|------|--------|
| AC1 | T1 | Automated — inference instruction text present |
| AC2 | T2 | Automated — question-limit guidance present |
| AC3 | T3 | Automated — assume-and-proceed pattern present |
| AC4 | T4 | Automated — existing lens headings unmodified |
| AC5 | T5 | Manual — live ≥4-turn session; verification artefact required |

## H4 — Out of scope ✅

No changes to existing lens step content, skills.js, chat-view.js, or any test files except check-inc3-question-cadence.js.

## H5 — Benefit linkage ✅

M1 (session turn efficiency).

## H6 — Complexity rated ✅

Complexity 1. Same pattern as inc2.2. Known risk: instruction phrasing affects model behaviour non-deterministically; mitigated by live verification.

## H7 — No unresolved HIGH review findings ✅

Review 1: PASS. 0 HIGH. 1 LOW (3-L1 — verification window). Resolved: 7-day window stated here and in DoD entry condition.

## H8 — No uncovered ACs ✅

AC5 gap acknowledged. Verification artefact required for DoD.

## H9 — Architecture constraints ✅

- Modify ONLY: `.github/skills/ideate/SKILL.md` (additive only — new instruction block, no modification to existing lens step text)
- New test file: `tests/check-inc3-question-cadence.js` (4 automated tests)
- Append to package.json test chain: `&& node tests/check-inc3-question-cadence.js`
- Human review and merge required (governed file)
- Verification session within 7 calendar days of merge

---

## DoD Entry Condition

Human-in-the-loop verification: ≥4-turn /ideate session after merge. Observer counts clarifying questions per lens step — should be ≤1 per step. Verification artefact at `artefacts/2026-06-15-ideate-web-ux-inc3/verification/inc3-cadence-verification.md`. Window: ≤7 days post-merge.

---

## Coding Agent Instructions

```
Proceed: Yes
Modify ONLY: .github/skills/ideate/SKILL.md
New files:
  - tests/check-inc3-question-cadence.js  (4 tests T1–T4)
Append to package.json test chain: && node tests/check-inc3-question-cadence.js

SKILL.md change (additive only):
  Add the following instruction block BEFORE the "## Step 1 — Load context" section
  (at the top of the operational guidance, so it governs all lenses):

  ## Conversation cadence

  Move with the user — do not ask for confirmation before making progress.

  - **Infer, then state:** When context makes an answer inferable, state your inference
    explicitly ("I'm assuming X — correct me if wrong") and proceed. Do not ask a question
    when a sensible default exists.
  - **One question per step:** If genuine ambiguity exists that materially affects the lens
    output, ask exactly one focused question. Do not ask multiple questions in the same turn.
  - **Proceed after one answer:** Once the user answers a clarifying question, proceed to
    substantive output immediately. Do not re-confirm.
  - **Questions are for genuine forks only:** Reserve clarifying questions for cases where
    two plausible interpretations would lead to meaningfully different lens outputs. Everything
    else is an inference.

Human oversight: governed file. PR requires human review and merge by platform maintainer.
After merge, run a live /ideate session of ≥4 turns and write the verification artefact.
```
