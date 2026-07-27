# Decision Log: durable-session-history

**Feature:** Durable Session History for Completed Pipeline Stages
**Discovery reference:** artefacts/2026-07-28-durable-session-history/discovery.md
**Last updated:** 2026-07-28

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

**2026-07-28 | ASSUMPTION | discovery/clarify**
**Decision:** Storing durable conversation turns for this feature is subject to the same data-governance gap flagged in `product/constraints.md` #5 (no retention/access-control model previously designed for verbatim per-invocation text) — this feature's scope explicitly closes that gap for this data rather than treating it as exempt.
**Alternatives considered:** Treat this feature as exempt from constraint #5 on the basis that it stores operator-authored pipeline conversation content, not the "verbatim per-invocation model instruction" text #5 originally refers to.
**Rationale:** The underlying risk (retaining verbatim text with no bounded retention or defined access control) is the same regardless of which specific text is being stored. Closing it now is cheap (two decisions already made — 60-day archive + existing tenant-isolation access control both already satisfy it) versus leaving an unaddressed governance gap to resurface later at a less convenient point.
**Made by:** Hamish King — Platform owner
**Revisit trigger:** If a future compliance/regulatory requirement demands a different retention window or access model than the 60-day archive + tenant-isolation convention already adopted here.

---

**2026-07-28 | ASSUMPTION | discovery/clarify**
**Decision:** The durable conversation-turn store is a new table (`session_turns`), not an extension of the existing `artefacts` table.
**Alternatives considered:** Extend the existing `artefacts` table with turn-history columns/rows — fewer new moving parts, but risks schema churn on a table every other feature already reads/writes.
**Rationale:** A new table keeps `artefacts`' schema and contract untouched for every other feature depending on it — higher isolation, judged cleaner despite slightly more plumbing.
**Made by:** Hamish King — Platform owner
**Revisit trigger:** If `/definition` finds a strong reason the two tables need to share a transaction boundary or foreign-key relationship that a separate table can't cleanly express.

---

**2026-07-28 | RISK-ACCEPT | branch-setup**
**Decision:** Proceeded past a failing test baseline (37 of 425 files failing) in the dsh-s1 worktree rather than fixing them first.
**Alternatives considered:** Investigate and fix all 37 pre-existing failures before starting implementation.
**Rationale:** Confirmed none of the 37 failing files reference `dsh-*`/`durable-session` at all — they span unrelated older features (e.g. `check-ougl*`, `check-wsm2*`, `check-mfc*`, `check-sec*`). `check-pipeline-state-integrity.js`'s own failures were already confirmed pre-existing earlier this same session, unrelated to this feature. Fixing 37 unrelated legacy test failures is out of scope for this feature and would substantially delay it for no benefit to durable-session-history's own delivery.
**Made by:** Hamish King — Platform owner (implicit, via "let's start with subagents" proceeding past this checkpoint)
**Revisit trigger:** If any of dsh-s1 through dsh-s6's own new tests interact with or are masked by one of these 37 pre-existing failures, investigate that specific overlap immediately rather than continuing to defer it.

---

## Architecture Decision Records

<!-- None yet for this feature -->
