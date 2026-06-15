# Test Plan: inc3 — Reduce clarifying question frequency

**Story:** inc3
**Feature:** 2026-06-15-ideate-web-ux-inc3
**Date:** 2026-06-15

---

## Tests

| Test | AC | Method | Description |
|------|-----|--------|-------------|
| T1 | AC1 | Automated | SKILL.md contains "infer" or "inference" instruction text |
| T2 | AC2 | Automated | SKILL.md contains question-limit guidance (≤1 per step or equivalent) |
| T3 | AC3 | Automated | SKILL.md contains "I'm assuming" or "assuming X" pattern instruction |
| T4 | AC4 | Automated | Existing lens step headings (A1, A2, A3, A4, B1, etc.) still present and unmodified |
| T5 | AC5 | Manual | Live ≥4-turn session shows ≤1 question per lens step |

## AC5 gap

T5 is manual (human-in-the-loop). Acknowledged per DoR. Verification artefact required for DoD.

## Test file

`tests/check-inc3-question-cadence.js` — 4 automated assertions (T1–T4).
