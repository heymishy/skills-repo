# Review Report: Add ADR-014 (Dual-Scope Artefact Model) to `architecture-guardrails.md` — Run 1

**Story reference:** artefacts/2026-04-22-modernisation-decompose/stories/md-3-adr-014.md
**Date:** 2026-04-22
**Categories run:** A — Traceability, B — Scope, C — AC quality, D — Completeness, E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **1-M1** Category C — AC coverage gap: none of the three ACs require updating the `guardrails-registry` YAML fenced block in `architecture-guardrails.md` alongside the ADR table row and full write-up. The registry block (read by `/definition`, `/review`, and `/definition-of-ready` to seed `feature.guardrails[]`) is the machine-readable counterpart to the human-readable ADR entry. An implementor correctly following AC1 and AC2 could add the table row and write-up section but omit the registry entry, and all three ACs would pass — leaving future features without ADR-014 seeded in their `guardrails[]` array until manually corrected.
  Line: `**AC1:** Given \`architecture-guardrails.md\` has been updated, when a contributor reads the Active ADRs table...` — no sibling AC covering the registry block.
  Risk if proceeding: future features will silently lack ADR-014 in their pipeline compliance tracking; `/trace` will not flag this as missing.
  To acknowledge: run /decisions, category RISK-ACCEPT

---

## LOW findings — note for retrospective

None.

---

## Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 5 | PASS |

0 HIGH, 1 MEDIUM, 0 LOW.
**Outcome: PASS** — no HIGH findings. One MEDIUM finding should be acknowledged in /decisions before /test-plan proceeds.
