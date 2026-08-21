# Decision Log: canvas-maximise-and-bulk-assign-button-fixes

**Feature:** canvas-maximise-and-bulk-assign-button-fixes
**Discovery reference:** None — short-track (bug fix)
**Last updated:** 2026-08-21

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
**2026-08-21 | RISK-ACCEPT | definition-of-ready**
**Decision:** Proceed past Warning W4 (verification script reviewed by a domain expert) without a pre-implementation review of `cmba-s1-verification.md`.
**Alternatives considered:** Review the 4-scenario script before proceeding (the option chosen for this session's other short-track stories today, `rbg-s1`/`lrtc-s1`).
**Rationale:** Operator chose to proceed without review this time. The four scenarios are low-risk, hands-on UI click-throughs (maximise buttons, bulk-assign label) directly mirroring the story's own already-detailed ACs; the underlying bugs were already live-confirmed via real browser testing during the original DoD pass that surfaced this story.
**Made by:** Hamish King (operator), via explicit AskUserQuestion response during /definition-of-ready.
**Revisit trigger:** If post-merge smoke testing (using this same verification script) surfaces a scenario that doesn't match real behaviour, treat that as evidence the pre-implementation review would have caught it.
---

---

## Architecture Decision Records

None for this feature.
