# Review Report: Dashboard-shell UX/CX parity and scope/benefit summary — Run 2

**Story reference:** `artefacts/2026-10-20-production-playback-capture/stories/ppc-s6-dashboard-shell-parity.md`
**Date:** 2026-10-26
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## Review Diff — Run 2 vs Run 1

### Resolved since last run
✅ **1-H1** — AC1/Architecture Constraints/Background now cite and require `renderShellWithNav` (not `_htmlShell.renderShell` directly) — RESOLVED
✅ **1-M1** — AC2/Architecture Constraints now explicitly require `escHtml()` at the Scope/Benefit render call site, mirroring `playback.js`'s own render pattern — RESOLVED

### New findings this run
🆕 None — the design-system compliance check (triggered by retroactively tagging `hasDesignSystemTrack: true`, see `decisions.md` 2026-10-26 DESIGN entry) surfaced one real gap, and it was fixed in the same pass rather than left open: new AC6 requires the Scope/Benefit cards to stack to a single column below 768px, per `DESIGN.md`'s own "not specified is not a valid shipped state" rule.

### Carried forward unchanged
⏳ None.

### Progress summary
Run 1: 1 HIGH, 1 MEDIUM, 0 LOW
Run 2: 0 HIGH, 0 MEDIUM, 0 LOW
Change: HIGH -1, MEDIUM -1, LOW 0

**IMPROVED**

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

- **[2-L1]** Category E (Architecture compliance) — new AC6 (768px responsive stacking) is a CSS-layout-dependent AC per CLAUDE.md's B2 rule ("CSS-layout-dependent ACs must be classified at DoR time" — automated visual regression test, or RISK-ACCEPT + manual smoke test). Not a review-blocking issue — this classification happens at `/definition-of-ready`, not `/review` — but flagging now so DoR doesn't treat AC6 as DOM-presence-verifiable only. `hasLayoutDependentGaps` has been set `true` on this story's `pipeline-state.json` entry as a forward-pointer.

---

## Summary

0 HIGH, 0 MEDIUM, 1 LOW.
**Outcome:** PASS

### Scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 5 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance (E) | 5 | PASS |

**Traceability, Scope integrity, Completeness:** unchanged from Run 1 — all still PASS at 5 (see `ppc-s6-review-1.md` for full reasoning); none of this run's fixes touched these dimensions.

**AC quality:** raised from 4 to 5 — Run 1's deduction was AC1 naming the wrong function; AC1 now correctly names `renderShellWithNav`, and AC6 is a new, independently testable, Given/When/Then AC with no ambiguity.

**Architecture compliance:** raised from 2 (FAIL) to 5 (PASS). Both Run 1 findings are resolved in the story text itself, not just promised: `renderShellWithNav` is now the explicit, literal requirement in AC1 and Architecture Constraints; `escHtml()` is now explicit in AC2 and Architecture Constraints. The design-system compliance check (this review's own extension, prompted by the operator pointing out `DESIGN.md`'s existence) found one further gap — the missing 768px responsive requirement — which is now AC6, not left open. `MC-SEC-01` and the `ppc-design-system` pattern guardrail are both updated to `status: met` in `pipeline-state.json`.
