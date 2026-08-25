# Decision Log: 2026-08-25-first-run-empty-state-copy

**Feature:** Add orientation copy to two first-run empty states, and gate the Modules card on feature count
**Discovery reference:** None — short-track (see `CLAUDE.md` short-track flow)
**Last updated:** 2026-08-25

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-08-25 | RISK-ACCEPT | definition-of-ready (fresc-s1)**
**Decision:** Proceed to the coding loop without a domain-expert (operator) read-through of `fresc-s1`'s AC verification script before implementation begins (DoR Warning W4).
**Alternatives considered:** The operator reviewing the 4 scenarios in `artefacts/2026-08-25-first-run-empty-state-copy/verification-scripts/fresc-s1-verification.md` before sign-off — the standard W4 path.
**Rationale:** This is a small, Complexity-1, single-file story (two static copy lines plus one length-check conditional) with no CSS-layout dependency, no schema change, and no new route — the risk profile is low enough that a pre-code read-through was judged unnecessary by the operator. The verification script still exists and will serve as the post-merge smoke test regardless.
**Made by:** Hamish King (operator), explicit choice via DoR W4 prompt ("Acknowledge and proceed").
**Revisit trigger:** If the post-merge smoke test (verification script, run after implementation) surfaces a scenario that reads as ambiguous or wrong, revisit whether pre-code review should have caught it before the next short-track story reuses this same shortcut.
---
