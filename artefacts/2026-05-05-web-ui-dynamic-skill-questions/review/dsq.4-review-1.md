# Review Report: Section-by-section artefact assembly (dsq.4) — Run 1

**Story reference:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/stories/dsq.4-section-artefact-assembly.md
**Date:** 2026-05-05
**Categories run:** A — Traceability, B — Scope, C — AC quality, D — Completeness, E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **4-M1** Category C (AC quality) — AC6 states "tests asserting `artefactContent` shape must be updated" — this is a rework instruction embedded in an acceptance criterion, not an observable system behaviour. ACs describe what the system does; guidance to update tests belongs in implementation notes or NFRs.
  Risk if proceeding: Test-plan author may produce a test that asserts about test file contents rather than system output behaviour.
  To acknowledge: run /decisions, category RISK-ACCEPT. Or rewrite AC6 as a regression AC: "Given this story is implemented, when `htmlGetPreview` is called for a skill with H2 sections, then the returned `artefactContent` begins with an H2 heading — not a 'Q1:' prefix."

- **4-M2** Category B (Scope integrity) — AC5 states "commit-preview renders section-structured content" which implies a change to the commit-preview HTML template, but the story's Out-of-Scope and Architecture Constraints fields do not clarify the boundary between data-shape changes (`htmlGetPreview`) and template-rendering changes (the HTML). The scope of any template edit is unspecified.
  Risk if proceeding: Implementation author may over-scope the template change or under-scope it and produce a page that cannot render structured content.
  To acknowledge: run /decisions, category RISK-ACCEPT. Or add to Out-of-Scope: "No change to the commit flow itself — only the content shape passed to the existing commit-preview template changes. The template may require minimal conditional rendering if it currently hard-codes Q/A label prefixes."

---

## LOW findings — note for retrospective

- **4-L1** Category D (Completeness) — The dependency on dsq.2 is described as "soft dependency (uses `session.sectionDrafts` if available)" — AC3 correctly covers the absent-draft fallback (concatenate raw answers). However, a test author reading only the Dependencies field may not know whether dsq.2 being absent affects dsq.4's testability. Clarify in implementation notes: "dsq.4 is fully testable without dsq.2 having been built; `session.sectionDrafts` will simply be absent and AC3 path is tested."

---

## Summary

0 HIGH, 2 MEDIUM, 1 LOW.
**Outcome:** PASS — no HIGH findings. MEDIUM findings are AC phrasing and scope boundary precision issues, addressable at test-plan time without story rework.

---

## Score

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| A — Traceability | 5 | PASS |
| B — Scope integrity | 3 | PASS |
| C — AC quality | 3 | PASS |
| D — Completeness | 4 | PASS |
| E — Architecture compliance | 5 | PASS |
