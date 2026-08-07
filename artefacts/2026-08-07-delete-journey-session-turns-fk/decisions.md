# Decision Log: delete-journey-session-turns-fk

**Feature:** Fix deleteJourney's foreign key violation on session_turns
**Story reference:** artefacts/2026-08-07-delete-journey-session-turns-fk/stories/djfk-s1-delete-session-turns-before-journey.md
**Last updated:** 2026-08-07

---

## Decision categories

| Code | Meaning |
|------|---------|
| `GAP` | Process gap acknowledged (e.g. short-track skipping discovery/review) |

---

## Log entries

---
**2026-08-07 | GAP (H-GOV) | short-track**
**Decision:** This story proceeds via the short-track path, skipping discovery/benefit-metric/definition — no `## Approved By` discovery section exists for H-GOV to check.
**Alternatives considered:** Full outer loop for a one-statement SQL-ordering fix.
**Rationale:** Bounded, well-understood, single-function fix matching an already-established pattern in the same function (`artefacts` before `journeys`), found live on staging. Same class of fix as `anvf-s1`, `cdpl-s1` earlier this session.
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** None.
---

---
**2026-08-07 | GAP (dispatch) | implementation approach**
**Decision:** Implemented directly rather than dispatched to a coding subagent.
**Alternatives considered:** Standard subagent dispatch.
**Rationale:** Complexity 1, single-file, single-function fix with a clear existing pattern to mirror — no need for a separate subagent session for something this bounded.
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** None.
---
