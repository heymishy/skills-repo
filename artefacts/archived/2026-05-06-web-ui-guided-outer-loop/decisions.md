# Decision Log: 2026-05-06-web-ui-guided-outer-loop

**Feature:** Web UI Guided Outer Loop Journey
**Discovery reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/discovery.md
**Last updated:** 2026-05-06

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
**2026-05-06 | ARCH | spike**
**Decision:** Option B (one session per skill stage with handoff context block) chosen over Option A (single persistent /workflow session spanning all stages).
**Alternatives considered:** Option A — a single long-running session where the model accumulates the full outer loop conversation. Evaluated and ruled out.
**Rationale:** Three structural blockers in the mfc.1 session model made Option A incompatible without significant refactoring: (1) `session.done` fires on the first artefact signal and cannot be reset — /benefit-metric cannot start in a session where /discovery has already signalled done; (2) `buildSystemPrompt` is called once at session creation and stored as `session.systemPrompt` — the system prompt is immutable per session, so swapping SKILL.md content between stages is not supported; (3) context budget risk — 7 SKILL.md files plus full outer loop conversation history approaches the model's 128k token limit before any artefact output. Option B requires only additive changes: one new `priorArtefacts` parameter to `buildSystemPrompt`, an orchestration layer, and a gate-confirm handler.
**Made by:** Hamis — confirmed on spike PROCEED verdict 2026-05-06.
**Revisit trigger:** If a future model API supports true multi-agent session handoff natively, or if the mfc.1 session model is refactored to support session reset. Neither is planned.

---
**2026-05-06 | ARCH | spike**
**Decision:** Handoff schema for cross-stage context is artefact content only (Option B-iii) — prior-stage artefact files injected as `--- PRIOR ARTEFACT ---` sections in the system prompt via a new `priorArtefacts` parameter in `buildSystemPrompt`.
**Alternatives considered:** B-i (inject full prior session Q&A turns into new session), B-ii (model emits a synthesised summary at stage transition). Both deferred, not discarded.
**Rationale:** B-i carries unbounded token cost (all Q&A across all prior sessions) and presents a multi-persona context that the new session's model did not participate in — context confusion risk. B-ii adds a model call per stage boundary, introduces summary fidelity risk (key decisions can be silently dropped), and adds latency; marginal benefit over B-iii for MVP. B-iii maps directly to `buildSystemPrompt`'s existing reference materials injection pattern (step 4 already injects reference/ dir .md files as named sections). Token budget for largest injection ≈ 8k tokens — well within per-session budget.
**Made by:** Hamis — confirmed on spike PROCEED verdict 2026-05-06.
**Revisit trigger:** See RISK-ACCEPT entry below (2026-05-06) — if heavily-edited artefacts are producing thin downstream context in practice, revisit B-ii as a post-MVP enhancement.

---
**2026-05-06 | ARCH | spike**
**Decision:** Disk is canonical from gate-confirm onward. The gate-confirm handler uses a write-then-read sequence: (1) write `session.artefactContent` to disk, (2) read the file back from disk, (3) use disk content to build the handoff block for the next stage session. The in-memory `session.artefactContent` value is not used after the write.
**Alternatives considered:** Using `session.artefactContent` directly as handoff input (skipping the disk read-back). Ruled out because `/trace` always validates against disk, so any edit made at gate-confirm between LLM output and confirmation would create a divergence between what the next skill receives and what the trace sees.
**Made by:** Hamis — confirmed on spike PROCEED verdict 2026-05-06.
**Revisit trigger:** Never — disk canonicity is a traceability requirement, not a convenience choice.

---
**2026-05-06 | RISK-ACCEPT | spike**
**Decision:** Accepted that artefact content only (B-iii) captures the structured output of each stage but not the reasoning path — the "why" behind operator choices made during the conversation is not carried forward to subsequent stages.
**Context:** A discovery artefact records what the operator decided (problem statement, MVP scope, assumptions), but not the deliberative path that produced it — e.g. "the operator initially framed this as a technical problem, then reframed it as a user onboarding problem after the third question." If an operator produces a heavily edited artefact (edits after the model-generated draft), the gap between the final artefact and the actual reasoning is wider than for a lightly-edited artefact. The downstream skill (/benefit-metric, /definition) receives only the output, not the reasoning. In most cases this is sufficient — artefacts are designed to be self-contained. But for complex, ambiguous discoveries where the operator's framing shifted significantly mid-session, the next-stage model may lack context to ask the right probing questions.
**Why accepted for MVP:** The spike scope (Definition phase) does not require solving this. B-iii is sufficient for the majority of cases. B-ii (model-synthesised summary) addresses this gap but adds implementation complexity and a model call per stage boundary — deferred, not discarded. The gap is observable (operators will notice if /benefit-metric asks questions that seem to ignore prior context) and addressable post-MVP.
**Monitoring signal:** Operator coherence ratings from MM2 (benefit-metric.md) at stage transitions. If coherence ratings drop below 4/5 consistently on features with heavily-edited discovery artefacts, this is the trigger to revisit B-ii.
**Made by:** Hamis — captured 2026-05-06 before /definition.
**Revisit trigger:** MM2 coherence ratings below 4/5 on ≥2 features where the discovery artefact was substantially edited post-generation. Or: first operator explicitly reports "the model didn't seem to know what we'd decided in the previous stage."

---

## Architecture Decision Records

<!-- No full ADRs required for this feature — log entries above are sufficient.
     The three ARCH decisions above are additive extensions to the mfc.1 session model
     and do not constrain future features beyond this feature's scope. -->
