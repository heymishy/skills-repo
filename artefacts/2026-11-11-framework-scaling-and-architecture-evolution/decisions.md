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
**2026-11-11 | ARCH | ideate (stand-back re-assessment, operator request)**
**Decision:** Fix the sequencing-enforcement gap directly in `src/enforcement/cli-gate-advance.js` (not via any graph framework). Confirm, on re-examination at the whole-pipeline scale, that orchestration still does not need LangGraph — the same hand-rolled predecessor-check pattern generalizes cheaply to the remaining outer-loop transitions if ever needed. Separately, log a new, real, previously-unknown finding: `scripts/lib/pipeline-timings.js`'s instrumentation mechanism is referenced as mandatory in exactly 5 of 42 skills (all inner-loop), zero outer-loop skills, and `.github/pipeline-timings.jsonl` does not exist anywhere in this repository despite this exact session running dozens of qualifying inner-loop invocations. This is a real, demonstrated gap, not fixed here, and deliberately not treated as a reason to revisit the LangGraph decision — closing it needs a tracing-destination decision and skill-contract discipline, not an orchestration-framework change.
**Alternatives considered:** (A) Treat the broken instrumentation finding as new evidence for reopening the LangGraph question, since LangSmith (tracing) usually ships alongside LangGraph (orchestration) — rejected: tracing is adoptable as a cross-cutting concern independent of the execution model, and conflating "we need better tracing" with "we need to adopt LangGraph" would repeat the same category error this whole ideation was meant to correct (treating adjacent-but-separate problems as one). (B, chosen) Keep the LangGraph verdict closed on its own evidence; log the instrumentation gap as its own separate, undecided candidate initiative.
**Rationale:** The operator's stand-back request was answered on its own terms (orchestration and instrumentation both re-examined fresh, not assumed from the narrow finding), and produced one genuinely new, concrete result (the zero-output timing mechanism) that the narrow check would never have surfaced. Keeping it as a separate thread avoids scope creep back into the already-resolved LangGraph question.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during `/ideate` stand-back follow-through, 2026-11-11
**Revisit trigger:** If a future initiative specifically chooses LangSmith as the tracing destination (one of several candidates, not a foregone conclusion), that would be the point to re-examine whether adopting LangGraph alongside it is now justified by the tracing decision itself — not before.
---

## Architecture Decision Records

<!-- None yet for this feature. -->
