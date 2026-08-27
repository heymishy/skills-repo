# Decision Log: revise-earlier-stage

**Feature:** Revise an Earlier Stage Mid-Journey
**Discovery reference:** artefacts/2026-08-27-revise-earlier-stage/discovery.md
**Last updated:** 2026-08-28

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
**2026-08-28 | RISK-ACCEPT | review**
**Decision:** Accept res-s4 review finding 1-M1 (Architecture Constraints doesn't reference `architecture-guardrails.md`'s documented "stage-sequence duplication" anti-pattern, and flag-state persistence is undefined) without amending the story now — proceed to `/test-plan` with the finding still open, to be resolved at DoR/implementation time instead of by another story-text revision pass.
**Alternatives considered:** (1) Amend res-s4 immediately, the same way 1-H1 was just fixed on res-s2/res-s3 — add an explicit Architecture Constraint naming `journey-store.js`'s `STAGE_SEQUENCE` as the only valid ordering source, and specify whether flag state persists via the same `_diskAdapter`/`_pgWrite` path as `completedStages`. (2) Descope the "downstream flag" concept from res-s4's AC1 entirely and defer it to a follow-up story.
**Rationale:** Unlike 1-H1, this finding doesn't block implementability — res-s4's existing ACs (AC1-AC4) remain valid and independently testable regardless of which stage-ordering source or persistence mechanism is eventually chosen. It's an implementation-detail gap, not a sequencing contradiction: the coding agent can resolve it correctly by reading the cited anti-pattern precedent directly (it's already documented, with two prior recurrences named — `dtra-s1`, `dspw-s1`) at DoR's H9 architecture-constraints check, rather than requiring the story text to be pre-amended. Further pre-implementation story-text iteration has diminishing returns once the underlying reference material already exists and is citable.
**Made by:** Hamish King — Platform Owner
**Revisit trigger:** If the coding agent's implementation for res-s4 introduces a second hardcoded stage-order array duplicating `journey-store.js`'s `STAGE_SEQUENCE` (repeating the exact drift pattern already caught twice), or if flagged-stage state is found not to survive a server restart in a way that surprises real usage — treat as a real defect at that point, not just a documentation gap.
---

---
**2026-08-28 | RISK-ACCEPT | definition-of-ready**
**Decision:** Accept DoR Warning W4 (verification script reviewed by a domain expert) as unresolved pre-code for all 4 stories (res-s1, res-s2, res-s3, res-s4) — proceed to the coding agent without a pre-code human walkthrough of the 4 verification scripts.
**Alternatives considered:** (1) Pause DoR and walk through all 4 scripts before signing off any story.
**Rationale:** The verification scripts (`templates/ac-verification-script.md`) are explicitly designed to serve three moments without modification — pre-code sign-off, post-merge smoke test, and delivery review. Given solo-operator context and no separate domain expert available, the operator will use the scripts as the post-merge smoke test instead of a pre-code gate — this is one of the script's designed uses, not a workaround.
**Made by:** Hamish King — Platform Owner
**Revisit trigger:** If a post-merge smoke test run against any of the 4 scripts finds a scenario that reveals the AC itself was wrong (not just the implementation), treat that as evidence the pre-code walkthrough would have caught it — reconsider skipping W4 for future stories on this feature.
---

---

## Architecture Decision Records

<!-- None recorded for this feature yet. -->
