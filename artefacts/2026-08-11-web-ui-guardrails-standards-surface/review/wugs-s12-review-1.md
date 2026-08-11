# Review Report: Remove the `standards`/`standard_product_optouts` DB tables and their references — Run 1

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s12-remove-db-tables.md
**Date:** 2026-08-11
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

None.

---

## Summary

0 HIGH, 0 MEDIUM, 0 LOW across 1 story.
**Outcome:** PASS

---

## Scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS — correctly framed as a technical/cleanup story per the template's own guidance |
| Scope integrity | 5 | PASS |
| AC quality | 5 | PASS — AC2's explicit callout of the `handleDeleteProduct` cross-reference (found during this feature's own discovery investigation, not assumed) is the strongest single AC in this feature — names a specific, real, easy-to-miss risk and turns it into a testable requirement |
| Completeness | 5 | PASS |
| Architecture compliance | 5 | PASS — correctly applies ADR-003 (schema-first) in reverse for the removal, and correctly sequences after `wugs-s11` |
