# Review Report: Fix the Silent Artefact-Commit Failure in Stage-Completion (AC2 Guard) — Run 2

**Story reference:** artefacts/2026-09-01-artefact-commit-durability-gap/stories/acdg-s1.md
**Date:** 2026-09-02
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

- **[2-L1]** AC quality — AC2-revised will also fire for a journey whose `productId` IS set but whose linked product genuinely has no connected repository (`products.repo_owner`/`repo_name` null) — a legitimate, unremarkable state, not just the "genuine anomaly" framing the AC's own prose emphasises. On reflection this is not a defect: `das-s1`'s own AC2 spirit ("never a silently completed stage with no durable backing") applies equally to this case — an informative, non-alarming message ("this product has no connected repository — artefact not committed to git") is still strictly better than today's true silence. Worth a one-line implementation note so the error message wording doesn't read as alarming for this entirely normal case — not worth a story change.

---

## Post-review resolution

Not applicable — no findings required resolution this run.

## Summary

0 HIGH, 0 MEDIUM, 1 LOW.
**Outcome:** PASS

---

## Review Diff — Run 2 vs Run 1

### Resolved since last run
✅ 1-M1 — AC1 may test already-passing behaviour — RESOLVED (confirmed correct via full code read of `artefact-commit-writer.js`; AC1's own text already reflects this)
✅ 1-M2 — AC2 doesn't cover the non-throwing falsy-return sub-mode — RESOLVED, superseded: confirmed unreachable via full code read of `export-data-source.js`, AC2a removed, replaced by AC2-revised/AC3-revised

### New findings this run
🆕 2-L1 — AC quality — AC2-revised also fires for a legitimate "product with no repo" case; implementation-note-worthy, not a defect

### Carried forward unchanged
⏳ 1-L1 — Architecture compliance — guardrails registry doesn't cover `src/web-ui/` — 2 runs open, still informational only, repo-level gap not story-scoped

### Progress summary
Run 1: 0 HIGH, 2 MEDIUM, 1 LOW
Run 2: 0 HIGH, 0 MEDIUM, 1 LOW (1 new, 1 carried, both from run 1 resolved)

IMPROVED

---

## Score Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 5 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 4 | PASS |

**Traceability (5):** Unchanged from run 1 — all references correct, benefit linkage names the metric with a genuine mechanism.

**Scope integrity (5):** The revised fix stays entirely within `journey.js` — does not touch `export-data-source.js`, `artefact-commit-writer.js`, or the journey-store modules, and does not implement any epic/discovery out-of-scope item.

**AC quality (5):** AC2-revised and AC3-revised are both concrete, independently testable, Given/When/Then, grounded in confirmed real code behaviour (not hypothesis) — a material improvement over run 1's AC2/AC2a, which described a partially-unreachable and partially-indistinguishable scenario space. 2-L1 is a wording nuance, not a structural gap.

**Completeness (5):** All fields populated; Complexity revised down to 1 with an explicit rationale for the change, not silently altered.

**Architecture compliance (4):** Unchanged — same guardrails-registry coverage gap as run 1 (1-L1).
