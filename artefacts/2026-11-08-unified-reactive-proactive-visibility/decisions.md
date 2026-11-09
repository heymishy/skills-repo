# Decision Log: unified-reactive-proactive-visibility

**Feature:** Unified Reactive + Proactive Visibility
**Discovery reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/discovery.md
**Last updated:** 2026-11-08

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
**2026-11-08 | ASSUMPTION | discovery (/clarify) — retroactively logged 2026-11-08**
**Decision:** Drop the "Fork-relationship reference value" Directional Success Indicator entirely, rather than keeping it as a measured post-ship indicator. Carry the underlying "legible reference" concern forward as writing guidance for `/definition` instead.
**Alternatives considered:** The discovery draft's original assumption — that the enterprise-fork steward persona would consult the live UI surface, making UI reference-worthiness a measurable success indicator for this feature specifically.
**Rationale:** Confirmed by the operator during /clarify that the fork-steward persona's actual consumption path is the discovery/definition text artefacts, not the live UI (consistent with the corrected fork-maintenance model established earlier this session: the fork references this repo's outer-loop artefacts and runs the outer loop independently, rather than consuming UI/code directly). Measuring "fork-worthiness" as a UI success indicator would have measured the wrong thing — artefact clarity is a cross-cutting documentation-quality bar that applies to every feature's discovery/definition writing, not evidence this specific feature succeeded or failed.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /clarify session, 2026-11-08
**Revisit trigger:** If a real enterprise-fork consumer is ever observed actually using the live UI (not just the referenced artefacts) to inform their own re-derivation, revisit whether a UI-facing success indicator should be reinstated.
**Note:** This entry was logged retroactively on 2026-11-08, after a cross-tranche consistency audit found this feature was approved without a `decisions.md`, despite its own Clarification log recording a materially-changed assumption (a success indicator removed, not just confirmed) — the same trigger condition that produced a `decisions.md` for every other initiative in this tranche (2, 3, 4, 5). Logged now for consistency with the rest of the tranche, not at the time of the original /clarify session.
---

---
**2026-11-09 | RISK-ACCEPT | benefit-metric**
**Decision:** Metric owner on `benefit-metric.md` is self-assigned to Hamish King (Platform Owner). Reviewers remains `[Pending]` rather than self-assigned.
**Alternatives considered:** (A) Self-assign Hamish King as both owner and reviewer — rejected, since the point of an independent reviewer is a second perspective on whether a metric is honest and measurable, which self-review cannot provide. (B) Fabricate a placeholder reviewer role to satisfy the skill's completion check — rejected, contradicts this pipeline's "never invent" discipline for unfilled fields.
**Rationale:** Metric owner is a genuine accountability role this operator already holds across every delivery artefact in this repo; self-assigning it reflects reality rather than inventing a role. The Reviewers field is left honestly unfilled because no second contributor exists in this personal-scope team to fill it.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), 2026-11-09
**Revisit trigger:** If a second contributor ever joins this project, assign them as Reviewer on this and every other open benefit-metric artefact rather than continuing to leave the field pending.
---

---

## Architecture Decision Records

<!-- None yet for this feature. -->
