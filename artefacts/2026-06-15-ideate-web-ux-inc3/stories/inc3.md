# Story: inc3 — Reduce clarifying question frequency in /ideate

**Story ID:** inc3
**Feature:** 2026-06-15-ideate-web-ux-inc3
**Date:** 2026-06-15

---

## User story

As a facilitator or product lead using /ideate, I want the skill to make confident inferences from my context and proceed with substantive output, so that sessions feel like a collaborative conversation rather than an interview.

---

## Acceptance criteria

**AC1 — Inference-first instruction present:** SKILL.md contains an explicit instruction directing the model to infer from prior context and proceed rather than asking for confirmation.

**AC2 — Question limit guidance present:** SKILL.md contains explicit guidance limiting clarifying questions to ≤1 per lens step (or equivalent phrasing that caps question frequency).

**AC3 — Assumption-and-proceed pattern documented:** SKILL.md instructs the model to state its inference explicitly ("I'm assuming X — let me know if that's wrong") rather than asking a question when a sensible default exists.

**AC4 — Existing lens step content unchanged:** No modification to any existing lens step (`A1`–`A4`, `B1`–`B3`, `C1`–`C3`, `D` questions, `E1`–`E4`) text or instructions.

**AC5 — Human-in-the-loop verification:** A live /ideate session of ≥4 turns after merge confirms the model asks noticeably fewer sequential clarifying questions. Verification artefact written.

---

## Architecture constraints

- Modify ONLY: `.github/skills/ideate/SKILL.md` (additive only — instruction block added before or after the existing lens step listing, not within any existing step)
- New test file: `tests/check-inc3-question-cadence.js` (4 automated tests T1–T4 covering AC1–AC4)
- Append to package.json test chain
- Human review and merge required (governed file — Constraint 4)
- Verification session within 7 calendar days of merge

---

## DoD entry condition

Human-in-the-loop verification: a live /ideate session of ≥4 turns must be run after merge and show a measurable reduction in clarifying question frequency. Verification artefact at `artefacts/2026-06-15-ideate-web-ux-inc3/verification/inc3-cadence-verification.md`.
