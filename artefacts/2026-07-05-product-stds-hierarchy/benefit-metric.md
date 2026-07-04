# Benefit Metric: Product Hierarchy, Standards and Patterns Library

**Discovery reference:** artefacts/2026-07-05-product-stds-hierarchy/discovery.md
**Date defined:** 2026-07-05
**Metric owner:** Hamish King — Platform operator / product owner
**Reviewers:** Hamish King — 2026-07-05

---

## Tier Classification

**META-BENEFIT FLAG:** No

This is a product feature delivery. Metrics measure whether operators can adopt product-structured workflows, whether product context flows automatically into skill sessions, and whether the standards library sees meaningful take-up. There is no hypothesis being validated about tooling or process approach — the patterns being extended (session context injection, event-driven analytics) are already proven in production.

**Roadmap alignment:** Phase 5 — web UI workstreams. This feature enables product-level delivery governance and is a prerequisite for multi-team scale adoption (Phase 5 WS6: human capability). It is also an ordering dependency for Feature 2 (organisation user management) and Feature 3 (repo wiring).

---

## Tier 1: Product Metrics (Operator Value)

### M1: Product setup completion rate

| Field | Value |
|-------|-------|
| **What we measure** | % of new accounts that complete product setup (create a product) and create at least one feature within it during their first active session. |
| **Baseline** | 0% — no product concept exists today. New accounts go directly to feature creation with no product grouping step. |
| **Target** | ≥70% of new accounts complete product setup and first feature-within-product in their first active session. |
| **Minimum validation signal** | ≥50% — below this threshold, stop and investigate the product creation flow UX (form complexity, AI draft quality, inline review step friction). |
| **Measurement method** | PostHog: `product_created` event followed by `journey_created` with `productId` set, within the same session, filtered to new accounts (first active session only). Measured weekly after launch by operator. |
| **Feedback loop** | If <50%: investigate creation flow dropoff — check where operators abandon (after form submission, during AI draft review, or at inline edit step). If ≥50% but <70%: review AI draft quality for the most common tech stacks. If ≥70%: no action required — monitor monthly. |

---

### M2: Product context injection rate

| Field | Value |
|-------|-------|
| **What we measure** | % of skill sessions initiated for a product-associated feature that include product context (mission.md, tech-stack.md, constraints.md, architecture-guardrails.md) in their system prompt. |
| **Baseline** | 0% — no product context injection exists today. Sessions receive only the global static `product/` directory content, not per-product files. |
| **Target** | 100% — every skill session for a feature associated with a product must receive that product's context. Any miss is a bug. |
| **Minimum validation signal** | ≥99% — one grace for a genuine edge case (e.g. product context files not yet generated at session start). |
| **Measurement method** | Automated CI test: assert that the system prompt for a product-associated feature session contains the product's tech-stack.md and constraints.md content. Checked on every deploy. Post-deploy manual check: start one skill session for a product-associated feature and inspect the system prompt in logs. |
| **Feedback loop** | Any failure below 100% is treated as a bug and investigated immediately. Check the system prompt assembly path in the skill session initialisation route — confirm `productId` is resolved, product context files are read from Postgres, and content is prepended to the system prompt before the SKILL.md content. |

---

### M3a: Kanban render correctness

| Field | Value |
|-------|-------|
| **What we measure** | Whether the org-level kanban correctly renders all features grouped by their product with their accurate current pipeline stage and health. Binary pass/fail per deploy. |
| **Baseline** | 0% — feature does not exist today. |
| **Target** | 100% — kanban must render correctly on every deploy. Any render failure is a bug. |
| **Minimum validation signal** | 100% — no partial pass. |
| **Measurement method** | Automated CI rendering test: assert that (1) all features for the org appear in the kanban, (2) each feature is grouped under its correct product, (3) pipeline stage label matches `pipeline-state.json` for each feature. Checked on every deploy. |
| **Feedback loop** | Render failures investigated immediately. Check the kanban data query — confirm it joins journeys → products correctly and that stage labels are resolved from the correct source. |

---

### M3b: Kanban weekly view rate

