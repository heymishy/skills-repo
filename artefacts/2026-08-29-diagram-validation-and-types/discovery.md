# Discovery: Diagram Validation, Drift Accuracy, and Archify-Inspired Diagram Types

**Status:** Clarified — awaiting approval
**Created:** 2026-08-29
**Approved by:** Pending
**Author:** Claude (agent)

---

## Problem Statement

The platform's canvas-block diagrams (System Architecture, Program Design, Data Model — emitted as LLM-authored mermaid during `/design`/`/definition`, and compared as-designed-vs-as-built by `drift-comparator.js`) fall short on four fronts. First, a malformed diagram marker or invalid mermaid source fails silently on the client with no diagnostic telling the model or operator what's wrong. Second, `drift-comparator.js`'s parsers only recognize single-line, single-target declarations — no labeled edges, multi-target edges, or subgraphs — so richer-but-valid mermaid can make drift detection silently under- or over-report. Third, diagram-type coverage is narrower than the concepts a feature under design might need to express: no dedicated **sequence** type exists today for illustrating a feature's own component-to-component interaction over time (an SSE turn exchange, a cache-fallback trace, an auth handshake). Fourth, and most fundamentally: even where a diagram type exists, nothing today asks whether the diagram is actually a *good* one — legible, following standard diagramming conventions, genuinely readable by a human — on either side of the comparison. The as-designed diagram (authored by the model during `/design`) needs to faithfully represent design *intent*; the as-built diagram (`csd-s5`'s static parse of real repo files) needs to faithfully represent what was actually delivered; and `drift-comparator.js`'s whole value depends on BOTH sides being accurate, comprehensible representations, not just parseable text. Archify's taxonomy and its emphasis on layout/legibility as a first-class concern (not an afterthought to structural validity) is a proven reference point for closing these gaps. Two of archify's other types — workflow and lifecycle — were considered and explicitly deferred (see Out of Scope): once rescoped away from the platform's own meta-pipeline (which the existing kanban board already visualizes as a live status view), neither had a concrete anticipated use case, and speculative diagram-type capability without a real use case is exactly the kind of scope this discovery is trying to avoid.

## Who It Affects

**Developer/engineer** running `/design` or `/definition` for a feature — they're the one who has to read the generated System Architecture / Program Design / Data Model diagram and trust it represents the real shape of what's being built, and later has to interpret a DIVERGED drift signal and figure out whether it's a real problem or noise from a parsing gap. **Tech lead / squad lead** — reviews DoR's H9 architecture-constraints check against these diagrams, and relies on drift-check results as part of delivery governance (per `drift-comparator.js`'s own stated purpose: feeding the epic's benefit metrics P1 "time-to-drift-determination" and P3 "diverged-flag true-positive rate"). **Platform maintainer** — owns `skills/design/SKILL.md`'s diagram-emission instructions and `src/modules/drift-comparator.js`'s parsing/comparison logic; has to maintain and evolve these without silently degrading either side of the drift signal's accuracy.

## Why Now

Direct trigger: reviewing `tt-a1i/archify` (an external agent-skill diagram tool) this session surfaced concrete, code-grounded gaps in the platform's own diagram/drift machinery — narrow mermaid parsing (`drift-comparator.js`'s regexes miss labeled/multi-target edges and subgraphs), no validation feedback loop on malformed diagrams, and missing type coverage (no workflow/sequence/lifecycle types). This isn't just "we saw something shiny": `drift-comparator.js` was purpose-built with real benefit metrics already wired to it (P1: time-to-drift-determination, P3: diverged-flag true-positive rate, M1, per its own header comments). A parsing gap that silently produces a false MATCHED or false DIVERGED doesn't just look bad — it directly corrupts a governance signal the platform already claims to deliver and measure, on real (non-mocked) usage. No live-usage evidence of the specific failure exists yet — this is a code-review-derived risk finding, not an observed production incident — which is exactly the kind of gap worth closing before it produces one.

## MVP Scope

