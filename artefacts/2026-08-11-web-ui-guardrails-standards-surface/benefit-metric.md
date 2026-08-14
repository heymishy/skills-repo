## Benefit Metric: Web UI Guardrails & Standards Surface

**Discovery reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/discovery.md
**Date defined:** 2026-08-11
**Metric owner:** Hamish King — Platform owner
**Reviewers:** None — solo-operator context at this stage; same limitation noted in discovery.md's Attribution section. Revisit before DoR if a second reviewer becomes available.

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This is a standard product-value initiative — the discovery's "Why Now" section cites real, already-observed prospect interest and an internally-surfaced gap (from `smug-s1` shipping), not a hypothesis being tested about tooling, process, or team capability. No meta-metrics defined.

**Roadmap alignment:** This feature sits within the Commercialisation track — wuce SaaS beta path (`product/roadmap.md`), which is explicitly pre-launch and actively soliciting what will make wuce credible to real paying teams. It is not a named roadmap deliverable today, but it directly serves that track's stated outcome ("wuce operates safely as a real product... with... deterministic coverage of the flows that would cost the business its first customers' trust") — guardrails/standards visibility was named in discovery as a capability prospects are already asking about.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Guardrail/standard visibility in the web UI

| Field | Value |
|-------|-------|
| **What we measure** | Whether a tech lead/CoP expert can, from a single web-UI view, see every guardrail/standard that applies to their product (org-level + product-level, from the real connected repo files), not a proxy like "page exists" |
| **Baseline** | 0% — no such view exists in the web UI today; the visibility gap is total (per discovery's Problem Statement) |
| **Target** | 100% of active products with a connected repo render a populated, correctly-delineated org/product guardrails-and-standards view; products without a connected repo render org-level entries with a working "connect a repo" prompt (not a broken/empty page) |
| **Minimum validation signal** | At least one real product (connected or not) renders a correct, non-empty view within the first observation window — proves the mechanism works end-to-end before full-fleet rollout is assessed |
| **Measurement method** | Metric owner spot-checks a sample of active products weekly during beta; supplemented by an automated smoke test asserting the view renders real repo-sourced data (not empty/error) for at least one connected and one unconnected product |
| **Feedback loop** | If the view fails to populate correctly for connected-repo products within 2 weeks of release (GitHub API errors, empty renders, wrong org/product delineation), the metric owner reassesses the live-read architecture decision (`decisions.md` ARCH entry #4 — no caching layer) toward a caching approach, per that decision's own logged revisit trigger |

### Metric 2: Product-to-org promotion-approval workflow usage

| Field | Value |
|-------|-------|
| **What we measure** | Real usage of the new promotion-approval workflow — a promotion request submitted, and resolved (approved or rejected) by a tech lead/CoP expert — not just that the button exists |
| **Baseline** | 0 — the workflow does not exist yet; there is no current usage to compare against |
| **Target** | At least 1 real promotion request submitted and resolved (approved or rejected) within the first 4 weeks post-release |
| **Minimum validation signal** | At least 1 promotion request is submitted (even if not yet resolved) — proves the workflow is discoverable and usable, a lower bar than a full approve/reject cycle |
| **Measurement method** | Audit-logged PostHog events (`guardrail_promotion_requested`, `guardrail_promotion_approved` / `guardrail_promotion_rejected`, matching this platform's existing state-changing-action capture convention), reviewed by the metric owner weekly |
| **Feedback loop** | If zero promotion requests occur within 4 weeks, the metric owner investigates whether the workflow is undiscoverable (a UX/placement issue — first thing to check) or whether the underlying need is less pressing in practice than discovery assumed (a scope/priority question) — this determines whether to invest in improving discoverability or deprioritise further work on the promotion feature specifically |

---

## Metric Coverage Matrix

<!-- Populated by /definition after stories are created. -->

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Guardrail/standard visibility in the web UI | `wugs-s1`, `wugs-s2`, `wugs-s3`, `wugs-s4` (primary), `wugs-s5`, `wugs-s6`, `wugs-s7` (indirect — enables content to exist), `wugs-s11`, `wugs-s12` (indirect — removes the competing old view) | Covered |
| Product-to-org promotion-approval workflow usage | `wugs-s8`, `wugs-s9`, `wugs-s10` (primary) | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts, defined at `/definition`
- Implementation approach — the four architecture decisions this feature is built on are already logged in `decisions.md`; further implementation detail is `/definition`'s job
- Sprint targets or velocity — these metrics are outcome-based (adoption/usage), not output-based (features shipped)
