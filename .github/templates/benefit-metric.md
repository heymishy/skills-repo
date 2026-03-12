# Benefit Metric Template

<!--
  USAGE: Canonical format for all benefit-metric artefacts produced by the /benefit-metric skill.
  Every metric defined here must be traceable forward to at least one story via the definition skill.
  Every story must trace back to at least one metric here.
  Orphaned metrics (no stories) and orphaned stories (no metric) are pipeline failures.

  To evolve this format: update this file, open a PR, tag product lead + engineering lead.
-->

## Benefit Metric: [Feature / Initiative Name]

**Discovery reference:** [Link to approved discovery artefact]
**Date defined:** [YYYY-MM-DD]
**Metric owner:** [Who is responsible for measuring and reporting]

---

## Tier Classification

<!--
  Some initiatives have both product benefits (user value) and meta benefits 
  (learning / validation goals for the team or tooling). Define them separately.
  A project can succeed on Tier 2 metrics even if Tier 1 targets are not met —
  but only if this tradeoff was explicit from the start.

  If only one tier applies, delete the other section.
-->

**⚠️ META-BENEFIT FLAG:** [Yes / No]
<!-- Set to Yes if this initiative also validates a hypothesis about tooling, 
     process, or team capability — not just user value. -->

---

## Tier 1: Product Metrics (User Value)

### Metric 1: [Name]

| Field | Value |
|-------|-------|
| **What we measure** | [Specific, observable thing — not a proxy] |
| **Baseline** | [Current value, or "establishing baseline in first 2 weeks"] |
| **Target** | [Specific, directional — "under 15 minutes", not "faster"] |
| **Minimum validation signal** | [Lower threshold — if we don't hit this, stop/pivot] |
| **Measurement method** | [How, by whom, how often] |
| **Feedback loop** | [What happens if signal is not met — who decides, what are the options] |

<!-- Add further Tier 1 metrics as needed -->

---

## Tier 2: Meta Metrics (Learning / Validation)

<!--
  Use this section when the initiative also tests a hypothesis about process, 
  tooling, or team capability. Common in early-stage agentic tooling rollouts.
-->

### Meta Metric 1: [Name]

| Field | Value |
|-------|-------|
| **Hypothesis** | [What we believe is true that this will validate] |
| **What we measure** | [Observable signal] |
| **Baseline** | [Current state] |
| **Target** | [What "validated" looks like] |
| **Minimum signal** | [What "not invalidated" looks like] |
| **Measurement method** | [How, by whom] |

---

## Metric Coverage Matrix

<!--
  Populated by the /definition skill after stories are created.
  Every metric must have at least one story. Every story must reference at least one metric.
  Gaps here are pipeline failures — surface them before coding begins.
-->

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| [Metric 1] | [Story links] | [Covered / Gap] |
| [Meta Metric 1] | [Story links] | [Covered / Gap] |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
