# Review Report: Dismiss / mark-reviewed for the signals panel — Run 1

**Story reference:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s4.md
**Date:** 2026-10-04
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Completeness / Architecture compliance — The story introduces a new state-changing action (Dismiss/Undismiss, AC1/AC3) that must be a POST to some new endpoint, but neither Architecture Constraints nor NFRs say that endpoint must use this app's own established CSRF middleware convention. Every other state-changing form already rendered in this exact view (`signals-panel-view.js`'s `_signalItem`, the existing CTA form) embeds `_csrf.csrfField(csrfToken)` and is served by a route that calls `_csrf.generateCsrfToken(req)` first (`signals-panel.js`'s `handleGetSignalsPanelHtml`). A new POST route added without the same protection would be a real, concrete regression from this app's own existing security baseline — not a hypothetical.
  Risk if proceeding: the dismiss/undismiss endpoint ships without CSRF protection, allowing a forged cross-origin POST to dismiss signals on the operator's behalf. Low real-world impact (dismissal is reversible, no destructive action), but it's still a deviation from an established, repo-wide convention that `/review`'s own Category E exists to catch.
  To acknowledge: run /decisions, category RISK-ACCEPT — or simply add a line to Architecture Constraints naming the CSRF requirement explicitly before `/test-plan`.

---

## LOW findings — note for retrospective

- **[1-L1]** AC quality — AC5 ("Given `server.js` is the production wiring point..., Then the dismissed-signals store adapter is wired...") omits an explicit "When" clause, the same non-blocking pattern already accepted in this epic's own `ep2-s3` precedent (`1-L1`) and in `sptu-s2`'s `1-L1`.
- **[1-L2]** Completeness — No AC addresses dismiss-file staleness over time (a dismissed key whose underlying signal source content later changes, so the hash no longer matches anything real). Low real-world impact at this repo's own solo-operator scale — noted for retrospective, not a blocker.

---

## Summary

0 HIGH, 1 MEDIUM, 2 LOW across 1 story.
**Outcome:** PASS

---

## Category scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 3 | PASS |

**Traceability (5):** References epic, discovery, and benefit-metric; "So that..." connects explicitly to Metric 3 (Dismiss retention) as its sole mover; benefit coverage matrix lists this story.

**Scope integrity (5):** Out-of-scope section names 4 genuine exclusions, each traced to discovery.md's own Out of Scope (bulk dismiss, multi-tenant isolation) or a deliberate narrower cut (auto-expiry, migration). No epic/discovery out-of-scope item is implemented.

**AC quality (4):** 7 ACs, all Given/When/Then except the minor 1-L1 gap, all observable and independently testable. AC4/AC5 are strong — they correctly pre-empt the exact D37 weak-test shape (asserting wiring occurred) that this repo has been burned by before (`tir-s1`), requiring behavioural differentiation instead.

**Completeness (3):** Issues present (1-M1, the CSRF gap) but addressable without story rework — just a missing line in Architecture Constraints/NFRs, not a redesign. User story, persona, benefit linkage, out-of-scope, complexity, and scope stability are all otherwise correctly populated.

### Category E: Architecture compliance

- Architecture Constraints field explicitly applies the D37 injectable adapter rule with all 4 of its mandatory sub-points (stub throws, DoR wiring AC, separate wiring task, behavioural-correctness wiring test) — this is the correct, complete application of a named mandatory pattern from CLAUDE.md, matching the exact shape that was previously gotten wrong in `tir-s1` and is now explicitly guarded against here.
- **[1-M1]** (see above) — the one real gap: CSRF convention not named for the new POST endpoint.
- No named anti-pattern violated otherwise. No applicable Active ADR contradicted.
