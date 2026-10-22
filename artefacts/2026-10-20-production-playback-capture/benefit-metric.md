# Benefit Metric: Production Playback Capture

> **Correction note (2026-10-21):** This version replaces a prior `benefit-metric.md` built around the wrong mechanism (internal operator CLI tool). It is produced against the restarted, corrected `discovery.md` (self-service, in-product, multi-tenant capability) — see that artefact's own correction note and `decisions.md`'s 2026-10-21 CORRECTION entry.

**Discovery reference:** `artefacts/2026-10-20-production-playback-capture/discovery.md` (Status: Approved, 2026-10-21)
**Date defined:** 2026-10-21
**Metric owner:** Hamish King — Platform Owner
**Reviewers:** None separate — solo feature; owner and approver are the same person, as in `discovery.md`.

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This is a standard product capability for real tenants validating their own delivered features — not a pilot testing a tooling, process, or team-capability hypothesis for this platform team itself. No Tier 2 meta metrics are defined.

**Roadmap alignment note:** This fits the "Commercialisation track — wuce SaaS beta path" in `product/roadmap.md` (tenant trust/isolation work ahead of real customer reliance on the product). That same roadmap section states wuce has **no live paying customers yet** (pre-launch beta). This directly constrains Metric 1 below: until real beta tenants exist, the only measurable "tenant" is the operator's own dogfood usage — flagged explicitly in that metric's baseline/signal rather than glossed over.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Self-service DoD validation adoption

| Field | Value |
|-------|-------|
| **What we measure** | The count/percentage of a tenant's own DoD-complete features for which that tenant's Product Owner triggers and views self-service screenshot capture, without engineer involvement. |
| **Baseline** | 0% — the capability does not exist yet. `fpd-s5`'s real-world run found only 1 of ~50 ACs across a real feature had any captured evidence at all, meaning validation today mostly doesn't happen, not just happens slowly. |
| **Target** | ≥50% of a pilot tenant's own DoD-complete features captured self-service within 6 weeks of the MVP going live, for at least one real tenant. |
| **Minimum validation signal** | At least one real tenant (the operator's own dogfood tenant if no beta customer exists yet — see roadmap alignment note above) triggers self-service capture at least once within 2 weeks of launch. |
| **Measurement method** | PostHog event on the capture-trigger action, scoped by `tenant_id`/`product_id`. Reviewed weekly by the Platform Owner during the pilot window. |
| **Feedback loop** | If the minimum signal isn't hit within 2 weeks, the Platform Owner investigates whether the blocker is discoverability (UI placement), trust (tenants not confident in the captured evidence), or simply low DoD-completion volume in the only available tenant(s) — and decides whether to extend the measurement window, instrument a simpler proxy, or treat it as an invalidated hypothesis pending real beta traffic. |

### Metric 2: Time to DoD sign-off

| Field | Value |
|-------|-------|
| **What we measure** | Wall-clock time from a feature being marked DoD-complete to its tenant Product Owner viewing captured evidence and recording a sign-off decision, for features that use self-service capture. |
| **Baseline** | Not yet established — no self-service mechanism existed before this feature, and manual evidence collation was rarely performed in practice (per the `fpd-s5` finding), so there is no reliable "today" number to compare against. Will measure actual times during the first 4 weeks post-launch. |
| **Target** | Median time under 10 minutes, single sitting — consistent with the synchronous trigger design confirmed in `discovery.md`. |
| **Minimum validation signal** | At least one real captured-and-signed-off cycle completes in under 30 minutes end-to-end — proves the self-service loop works at all, even before it's tuned to target speed. |
| **Measurement method** | Timestamp delta between the DoD-complete marking event and the first self-service capture-view event, both logged via PostHog. Reviewed weekly by the Platform Owner during the pilot window. |
| **Feedback loop** | If the minimum signal isn't hit, check whether the bottleneck is capture duration itself (the `discovery.md` MVP Scope's own flagged risk — synchronous capture pushing past ~30-60s) versus PO responsiveness/scheduling (outside this feature's control) before concluding the mechanism failed. |

### Metric 3: Engineer manual-demo load removed

| Field | Value |
|-------|-------|
| **What we measure** | Engineer-hours spent manually demoing or collating evidence, per feature, for features that go through the self-service capture path. |
| **Baseline** | Not yet established — manual collation effort was never consistently tracked historically (per `fpd-s5`, it rarely even happened), so there's no instrumented baseline to pull from. Will estimate via a short qualitative check-in with engineers during the first 4 weeks. |
| **Target** | Zero engineer-hours per feature once self-service capture is adopted for that feature. |
| **Minimum validation signal** | At least one feature's DoD sign-off completes with zero engineer involvement in evidence collection — the engineer was never asked to demo it. |
| **Measurement method** | No proxy metric is currently instrumented for this (flagged as a measurement gap in `discovery.md`). The Platform Owner asks engineers directly during the weekly pilot-window review — a qualitative, operator-reported signal, not an automated one. |
| **Feedback loop** | If engineers report they're still being asked to demo features that went through self-service capture, the gap is either trust in the captured evidence or a UX/discoverability problem for the PO — surface at the weekly review and route to a follow-up story rather than letting it sit unflagged. |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1 — Self-service DoD validation adoption | `ppc-s1` (makes it possible at all), `ppc-s2` (makes it meaningful at feature scale), `ppc-s3` (protects sustained adoption from accidental load) | Covered |
| Metric 2 — Time to DoD sign-off | `ppc-s2` (the full-feature, single-sitting capture loop) | Covered |
| Metric 3 — Engineer manual-demo load removed | `ppc-s1`, `ppc-s2` (the capability's existence structurally removes the need for an engineer to demo; measured qualitatively per this artefact's own Metric 3 definition) | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is `/definition`
- Sprint targets or velocity — these metrics are outcome-based, not output-based
