# Benefit Metric: Rubber-Duck Review Capture

**Discovery reference:** artefacts/2026-08-09-rubber-duck-review-capture/discovery.md
**Date defined:** 2026-08-09
**Metric owner:** Hamish King — Founder/Operator
**Reviewers:** (none — solo-operator context; no separate non-engineering reviewer exists outside the metric owner)

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes — this initiative is both trying to deliver a direct quality/process outcome (catch real gaps earlier, before beta) **and** testing an explicit, unconfirmed hypothesis about whether the capture mechanism itself works (the discovery's 3 `[ASSUMPTION]` lines: signal-vs-noise from transcription/extraction, agent-driven detection reliability, and workflow adoptability). Per the skill's own detection criteria ("we want to learn if [a new tool/approach] works"), this is a textbook meta-benefit situation — product-equivalent value and tooling validation are both real goals here, and the latter could fail even if the former's target is technically hit by luck. Both tiers are defined separately below.

---

## Tier 1: Product Metrics (Outcome Value)

<!-- "Product" here means the delivery-quality outcome this tool exists to produce, not an external customer-facing feature -- the direct beneficiary named in discovery is the developer/operator (and, indirectly, the SaaS platform's real users via fewer shipped gaps). -->

### Metric 1: Where real gaps get first detected, by pipeline stage

| Field | Value |
|-------|-------|
| **What we measure** | For each confirmed real gap (recorded in a DoD artefact or a follow-up story), which stage first detected it — tagged as `rubber-duck-review` / `dod-sweep` / `production-incident` |
| **Baseline** | Not yet established. No structured tagging exists today. This same session's own 2 confirmed examples (`lphf-s1` AC3, `lphf-s4` AC1) were both `dod-sweep`-detected — 0 examples of `rubber-duck-review`-detection exist yet, since the tool doesn't exist |
| **Target** | At least 50% of newly-confirmed real gaps of this shape (spec-technically-satisfied but experientially wrong) are first detected via `rubber-duck-review`, within the first 90 days of the tool being available for use — not via `dod-sweep` or `production-incident` |
| **Minimum validation signal** | At least 1 real gap is caught via `rubber-duck-review` before it reaches DoD or production, within the first 90 days — proves the mechanism works at all, even short of the 50% target |
| **Measurement method** | Manual tagging in each DoD artefact/follow-up story (a `detectedVia` note in the DoD Observations section), reviewed monthly by Hamish King |
| **Feedback loop** | If the minimum signal isn't hit within 90 days (zero gaps caught via rubber-duck-review), the mechanism isn't producing useful signal at all — deprioritize further investment and continue relying on the existing DoD-sweep pattern instead. Decision owner: Hamish King |

---

## Tier 2: Meta Metrics (Learning / Validation)

### Meta Metric 1: Findings signal quality (not noise)

| Field | Value |
|-------|-------|
| **Hypothesis** | Speech-to-text transcription + LLM extraction reliably produces useful, actionable structured findings rather than noise |
| **What we measure** | Of all findings produced by either capture mode, the proportion a human operator confirms as "real and actionable" (vs. noise/false-positive) on review |
| **Baseline** | Not yet established — no findings have been produced yet |
| **Target** | ≥70% of produced findings confirmed real/actionable by the reviewing operator |
| **Minimum signal** | ≥40% confirmed real/actionable — below this, the noise ratio makes reviewing findings cost more than the value they add |
| **Measurement method** | Operator marks each finding "actionable" or "noise" at review time; tracked as a running ratio, reviewed after the first 20 findings produced by either mode |

### Meta Metric 2: Agent-driven mode's issue-finding reliability

| Field | Value |
|-------|-------|
| **Hypothesis** | The agent-driven Playwright/Chrome-tooling review run can reliably find real issues — not just miss them, or flag false ones |
| **What we measure** | Against a fixed validation set of past real gaps (reintroduced as test fixtures — e.g. `lphf-s1`'s undeleted-candidate bug, `lphf-s4`'s wrong-live-count bug), the proportion the agent-driven run correctly flags |
| **Baseline** | Not yet established — no agent-driven runs exist yet |
| **Target** | ≥80% detection rate on the seeded validation set |
| **Minimum signal** | ≥50% detection rate — below this, a "clean" result from the agent-driven mode can't be trusted, since it's missing half of known real issues |
| **Measurement method** | Build the small fixed validation set (reusing this session's own 2 confirmed gaps as seed fixtures, plus any others found later), run the agent-driven mode against it before/alongside real usage; reviewed by Hamish King once built |

### Meta Metric 3: Workflow adoption / clunkiness

| Field | Value |
|-------|-------|
| **Hypothesis** | The tooling and workflow (recording, transcription, agent-driven runs, findings review) stay simple enough to actually use — not so complex or clunky that the operator skips it |
| **What we measure** | Whether the operator actually invokes the review capture tooling on eligible stories (matching discovery's "suggest" criteria — hero/customer-facing features) once it exists, versus skipping it |
| **Baseline** | 0% — the tool doesn't exist yet, usage is undefined by definition |
| **Target** | Used on ≥80% of eligible hero/customer-facing stories within the first 90 days of availability |
| **Minimum signal** | Used at least once, voluntarily, without being reminded — proves the workflow isn't so clunky that even a motivated operator abandons it immediately |
| **Measurement method** | Track invocation count against eligible stories; reviewed at the same 90-day check-in as Tier 1 Metric 1 |

---

## Tier 3: Compliance and Risk-Reduction Metrics

Not applicable. Discovery's Constraints section names data-handling hygiene concerns (transient recording content, no long-term video storage) but no named regulatory framework or compliance obligation applies to this initiative — it's an internal delivery-quality tool, not a customer-data-processing feature subject to an external audit requirement.

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1 — Where gaps are first detected | rdrc-s2, rdrc-s4 | Covered |
| Meta Metric 1 — Findings signal quality | rdrc-s1 | Covered |
| Meta Metric 2 — Agent-driven detection reliability | rdrc-s3 | Covered |
| Meta Metric 3 — Workflow adoption | rdrc-s5 | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
