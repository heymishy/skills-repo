# Review Report: Collapse the always-expanded "Ref docs" context manifest into a single summary indicator — Run 1

**Story reference:** artefacts/2026-08-31-web-ui-navigation-legibility/stories/wnl-s1-collapse-context-manifest.md
**Date:** 2026-09-10
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category E (Architecture compliance) / Completeness — `tests/check-iwu1-context-manifest.js` (iwu.1) directly unit-tests `buildContextManifestHtml()`'s exact HTML output shape (8 tests + 1 integration test, asserting `chip-ok`/`chip-warn` class presence, `id="context-manifest"` presence, escaping behaviour) — this story is not referenced anywhere in the story's own Architecture Constraints or Dependencies as a known, pre-existing test surface the implementation must keep passing.
  Risk if proceeding: Low actual breakage risk on inspection — the existing test suite asserts raw HTML string inclusion (`html.includes('chip-ok')`, etc.), not DOM visual-open/closed state, so a `<details>` wrap around the same unchanged chip markup (which AC5 already requires) should keep every existing assertion passing. But this was not verified by the story author before writing AC5 — it's an inference from reading the test file during review, not a confirmed fact the story itself establishes. A careless implementation (e.g. restructuring the chip-generation function itself rather than just wrapping its output) could silently break `iwu.1` without the story ever having named it as a thing to check.
  To acknowledge: run /decisions, category RISK-ACCEPT — or add `tests/check-iwu1-context-manifest.js` as an explicitly named regression check in the story's own Architecture Constraints/Dependencies before `/test-plan`.

- **[1-M2]** Category E (Architecture compliance) — Architecture Constraints cites "ADR-009's Express-less design" as the source for the "no new npm dependencies" constraint. This is a mis-citation: `.github/architecture-guardrails.md`'s real ADR-009 is "Evaluation and write-back workflows must be separate triggers with separate permission scopes" — an entirely unrelated CI-trigger topic. `CLAUDE.md`'s own "Injectable adapter rule" section already documents this exact confusion as a previously-made-and-corrected mistake elsewhere in this codebase ("Corrected 2026-07-09: previously mislabeled 'D37/ADR-009'... an unrelated topic"). The "no new npm dependencies" / Express-less-server constraint itself is real and correctly stated in prose (it matches Mandatory Constraint MC-SELF-02 and `product/tech-stack.md`'s own runtime constraints) — only the ADR number pointing to it is wrong.
  Risk if proceeding: A coding agent or reviewer who follows the citation to the real ADR-009 finds unrelated content about CI evaluation/write-back triggers, which could cause confusion or a false sense that the constraint has no real architectural backing.
  To acknowledge: run /decisions, category RISK-ACCEPT — or correct the citation to reference `product/tech-stack.md`'s "Zero new npm dependencies" runtime constraint and Mandatory Constraint MC-SELF-02, dropping the incorrect "ADR-009" reference, before `/test-plan`.

---

## LOW findings — note for retrospective

- **[1-L1]** Category A (Traceability) — The User Story's own "So that..." clause ("so that I can see at a glance that context is loaded correctly without every session permanently consuming vertical space...") doesn't literally name metric M1, relying on the separate Benefit Linkage section to make that connection explicit. Stylistically minor — the Benefit Linkage section does the actual linking job correctly — but a reader skimming only the User Story block wouldn't see the metric tie without reading further.

---

## Summary

0 HIGH, 2 MEDIUM, 1 LOW across 1 story.
**Outcome:** PASS

**Category scores:**

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 5 | PASS |
| Completeness | 4 | PASS |

Category E (Architecture compliance): 1 MEDIUM finding (1-M1) — Architecture Constraints field is populated and correctly cites the reusable `<details>`/`<summary>` pattern and relevant Mandatory Constraints (MC-SEC-01, MC-A11Y-01/02), but omits a real, directly-relevant existing test dependency (`iwu.1`).
