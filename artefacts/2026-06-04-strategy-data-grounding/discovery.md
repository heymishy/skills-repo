# Discovery Artefact — Strategy and Data Grounding for Pipeline Sessions

**Feature slug:** 2026-06-04-strategy-data-grounding
**Status:** Approved
**Discovery started:** 2026-06-04
**Approved by:** Hamish King — 2026-06-04

---

## Problem statement

Pipeline operators starting an ideation or discovery session have no automatic access to the organisational strategy, market positioning, or data context that should ground their work. Strategy content lives in PowerPoints, Excel files, and Power BI dashboards — disconnected from the pipeline entirely. Every session starts from scratch. The result is discovery artefacts that are scoped without strategic grounding, leading to rework at benefit-metric and definition stages when misalignment surfaces.

This problem has reached a tipping point now because the skills pipeline web UI has lowered the barrier to entry significantly. Non-product-managers — engineers, analysts, domain experts — are now starting ideation and discovery sessions with good ideas but without the organisational strategy context that a trained product manager would carry in their head. The gap between "person with an idea" and "grounded discovery artefact" is widest for this cohort, and it is the cohort that the web UI was built to reach.

---

## Who it affects

**Primary: Pipeline operators without a product management background**
Engineers, analysts, and domain experts who use the web UI or VS Code skills pipeline to run /ideate and /discovery sessions. They arrive with a real problem or opportunity but without organisational strategy context readily available. When strategy is not surfaced automatically, they either skip it (producing ungrounded artefacts) or context-switch to another tool to find it (breaking the flow).

**Secondary: Tech leads and squad leads**
Run the outer loop on behalf of their team. Currently rely on their own memory of strategic priorities when scoping discovery sessions. Benefit from automatic grounding as team size and initiative volume grow.

**Secondary: Product managers and business analysts**
Already carry strategy context but benefit from having it explicitly referenced in the artefact rather than implicit in their judgment. Automatic strategy referencing makes the grounding traceable and auditable.

---

## Why now

Two signals have converged:

1. **Web UI maturity:** The skills pipeline web UI is now mature enough that non-product-managers are the primary new cohort. The outer loop (ideation through definition-of-ready) is navigable via a browser without git or IDE knowledge. This cohort is the one most likely to start a session without strategy context.

2. **Input quality is now the highest-leverage improvement:** The pipeline outer loop is well-governed. The next meaningful improvement is not in the pipeline mechanics but in the quality of the inputs that enter it. Automatic strategy grounding addresses the root cause of the most common source of discovery rework.

---

## MVP scope

A markdown-first automatic strategy referencing capability for /ideate and /discovery sessions:

- The operator places a strategy file in a declared location (e.g. `product/strategy.md` or a path configured in `context.yml`)
- When a /ideate or /discovery session starts, the strategy file content is automatically read and injected as named context into the skill session system prompt
- The model surfaces relevant strategy content naturally during the session — framing the problem, challenging scope, and grounding benefit metrics against stated organisational priorities
- Works for at least one real markdown strategy format without operator intervention beyond placing the file
- Delivers value in the web UI skill session and in VS Code skills pipeline sessions

**Minimum bar for Phase 1 to be considered successful:** An operator running /ideate with a strategy file present receives materially better grounding questions and scope challenges than the same operator running /ideate without one — verifiable by side-by-side session comparison.

---

## Out of scope

1. **Guided strategy creation (/strategy skill):** Phase 1 references existing strategy content. It does not help operators create or structure strategy content. A /strategy skill (analogous to /ideate for strategy creation) is Phase 2.

2. **Non-markdown format support:** Excel, Power BI, PowerPoint, and other binary or cloud-native formats require format normalisation and potentially OAuth/service account authentication. These are deferred to Phase 2. Phase 1 is markdown only.

3. **Cloud data source authentication:** Reading strategy content from OneDrive, SharePoint, or other cloud-hosted locations requires token flows that are out of scope for Phase 1. Local file only.

