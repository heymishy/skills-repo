# Decision Log: delete-feature-redirect-fix

**Feature:** Fix "Delete feature" to redirect back to the owning product, not the generic journeys list
**Story reference:** artefacts/2026-07-29-delete-feature-redirect-fix/stories/dfr-s1-fix-delete-feature-redirect.md
**Last updated:** 2026-07-29

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
| `GAP` | A structural gap in the pipeline itself, surfaced but not blocking |

---

## Log entries

**2026-07-29 | GAP | definition-of-ready**
**Decision:** No `## Approved By` governance sign-off exists for this story, since short-track explicitly skips `/discovery` (H-GOV hard block shows a warning rather than a pass).
**Alternatives considered:** Run a full `/discovery` for a one-line-plus-one-column bug fix.
**Rationale:** This is precisely the class of work short-track exists for (bugs, small fixes, bounded refactors) — same precedent already established by `stis-s1`/`pcr-s1` in this same repo.
**Made by:** Hamish King — Platform owner (implicit, via requesting this follow-up directly)
**Revisit trigger:** None expected — this is expected, permanent short-track behaviour, not a gap to close later.

---

**2026-07-29 | ARCH | test-plan**
**Decision:** Scoped this story to include the `journey-store-pg.js` `listJourneys()` rehydration gap (AC2), not just the redirect itself (AC1), even though the operator only reported the redirect symptom.
**Alternatives considered:** Fix only the redirect (AC1), treating the rehydration gap as a separate future story.
**Rationale:** Fixing only AC1 would make the fix silently regress to the old `/journey` fallback for every journey loaded from Postgres after a server restart — the two are the same underlying defect (productId not making it from storage back into the redirect decision), not two separate concerns. Bundling them is a bounded, well-bounded short-track scope, not scope creep.
**Made by:** Copilot (autonomous, short-track) — confirmed via direct code investigation before scoping
**Revisit trigger:** None expected.

---

## Architecture Decision Records

<!-- None yet for this feature -->
