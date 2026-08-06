# Benefit Metric: Durable Artefact Storage for SaaS-Hosted Journeys

**Discovery reference:** artefacts/2026-08-06-durable-artefact-storage/discovery.md
**Date defined:** 2026-08-06
**Metric owner:** Hamish King — Platform maintainer / Product owner
**Reviewers:** Hamish King — Platform maintainer / Product owner

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This is a straightforward reliability fix, not a tooling/process learning pilot. Standard Tier 1 product metrics only.

**Roadmap alignment:** `product/roadmap.md`'s "Commercialisation track — wuce SaaS beta path" states the outcome as "wuce operates safely as a real product with paying, external teams... deterministic coverage of the flows that would cost the business its first customers' trust if broken." The roadmap's own "Flagged for reconsideration" list already tracks structurally similar pre-beta trust gaps (cross-tenant cache leak, CSRF, distributed rate limiting) — this feature's finding (an orphaned "Resume conversation" silently erodes a paying customer's trust that completed work is retrievable) belongs in that same pre-beta-readiness bucket.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Cross-redeploy artefact durability

| Field | Value |
|-------|-------|
| **What we measure** | Whether a completed stage's artefact remains fetchable and renders correctly via "Resume conversation" after the hosting container has redeployed at least once since that stage completed. |
| **Baseline** | 0% — confirmed directly against `wuce-staging` today (2026-08-06): no completed-stage artefact survives a redeploy (no durable write path exists pre-fix). |
| **Target** | 100% — every completed stage's artefact remains renderable via "Resume conversation" after any number of subsequent redeploys. |
| **Minimum validation signal** | At least 1 real completed stage's artefact confirmed to survive at least 1 real redeploy end-to-end via an automated test — proves the mechanism works before trusting it at 100%. |
| **Measurement method** | An E2E test (extending `dsh-s4`'s current blind spot, which only simulates in-memory session eviction, never a real redeploy) that completes a stage, triggers a real disk-wipe equivalent (Fly machine restart or redeploy), then asserts the artefact still renders. Runs in CI on every PR touching this write/read path; re-run manually before the first real beta customer onboards. |
| **Feedback loop** | If the minimum signal isn't hit after implementation, the git-commit-at-completion write is not actually durable — stop and re-diagnose before shipping further; do not relax the target. Owner: Hamish King. |

### Metric 2: Repo-connection-required coverage

| Field | Value |
|-------|-------|
| **What we measure** | Whether a newly created product is prevented from starting its first journey until a GitHub repo is connected (via `mtrr-s2`'s picker or the URL fallback). |
| **Baseline** | 0% — today, a brand-new product can start a journey immediately with zero repo connected. |
| **Target** | 100% of new products blocked from starting a first journey without a connected repo. |
| **Minimum validation signal** | The journey-creation API rejects at least one attempted journey-start for a repo-less new product with a clear, actionable error — proves the gate behaves correctly, not just that it exists. |
| **Measurement method** | A functional/integration test asserting the API's rejection behavior, plus one manual smoke test through the real product-creation UI flow before this is called done. |
| **Feedback loop** | If the gate can be bypassed (API accepts a journey-start for a repo-less new product), that's a scope regression — block release until fixed. Owner: Hamish King. |

### Metric 3: Orphaned-journey rate going forward (leading indicator)

| Field | Value |
|-------|-------|
| **What we measure** | Proportion of journeys whose stored `completedStages`/artefact-path metadata refers to a file that doesn't actually exist, checked periodically going forward. |
| **Baseline** | `[UNKNOWN BASELINE]` — nothing currently instruments this; will be established via the first health-check run. |
| **Target** | 0% for any journey created after this fix ships. |
| **Minimum validation signal** | The health-check script exists, runs at least once, and correctly identifies zero orphaned journeys among a sample of post-fix-created journeys. |
| **Measurement method** | A lightweight staging health-check script (nice-to-have per discovery, not MVP-blocking), run periodically or on-demand before a beta customer onboarding — informal cadence, not a hard CI gate. |
| **Feedback loop** | If the health check ever finds a non-zero orphan rate post-fix, that's a real regression signal — investigate before the next beta-readiness review, not deferred indefinitely. Owner: Hamish King. |

---

## Metric Coverage Matrix

<!-- Populated by /definition once story slugs are known. -->

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Cross-redeploy artefact durability | TBD at /definition | Pending |
| Repo-connection-required coverage | TBD at /definition | Pending |
| Orphaned-journey rate going forward | TBD at /definition | Pending |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is /definition
- Sprint targets or velocity — these metrics are outcome-based, not output-based
