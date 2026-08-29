## Benefit Metric: Diagram Validation, Drift Accuracy, and Archify-Inspired Diagram Types

**Discovery reference:** `artefacts/2026-08-29-diagram-validation-and-types/discovery.md` (Approved 2026-08-29, Hamish King — Platform Owner)
**Date defined:** 2026-08-29
**Metric owner:** Hamish King — Platform Owner
**Reviewers:** Hamish King — Platform Owner

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No — this is a real, standing capability improvement to the platform's own diagram/drift machinery, not a tooling pilot or hypothesis test. Standard product metrics only.

**Roadmap alignment note:** This initiative doesn't map cleanly to a named Phase/WS item in `product/roadmap.md` — it's a governance-accuracy improvement to existing web-UI diagram infrastructure (shipped under Phase 5's web-UI workstreams), not a new workstream in its own right. Flagged honestly rather than forced into a false mapping; it's consistent with the platform mission's "trust the governance output" success outcome (`mission.md`), specifically the accuracy of drift-check signals a tech lead already relies on for delivery governance.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Diagram render-failure diagnosability

| Field | Value |
|-------|-------|
| **What we measure** | Of all canvas diagram render failures (a malformed CANVAS-JSON marker or mermaid that fails to parse), the proportion that surface a structured diagnostic (a specific rule/reason) rather than the generic "diagram failed to render" message. |
| **Baseline** | 0% — no structured diagnostic mechanism exists today; every failure currently shows the generic message with no specific reason. |
| **Target** | 100% of render failures surface a structured diagnostic. |
| **Minimum validation signal** | At least 80% — some malformed-input edge cases may fall outside the initial diagnostic rule set; below 80% signals the diagnostic coverage itself needs work before this can be called a success. |
| **Measurement method** | A new audit/log event fired on every canvas-block render failure, recording whether a structured diagnostic was available versus falling through to the generic message. Reviewed by the metric owner after the first month of usage. |
| **Feedback loop** | If below 80% after a month, the metric owner reviews which failure modes aren't covered and extends the diagnostic rule set. If still low after a second pass, reconsider whether the rule-based approach can reach full coverage or needs a different validation strategy. |

### Metric 2: Drift-comparator parsing accuracy

| Field | Value |
|-------|-------|
| **What we measure** | Test coverage of `drift-comparator.js`'s parsers (`parseFlowchartMermaid`, `parseErDiagramMermaid`) against the previously-unhandled syntax cases: labeled edges, multi-target edges, and subgraphs. |
| **Baseline** | 0 — no test fixtures exercise these cases today, for either parser function. |
| **Target** | Dedicated, passing fixtures exist for all 3 cases, for both parser functions (6 fixture groups minimum). |
| **Minimum validation signal** | The 2 highest-likelihood cases (labeled edges, multi-target edges) covered and passing. Subgraphs may be deferred only with an explicit RISK-ACCEPT at DoR — not silently dropped. |
| **Measurement method** | Test suite coverage count, checked at `/verify-completion` for the implementing story. |
| **Feedback loop** | If a real drift-comparison false-positive or false-negative is later traced in production to an uncovered parsing case, that is a direct measurement failure — it triggers an immediate fix-forward story, not a backlog item. |

### Metric 3: New diagram type (sequence) adoption

| Field | Value |
|-------|-------|
| **What we measure** | Count of genuine (non-test) sequence-type canvas-block emissions during `/design` or `/definition` sessions. |
| **Baseline** | 0% — the sequence type doesn't exist today. |
| **Target** | At least 1 genuine emission within 4 weeks of shipping. |
| **Minimum validation signal** | At least 1 genuine emission within 8 weeks. Below this, the type is not being reached for — the conditional-emission instruction likely needs revisiting (either the trigger condition is unclear to the model, or the type genuinely isn't needed). |
| **Measurement method** | Canvas-block type distribution captured in turn/PostHog events — the same mechanism already used for `revise-earlier-stage`'s own M1/M2/M3 tracking. Reviewed by the metric owner monthly. |
| **Feedback loop** | If the minimum signal isn't hit by 8 weeks, the metric owner decides whether to strengthen the emission instruction or deprecate the type — the same "don't keep speculative capability without a real use case" principle already applied to cutting workflow/lifecycle at discovery. |

---

## Tier 2: Meta Metrics (Learning / Validation)

Not applicable — no meta-benefit flag set (see Tier Classification).

---

## Tier 3: Compliance and Risk-Reduction Metrics

Not applicable — `context.yml` has `meta.regulated: false`, no compliance frameworks configured, and the discovery artefact's Constraints section names no regulatory obligation.

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Diagram render-failure diagnosability | Pending — populated at `/definition` | Pending |
| Drift-comparator parsing accuracy | Pending — populated at `/definition` | Pending |
| New diagram type (sequence) adoption | Pending — populated at `/definition` | Pending |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
