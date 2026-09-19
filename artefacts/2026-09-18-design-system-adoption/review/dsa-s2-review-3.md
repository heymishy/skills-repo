# Review Report: Restyle the Dashboard and Wire Its Real Content to Match DESIGN.md — Run 3

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s2.md
**Date:** 2026-09-19
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## Review Diff — Run 3 vs Run 2

### Resolved since last run
None — [1-M1] and [2-M1] remain open (both already RISK-ACCEPTed in `decisions.md`, see Carried forward).

### New findings this run
🆕 **[3-M1]** Category B (Scope) — AC8 is genuinely new (zero-products onboarding preservation), not a renumbering of an existing AC; flagged only to note it in this diff explicitly rather than let a "7→8 ACs" change go unremarked.
🆕 **[3-L1]** Category E (Architecture compliance) — the story leaves the exact mechanism for relocating Tasks 1-3's data-wiring functions (new shared module vs. direct import from `dashboard.js`) undecided, deferred explicitly to `/implementation-plan`. This is a real open question, correctly flagged as such rather than silently assumed — not a defect, but noting it here since Category E checks "Architecture Constraints field is populated," and an explicitly-deferred sub-decision is a slightly weaker form of "populated" than a fully resolved one.

### Carried forward unchanged
⏳ **[1-M1]** Category C — AC4 describes a verification method rather than a sharply observable outcome — 3 runs open, consistently RISK-ACCEPTed.
⏳ **[2-M1]** Category C — AC5/AC6 name implementation details inside otherwise-observable AC text — 2 runs open, RISK-ACCEPTed.

### Progress summary
Run 2: 0 HIGH, 2 MEDIUM, 0 LOW
Run 3: 0 HIGH, 2 MEDIUM, 1 LOW
Change: HIGH +0, MEDIUM +0, LOW +1

SAME (no new MEDIUM/HIGH; one new LOW is an explicitly-flagged-as-open, not-yet-resolved sub-decision, not a quality regression)

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

Carried forward from run 2, both already RISK-ACCEPTed (see `decisions.md`):
- **[1-M1]** AC4's verification-method wording.
- **[2-M1]** AC5/AC6's implementation-detail-in-AC-text wording.

No new MEDIUM findings this run — the major re-target (Amendment note 2) was executed with the same rigor as the original amendment: every architecture claim in the amended Architecture Constraints section was independently verified against real code (confirmed in `decisions.md`'s own investigation trail, cross-checked again in this review), not just re-asserted.

---

## LOW findings — note for retrospective

- **[3-M1]** (Category B) AC8 is genuinely new scope (zero-products onboarding preservation), not a renumbering — noted for the trace record, not a defect.
- **[3-L1]** (Category E) the shared-module-vs-direct-import mechanism for relocating Tasks 1-3's data-wiring functions is explicitly deferred to `/implementation-plan` — a real open question, correctly flagged rather than silently assumed either way.

---

## Summary

0 HIGH, 2 MEDIUM, 1 LOW.
**Outcome:** PASS

---

## Score Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 4 | PASS |

**Verdict:** PASS — all criteria scored 3 or above. Architecture compliance dropped from 5 to 4 this run only because of the explicitly-deferred relocation-mechanism sub-decision ([3-L1]) — a genuine, correctly-flagged open question, not a gap in rigor. 2 MEDIUM findings (both pre-existing, already RISK-ACCEPTed) and 1 new LOW should be acknowledged before proceeding.

---

## Category detail

### A — Traceability
Unchanged in substance from run 2 — story still references the parent epic, discovery, and benefit-metric artefacts correctly; benefit linkage still names the real metric. The re-target (Amendment note 2) does not change which metric this story serves, only which file satisfies it — traceability is unaffected by a target-file change of this kind.

### B — Scope discipline
**This is the category that mattered most for this run**, given the scale of the re-target. Checked explicitly: does the amended story implement anything in the epic's or discovery's own Out of Scope sections? No — the epic's Out of Scope excludes screens beyond the 4 named (unaffected — this is still the dashboard screen, just the REAL dashboard route instead of a dead one) and inventing new tokens/patterns beyond `DESIGN.md` (unaffected — still applying the existing token table). The story's OWN Out of Scope section was itself substantially expanded during this amendment to proactively exclude real risk surface newly visible now that the real target file is known: other `products.js` functions (`handleGetProductView`, `handleGetProductNew`, `_renderRoadmapTab`, the kanban board path) are explicitly named as untouched, and `routes/dashboard.js`'s own dead-code cleanup is explicitly deferred rather than silently bundled in. This is exactly the right response to a re-target of this size — naming the newly-visible boundaries explicitly, not assuming the old Out of Scope list still covers everything. The scope addition (the full re-target itself) has a real, thorough approved scope note: the story's own two Amendment notes plus a very detailed `decisions.md` entry documenting the operator's explicit 3-option choice.

### C — AC quality
AC1-AC7 are substantively unchanged (still Given/When/Then, still observable outcomes with the 2 already-acknowledged wording exceptions carried forward) — only the subject changed from "the dashboard" to "the REAL, live dashboard (served by routes/products.js)," which is a clarity improvement, not a quality regression. AC4 was strengthened (now explicitly requires confirming the zero-products path and the `?view=board` kanban route are unaffected, not just "pre-existing test coverage still passes" in the abstract). AC8 (new) is a clean, testable, observably-scoped addition — Given/When/Then, describes a real observable outcome (the CTA still renders and still works), independently testable. 8 ACs total, well above the minimum-3 threshold.

### D — Completeness
All template fields remain populated and internally consistent after the amendment: user story unchanged (still names Hamish King as the real persona — appropriate, since this is HIS own daily-use landing page, arguably even more so now that it's confirmed to be the REAL one he actually uses). Out of scope substantially expanded (9 items now, up from 7 — a real increase in explicit boundary-setting, not scope-creep). NFRs updated to reflect the now-confirmed-real production stakes (the Security NFR explicitly calls out the tenant-filter regression risk given this is now confirmed to be the primary landing page, not dead code — a meaningfully sharper NFR than before). Complexity rating kept at 3 with an updated, honest rationale (technical ambiguity is actually lower now that the real target and its real signature are confirmed, but stakes are higher) rather than mechanically bumping the number just because the finding sounds dramatic — a good instance of NOT over-reacting to a scary-sounding finding by inflating a rating that the rationale itself doesn't support.

### E — Architecture compliance
`architecture-guardrails.md` exists. Architecture Constraints section is extensively populated with the real, verified target function names, real signature, real existing branches to preserve, and real reuse plan for Tasks 1-3's logic — see [3-L1] for the one explicitly-open sub-decision (relocation mechanism), correctly deferred rather than assumed. The anti-pattern guardrail this story's own Architecture Constraints cites ("any change to shared surface modules... is a story") remains correctly respected — the sidebar is explicitly named as untouched. No Active ADR violation found. No mandatory constraint conflict found. One new architectural risk surface correctly named and scoped: this story now touches a real, live, high-traffic production route for the first time in this feature's delivery — the Out of Scope section's explicit exclusion of every OTHER function in `products.js` is a well-judged containment boundary for that new risk.
