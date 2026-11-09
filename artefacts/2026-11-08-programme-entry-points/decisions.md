# Decision Log: programme-entry-points

**Feature:** Programme Entry Points
**Discovery reference:** artefacts/2026-11-08-programme-entry-points/discovery.md
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
**2026-11-08 | ASSUMPTION | discovery (/clarify)**
**Decision:** Correct the discovery's description of `skills-platform-phase4` from "5 spikes gating 3 epics" to its real structure: 5 epics (`e1`–`e5`), with the 5 spikes nested inside `e1` specifically. The artefact itself lives at `artefacts/archived/2026-04-19-skills-platform-phase4/` (archived, not in the live `artefacts/` tree) and holds 205 files across every pipeline stage — confirmed sufficient for story 1's retrospective dry-run.
**Alternatives considered:** The discovery draft's original, unverified description ("5 spikes gating 3 epics"), carried forward from an earlier session summary rather than checked directly.
**Rationale:** Read the real artefact directory and `pipeline-state.json`'s `phase4.spikes` block directly during /clarify rather than trusting the inherited description. Getting the structure right matters because story 1's dry-run report will reference these epics by name.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /clarify session, 2026-11-08
**Revisit trigger:** None expected — this is a factual correction, not a design choice that could later reverse.
---
**2026-11-08 | ASSUMPTION | discovery (/clarify)**
**Decision:** Drop calendar timeline span from the bottom-up detection heuristic (story 3). Weight epic count as the primary signal and `decisions.md` cross-feature dependency density as a secondary signal.
**Alternatives considered:** The discovery draft's original three-signal heuristic (epic count + timeline span + decisions-density), assumed sufficient without checking against real data.
**Rationale:** Checked `skills-platform-phase4` (5 epics, 2-day git-committed artefact span) against `team-identity-roles` (1 epic, 9 stories, 39-day span) — a normal single-feature effort the heuristic must NOT flag. Timeline span is inverted in this repo's actual history: the normal feature took 19x longer in wall-clock terms than the genuine programme-candidate. Including it would have misranked exactly the case the heuristic exists to catch. Epic count cleanly separates the two cases (5 vs. 1); timeline span does not.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /clarify session, 2026-11-08
**Revisit trigger:** If story 3's dry-run against a third historical case shows epic count alone produces too many false positives, re-evaluate whether a different secondary signal (not timeline span) is needed.
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
