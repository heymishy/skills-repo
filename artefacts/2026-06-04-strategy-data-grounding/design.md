# Discovery Artefact — Strategy and Data Grounding for Web UI Skill Sessions

**Feature slug:** 2026-06-04-strategy-data-grounding
**Status:** Approved
**Discovery started:** 2026-06-04
**Approved by:** Hamish King — 2026-06-04

---

## Problem statement

Pipeline operators starting skill sessions (/ideate, /discovery, /definition, and others) have no automatic access to organisational strategy, market positioning, or data context that should ground their work. Strategy and data content live in disconnected tools (PowerPoints, Excel, Power BI, dashboards) or exist only in operators' heads. Every session starts from scratch without explicit strategic grounding. The result is discovery and definition artefacts that miss strategic alignment, leading to rework at benefit-metric and definition-of-ready stages when misalignment surfaces.

This problem is acute now because the web UI has lowered the barrier to entry for non-product-managers — engineers, analysts, domain experts — to run the outer loop. This cohort arrives with real problems and opportunities but lacks the organisational strategy context that trained product managers carry implicitly. The gap between "person with an idea" and "grounded discovery artefact" is widest for this cohort, and it is the cohort the web UI was built to reach.

---

## Who it affects

**Primary: Pipeline operators without product management background**
Engineers, analysts, domain experts, and tech leads using the web UI or VS Code skills pipeline to run /ideate, /discovery, /definition, and similar sessions. They arrive with a real problem or opportunity but without easy access to organisational strategy context. Without automatic grounding, they either skip strategy entirely (producing ungrounded artefacts) or context-switch to external tools (breaking the skill session flow).

**Secondary: Product managers and business analysts**
Already carry strategy context but benefit from having it explicitly referenced and recorded in artefacts. Automatic strategy referencing makes the grounding traceable and auditable.

**Secondary: Tech leads and squad leads**
Run the outer loop on behalf of their teams. Benefit from automatic grounding as team size and initiative volume grow, reducing reliance on individual memory of strategic priorities.

---

## Why now

Two signals have converged:

1. **Web UI maturity:** The skills pipeline web UI is mature enough that non-product-managers are now the primary new cohort using the pipeline. The outer loop is navigable without git or IDE knowledge. This cohort is most likely to start sessions without explicit strategic grounding.

2. **Input quality is the highest-leverage improvement:** The pipeline mechanics are well-governed. The next meaningful improvement is the quality of inputs entering the pipeline. Automatic strategy grounding addresses the root cause of the most common discovery rework.

---

## MVP scope

An optional, operator-guided strategy and data grounding capability for web UI skill sessions:

- The operator decides upfront (at journey start, after choosing new feature vs. resume existing) whether to ground the session in strategy or data — entirely optional, may skip on first runs
- Reference file upload flow allows operators to upload strategy/data files into the existing reference materials structure (`artefacts/[feature]/reference/`)
- Skills that can benefit from strategy context (/ideate, /discovery, /definition — decided per-skill by SKILL.md instruction) automatically reference available files if present
- The model explicitly calls out when it uses strategy/data content: "Grounded in: [strategy item]" appears in artefact sections where strategy informed the decision
- Works for markdown-format strategy files in the web UI skill session and VS Code skills pipeline sessions
- Metrics are recorded on feature usage and effectiveness (explicit callouts are counted and correlated with artefact quality)

**Minimum bar for Phase 1 success:** An operator running /ideate with strategy/data files uploaded receives materially better grounding questions and scope challenges than without them — verifiable by side-by-side session comparison.

---

## Out of scope

1. **Guided strategy creation (/strategy skill):** Phase 1 references existing strategy content. It does not help operators create or structure strategy. A /strategy skill (analogous to /ideate for strategy creation) is Phase 2+.

2. **Non-markdown format support:** Excel, Power BI, PowerPoint normalisation and cloud data source authentication are deferred to Phase 2+. Phase 1 is markdown only, local files only.

3. **Semantic search or vector database infrastructure:** Phase 1 injects the full strategy/data file (or relevant sections) into the system prompt. Relevance matching via vector search is Phase 2+ if context budget becomes a constraint.

4. **Automatic strategy file discovery:** Phase 1 requires the operator to upload files via the reference upload UX. Auto-discovery of strategy content across the repository is out of scope.

5. **Multi-organisation support:** This feature assumes a single organisational context. Multi-org strategy routing is out of scope for Phase 1.

---

## User journey

1. Operator opens web UI and starts a new feature journey
2. Journey asks: "Is this a new product or resuming an existing product?" (existing gate)
3. Journey asks: "Would you like to ground this work in strategy or data?" (new gate — optional, may skip)
4. If yes:
   - Reference upload UX appears: operator uploads strategy/data markdown files
   - Files are stored in `artefacts/[feature-slug]/reference/`
