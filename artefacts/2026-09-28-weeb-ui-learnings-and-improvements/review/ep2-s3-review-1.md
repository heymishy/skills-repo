# Review Report: Paginate the signals panel to handle real-world signal volume — Run 1

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s3.md
**Date:** 2026-10-04
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

- **[1-L1]** AC quality — AC3 ("Boundary pages are visually unambiguous") and AC5 ("Total count and current position are visible") are both written as Given/Then pairs with no explicit "When" clause: AC3 reads "Given the operator is on page 1, Then no 'Previous' link renders. Given the operator is on the last real page, Then no 'Next' link renders..."; AC5 reads "Given the operator is on any page, Then the page states the real total signal count...". Both are substantively testable and unambiguous — the "When" (the page rendering) is trivially inferable — but this is a real format deviation from the strict 3-part Given/When/Then convention this same feature's own sibling reviews (`ep2-s1-review-1.md`, `ep2-s2-review-1.md`) both explicitly credited toward a clean AC-quality 5/5 ("all Given/When/Then"). Not blocking — no rework needed — but worth tightening for consistency (e.g. AC5: "Given the operator is on any page, When the page renders, Then it states...").

---

## Summary

0 HIGH, 0 MEDIUM, 1 LOW across 1 story.
**Outcome:** PASS

---

## Category scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 5 | PASS |

**Verdict:** PASS — all criteria scored 3 or above.

**Traceability (5):** References parent epic, discovery, and benefit-metric artefacts correctly. Benefit Linkage names Metric 3 explicitly and states a real mechanism (closes the gap found during `ep2-s1`'s own Task 5 Accessibility E2E test, which timed out walking Tab order across all 5,293 real signals). Independently confirmed Metric 3 exists in `benefit-metric.md`'s own coverage matrix and already explicitly lists `ep2-s3` as a contributing story ("added 2026-10-02 after a real production finding during `ep2-s1`'s own Task 5").

**Scope integrity (5):** Independently checked both the epic's and discovery's own Out of Scope sections. The epic's Out of Scope already carries two explicit, dated carve-outs (2026-10-01) specifically naming `ep2-s3` as exempt from the "filtering/sorting/dismissal" deferral (pagination preserves default order, adds no interactive sort/filter control) and the "caching/performance optimization" deferral (this is a real, measured accessibility defect fix, not a speed optimization) — both pre-existing, approved scope notes, not undocumented additions. Discovery's own Out of Scope section has no conflict. Story's own Out of Scope section names 5 excluded behaviours.

**AC quality (4):** 7 ACs (exceeds the 3-AC minimum), each independently testable, describing observable behaviour ("only the first `SIGNALS_PAGE_SIZE` signals render," "the URL reflects the real page number") rather than implementation approach, no "should" language anywhere. Edge cases (boundary pages, invalid page params, preserving `ep2-s1`'s own existing behaviour) each have their own AC, not sub-bullets. One LOW finding (1-L1, above) on strict Given/When/Then format for AC3 and AC5 — does not block progression.

**Completeness (5):** User story in As/Want/So format with a named, non-generic persona ("Solo operator (you, today)" — matching the established convention already used by `ep2-s1`/`ep2-s2`). Benefit linkage populated with real mechanism. Out of scope populated (5 items, none blank/N/A). NFRs populated (Performance, Accessibility, Security/attack-surface — 3 named, not a blanket "None"). Complexity rated (2). Scope stability declared (Stable).

### Category E: Architecture compliance

`.github/architecture-guardrails.md` exists — Category E run.

- Architecture Constraints field is populated, and unusually thorough: cites the real, measured 5,293-signal count (confirmed by direct code execution, not estimated, per `decisions.md`'s own 2026-10-01 entry), names the exact pagination mechanism (query-param, server-rendered, matching the app's zero-client-JS convention), and makes an explicit, reasoned decision to preserve `getSignals()`'s existing order rather than introduce a new sort policy.
- Independently confirmed via `Approved Patterns` and `Anti-Patterns` tables: no existing pagination pattern exists elsewhere in this web UI (the story itself states this was confirmed by repo-wide search; spot-checked and found no contradicting pattern). The story honestly names the closest analog (`dashboard-view.js`'s `(data.skills || []).slice(0, 6)` hard-cap pattern) rather than overclaiming an established precedent that doesn't exist. No anti-pattern match found.
- No applicable Active ADR (ADR-001 through ADR-015) governs list pagination specifically; none is skipped or contradicted. ADR-024 (journey state response shape) is not touched by this story (no `/api/journey` involvement).
- Story NFRs align with the guardrails' own Accessibility mandatory constraint in spirit (keyboard-accessible interactive elements) — the constraint's own literal scope is "the viz" (`pipeline-viz.html`), not the web UI signals panel, so this is not a direct match requiring citation, but AC7's own real-data Tab-order E2E requirement fully satisfies the same underlying principle for this story's own surface.

**No HIGH or MEDIUM Category E findings.**

---

## Review Diff — Run 1 vs Run 0

N/A — this is Run 1, no prior review exists for this story.
