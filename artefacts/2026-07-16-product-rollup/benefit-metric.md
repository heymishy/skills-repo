## Benefit Metric: Product Rollup & Aggregation Layer

**Discovery reference:** artefacts/2026-07-16-product-rollup/discovery.md
**Date defined:** 2026-07-17
**Metric owner:** Hamish King — Founder/Operator
**Reviewers:** Hamish King — Founder/Operator

*Solo-operator context — no separate non-engineering reviewer is available yet; Hamish King serves as both owner and reviewer, per this repo's W4 solo-operator posture (`.github/architecture-guardrails.md`).*

**Product context read:** no `product/roadmap.md` "beta" milestone entry names this feature directly, but the discovery's own Why Now section ties it to the imminent beta launch and to the operator's dogfooding intent — consistent with `product/mission.md`'s framing of the platform as something the operator runs on its own delivery work before offering it to tenants.

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

Discovery's Why Now names two drivers: the beta launch (a product-value need) and dogfooding the platform on its own development (a validation need — proving the rollup mechanism works against real, large-scale data before any tenant relies on it). These are separable outcomes: the rollup could technically render correctly while still failing to prove itself as a workable pattern for a much smaller or differently-shaped tenant product. Tier 1 tracks the product value; Tier 2 tracks what dogfooding actually validates.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Product shape visible in the web UI

| Field | Value |
|-------|-------|
| **What we measure** | Whether `/products/:id` renders a rollup view — discovery scope, feature/epic taxonomy grouping, aggregate test coverage, aggregate DoD status — for a product, in place of today's bare feature list and count. |
| **Baseline** | 0% — `/products/:id` (`_renderProductView` in `src/web-ui/routes/products.js`) shows a feature list and `featureCount` only; no aggregate rollup exists today. |
| **Target** | 100% of a product's rollup fields (discovery scope, taxonomy, test coverage, DoD status) render correctly for skills-framework's own dogfooded product row, verified against a real `/product-sync` run. |
| **Minimum validation signal** | The rollup view renders for skills-framework's own product with at least the aggregate test-coverage and DoD-status fields correct — taxonomy grouping may follow in a fast-follow if it proves harder to get right first. |
| **Measurement method** | Manual verification: run `/product-sync`, load `/products/:id`, compare rendered values against a hand-computed aggregate from `pipeline-state.json`. Measured by Hamish King at DoD time. |
| **Feedback loop** | If rendered values don't match a hand-computed aggregate, treat as signal-not-met — do not ship with a rollup that's visibly present but numerically wrong; that's worse than no rollup. |

### Metric 2: Staleness is visible, never silent

| Field | Value |
|-------|-------|
| **What we measure** | Whether a referenced feature's state change after the last `/product-sync` run is detected and surfaced as a visible flag in the `/products/:id` rollup view. |
| **Baseline** | 0% — no rollup and no staleness mechanism exist today. |
| **Target** | 100% of post-sync feature-state changes are detected and flagged on the next render of the rollup view. |
| **Minimum validation signal** | A single scripted test: advance a feature's `pipeline-state.json` entry after a `/product-sync` run, confirm the rollup view flags itself stale on next render. |
| **Measurement method** | Automated test in CI, asserting the staleness flag's presence/absence against a controlled before/after state change. Measured continuously by CI; reviewed by Hamish King at DoD. |
| **Feedback loop** | Any CI failure of this test blocks merge — a rollup that can silently go stale defeats its own purpose as a trustworthy artefact. |

---

## Tier 2: Meta Metrics (Learning / Validation)

### Meta Metric 1: Dogfooding validates the rollup mechanism before any tenant depends on it

| Field | Value |
|-------|-------|
| **Hypothesis** | Building and proving `/product-sync` against skills-framework's own product row (a single, large, well-instrumented product) is sufficient validation before extending the mechanism to real beta tenants, most of whom will have much smaller and differently-shaped products. |
| **What we measure** | Whether the rollup view's core computations (aggregate test coverage, DoD status counts) hold up unmodified when run against a materially smaller synthetic or early-tenant product, not just skills-framework's own 49+-feature dataset. |
| **Baseline** | Untested — no non-skills-framework product exists to compare against yet. |
| **Target** | The same `/product-sync` logic, unmodified, produces correct rollup output for at least one product with under 10 features, proving the mechanism doesn't implicitly assume skills-framework's own scale or feature-schema quirks. |
| **Minimum signal** | Manual verification against one small synthetic product fixture, even before a real second tenant exists. |
| **Measurement method** | Manual test run against a fixture product with a handful of features, compared before beta launch. Measured by Hamish King. |

---

## Tier 3: Compliance and Risk-Reduction Metrics

Not applicable. `context.yml` sets `meta.regulated: false`, and this feature doesn't exist to resolve a named audit finding or regulatory obligation.

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1 — Product shape visible in web UI | To be populated at /definition | Pending |
| Metric 2 — Staleness visible, never silent | To be populated at /definition | Pending |
| Meta Metric 1 — Dogfooding validates the mechanism | To be populated at /definition | Pending |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
