# Benefit Metric: Customer Journey as First-Class Entity

**Feature slug:** 2026-10-05-customer-journey-as-first-class
**Date:** 2026-10-05
**Status:** Active

---

## Attribution

**Metric owner:** Hamish King — Platform Owner
**Reviewers:** Pending
**Approved By:** Pending

---

## Product context alignment

**Mission success outcomes read from product/mission.md:**
Outer loop practitioners can run the full outer loop unassisted; teams trust governance output; product managers and business analysts own benefit metric definition and outcome measurement.

**Roadmap alignment:**
Phase 5 active delivery — web UI workstreams. This feature adds a journey canvas layer that ties together existing benefit tracking, PostHog metrics, and DoD-captured signals across multiple features into a journey-level health view. Aligns with the practitioner-facing outer loop and the product intelligence theme (WS5).

---

## Directional indicators from discovery

- Journeys created per active product
- New features mapped to a journey stage before definition
- Metrics stored against journey stages

---

## Metrics

### Metric 1 — Journey adoption (Tier 1 product metric)

**What we are measuring:** Count of journey records created in the `customer_journeys` table, scoped to real active products (excluding test/fake products and the generic 'no product' product) within the operator's tenant.

**Baseline:** 0 — no journey entity exists today.

**Target:** ≥2 journeys created (1 per real active product) within 4 weeks of release.

**Minimum validation signal:** ≥1 journey created within 4 weeks of release. Below this threshold: investigate whether the journey canvas is discoverable in the product UI and whether the creation flow has friction preventing completion.

**Measurement approach:** Query the `customer_journeys` table filtered by `tenantId`, excluding known test/fake product IDs and the 'no product' record. Count distinct journey records with a `createdAt` date after the release date. Measured weekly by the metric owner.

**Metric owner:** Hamish King — Platform Owner

---

### Metric 2 — Feature-to-stage mapping adoption (Tier 1 product metric)

**What we are measuring:** Percentage of new features (created after release date) that have a journey-stage association (e.g. `journeyStageId` or equivalent field populated) at the point DoR is signed off (`dorStatus: signed-off`).

**Baseline:** 0% — no journey-stage mapping mechanism exists today.

**Target:** ≥50% of new features mapped to a journey stage at DoR sign-off within 8 weeks of release.

**Minimum validation signal:** ≥25% within 8 weeks. Below this threshold: investigate whether the mapping step is surfaced visibly in the DoR flow or is being skipped as a non-mandatory step.

**Measurement approach:** Query feature records with `dorStatus: signed-off` and `createdAt` after release date. Count those with a non-null `journeyStageId` (or equivalent). Divide by total features in that cohort. Measured at each DoR sign-off event and reviewed monthly by the metric owner.

**Metric owner:** Hamish King — Platform Owner

---

### Metric 3 — Journey-level metric coverage (Tier 1 product metric)

**What we are measuring:** Count of distinct journey stages across all journeys in the tenant that have at least one metric record attached via a `journeyStageId` foreign key.

**Baseline:** 0 — metrics are currently stored at the feature level only; no journey-stage metric association exists.

**Target:** ≥3 distinct journey stages have at least one metric attached within 8 weeks of release.

**Minimum validation signal:** ≥1 journey stage with a metric attached within 8 weeks. Below this threshold: investigate whether the metric-attachment flow has been implemented and is visible to practitioners at DoD time.

**Measurement approach:** Query metric records with a non-null `journeyStageId`. Count distinct stage IDs. Measured monthly by the metric owner.

**Metric owner:** Hamish King — Platform Owner

---

## Feedback loops

| Metric | Measured by | Frequency | Below minimum signal: action |
|--------|-------------|-----------|------------------------------|
| M1 — Journey adoption | Hamish King | Weekly (weeks 1–4 post-release) | Investigate discoverability and creation flow friction |
| M2 — Feature mapping adoption | Hamish King | At each DoR sign-off; monthly review | Investigate DoR flow visibility; consider making mapping a DoR hard block |
| M3 — Journey metric coverage | Hamish King | Monthly (months 1–2 post-release) | Investigate whether metric-attachment flow is implemented and surfaced at DoD |

---

## Baseline discipline note

All three baselines are 0 — this is a net-new capability. No historical measurement is required to establish the baseline. The baseline is structural (the capability does not exist today) rather than empirical.

---

## What these metrics do NOT cover

- Cross-org or multi-tenant journey sharing (out of scope per discovery)
- Automated journey generation from existing artefacts (out of scope)
- PostHog-derived journey stage inference (out of scope for MVP; metric 3 measures manual attachment only)
- Journey version history or change tracking (out of scope)

---

## Instrumentation metadata

<!-- eval-mode: false -->
<!-- experiment_id: EXP-010-fable5-model-sweep -->
<!-- model_label: claude-sonnet-4-6 -->
<!-- cost_tier: fast -->
<!-- skill_name: benefit-metric -->
<!-- artefact_path: artefacts/2026-10-05-customer-journey-as-first-class/benefit-metric.md -->
<!-- run_timestamp: 2026-10-05T00:00:00Z -->