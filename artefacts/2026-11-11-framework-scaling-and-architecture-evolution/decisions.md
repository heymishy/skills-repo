# Decision Log: framework-scaling-and-architecture-evolution

**Feature:** Framework scaling and architecture evolution (LangGraph/Aegra assessment, inner-loop scaling, governance drift)
**Ideation reference:** artefacts/2026-11-11-framework-scaling-and-architecture-evolution/research/ideation.md
**Last updated:** 2026-11-11

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
**2026-11-11 | ASSUMPTION | ideate (Lens B data-proxy check)**
**Decision:** Invalidate the assumption that `src/enforcement/gate-map.js`'s domain-specific governance logic (D37, H-DESIGN, H-GOV, H1–H13-style checks) can be carried across to a LangGraph typed-state-graph model without losing fidelity. Do not write the narrow LangGraph POC originally scoped in this ideation's Lens D recommendation.
**Alternatives considered:** (A) Proceed with the narrow POC as originally scoped (model the inner loop's gate sequence as a small typed-state graph, test against two real historical schema-drift bugs) — rejected after the cheaper pre-check (reading `gate-map.js` and `cli-outer-loop.js`'s real `validate()` dispatcher plus two representative gate-validators) showed the actual governance logic is markdown-prose parsing and regex cross-referencing between artefact files, not typed-state validation — a class of check LangGraph's `StateSchema` has no bearing on. Porting it would move the same code behind a node-function call, not simplify or eliminate it. (B, chosen) Stop here — the assumption this POC's cheapness depended on is false, so the POC would cost real migration effort for no corresponding reduction in complexity.
**Rationale:** This is exactly the test Lens B's own assumption inventory specified before any POC code was written — `gate-map.js` and `validate()` were read directly, not assumed. The result was unambiguous after a single read-through (both `validateTestPlanComplete` and the H1–H9 fall-through are prose-regex-and-filesystem checks), so no further investigation was needed to close this thread confidently.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during `/ideate` Lens B follow-through, 2026-11-11
**Revisit trigger:** If the governance logic is ever substantially rewritten away from markdown-artefact-prose-parsing toward a structured, typed representation of story/epic/feature state for other reasons, re-evaluate whether a graph framework would then map more cleanly — but do not treat that rewrite as motivated by this decision; it would need its own independent justification.
---
**2026-11-11 | SCOPE | ideate (Lens B data-proxy check)**
**Decision:** A real, previously-unknown gap was found while running the data-proxy check above, unrelated to the LangGraph question: `cli-outer-loop.js`'s `validate()` dispatcher and `cli-gate-advance.js`'s `gateAdvance()` enforce no cross-gate sequencing at all — nothing today prevents calling `gate-advance <feature> <story> definition-of-done <artefact>` before `test-plan-complete` has ever been validated for that story. This is logged as a real finding to fix, scoped separately from this ideation's own thread.
**Alternatives considered:** (A) Fold this into the (now-rejected) LangGraph POC, since conditional-edge routing is exactly what would prevent this — rejected, since the POC itself was just rejected above; building a whole graph framework to get one ordering check is disproportionate. (B, chosen) Fix directly in the existing JS: a small addition to `gateAdvance()` checking the story's current `stage` against an expected-predecessor map (derivable from `gate-map.js`'s own 7-gate list) before calling `validate()`.
**Rationale:** The gap is real and confirmed (grep found zero ordering/sequence logic anywhere in the dispatcher), but it does not require adopting a new framework to close — it is a handful of lines in code that already exists and is already the sanctioned write path (`bin/skills gate-advance`).
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during `/ideate` Lens B follow-through, 2026-11-11
**Revisit trigger:** None — this is a direct, independent fix, not something that depends on any other decision in this log.
---

## Architecture Decision Records

<!-- None yet for this feature. -->
