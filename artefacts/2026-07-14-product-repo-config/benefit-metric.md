## Benefit Metric: Per-Product Git Repo Configuration and Management

**Discovery reference:** artefacts/2026-07-14-product-repo-config/discovery.md
**Date defined:** 2026-07-14
**Metric owner:** Hamish King — Founder/Operator
**Reviewers:** Hamish King — Founder/Operator

*Solo-operator context — no separate non-engineering reviewer is available yet; Hamish King serves as both owner and reviewer. Revisit when a second real team member exists to provide independent review, per the skill's own preference for a distinct non-engineering reviewer on Tier 1 metrics.*

**Product context read:** `product/roadmap.md`'s "Commercialisation track" section lists 4 named blockers to first beta (tir-s9 merge, bri-s3.3, live infra provisioning, bri-s1.4's wiring gap) — this feature is not one of them. It's a platform-capability investment adjacent to the beta path, not gating it: justified by the operator's own dogfooding need (discovery's Why Now), not by a beta-blocking requirement. Framed honestly as such below rather than overstated as beta-critical.

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

The discovery artefact's own Risks section flags this directly: "two people pairing across web UI and IDE" is a hypothesis about what a future team customer wants, not yet validated by real usage. This is a genuine meta-benefit situation — the feature delivers a technical capability (Tier 1) while simultaneously testing whether that capability is actually used and valued (Tier 2). Product metrics could all be hit (repos configured, artefacts git-tracked) while the meta-hypothesis (pairing is genuinely better than the current workflow) goes unvalidated — that gap must stay visible, not get silently folded into "shipped successfully."

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Time from idea to DoR-ready, git-committed artefact

| Field | Value |
|-------|-------|
| **What we measure** | Wall-clock time from starting a `/discovery` session in `wuce`'s web UI to a story reaching DoR-signed-off status, with every intervening artefact (discovery.md, benefit-metric.md, stories, test-plans, DoR) present as real commits in the product's own GitHub repo — no manual export/import step anywhere in the chain. |
| **Baseline** | Not yet established — currently impossible (0 completed end-to-end runs via `wuce`'s web UI; today this entire pipeline runs via Claude Code directly against a local checkout, as this very session did). Will measure on the first real dogfood run once this feature ships. |
| **Target** | A full discovery→DoR run completable in a single working session (same order of magnitude as this session's own multi-hour runs via Claude Code), with zero manual copy/paste of artefact content between systems. |
| **Minimum validation signal** | At least one full discovery→DoR run completes end-to-end via the web UI alone, producing real commits in the product's repo, without the operator manually moving content anywhere. |
| **Measurement method** | Manual timestamp comparison (session start → DoR sign-off) on the first 3 real dogfood runs, corroborated by git log timestamps in the product repo. Measured by Hamish King, ad hoc for the first few runs. |
| **Feedback loop** | If the first attempted end-to-end run fails to complete without manual intervention, treat as signal-not-met — return to `/definition` to identify the specific blocking gap before attempting again, rather than declaring partial success. |

### Metric 2: Products with a configured repo

| Field | Value |
|-------|-------|
| **What we measure** | Percentage of products created *after this feature ships* that have a non-null repo association (`repo_owner`/`repo_name`) at the time their first outer-loop skill run is attempted. |
| **Baseline** | 0% — no product has any repo association today; the columns don't exist yet. |
| **Target** | 100% — the product creation flow should make it structurally impossible to start an outer-loop run without a configured repo. |
| **Minimum validation signal** | 100% for new products created via the updated flow. (Existing products are explicitly out of scope per discovery, so they don't count against this metric.) |
| **Measurement method** | `SELECT COUNT(*) FROM products WHERE created_at > [ship date] AND repo_owner IS NULL` should return 0. Measured by Hamish King at DoD time, spot-checked periodically after. |
| **Feedback loop** | Any new product ending up without a repo is a gap in enforcement, not just the happy path — file a fix-forward story immediately rather than treating it as a known edge case. |

### Metric 3: Cross-tenant repo isolation

| Field | Value |
|-------|-------|
| **What we measure** | Whether two different tenants' outer-loop runs can ever write to the same repo, or whether one tenant's write-back can ever target a repo it doesn't own. |
| **Baseline** | Not yet established — untested today since only the operator's own tenant is real. The *current* single-global-repo architecture would fail this test outright if run today (every tenant writes to the same repo) — itself the evidence for why this metric matters. |
| **Target** | 100% isolation, proven by an automated E2E test — tenant A's write attempts can never land in tenant B's configured repo, matching the existing `bri-s3.4` cross-tenant isolation spec pattern. |
| **Minimum validation signal** | The E2E isolation test exists and passes in CI at least once before this feature is considered DoD-complete. |
| **Measurement method** | Automated Playwright E2E spec, run in CI on every PR touching the repo-write path. Measured continuously by CI; reviewed by Hamish King at DoD. |
| **Feedback loop** | Any CI failure of this spec blocks merge — zero-tolerance, matching the existing gate already in place for `bri-s3.4`. |

---

## Tier 2: Meta Metrics (Learning / Validation)

### Meta Metric 1: Web-UI/IDE pairing is a real workflow improvement, not just a technical capability

| Field | Value |
|-------|-------|
| **Hypothesis** | Running outer-loop work in `wuce`'s web UI and inner-loop work in an IDE/coding agent against the same repo genuinely improves on today's all-Claude-Code workflow — not just "now technically possible," but actually used and preferred for at least some real sessions. |
| **What we measure** | Whether the operator (or a future real team member) voluntarily chooses to run outer-loop work via `wuce`'s web UI at least once, post-launch, rather than defaulting back to Claude Code for everything — as happened for this entire session despite `wuce` existing. |
| **Baseline** | 0% — today 100% of outer-loop work, including this very session, happens via Claude Code directly; `wuce`'s web UI has never been used for its own pipeline. |
| **Target** | At least 1 full outer-loop session per week run via `wuce`'s web UI, sustained for 4 consecutive weeks post-launch. |
| **Minimum signal** | At least 1 full outer-loop session completed via the web UI at all, within 2 weeks of shipping — proves the workflow is genuinely usable, even before it's habitual. |
| **Measurement method** | Manual observation/log by Hamish King in the near term — no dedicated telemetry event is in this feature's scope; a `product_outer_loop_started` PostHog event (reusing the existing `posthog-server.js` capture pattern already used in `products.js`) would be the natural follow-up if this metric needs to scale past manual tracking. |

---

## Tier 3: Compliance and Risk-Reduction Metrics

Not applicable. `context.yml` sets `meta.regulated: false`, no compliance framework is named in the discovery artefact, and this feature doesn't exist to resolve a named audit finding or regulatory obligation — it's a platform-capability feature, not a compliance-driven one.

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1 — Time from idea to DoR-ready artefact | *(populated at /definition)* | Gap |
| Metric 2 — Products with a configured repo | *(populated at /definition)* | Gap |
| Metric 3 — Cross-tenant repo isolation | *(populated at /definition)* | Gap |
| Meta Metric 1 — Pairing workflow validation | *(populated at /definition)* | Gap |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