| Field | Value |
|-------|-------|
| **What we measure** | % of active tenants (at least 1 active feature) who view the org or product kanban at least once per week within 30 days of feature launch. |
| **Baseline** | Not yet established — the current kanban has no product grouping, making pre-launch usage data non-comparable. Establish baseline in first 2 weeks post-launch. |
| **Target** | ≥50% of active tenants view the kanban weekly within 30 days of launch. |
| **Minimum validation signal** | ≥25% — below this, investigate whether the kanban is discoverable (navigation placement, entry point visibility). |
| **Measurement method** | PostHog: `kanban_viewed` events grouped by `tenantId`, weekly aggregation. Divide by count of tenants with ≥1 active feature in the same period. Measured monthly by operator. |
| **Feedback loop** | If <25%: investigate navigation — is the kanban reachable from the main flow? If ≥25% but <50%: review kanban UX (is the product grouping clear? does the stage column labelling make sense to operators?). If ≥50%: no action, monitor quarterly. |

---

### M4a: Standards library adoption rate

| Field | Value |
|-------|-------|
| **What we measure** | % of team/enterprise plan tenants that define at least one standard or pattern in their standards library within 60 days of feature launch. |
| **Baseline** | 0% — no standards library exists today. |
| **Target** | **TBD — observe first.** Standards are a new and optional capability. Track PostHog events for 60 days post-launch, then set a data-informed target. Convert to an active metric at the first `/definition-of-done` review after the 60-day window. |
| **Minimum validation signal** | At least 1 `standard_created` event per week during the observation period. Zero events for 2 consecutive weeks after launch would indicate a discoverability problem. |
| **Measurement method** | PostHog: `standard_created` events, counted per `tenantId` over a 60-day window. Filter to team and enterprise plan tenants only. Operator reviews at 60-day mark and sets forward target. |
| **Feedback loop** | During observation: if zero events for 2 consecutive weeks, investigate discoverability of the standards library in the product dashboard. Post-60-days: if adoption is <10%, consider whether the creation flow is too high-friction. |

---

### M4b: Standards injection rate

| Field | Value |
|-------|-------|
| **What we measure** | % of skill sessions for features within a product that has ≥1 standard configured, where at least one standard is included in the session system prompt. |
| **Baseline** | 0% — no standards injection exists today. |
| **Target** | 100% — every session for a product with standards configured must inject those standards. Any miss is a bug. |
| **Minimum validation signal** | 100% — no partial pass. |
| **Measurement method** | Automated CI test: assert that a skill session started for a feature within a product with ≥1 standard configured includes the standard content in the system prompt. Checked on every deploy. |
| **Feedback loop** | Any failure is a bug. Check the standards retrieval path in session initialisation — confirm `productId` → standards lookup → system prompt assembly chain. |

---

## Metric Coverage Matrix

| Metric | Stories that will move it | Coverage status |
|--------|--------------------------|-----------------|
| M1: Product setup completion rate | psh-s3 (product creation flow — `product_created` event), psh-s4 (product-aware navigation — `journey_created` with `productId`) | Covered |
| M2: Product context injection rate | psh-s5 (product context injection into skill sessions) | Covered |
| M3a: Kanban render correctness | psh-s6 (per-product kanban), psh-s7 (org-level kanban) | Covered |
| M3b: Kanban weekly view rate | psh-s6 (product kanban `kanban_viewed` event), psh-s7 (org kanban `kanban_viewed` event) | Covered |
| M4a: Standards library adoption rate | psh-s8 (standards definition — `standard_created` event) | Covered |
| M4b: Standards injection rate | psh-s10 (standards injection into skill sessions) | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — stories and plans to be written at /definition
- Sprint targets or velocity — these metrics are outcome-based, not output-based
- Standards approval workflow, versioning, or org-level governance of standards content — deferred scope

---

## Attribution

| Field | Value |
|-------|-------|
| **Metric owner** | Hamish King — Platform operator / product owner |
| **Reviewers** | Hamish King — 2026-07-05 |
| **Status** | Active |
| **Note** | M4a target is TBD — to be set at first /definition-of-done review after 60 days of post-launch data. |
