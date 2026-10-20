## Benefit Metric: Production Playback Capture

**Discovery reference:** `artefacts/2026-10-20-production-playback-capture/discovery.md` (Approved, 2026-10-21)
**Date defined:** 2026-10-21
**Metric owner:** Hamish King — Platform Owner
**Reviewers:** Hamish King — Platform Owner

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This is real production-capability delivery (closing the production-auth gap in an already-proven capture mechanism), not a tooling pilot or process experiment — standard product metrics only. No named compliance/regulatory obligation applies (Tier 3 not used): the production-auth design choices (no new bypass route, dedicated synthetic tenant, CI-secrets-only credential) are architectural risk mitigations already decided in discovery, not obligations tracked against an external framework.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Production capture coverage

| Field | Value |
|-------|-------|
| **What we measure** | Whether at least one real, DoD-complete feature has screenshot evidence captured directly against production (`wuce.fly.dev`), not staging, via this mechanism |
| **Baseline** | 0 of ~270 DoD-complete features in this repo have any production-sourced evidence today — it is currently impossible, not just slow (confirmed in discovery) |
| **Target** | ≥1 real DoD-complete feature has production-sourced screenshot evidence within 4 weeks of this MVP shipping |
| **Minimum validation signal** | The mechanism successfully authenticates and captures one real screenshot against production end-to-end at least once, independent of whether it's yet tied to a specific feature's own DoD cycle |
| **Measurement method** | A `source: production` marker on the playback package's own `package-status.json`, distinguishing it from staging-sourced evidence; checked by scanning package-status files across features |
| **Feedback loop** | If zero features use it within 4 weeks despite the mechanism working (minimum signal met), the gap is process, not technical — mirrors the exact problem `rpca-s5`'s own automatic-DoD-trigger fix solved for staging. Platform owner decides whether an equivalent automatic trigger is needed for production too, or whether manual invocation is acceptable at current volume |

### Metric 2: Capture time (once built)

| Field | Value |
|-------|-------|
| **What we measure** | Wall-clock time for the CLI to authenticate against production and capture one screenshot, unattended |
| **Baseline** | N/A — currently impossible, no mechanism exists |
| **Target** | Comparable to the staging mechanism's own proven ~5-6 second unattended run time (per `rpca-s1`'s own real verification) |
| **Minimum validation signal** | Completes in under 30 seconds unattended — generous versus target, but proves the "no manual Chrome session" claim holds even before optimisation |
| **Measurement method** | Session/CI job timing, same method as the staging epic's own indicator |
| **Feedback loop** | If meaningfully slower than staging (e.g. the real login flow is slower than the staging secret-bypass route), platform owner decides whether this is an acceptable tradeoff (production safety over speed) or worth further investigation |

---

## Tier 2: Meta Metrics (Learning / Validation)

Not applicable — no meta-benefit flagged for this initiative.

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1 — Production capture coverage | *(populated at /definition)* | Gap — pending story decomposition |
| Metric 2 — Capture time | *(populated at /definition)* | Gap — pending story decomposition |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