5. Operator starts /ideate or /discovery skill
6. The skill's system prompt includes injected strategy/data content as "Strategic context" and "Reference material"
7. Model uses the context to frame questions and validate scope
8. Where the model uses strategy/data, it explicitly calls it out: "Grounded in: [strategy item]"
9. Metrics system records the callout and tracks effectiveness

---

## Technical approach

### Reference file upload and storage

- Operators upload files via a modal/drawer in the web UI journey flow
- Files are stored in `artefacts/[feature-slug]/reference/` — reusing the existing reference materials directory structure
- Supported format: Markdown (Phase 1)
- File naming convention: `strategy.md` or `data.md` (or operator-chosen name)

### System prompt injection

- When a skill session starts (/ideate, /discovery, /definition, etc.), the system checks for files in the feature's reference directory
- If files exist, their content is injected into the skill's system prompt as:
  ```
  ## Strategic context and reference material
  [file content]
  ```
- This is additive — it does not replace existing system prompt sections
- Skills that do not benefit from strategy context simply do not reference it (silent ignore)

### Explicit grounding callouts

- The skill SKILL.md instruction includes guidance: "When you use the injected strategy/data content to ground a decision, explicitly note it: 'Grounded in: [strategy item]'"
- The model learns to make these callouts through SKILL.md instruction and example
- Metrics system scans artefacts for "Grounded in:" patterns to count and correlate with quality signals

### Metrics collection

- **Usage tracking:** Count of sessions with strategy/data files uploaded, count of sessions where "Grounded in:" callouts appear
- **Effectiveness tracking:** Correlation between artefact callout count and downstream rework (at benefit-metric and definition-of-ready stages)
- **Quality signal:** Post-session operator feedback (1–5 scale) on whether strategy grounding was useful
- Metrics are recorded in the feature's benefit-metric.md and reviewed at Phase 1 closure

---

## Constraints

- **Node.js CommonJS only** — no ES modules, no TypeScript
- **Zero new npm dependencies** — file reading uses `fs` and `path` built-ins only
- **No persistent runtime** — strategy context injection happens at session-start system prompt assembly
- **Markdown format only for Phase 1** — format normalisation for other formats is out of scope
- **Context budget** — injected strategy/data content must not push the total system prompt beyond the per-session token budget (currently 12,000 tokens per turn, defined in `context.yml`)
- **Single organisational context** — Phase 1 assumes one organisation, not multi-org routing

---

## Assumptions and risks

**[ASSUMPTION]** The strategy/data file content fits within the skill session context budget when injected alongside the SKILL.md system prompt and prior artefacts — unconfirmed, requires token budget validation during implementation.

**[ASSUMPTION]** Operators will realistically upload and maintain strategy/data files in the reference directory — unconfirmed, requires validation that this behaviour is realistic for the target cohort.

**[ASSUMPTION]** The model uses injected strategy/data content meaningfully (frames questions, validates scope) rather than acknowledging it and proceeding as if absent — unconfirmed, requires a test session with real strategy content.

**[ASSUMPTION]** Explicit "Grounded in:" callouts will be consistently emitted by the model when it uses strategy context — unconfirmed, requires SKILL.md instruction refinement and testing.

**Risk: Context budget exhaustion.** A comprehensive strategy/data document injected alongside SKILL.md and prior artefacts could exhaust per-session context budget. Mitigation: validate token count during Phase 1 implementation; consider section-level injection as fallback if needed.

**Risk: Operator adoption.** Without guided help, operators may not realise the feature exists or may not populate strategy files. Mitigation: reference upload UX must be discoverable and frictionless; consider a default "getting started" strategy template.

---

## Success indicators

**Primary: Grounding quality improvement**
Baseline: [TBD] — retrospective audit of prior sessions to establish how often discovery artefacts are revised at benefit-metric/definition stage due to missing strategic grounding.
Target: ≥30% reduction in strategy-related rework (compared to baseline).
Measured via: Artefact revision logs tagged with rework reason; correlation between "Grounded in:" callout frequency and revision frequency.

**Secondary: Feature adoption rate**
Baseline: 0% (feature does not exist).
Target: ≥50% of new feature journeys have strategy/data files uploaded within 30 days of Phase 1 release.
Measured via: Reference directory presence across active features; session logs showing files injected.

**Secondary: Operator satisfaction**
Baseline: Unknown.
Target: ≥70% of sessions report strategy grounding was useful (post-session 1–5 scale, ≥4/5 counts as useful).
Measured via: Post-session operator feedback; artefact-level "Grounded in:" callout count.

**Tertiary: Model usage consistency**
Baseline: Unknown.
Target: ≥60% of sessions where strategy files are uploaded also contain ≥1 explicit "Grounded in:" callout in the artefact.
Measured via: Artefact text scanning for "Grounded in:" pattern.

---

## Attribution

**Contributors:**
- Hamish King — Product owner / operator — 2026-06-04

**Approved by:**
- Hamish King — Product owner — 2026-06-04