# Decision Log: 2026-07-19-kanban-consolidation

**Feature:** Consolidate kanban rendering into one shared pattern; retire /features, /actions, /status
**Story reference:** artefacts/2026-07-19-kanban-consolidation/stories/kbc-s1.md
**Last updated:** 2026-07-19

---

## Decision categories

| Code | Meaning |
|------|---------|
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |
| `GAP` | A skill/process gap surfaced during execution, not specific to this story's content |
| `SCOPE` | MVP scope added, removed, or deferred |

---

## Log entries

---
**2026-07-19 | SCOPE | story authoring**
**Decision:** `/features`, `/actions`, `/status`, and `/status/export` are removed outright as part of this story — not redirected, not soft-deprecated with a sunset window.
**Alternatives considered:** (1) Redirect to the nearest new product/org equivalent — rejected by operator, preferring a clean cut. (2) Deprecation notice with removal deferred to a later story — rejected by operator for the same reason.
**Rationale:** Operator's explicit preference for a clean cut over a staged transition, accepting the risk that an undiscovered external dependency on these URLs could break without warning.
**Made by:** Hamish King (Founder/Operator), 2026-07-19, in direct response to a clarifying question during story authoring.
**Revisit trigger:** If any external dependency on the removed routes surfaces post-removal (a broken bookmark, an external script hitting these URLs), treat as a real incident to investigate — the risk was accepted knowingly, not unknowingly.
---
**2026-07-19 | SCOPE | story authoring**
**Decision:** Tenant gets its own kanban/board scope (an aggregate across every product a tenant owns), in addition to org and product — a third caller of the shared rendering pattern, not just two.
**Alternatives considered:** Just org and product, treating tenant as a pure containing concept with no board of its own — this was the recommended-by-default option, not chosen.
**Rationale:** Operator's explicit direction, given directly in response to a clarifying question during story authoring.
**Made by:** Hamish King (Founder/Operator), 2026-07-19.
**Revisit trigger:** None — this is now the confirmed target shape for this story.
---
**2026-07-19 | GAP | definition-of-ready (H-GOV)**
**Decision:** Treat H-GOV as satisfied for this short-track story via the operator's direct, live discovery of the underlying inconsistency (two kanban implementations) during staging verification, following the same precedent established for `pcr-s1`, `stis-s1`, `gav-s1`, `dta-s1`, and `jrf-s1`.
**Made by:** Claude (agent), via `/definition-of-ready`, 2026-07-19
**Revisit trigger:** Same as prior precedent.
---
**2026-07-19 | RISK-ACCEPT | definition-of-ready (W4)**
**Decision:** Proceed to coding agent without a separate, formal domain-expert walkthrough before implementation begins, despite this story's Medium oversight level and real removal risk.
**Rationale:** Both prior open design questions are now resolved by direct, explicit operator confirmation — the remaining risk (undiscovered external dependency on removed routes) was itself knowingly accepted by the operator, not something a verification-script walkthrough would newly surface.
**Made by:** Hamish King (Founder/Operator), via /definition-of-ready, 2026-07-19
**Revisit trigger:** If implementation discovers the removal's blast radius is larger than expected (e.g. `features.js`'s helpers are used far more widely than assumed), pause and log a new decision here before proceeding with deletion.
---

## Architecture Decision Records

None promoted to repo-level ADR status yet. If a future feature needs a fourth board scope beyond tenant/org/product, consider whether the shared renderer pattern established here is worth formalising as a repo-level ADR (e.g. "all kanban-style board views render through one shared component, scope-specific code only shapes the data").
