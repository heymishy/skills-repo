## Benefit Metric: Journey CX/UX Redesign — Journey Map + Placeholder-Feature Trigger

**Discovery reference:** artefacts/2026-10-11-journey-cx-redesign/discovery.md
**Date defined:** 2026-10-11
**Metric owner:** Hamish King — Platform Owner
**Reviewers:** Hamish King — Platform Owner (single-operator repo; matches the `2026-10-10-infinite-canvas` feature's own established convention)

**Product context read:** `product/mission.md` — the outer loop practitioner (PO/SME/discovery lead) is a primary persona, matching this feature's own target user exactly. `product/roadmap.md` — this extends the same web-UI layer the `canvas-replacement-for-journey-stages` epic just shipped, consistent with current strategic priority.

**Meta-benefit check:** No. This is a straightforward product feature (CX/UX redesign + a new pipeline-trigger mechanism) — discovery.md shows no signal of also testing a tooling/process/capability hypothesis. Tier 2 (meta metrics) does not apply.

**Tier 3 (compliance/risk) check:** No. `context.yml` sets `meta.regulated: false`; discovery.md names no compliance framework or regulatory obligation. Tier 3 does not apply.

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Operator CX judgment vs. the reference bar

| Field | Value |
|-------|-------|
| **What we measure** | The operator's own direct, qualitative judgment on whether the redesigned Customer experience tab reads as a genuine journey map, matching or approaching the quality of the 3 reference examples (Spotify flow, supermarket shopping map, Hustle Badger template) — not a proxy like page views or time-on-tab |
| **Baseline** | Today, the operator judges the tab as not matching the reference bar — this is the explicit trigger for this entire initiative (operator's own direct feedback, 2026-10-11) |
| **Target** | Operator judges the redesigned tab as genuinely matching or approaching the reference examples' quality — same judgment-scale convention as the prior epic's own M2 ("Operator CX judgment vs. the list view it replaced") |
| **Minimum validation signal** | Operator judges it as a real improvement, moving in the right direction — even if not yet fully matching the reference bar |
| **Measurement method** | Direct operator review/demo once shipped. Single qualitative judgment call by Hamish King (Platform Owner) |
| **Feedback loop** | If even the minimum signal isn't met (operator doesn't see it as an improvement at all), pause further iteration and re-run `/spike` or revisit `/design` before continuing — don't keep building blindly against a judgment that already failed once |

### Metric 2: Placeholder-feature trigger actually used

| Field | Value |
|-------|-------|
| **What we measure** | Count of placeholder features created from a journey stage, and separately, the count that reach `/discovery` approval — the actual mechanism tying the journey map to the outer-loop pipeline, not just whether the button exists |
| **Baseline** | 0 — the mechanism does not exist yet |
| **Target** | ≥1 placeholder feature triggered from a journey stage and reaching `/discovery` approval, within 4 weeks of release |
| **Minimum validation signal** | ≥1 placeholder feature *created* (even if not yet reaching discovery approval) within the same window — proves the affordance itself is discoverable and used, independent of how far the resulting discovery gets taken |
| **Measurement method** | `pipeline-state.json` — count of feature entries carrying the "triggered-from-journey-stage" provenance marker (per `/clarify`'s confirmed mechanics). Checked weekly by the Platform Owner |
| **Feedback loop** | If even the minimum signal isn't met, the trigger is either undiscoverable or genuinely unwanted — revisit its placement/UX before investing further, or deprioritize relative to Metric 1's simpler presentation win |

### Metric 3: Emotion/persona data actually populated

| Field | Value |
|-------|-------|
| **What we measure** | % of journey stages (among journeys touched since release) with a non-null `emotion` field populated post-release — the real signal that the emotion curve is doing its job, not just rendering an empty state |
| **Baseline** | `[UNKNOWN BASELINE — exact %]`. Confirmed via `/clarify` that existing `emotion` data is "mostly empty" today, but the precise pre-release % hasn't been measured yet. **Action before release:** run the real DB query now to establish this baseline, per discovery.md's own Success Indicators note |
| **Target** | ≥25% of touched stages have `emotion` populated within 4 weeks of release — a conservative target given this is genuinely new behaviour operators haven't used before |
| **Minimum validation signal** | ≥5% — any real, non-trivial usage beyond a single operator's own test journey, proving the empty-state-to-populated transition actually happens in practice |
| **Measurement method** | Direct database query, run by the Platform Owner or engineering, weekly post-release |
| **Feedback loop** | If even the minimum signal isn't met, passive field availability alone isn't prompting operators to fill in emotion data — may need an explicit in-tab nudge/prompt, not just a presentable empty state |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1 — Operator CX judgment vs. reference bar | `jcx-s3` (emotion curve), `jcx-s4` (persona card), `jcx-s6` (swimlane/timeline restructure — post-release spike found the structural gap `jcx-s3`/`jcx-s4` didn't close) | Covered |
| M2 — Placeholder-feature trigger actually used | `jcx-s1` (data model + trigger), `jcx-s2` (auto-conversion), `jcx-s5` (authorization hardening) | Covered |
| M3 — Emotion/persona data actually populated | `jcx-s3` (emotion), `jcx-s4` (persona, discovery-seeded) | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts, defined at `/definition`
- Implementation approach — that is `/definition` and `/design`
- Sprint targets or velocity — these metrics are outcome-based, not output-based
