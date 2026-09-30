# Review Report: Signals panel — render real signals in a web UI page — Run 1

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s1.md
**Date:** 2026-10-01
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

- **[1-L1]** Story was missing the `Complexity Rating`/`Scope stability` fields present on this feature's own precedent story (`ep1-s3`), and the `Definition of Ready Pre-check` placeholder section. **Resolved during this same review run** — both added (Rating: 1, Stable) before this report was finalized; not carried forward as outstanding.

---

## Summary

0 HIGH, 0 MEDIUM, 0 LOW outstanding (1 LOW found and fixed in this run).
**Outcome:** PASS — all criteria scored 3 or above.

**Score summary:**

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 5 | PASS |
| Completeness | 4 → 5 (post-fix) | PASS |

**Traceability (5):** references parent epic, discovery, and benefit-metric artefacts by path; "So that..." names Metric 3 explicitly, and Benefit Linkage also correctly identifies the story's contribution to Metric 2's full target; both metrics confirmed present in `benefit-metric.md`'s own coverage matrix (verified by direct read, not assumed).

**Scope integrity (5):** cross-checked against both the epic's own Out of Scope (signal filtering/sorting/bulk actions, automated scheduling, cross-repo aggregation, caching/perf, multi-tenant isolation — none touched) and `discovery.md`'s own Out of Scope (automated AI summarisation, capture-log/learnings format changes, full `/improve` execution, admin/tenant signal config — none touched). Story's own Out of Scope section names 5 specific excluded behaviours, not "N/A".

**AC quality (5):** 5 ACs, all Given/When/Then, all describe observable rendering behaviour rather than implementation approach, no "should" language. AC3 (empty state) and AC4 (parse-error styling) are each their own AC, not sub-bullets under AC1. AC4's premise (the aggregator really does emit `parse-error` signals under real conditions) is grounded in this session's own live-verified finding from `ep1-s2`'s DoD, not a hypothetical.

**Completeness (4, resolved to 5):** User story in As/Want/So format with a named persona ("Solo operator (you, today)", matching this feature's established persona — not "a user"); Benefit Linkage populated with two specific metric mechanisms; Out of Scope populated (5 items); NFRs populated (3 items). One LOW gap found (Complexity/Scope stability missing) — fixed in this run, see LOW findings above.

**Category E (Architecture compliance):** Architecture Constraints field is detailed and grounded in a direct code read of `signals-aggregator.js`'s real `Signal` shape (`_makeSignal`'s actual 5-argument signature, including the `cta` field), not a paraphrase. Correctly directs reuse of `ep1-s2`'s own `/api/signals` endpoint rather than re-implementing aggregation — respects that story's own DoR constraint against modifying its response shape. No Approved Pattern violated; no Anti-Pattern matched (does not modify a shared surface module — `renderShell`/`html-shell.js` is consumed, not changed; is not a shadow change — this story is itself the required artefact per ADR-011). No applicable Active ADR was found uncited (`/api/signals` has no ADR of its own beyond `ep1-s2`'s own DoR contract, which is correctly cited via the Dependencies field instead).

---

**Ready to run /test-plan for "Signals panel — render real signals in a web UI page"?**
