# Benefit Metric: Code Shape Diagrams (System Architecture, Program Design, Data Model)

**Discovery reference:** artefacts/2026-07-25-code-shape-diagrams/discovery.md
**Date defined:** 2026-07-25
**Metric owner:** Hamish King — Founder/Operator
**Reviewers:** Hamish King — Founder/Operator

<!-- Solo-operator posture: no separate non-engineering role exists for this repo today. Tier 1's own convention (non-engineering owner/reviewer) is not met — noted here rather than fabricating a role, matching this repo's established RISK-ACCEPT pattern for the same gap on other features. -->

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

This initiative both delivers operator value (faster drift/shape review) and tests a broader hypothesis, informed by external research (HumanLayer's "Why Software Factories Fail"): that visual structural artefacts (diagrams) reduce codebase drift and rework better than diff-only review does, for this pipeline specifically.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Time-to-drift-determination

| Field | Value |
|-------|-------|
| **What we measure** | Time for the operator to determine as-built vs as-designed match/diverged status for a feature, from the canvas view |
| **Baseline** | Not yet established — currently requires reading the diff; no measurement exists today |
| **Target** | Under 30 seconds |
| **Minimum validation signal** | Under 2 minutes — still meaningfully faster than diff review even if the stretch target isn't hit |
| **Measurement method** | Informal timing during the operator's own dogfood use of the first real feature run through this. Measured by: Hamish King. |
| **Feedback loop** | If the minimum signal isn't hit after 2–3 real features, the drift-signal presentation (not the underlying diagram mechanism) needs redesign before further investment — decided by Hamish King. |

### Metric 2: Diagram completion rate

| Field | Value |
|-------|-------|
| **What we measure** | % of features run through `/design`/`/definition` post-launch that have all three diagram types (System Architecture, Program Design, Data Model) actually populated, not left blank or skipped |
| **Baseline** | 0% — feature doesn't exist yet |
| **Target** | 100% of features run through this pipeline after launch |
| **Minimum validation signal** | 50% — some features may still skip if the mechanism isn't yet trusted |
| **Measurement method** | Presence check against `.github/pipeline-state.json` / artefact folder contents. Measured by: Hamish King, at `/improve` time. |
| **Feedback loop** | If completion rate stays below 50% after several features, investigate whether the diagram step is too costly to produce, too disruptive to the skill session, or not perceived as valuable — decided by Hamish King. |

### Metric 3: Diverged-flag true-positive rate

| Field | Value |
|-------|-------|
| **What we measure** | Of drift flags raised, the fraction the operator judges to represent a real structural problem worth acting on, not noise |
| **Baseline** | Not yet established — no drift mechanism exists today |
| **Target** | Over 70% judged real/worth-acting-on |
| **Minimum validation signal** | Over 40% — this is the direct test of the "too hard to visualise well" risk named in discovery; below this, the mechanism does not pay for itself |
| **Measurement method** | A simple yes/no tag logged against each flagged drift result. Measured by: Hamish King. |
| **Feedback loop** | Below the minimum signal, the drift-detection rules (Section 4, MVP scope, discovery.md) need retuning or the fully-automated-detection follow-up phase needs reprioritising sooner than planned — decided by Hamish King. |

---

## Tier 2: Meta Metrics (Learning / Validation)

### Meta Metric 1: Drift caught before it became a problem

| Field | Value |
|-------|-------|
| **Hypothesis** | Visual structural drift-checking (as-built vs as-designed) catches real problems earlier than diff-only review would, validating the core premise borrowed from HumanLayer's WSFF research for this pipeline specifically. |
| **What we measure** | Number of instances, across the first 5 features using this, where the drift check surfaces something that would otherwise have caused a bug or costly rework. |
| **Baseline** | Not yet established — not currently tracked as a distinct category; today this shows up only as a generic bug or rework item, with no link back to "drift went unnoticed." |
| **Target** | At least 1 real, attributable catch within the first 5 features using this. |
| **Minimum signal** | At least 1 catch — same as target; this is a low-frequency, high-value signal rather than one with a graduated minimum. Zero catches after 5 features is a genuine (not just soft) signal the hypothesis may not hold as stated. |
| **Measurement method** | Logged in `decisions.md` or `workspace/capture-log.md` at the moment it happens, tagged so it's queryable later. Measured by: Hamish King. |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| P1: Time-to-drift-determination | csd-s3, csd-s4, csd-s5, csd-s6 | Covered |
| P2: Diagram completion rate | csd-s1, csd-s2, csd-s3, csd-s5 | Covered |
| P3: Diverged-flag true-positive rate | csd-s4, csd-s6 | Covered |
| M1: Drift caught before it became a problem | csd-s4, csd-s5, csd-s6 | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
