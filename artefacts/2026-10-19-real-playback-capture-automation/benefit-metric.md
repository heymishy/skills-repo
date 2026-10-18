## Benefit Metric: Real Playback Capture Automation

**Discovery reference:** artefacts/2026-10-19-real-playback-capture-automation/discovery.md
**Date defined:** 2026-10-19
**Metric owner:** Hamish King — Platform Owner
**Reviewers:** Hamish King — Platform Owner

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Real capture coverage on new DoD-complete features

| Field | Value |
|-------|-------|
| **What we measure** | % of DoD-complete features (shipped after this story's own merge) whose own `/playback/:slug` page shows non-zero real captured evidence (`computeAcCoverageSummary`'s own count), produced by the capture CLI — not a manual Chrome session |
| **Baseline** | 0% — the automated mechanism does not exist yet; every real screenshot in this repo's history was produced manually |
| **Target** | ≥50% of new DoD-complete features reach non-zero real capture coverage via the CLI alone, within 30 days of this story's own merge |
| **Minimum validation signal** | Any single DoD-complete feature reaching non-zero coverage via the CLI (not manual Chrome) — proves the mechanism works end to end at all, even once |
| **Measurement method** | Platform Owner checks each new DoD-complete feature's own `/playback/:slug` coverage summary, and confirms via git/CI logs that the evidence was produced by a CLI run, not a manual browser session, at each feature's own DoD checkpoint |
| **Feedback loop** | If 0 instances occur in 30 days, the Platform Owner reviews why directly (CLI not being used? E2E-spec coverage too thin to find selectors? Staging data not realistic?) before concluding the mechanism has failed |

### Metric 2: Manual capture time per feature

| Field | Value |
|-------|-------|
| **What we measure** | Human active time spent manually driving a browser to produce playback evidence, per feature |
| **Baseline** | Multi-hour (confirmed directly this session capturing `journey-cx-redesign`'s own evidence — a full working session, not precisely timed) |
| **Target** | ≤5 minutes of human time per feature (triggering the CLI and reviewing its output) for any feature whose ACs have existing E2E spec coverage |
| **Minimum validation signal** | Any single feature's playback evidence produced with zero manual Chrome-driving time (CLI-only), even if some ACs still needed the manual fallback |
| **Measurement method** | Session/time comparison for the next feature needing playback evidence, same self-reported timing convention `feature-playback-demo`'s own M3 already uses |
| **Feedback loop** | If the CLI consistently still requires substantial manual time, the Platform Owner reviews whether the E2E-spec-selector-derivation approach (MVP's primary mechanism) is actually covering enough ACs in practice |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1 — Real capture coverage on new DoD-complete features | `rpca-s1` (proves the mechanism), `rpca-s2` (generalises it to every AC), `rpca-s3` (adds video) | Covered |
| M2 — Manual capture time per feature | `rpca-s1`, `rpca-s2`, `rpca-s3` (same mechanism — replacing manual Chrome-driving is what moves this metric) | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is /definition and the implementation plan
- Sprint targets or velocity — these metrics are outcome-based, not output-based
