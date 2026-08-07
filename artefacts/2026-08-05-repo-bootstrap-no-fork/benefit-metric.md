# Benefit Metric: No-Fork Repo Bootstrap for the Inner (and Optionally Outer) Loop

**Discovery reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/discovery.md
**Date defined:** 2026-08-05
**Metric owner:** Hamish King — Platform maintainer / Product owner
<!-- No separate non-engineering role exists in this operation today; owner is both platform maintainer and product decision-maker. Flagged rather than fabricated. -->
**Reviewers:** Hamish King (self-reviewed; no separate reviewer available at this scale)

---

## Roadmap alignment

**Product context read:**
Mission success outcomes: "Adopt in subset" and "Augment progressively" (a squad should be able to adopt the platform without forking/disrupting their pipeline) — directly supports this initiative.
Roadmap alignment: This is not a new idea — it lands squarely inside **Phase 5, WS0 (distribution completion)**, specifically the "non-git consumer distribution" item already named in `product/roadmap.md`, and is listed as part of the **Phase 5 MVP minimum set** (WS0.1–WS0.3, WS0.5, WS0.6). It also directly follows the roadmap's own "Commercialisation track — wuce SaaS beta path" status: the immediate blockers to first beta (`tir-s9`, `bri-s3.3`, live infra, `bri-s1.4`) are recorded as resolved/in-flight, meaning beta traffic is imminent — reinforcing the discovery's "why now."

This initiative is confirmed aligned with an existing Horizon 1 roadmap commitment, not a net-new strategic bet.

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No — this is a standard product/adoption initiative (reducing fork/clone friction for real consumers), not a test of an internal tooling or process hypothesis. Tier 1 product metrics only.

**Tier 3 (compliance/risk-reduction):** Not applicable — feature is unregulated (`context.yml meta.regulated: false`), no named compliance framework or risk-register obligation.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Bootstrap-to-first-inner-loop-run time

| Field | Value |
|-------|-------|
| **What we measure** | Wall-clock time from a user invoking the init command to their first successfully-completed `/branch-setup` run in the bootstrapped repo |
| **Baseline** | Not yet established — no bootstrap path exists today. Will measure current manual clone+setup time as a comparison baseline in the first 2 weeks after this metric becomes measurable (i.e. once the init command exists in any form, even pre-release) |
| **Target** | Under 10 minutes from command invocation to a running inner loop |
| **Minimum validation signal** | Under 30 minutes — still a clear win over the current fork/clone path, which has no fixed ceiling and commonly takes longer once repo size and unfamiliarity are factored in |
| **Measurement method** | Timestamp delta between init-command invocation and first `branch-setup` completion, logged to `workspace/state.json` or a dedicated bootstrap log; measured by the platform maintainer from self-reported/log data, reviewed monthly during beta |
| **Feedback loop** | If minimum signal is missed for 3+ consecutive real users, the platform maintainer reviews whether the bottleneck is the command itself or an external dependency (npm publish latency, SaaS API round-trip) and decides whether to simplify scope before continuing |

### Metric 2: SaaS-to-inner-loop conversion rate

| Field | Value |
|-------|-------|
| **What we measure** | Share of DoR-approved SaaS artefacts that get bootstrapped into a real, executing repo within 7 days of DoR sign-off |
| **Baseline** | 0% — today, no SaaS-only user can reach the inner loop without forking/cloning first, so conversion via this path is definitionally zero |
| **Target** | ≥ 30% of DoR-approved SaaS artefacts converted to a bootstrapped repo within 7 days, once beta traffic exists |
| **Minimum validation signal** | ≥ 10% — low enough to prove the path is used at all, distinguishing "path exists but under-discovered" from "path doesn't solve the real problem" |
| **Measurement method** | Cross-reference SaaS-side DoR-approval events (already tracked in `pipeline-state.json`/SaaS backend) against bootstrap-command invocations tagged with the same feature slug; measured by the platform maintainer, reviewed at each beta cohort milestone |
| **Feedback loop** | If minimum signal is missed after the first real beta cohort, re-open the discovery's Risk #2 (SaaS export path may not be practical) rather than assuming the command itself is the problem |

### Metric 3: Fork/clone avoidance rate among new adopters

| Field | Value |
|-------|-------|
| **What we measure** | Share of new adopters who use the init command as their first point of contact with the platform, versus forking or cloning the repository directly |
| **Baseline** | 100% — every current adopter today forks or clones to get started |
| **Target** | Majority (> 50%) of new adopters use the init command instead of fork/clone within 3 months of the command shipping |
| **Minimum validation signal** | ≥ 20% — a meaningful minority adopting the new path is enough to prove it's a real alternative, not just theoretically available |
| **Measurement method** | Compare GitHub fork/clone-then-first-commit event patterns against init-command telemetry. **Known measurement gap, flagged not fabricated:** init-command usage isn't trackable without either a phone-home ping (a privacy/telemetry decision explicitly out of scope for discovery) or self-reported signal. Until that decision is made, this metric will rely on self-reported signal only (e.g. a one-line optional prompt at the end of `init` asking "mind if we log an anonymous success ping?") |
| **Feedback loop** | If telemetry remains unresolved by the time this metric needs reporting, the platform maintainer decides whether to make the phone-home ping decision explicitly (a separate, small privacy-scoped story) rather than let this metric silently go unmeasured |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1 — Bootstrap-to-first-inner-loop-run time | rb-s1, rb-s2, rb-s4 | Covered |
| Metric 2 — SaaS-to-inner-loop conversion rate | rb-s4 | Covered |
| Metric 3 — Fork/clone avoidance rate | rb-s1, rb-s3, rb-s5 | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach (npm vs. other distribution mechanism) — that is `/definition`
- Sprint targets or velocity — these metrics are outcome-based, not output-based
