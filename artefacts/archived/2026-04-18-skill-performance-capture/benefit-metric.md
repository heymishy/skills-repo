# Benefit Metric: Skill Performance Capture

**Discovery reference:** artefacts/2026-04-18-skill-performance-capture/discovery.md
**Date defined:** 2026-04-18
**Metric owner:** Hamish (platform maintainer / operator)

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

This initiative has two distinct metric tiers. Tier 1 measures whether the capture mechanism works correctly as a feature. Tier 2 measures whether the first experiment run produces decision-grade evidence about model choice. A Tier 1 success without a Tier 2 success (mechanism works, but experiment produces no discriminating signal) is a partial win — that tradeoff is explicit here.

---

## Tier 1: Product Metrics (Mechanism Correctness)

### Metric 1 (M1): Capture block completeness rate

| Field | Value |
|-------|-------|
| **What we measure** | Percentage of expected capture blocks that are present and fully populated across a single experiment run. Expected blocks: one per phase output artefact — `discovery.md`, `benefit-metric.md`, each story `.md`, each test plan `.md`. Gate artefacts (DoR, DoD) are excluded. |
| **Baseline** | 0% — feature does not yet exist. |
| **Target** | 100% — every expected block present and fully populated on the first experiment run. |
| **Minimum validation signal** | ≥ 80% — at least 4 of every 5 expected blocks present and complete. If threshold is met, proceed with the experiment and fix missing blocks before the second model run. |
| **Measurement method** | Operator manually checks each phase output artefact after the run; counts blocks present vs. expected. Done once per experiment run. Takes approximately 5 minutes. |
| **Feedback loop** | If < 80% after first run, operator debugs `context.yml` instrumentation configuration before proceeding to the second model run. If consistently failing across two attempts, the context overlay mechanism is insufficient — escalate to `/decisions` for mechanism evolution (e.g. `.github/instrumentation.md` wrapper). |

---

## Tier 2: Meta Metrics (Learning / Validation)

### Meta Metric 1 (MM1): Context breadth — unprompted repo file references

| Field | Value |
|-------|-------|
| **Hypothesis** | Different models draw on different amounts of available repo context unprompted. A more capable model surfaces more relevant files without operator direction. |
| **What we measure** | Count of distinct repo files referenced or demonstrably drawn on in artefact content per run, without the operator explicitly citing them during the session. |
| **Baseline** | Established during first model run — recorded in that run's capture blocks. Becomes the comparison baseline for the second run. |
| **Target** | Not absolute — measured as a delta between runs. A difference of ≥ 2 files between runs confirms the metric has discriminating power. |
| **Minimum signal** | At least one file cited in one run that was not cited in the other (i.e. the metric is not identical across runs). |
| **Measurement method** | Operator counts distinct file references in phase output artefacts post-run. Recorded in the capture block of each artefact. Done once per run by operator. |
| **Feedback loop** | If both runs produce identical file reference sets, this metric cannot discriminate between models. Note "no signal" in the experiment report and rely on MM2/MM3 for the comparison instead. |

---

### Meta Metric 2 (MM2): Constraint inference rate

| Field | Value |
|-------|-------|
| **Hypothesis** | A more capable model applies platform constraints from `product/constraints.md` (and architecture-guardrails.md) without needing the operator to prompt them explicitly during the session. |
| **What we measure** | Count of constraints from `product/constraints.md` and product context files that appear correctly applied in artefacts without the operator citing them during the run. |
| **Baseline** | Established during first model run — recorded in operator review section of capture blocks. |
| **Target** | Comparative — "better" model applies more constraints unprompted. No absolute threshold; the direction of the delta is the signal. |
| **Minimum signal** | At least one constraint applied differently between runs. |
| **Measurement method** | Operator reviews phase output artefacts against `product/constraints.md` post-run; tallies unprompted applications. Recorded in capture block operator review section. Done once per run. Takes approximately 10 minutes per run. |
| **Feedback loop** | If no difference detected, metric cannot discriminate between models; note "no signal" in experiment report. |

---

### Meta Metric 3 (MM3): Artefact linkage richness

| Field | Value |
|-------|-------|
| **Hypothesis** | A more capable model produces artefacts with richer, more accurate backward references to constraints, prior decisions, and existing artefacts in the repository — drawn from context rather than prompted by the operator. |
| **What we measure** | Count of accurate backward references per artefact — references to `constraints.md`, `decisions.md`, `architecture-guardrails.md`, and existing artefact slugs — that are both present and correct (not hallucinated or misfiled). Hallucinated references count as negative signal regardless of total count. |
| **Baseline** | Established during first model run — operator spot-checks 3 artefacts and records reference count + accuracy. |
| **Target** | Comparative — "better" run has more accurate references and fewer hallucinated ones. |
| **Minimum signal** | At least one reference difference (in count or accuracy) between runs. |
| **Measurement method** | Operator spot-checks the 3 largest phase output artefacts per run (typically `discovery.md`, `benefit-metric.md`, and one story), counts accurate references, notes any hallucinated references. Recorded in capture block. Done once per run. Takes approximately 15 minutes per run. |
| **Feedback loop** | If no difference, metric cannot discriminate; note "no signal". If hallucinated references discovered, record as a quality failure in the experiment report regardless of overall count — this is a disqualifying signal for the model run. |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1 — Capture block completeness rate | spc.1 (config schema), spc.3 (agent instruction — produces the blocks), spc.5 (governance check — measures completeness) | Covered |
| MM1 — Context breadth (unprompted repo file refs) | spc.2 (schema includes `files_referenced` list field), spc.3 (agent instruction populates it) | Covered |
| MM2 — Constraint inference rate | spc.2 (schema includes `constraints_inferred_count` field), spc.3 (agent instruction populates it) | Covered |
| MM3 — Artefact linkage richness | spc.2 (schema includes `backward_references` section with accuracy field), spc.3 (agent instruction populates it) | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