4. **Semantic search or vector database infrastructure:** Phase 1 injects the full strategy file (or a section of it) into the system prompt. Relevance matching via vector search is a Phase 2 enhancement if context budget becomes a constraint.

5. **Automatic strategy file discovery:** Phase 1 requires the operator to declare the strategy file path in `context.yml` or place it at the conventional location. Auto-discovery of strategy content across the repository is out of scope.

---

## Assumptions and risks

[ASSUMPTION] The strategy file content fits within the skill session context budget when injected alongside the SKILL.md system prompt and prior artefacts — unconfirmed, requires a context budget check before implementation begins.

[ASSUMPTION] Operators running /ideate and /discovery sessions will place a markdown strategy file at the declared location and keep it current — unconfirmed, requires validation that this behaviour is realistic for the target cohort.

[ASSUMPTION] The model uses injected strategy content meaningfully (asks grounding questions, challenges scope against strategy) rather than acknowledging it and proceeding as if it were absent — unconfirmed, requires a test session with real strategy content before committing to the approach.

**RISK-ACCEPT (carried from ideation):**
- A1: Operators want strategy context surfaced automatically rather than on request — accepted without test.
- A6: Format normalisation for Excel/PowerBI — accepted without test; mitigated by markdown-only Phase 1 scope.
- A7: Data source authentication complexity — accepted without test; mitigated by local file only.

**Risk: Context budget exhaustion.** A comprehensive strategy document injected alongside a full SKILL.md and prior artefacts for a multi-stage journey could exhaust the per-session context budget. Mitigation: test with a realistic strategy document size before committing to full injection; consider section-level injection as a fallback.

---

## Directional success indicators

**Primary: Grounding quality improvement**
Baseline: [UNKNOWN BASELINE] — no current measure of how often /ideate and /discovery sessions produce artefacts that are later revised at benefit-metric or definition stage due to missing strategic grounding.
Target: Reduction in discovery-to-definition rework caused by missing strategic context, observable in post-session operator feedback and artefact revision frequency.
Measured via: Session comparison (with vs without strategy file) and operator-reported revision frequency at benefit-metric stage.

**Secondary: Strategy file adoption rate**
Baseline: 0 (feature does not exist).
Target: ≥50% of new discovery sessions run with a strategy file present within 30 days of Phase 1 release.
Measured via: `context.yml` strategy file path configuration presence across active features.

**Secondary: Operator effort reduction**
Baseline: Operators currently context-switch to external tools (PowerPoint, Excel, Power BI) to retrieve strategy context before or during discovery sessions.
Target: Zero context-switches required for operators who have placed a strategy file.
Measured via: Operator self-report in post-session feedback.

---

## Constraints

- **Node.js CommonJS only** — no ES modules, no TypeScript (existing tech stack constraint).
- **Zero new npm dependencies** — strategy file reading must use `fs` and `path` built-ins only.
- **No persistent runtime** — strategy context injection happens at session-start system prompt assembly; no background service.
- **Markdown format only for Phase 1** — format normalisation for other formats is out of scope.
- **Context budget** — injected strategy content must not push the total system prompt beyond the per-session token budget defined in `context.yml` (`optimization.token_policy.per_turn_soft_budget`).

---

## /clarify recommendation

This discovery contains 3 unconfirmed assumptions that affect implementation approach and benefit measurement. Before proceeding to `/benefit-metric`, consider running `/clarify` to resolve:

- Context budget assumption: does a realistic strategy document fit within the session token budget when injected alongside the full SKILL.md and prior artefacts?
- Operator behaviour assumption: will operators in the target cohort realistically place and maintain a markdown strategy file?
- Model usage assumption: does the model meaningfully use injected strategy content, or does it acknowledge and ignore it?

These can be resolved with a 30-minute test session using real strategy content before committing to the implementation approach.

---

## Attribution

**Contributors:**
- Hamish King — Product owner / operator — 2026-06-04

**Reviewers:**
- None (solo operator, W4 RISK-ACCEPT posture)

**Approved by:**
- Hamish King — Product owner — 2026-06-04