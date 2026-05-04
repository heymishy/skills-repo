# Review Report: Section confirmation loop (dsq.2) — Run 1

**Story reference:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/stories/dsq.2-section-confirmation-loop.md
**Date:** 2026-05-05
**Categories run:** A — Traceability, B — Scope, C — AC quality, D — Completeness, E — Architecture compliance
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **2-H1** Category C (AC quality) — AC1 states "when the operator answers the last question in a section, then `htmlRecordAnswer` detects the section boundary." The existing `_getQuestionsForSkill` function (skills.js line 64) calls `extractQuestions` which returns a **flat array** — it does not preserve or expose H2 section groupings. There is no current mechanism to know which questions belong to which section. AC1 assumes a structural capability (`session.questions` carries section metadata) that does not exist in the codebase. This is a hidden prerequisite, not a minor implementation detail.
  Fix: Add an explicit prerequisite to dsq.2's Dependencies block: "Upstream: `extractQuestions` (or a parallel `extractSections` function) must return section-grouped question structure — either as an addition to registerHtmlSession or as a refactor of `_getQuestionsForSkill`." Revise AC1 to be conditional on this structure existing, or add a task within dsq.2 to introduce section-aware extraction first. Alternatively, add a separate prerequisite story (e.g. dsq.1.5) and make dsq.2 depend on it.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **2-M1** Category C (AC quality) — AC2 references "'Confirm' / 'Edit' option" without specifying the HTTP mechanism (new route? query param? form POST?). A test author cannot write an HTTP-level integration test without knowing the URL or form action for these interactions.
  Risk if proceeding: Test plan author must invent the route contract, creating risk of implementation/test divergence.
  To acknowledge: run /decisions, category RISK-ACCEPT. Or specify the route: e.g. `POST /skills/:name/sessions/:id/confirm-section` with body `{ action: 'confirm' | 'edit', text: '...' }`.

---

## LOW findings — note for retrospective

- **2-L1** Category A (Traceability) — AC7 references "all tests passing before this story (including dsq.1's tests)" without stating the expected count. At the time dsq.2 is implemented, the baseline will be 14 (wuce.26) + N new dsq.1 tests. The AC is not self-contained — test authors must infer the count. Acceptable to leave; note for implementation plan.

---

## Summary

1 HIGH, 1 MEDIUM, 1 LOW.
**Outcome:** FAIL — 1 HIGH finding must be resolved before /test-plan.

The HIGH finding (2-H1) is a hidden prerequisite gap: section boundary detection in the session store assumes a flat-array-to-section-grouped refactor that is not in scope for any upstream story.

---

## Score

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| A — Traceability | 5 | PASS |
| B — Scope integrity | 5 | PASS |
| C — AC quality | 2 | FAIL |
| D — Completeness | 5 | PASS |
| E — Architecture compliance | 4 | PASS |