The smallest validating slice: (1) every diagram marker (System Architecture, Program Design, Data Model) gets validated before render, with a structured diagnostic — not a generic "failed to render" box — when it's malformed or the mermaid doesn't parse, including one bounded retry attempt using that diagnostic before surfacing it as terminal; (2) `drift-comparator.js`'s parsers are strengthened to correctly handle labeled edges, multi-target edges, and subgraphs, so drift detection stops silently mis-reporting on valid-but-richer mermaid; (3) exactly **one** new diagram type — **sequence** — is added end-to-end (schema/instruction with a worked example, LLM emission, client render), for illustrating a feature's own component-to-component interaction over time (an SSE turn exchange, a cache-fallback trace, an auth handshake). Emission is **conditional, not unconditional**: unlike System Architecture (emitted for every feature during `/design`), sequence only fires when the feature's own subject matter genuinely involves a multi-step interaction worth diagramming — most features won't trigger it. Drift comparison for sequence diagrams is explicitly out of scope for this MVP (harder than System Architecture's call-graph parse; revisit only once the type itself proves useful). Must be true for it to be worth building: an operator can trust that when any of these diagrams render, they're structurally valid; when a drift signal fires, it's not a parser artifact; and the new sequence type is actually reached for, not built speculatively.

## Out of Scope

- **Replacing mermaid with a typed-IR/agent-authored-grid-layout rendering engine** (archify's approach) — mermaid's auto-layout is retained; this initiative strengthens validation and parsing around it, it does not replace the rendering engine. A platform-native diagram-layout system is a much larger investment with no governance payoff proportional to the cost.
- **Visual presets, themes, and motion/animation** (archify's signal-flow/blueprint/classic presets, dark/light, finite trace animation) — purely cosmetic; no governance or traceability value, and building/maintaining a visual-design system is outside this platform's mission as a delivery-governance tool, not a diagram product.
- **Interactive reader-facing exploration features** (upstream/downstream reach traversal, route probing, semantic-role "lens" comparison, guided "stories") — these are standalone-artifact-viewer features; the platform's diagrams render inline in a chat turn, not as a separately distributed interactive file. Out of scope for this initiative.
- **A standalone diagram-authoring CLI** (validate/preview/deliver/compare/guide commands, a local watch-and-preview loop) — diagrams here are generated inline as part of `/design`/`/definition` LLM turns, not authored via a separate developer tool. Any validation added stays inline in the existing chat/render pipeline.
- **Workflow and lifecycle diagram types** — both were considered and cut during `/clarify`. Once correctly rescoped away from the platform's own meta-pipeline (gate approvals, a story's journey through `pipeline-state.json` phases — which the existing kanban board already visualizes live), neither had a concrete anticipated use case identified. Building speculative diagram-type capability without a real use case in hand is exactly the scope discipline this discovery is trying to enforce elsewhere — revisit only if a real future feature surfaces a genuine multi-step-process or stateful-domain-entity diagramming need.
- **A distinct "data-flow" diagram type** — archify's data-flow type (pipelines, lineage, PII, consumers) overlaps with the platform's existing `data-model` type (ER diagrams); adding a second, adjacent type would create ambiguity about which to use rather than closing a real gap. `data-model` stays as the platform's one data-shape diagram type.
- **Evidence-backed git-SHA citations on diagram nodes** — archify's evidence-backed nodes cite a pinned commit + file/line range. Not in scope here: as-designed diagrams describe proposed (not-yet-existing) work by definition, and adding real citation UI for the as-built side is a separate, larger feature in its own right.

## Assumptions and Risks

~~[ASSUMPTION] The model can reliably emit valid, richer mermaid syntax (labeled edges, multi-target edges, subgraphs) once instructed to use it for the new workflow/sequence/lifecycle types~~ — **Resolved via /clarify (2026-08-29):** mitigate by including explicit worked examples for each new type's mermaid syntax directly in the SKILL.md instructions, matching the existing convention already used for System Architecture and Data Model. `/definition` should require this as an explicit story AC (worked example present in the instruction text for each new type), not leave it implicit.
~~[ASSUMPTION] A structured diagnostic (a "repair receipt") on a malformed diagram marker will actually help the model self-correct on a retry, rather than just producing a more detailed but equally wrong second attempt~~ — **Resolved via /clarify (2026-08-29):** MVP includes exactly one bounded retry attempt using the structured diagnostic, mirroring archify's own capped-repair-round pattern (`SKILL.md`: "if two consecutive rounds do not improve... stop and report truthfully"). If the single retry still fails, the diagnostic is surfaced to the operator as the terminal state — no unbounded retry loop.
~~[ASSUMPTION] `pipeline-state.json`'s existing phase-transition data is rich enough to drive a genuinely useful lifecycle diagram without new instrumentation~~ — **Resolved via /clarify (2026-08-29): moot.** The lifecycle diagram type was cut from scope (see Out of Scope) after establishing it would have been redundant with the existing kanban board's live status view, and that no concrete use case for it existed independent of that redundancy.

**Risk:** Adding a new diagram type end-to-end (schema/instruction text, LLM emission, client render) grows the instruction surface of `skills/design/SKILL.md` and `skills/definition/SKILL.md` — this repo's own token-policy and progressive-disclosure principles treat SKILL.md size as a real cost, not a free addition. Narrowed from three types to one during `/clarify`, reducing this risk's magnitude.
**Risk:** If the sequence type ends up rarely reached for in practice, the instruction surface and schema support built for it is wasted investment — only detectable post-launch via usage measurement (see Directional Success Indicators). This is the same risk that led to cutting workflow and lifecycle pre-emptively; sequence was kept because — unlike those two — it maps to a concept (component-to-component interaction over time) the platform's own architecture already frequently involves (SSE turns, auth, cache fallback), not a speculative one.
**Risk:** This initiative originates from reviewing an external tool this session, not from an observed production pain point (per Why Now) — there's a real risk of over-indexing on "what archify does well" rather than what this platform's own operators actually need; the archify comparison should inform design, not dictate it.

## Directional Success Indicators

**Diagram render-failure diagnosability:** Baseline: `[UNKNOWN BASELINE]` — no current tracking of how often a canvas diagram marker fails to render, or whether the generic "failed to render" message is actually being hit in practice. Target: 100% of render failures surface a structured diagnostic (a specific rule/reason, not a generic message). Measured via: a new audit/log event fired on every canvas-block render failure, recording whether a structured diagnostic was available.

**Drift-comparator parsing accuracy:** Baseline: 0 — no test fixtures today exercise labeled edges, multi-target edges, or subgraphs in either `parseFlowchartMermaid` or `parseErDiagramMermaid`. Target: dedicated fixtures for all three cases exist and pass, for both diagram types drift-comparator supports. Measured via: test suite coverage count for these specific parsing cases.

**New diagram type adoption:** Baseline: 0% — the sequence diagram type doesn't exist today. Target: at least one genuine (non-test) emission within 4 weeks of shipping. Measured via: canvas-block type distribution captured in turn/PostHog events, the same mechanism already used for `revise-earlier-stage`'s own M1/M2/M3 tracking. If this target is missed, that's the signal the type genuinely isn't needed — not a reason to add workflow/lifecycle as a substitute without their own concrete use case.

## Constraints

Sourced from `product/constraints.md` (confirmed):
- **#15 Outcome-oriented instructions:** new SKILL.md instructions for workflow/sequence/lifecycle diagram emission must state the required outcome, not compensate for a current model quirk — must pass the "if the model improved tomorrow, would this instruction still be correct?" test.
- **#13 Structural governance over instructional:** the diagram-validation/repair-receipt mechanism must be a real, structurally-enforced check (code that runs and blocks/flags), not just an instruction reminding the model to validate its own output.
- **#11 No persistent agent runtime dependency:** validation must run within the existing chat-turn/render pipeline on standard infra — no new hosted service.
- **#7 One question at a time:** already being followed in this discovery session; any future interactive skill work here (if any) must follow the same discipline.

Sourced from repo-level architecture guardrails:
- **ADR-026 (no parallel rendering path):** new diagram types must dispatch through the existing single `renderCanvasBlock()` function in `skills.js`, not introduce a second rendering path.
- **Stack constraints** (`.github/standards/web-ui/web-ui-patterns.md`): no new npm dependencies, Node.js built-ins only — any strengthened mermaid parsing stays hand-rolled (extending `drift-comparator.js`'s existing regex-based approach), not a new mermaid-AST-parser dependency.

No new technical dependency is needed for richer mermaid *rendering* — mermaid.js (already in use) natively supports labeled edges, multi-target edges, and subgraphs; the gap is entirely in `drift-comparator.js`'s own bespoke structural parser, which is separate from the client-side render.

## Contributors

- Hamish King — Platform Owner

## Reviewers

- [None yet]

## Approved By

Pending

---

## /clarify recommendation

**Superseded by the Clarification log below.** All 3 original unconfirmed assumptions were resolved via `/clarify` on 2026-08-29 — two by deciding a concrete mitigation, one by becoming moot after a scope cut. The scope cut itself (dropping workflow and lifecycle diagram types) was the most significant outcome of clarification, not just an assumption resolution — see the log.

## Clarification log

[2026-08-29] Clarified via /clarify:
- Q: Can the model reliably emit valid, richer mermaid syntax (labeled/multi-target edges, subgraphs) for the new types? A: Mitigate by including explicit worked examples for each new type's mermaid syntax in the SKILL.md instructions, matching the existing convention for System Architecture/Data Model; require as an explicit story AC.
- Q: Will a structured diagnostic help the model self-correct on retry, or is it operator-visibility-only? A: MVP includes exactly one bounded retry attempt using the diagnostic (mirroring archify's own capped-repair-round pattern); if that retry still fails, the diagnostic surfaces to the operator as terminal — no unbounded retry loop.
- Q (operator-raised, not originally scheduled): Is the "workflow" diagram type actually just the platform's own meta-pipeline/approval process — and if so, isn't that redundant with the existing kanban board's live status view? A: Yes, as originally scoped it was redundant. Rescoped: every diagram type should document the feature being built, never the delivery process that builds it (matching System Architecture/Program Design/Data Model's existing convention) — "workflow" would mean a process the feature itself introduces, "lifecycle" a domain entity's own state machine within the feature, neither the meta-pipeline.
- Q (operator-raised): Where would a rescoped workflow diagram actually show up in the product UX? A: Same canvas panel/rendering path as existing types, but conditionally emitted (only when the feature's own subject matter involves a multi-step process) rather than unconditionally like System Architecture.
- Q (operator-raised): Given how narrow/conditional that trigger is, would workflow or lifecycle ever actually get used? A: Genuine uncertainty, not resolved by further rescoping — decided to cut both from MVP scope rather than build speculative capability with no concrete anticipated use case. `pipeline-state.json` lifecycle-data-richness question (the original Q3) became moot as a result. Sequence was kept (not cut) because it maps to a concept the platform's architecture already frequently involves (SSE turns, auth, cache fallback) rather than a speculative one.

---

**Next step:** Human review and approval → /benefit-metric
