# Benefit Metric: Multi-Tenant Repo Resolution for SaaS Export + Repo-Connection UX

**Discovery reference:** artefacts/2026-08-06-multi-tenant-repo-resolution/discovery.md
**Date defined:** 2026-08-06
**Metric owner:** Hamish King — Platform maintainer / Product owner
**Reviewers:** Hamish King (self-reviewed; no separate reviewer available at this scale)

---

## Roadmap alignment

**Product context read:**
Mission success outcome: "Trust the governance output" and the platform's own existing multi-tenancy commitment (`ADR-025`) — this closes a real gap in that same commitment inside a brand-new feature.
Roadmap alignment: Sits inside the "Commercialisation track — wuce SaaS beta path" (`product/roadmap.md`), specifically the cross-tenant data-boundary integrity theme already flagged there once before ("Cross-tenant prompt-cache leak mitigation is incomplete, not just deferred" — `wuce-multi-tenancy` Decision 8). This is the same class of finding: a real, unclosed cross-tenant boundary gap discovered before beta traffic exists, not a nice-to-have.

Confirmed aligned with an existing Horizon 1 priority (beta readiness / tenant isolation), not a net-new strategic bet.

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No — this is a data-isolation bug fix plus a UX improvement to existing functionality, not a test of an internal tooling/process hypothesis. Tier 1 product metrics only.

**Tier 3 (compliance/risk-reduction):** Arguably applicable given the security/data-isolation framing — see Metric 1 below, which is written in risk-reduction terms even though this artefact keeps it as Tier 1 for simplicity (single small feature, no named external compliance framework or regulatory clause in scope).

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Cross-tenant data isolation for the export feature

| Field | Value |
|-------|-------|
| **What we measure** | Whether a request for one tenant's feature slug can ever return another tenant's artefact/pipeline-state content |
| **Baseline** | Real risk today — a slug collision across repos can return another tenant's data; no test currently guards against this |
| **Target** | Zero cross-tenant leaks, permanently enforced by a dedicated isolation test matching this platform's existing `wuce-multi-tenancy` "Cross-tenant isolation spec — 20x repeat, zero-tolerance" CI pattern |
| **Minimum validation signal** | The isolation test exists and passes at least once, even before the 20x-repeat hardening is added — proves the fix works, even if repeat-count hardening lags |
| **Measurement method** | CI check on every PR touching the export endpoint; reviewed by the platform maintainer at each PR |
| **Feedback loop** | If the isolation test ever fails post-merge, this is a P0 — a real customer's data may have been exposed; halt and investigate immediately, do not treat as a normal regression |

### Metric 2: Number of distinct products that can successfully use `--from-saas`

| Field | Value |
|-------|-------|
| **What we measure** | Count of distinct products (each with its own connected repo) that can independently and correctly resolve and export their own artefact content |
| **Baseline** | 1 — only whichever repo happens to be hardcoded in `GITHUB_REPO` |
| **Target** | Every product with a connected repo works correctly, regardless of count |
| **Minimum validation signal** | At least 2 distinct products' repos resolve correctly and independently in a single test run |
| **Measurement method** | Automated test asserting 2+ distinct product/repo pairs resolve to their own, individually-correct content — not a shared/cached response |
| **Feedback loop** | If only 1 product can be proven to work, the fix isn't done — do not merge until the 2-product minimum signal passes |

### Metric 3: Repo-connection setup experience

| Field | Value |
|-------|-------|
| **What we measure** | Whether an operator can connect a product to a repo without needing to already know or look up its URL |
| **Baseline** | `[UNKNOWN BASELINE]` — no current measurement exists; qualitative baseline is "bare URL-entry form, no guidance" |
| **Target** | Operator picks from a list of their own accessible repos (resolved via their GitHub credential) rather than pasting a URL |
| **Minimum validation signal** | The picker flow works for at least one real GitHub account with multiple repos, correctly listing and letting the operator select one |
| **Measurement method** | Manual UX walkthrough confirming the flow is completable without external documentation |
| **Feedback loop** | If the repo-listing approach hits GitHub API rate-limit or scope issues in practice, fall back to the existing URL-entry field as a secondary option rather than blocking the whole story on solving that separately |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1 — Cross-tenant data isolation | mtrr-s1 | Covered |
| Metric 2 — Distinct products supported | mtrr-s1 | Covered |
| Metric 3 — Repo-connection setup experience | mtrr-s2 | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach (exact product→repo lookup query shape, UI component choice) — that is `/definition`
- Sprint targets or velocity — these metrics are outcome-based, not output-based
