# Decision Log: legacy-ingestion

**Feature:** Legacy Ingestion Pipeline — `/reverse-engineer` → `/modernisation-decompose` → Feature Candidates → `/discovery`
**Discovery reference:** `artefacts/2026-07-16-legacy-ingestion/discovery.md`
**Last updated:** 2026-08-22

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
**2026-08-22 | SCOPE | clarify**
**Decision:** The web-UI entry point for legacy ingestion is in MVP scope, not deferred — `handlePostJourney`/`startSkill` (`src/web-ui/routes/journey.js` line 333) must gain a UI-reachable third entry point alongside `'ideate'`/`'discovery'` before this feature can be considered MVP-complete.
**Alternatives considered:** A CLI/chat-only interim path (the discovery's own original recommendation, matching how `/reverse-engineer` operates today since it has never been run through any interface).
**Rationale:** Operator's explicit expectation is a UI-reachable legacy-ingestion journey from day one, not an interim CLI-only path. This materially enlarges the MVP versus the 2026-07-16 draft — the structural system-slug vs. feature-slug mismatch in the existing journey-creation flow now needs resolving as part of this feature, not a follow-on pass.
**Made by:** Hamish King (Founder/Operator), via `/clarify`
**Revisit trigger:** None — this is now a locked MVP scope item, not a deferred one. Revisit only if the operator later decides a phased CLI-first rollout is acceptable after all.
---

**2026-08-22 | SCOPE | clarify**
**Decision:** Boundary-signal detection for a specific non-Java stack is in MVP scope. `/modernisation-decompose`'s current Java/Spring-only detection (Maven module, `@Service`, JPA aggregate root, `@Transactional` span) cannot ship as-is for MVP, since the first real legacy-ingestion target is confirmed non-Java. The specific stack (COBOL / Struts 2 / IBM ACE-IIB / other) remains unconfirmed — this is a genuinely open item, not silently assumed, and must be named before `/definition` locks story-level scope.
**Alternatives considered:** Leaving the Java-only limitation unresolved for MVP and documenting it as a known, visible (not silent) gap for a future pass — the discovery's own original recommendation, contingent on the operator's legacy systems of interest not yet being named.
**Rationale:** Operator confirmed the first real target is non-Java, which the discovery itself had already flagged as the condition that would invalidate a Java-only MVP ("this MVP would produce a working corpus with no working decomposition step — a materially incomplete pipeline for that specific case, not a deferred nice-to-have"). `/reverse-engineer`'s extraction methodology already supports COBOL, Struts 2, and IBM ACE/IIB — the gap is specifically on the `/modernisation-decompose` decomposition side, and only for whichever stack is actually targeted.
**Made by:** Hamish King (Founder/Operator), via `/clarify`
**Revisit trigger:** Resolve before `/definition` locks scope — the operator must name the specific target stack (or route through a short `/spike` if the target legacy system itself is still being identified) before the boundary-signal extension work can be sized.
---

---

## Architecture Decision Records

<!-- None yet — no structural technical decisions have been made for this feature beyond the two SCOPE entries above. Add an ADR here if the boundary-signal extension design or the UI-entry-point retrofit surfaces a genuinely structural choice at /definition. -->
