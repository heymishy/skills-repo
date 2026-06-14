# Definition of Ready: inc2.2 — SKILL.md condition marker instruction

**Story:** inc2.2
**Feature:** 2026-06-15-ideate-web-ux-inc2
**DoR completed:** 2026-06-15
**Signed off by:** Hamish King — Platform operator / tech lead
**Oversight level:** High (governed file — human review and merge required; human-in-the-loop verification required post-merge)

---

## H1 — User story format ✅

"As a platform operator, I want the /ideate skill to emit `---CONDITION-JSON---` markers when it identifies constraints, dependencies, and outcome conditions during a session, so that conditions surface in the conditions panel automatically."

---

## H2 — ≥3 Acceptance Criteria ✅

6 ACs defined. AC1–AC5 automated. AC6 human-in-the-loop (acknowledged gap, DoD entry condition). See `artefacts/2026-06-15-ideate-web-ux-inc2/stories/inc2.2.md`.

---

## H3 — Every AC has ≥1 test ✅

| AC | Test(s) | Method |
|----|---------|--------|
| AC1 | T1 | Automated — SKILL.md contains CONDITION-JSON text |
| AC2 | T2 | Automated — all four fields present |
| AC3 | T3 | Automated — all three type values named |
| AC4 | T4 | Automated — complete example present |
| AC5 | T5 | Automated — "when to emit" guidance present |
| AC6 | Manual | Human-in-the-loop verification ≥4-turn live session |

---

## H4 — Out of scope populated ✅

No changes to existing SKILL.md content, skills.js, chat-view.js, or any test files.

---

## H5 — Benefit linkage ✅

M2 (discovery constraint fill rate).

---

## H6 — Complexity rated ✅

Complexity 1. Identical pattern to iwu.6. Known risk: SKILL.md instruction quality affects emission rate; mitigated by human-in-the-loop verification.

---

## H7 — No unresolved HIGH review findings ✅

Review run 1: PASS. 0 HIGH. 1 LOW (1-L1 — verification time bound). Resolved: verification session must be run within 7 calendar days of merge.

---

## H8 — No uncovered ACs ✅

AC6 gap acknowledged per test plan. DoD entry condition ensures human verification before DoD.

---

## H9 — Architecture constraints populated ✅

- Modify ONLY: `.github/skills/ideate/SKILL.md` (additive only — no modification of existing content)
- New test file: `tests/check-inc2.2-condition-marker-instruction.js`
- New verification artefact: `artefacts/2026-06-15-ideate-web-ux-inc2/verification/inc2.2-emission-verification.md` (human-authored, required for DoD)
- Extend package.json test chain: `&& node tests/check-inc2.2-condition-marker-instruction.js`
- Human review and merge required (Constraint 4 — governed file)
- Verification session within 7 calendar days of merge

---

## DoD Entry Condition

Human-in-the-loop verification: a real /ideate session of ≥4 turns must be run after merge. Operator confirms `---CONDITION-JSON---` markers are emitted at appropriate points. Verification artefact must be present at `artefacts/2026-06-15-ideate-web-ux-inc2/verification/inc2.2-emission-verification.md` before this story can be marked definition-of-done. Verification window: ≤7 days post-merge.

---

## Coding Agent Instructions

```
Proceed: Yes
Schema depends on: inc2.1 (conditions panel must be delivered first)
Modify ONLY: .github/skills/ideate/SKILL.md
New files:
  - tests/check-inc2.2-condition-marker-instruction.js  (5 tests T1–T5)
Append to package.json test chain: && node tests/check-inc2.2-condition-marker-instruction.js

SKILL.md change (additive only):
  Add the following content AFTER the existing ---ASSUMPTION-JSON--- instruction section
  (do not modify the assumption instruction — add after it, before the next major section):

  ## Condition markers

  When you identify a hard constraint, dependency, or condition of satisfaction during ideation,
  emit a condition marker on its own line:

  ---CONDITION-JSON: {"id":"<kebab-slug>","text":"<condition as a plain declarative sentence>",
  "type":"<constraint|dependency|outcome>","source":"model"}---

  Type definitions:
  - constraint: a hard technical or platform constraint that bounds the solution
  - dependency: something this solution requires that is not yet in place or owned externally
  - outcome: a condition of satisfaction — what "done" looks like for this opportunity

  Example:
  ---CONDITION-JSON: {"id":"no-disk-write","text":"Session state must remain in-memory only — no disk writes permitted for MVP.",
  "type":"constraint","source":"model"}---

  When to emit: emit a condition marker when you identify a definite constraint, dependency, or
  outcome condition — not for assumptions (use ---ASSUMPTION-JSON--- for those). Emit at the point
  of identification, not batched at end of lens. Do not emit conditions about things you are uncertain
  about — those are assumptions, not conditions.

Human oversight: this is a governed file. PR requires human review and merge by platform maintainer.
After merge, run a live /ideate session of ≥4 turns and write the verification artefact.
```
