## Epic: Operators can trust every canvas diagram renders correctly and every drift signal is accurate

**Discovery reference:** artefacts/2026-08-29-diagram-validation-and-types/discovery.md
**Benefit-metric reference:** artefacts/2026-08-29-diagram-validation-and-types/benefit-metric.md
**Slicing strategy:** Walking skeleton — S1 establishes the thinnest end-to-end diagnostic path on the simplest failure mode (malformed marker), then each subsequent story extends the same mechanism to a harder failure mode or a new capability, rather than building all three MVP pieces in parallel from scratch.

## Goal

An operator running `/design` or `/definition` never encounters a canvas diagram that silently fails to appear or fails with an unhelpful generic error — every failure names its specific cause. A tech lead reviewing a drift-check result trusts that a DIVERGED or MATCHED signal reflects the real diagram content, not a parser gap. When a feature's own subject matter involves a component-to-component interaction over time, the operator can express it as a Sequence diagram using the same trusted canvas mechanism.

---CANVAS-JSON: {"type":"program-design","title":"Program Design","content":{"mermaid":"flowchart TD\n    SCANNER[skills.js: canvas-marker scan loop]\n    PARSER[skills.js: parseCanvasBlock]\n    DIAGNOSTIC[skills.js: diagnostic emitter -- new, S1/S2]\n    RENDERFN[skills.js: renderCanvasBlock / buildDiagramBodyHtml]\n    ERRHANDLER[skills.js: markDiagramRenderError]\n    DRIFTPARSE[drift-comparator.js: parseFlowchartMermaid]\n    DRIFTCOMPARE[drift-comparator.js: compareProgramDesign / compareSystemArchitecture]\n    SCANNER --> PARSER\n    PARSER --> DIAGNOSTIC\n    DIAGNOSTIC --> SCANNER\n    RENDERFN --> ERRHANDLER\n    ERRHANDLER --> DIAGNOSTIC\n    DRIFTPARSE --> DRIFTCOMPARE"}}---

## Out of Scope

- Workflow and lifecycle diagram types — cut at discovery/clarify; no concrete use case identified (see `decisions.md`)
- Replacing mermaid, adding visual presets/themes/motion, interactive reach/route/lens exploration, a standalone diagram CLI, a distinct data-flow type, or evidence-backed git-SHA citations — all explicitly out of scope per discovery
- Drift comparison support for the new Sequence type — the type ships without drift-comparator support in this epic; revisit only once the type itself proves used (per benefit-metric M3)
- Strengthening `parseErDiagramMermaid` for labeled/multi-target edges or subgraphs — these are flowchart-only mermaid concepts; ER diagrams don't have them, so `parseErDiagramMermaid` needs no change in this epic

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Diagram render-failure diagnosability | 0% | 100% of render failures surface a structured diagnostic | S1 (malformed marker) + S2 (invalid mermaid) each close one half of the render-failure surface |
| Drift-comparator parsing accuracy | 0 fixtures for labeled/multi-target edges or subgraphs | Dedicated passing fixtures for both cases, both parser functions where applicable | S3 (labeled/multi-target edges) + S4 (subgraphs) |
| New diagram type (sequence) adoption | 0% | ≥1 genuine emission within 4 weeks | S5 |

## Stories in This Epic

- [ ] S1 — Structured diagnostic for a malformed canvas diagram marker
- [ ] S2 — Structured diagnostic for invalid mermaid syntax inside a diagram
- [ ] S3 — Drift-comparator recognizes labeled and multi-target edges
- [ ] S4 — Drift-comparator recognizes subgraphs
- [ ] S5 — Add the Sequence diagram type, conditionally emitted

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Touches shared rendering (`renderCanvasBlock`, ADR-026's single-dispatch constraint) and a governance-relevant comparator (`drift-comparator.js`) whose output feeds real benefit metrics — not high-risk/customer-facing/experimental, but worth a human PR review before merge rather than fully autonomous coding-agent completion.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable
