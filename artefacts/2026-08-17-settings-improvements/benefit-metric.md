# Benefit Metric: Settings improvements — locale, plan management, theme relocation

**Discovery reference:** artefacts/2026-08-17-settings-improvements/discovery.md (Approved by Hamish King, 2026-08-17)
**Date defined:** 2026-08-17
**Metric owner:** Hamish King, Platform owner
**Reviewers:** Hamish King, Platform owner

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This is a straightforward product-improvement initiative closing real beta-user friction — not a hypothesis test about tooling, process, or team capability. Tier 1 product metrics only.

**Compliance/risk-reduction obligations:** None. `context.yml` sets `meta.regulated: false`; discovery's own Constraints section confirms no compliance or regulatory driver. No Tier 3 metrics.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Locale preference adoption

| Field | Value |
|-------|-------|
| **What we measure** | Count of signed-in users who have set a non-default timezone/date-format preference, out of total signed-in users |
| **Baseline** | 0% — the feature does not exist yet |
| **Target** | Any signed-in user can set timezone/date-format and see it reflected in the product; ≥1 real user (beyond the reporting beta user) sets a non-default value within 4 weeks of release |
| **Minimum validation signal** | The originating beta user (Abhijeet Singh) successfully sets and sees his own preference reflected — confirms the mechanism works end-to-end even if broader adoption is still low |
| **Measurement method** | New settings-change PostHog event (matching the existing `_posthog.capture` convention in this codebase), queried weekly by the Platform owner |
| **Feedback loop** | If the minimum signal isn't hit within 4 weeks (the beta user himself can't set/see his preference), the Platform owner investigates whether the mechanism is broken vs. undiscoverable, and decides whether to fix or reprioritise before further locale investment |

### Metric 2: Theme toggle relocation — no usage regression

| Field | Value |
|-------|-------|
| **What we measure** | Click-through rate on the theme toggle control, before (topbar) vs. after (Settings) relocation |
| **Baseline** | Not yet established — no existing telemetry on topbar theme-toggle click frequency. Will capture a 2-week baseline window on the current topbar control before relocating it |
| **Target** | Post-relocation click rate is within 20% of the pre-relocation baseline (comparable usage, not a silent drop-off) |
| **Minimum validation signal** | Post-relocation click rate is non-zero and trending flat-to-up over the first 2 weeks after release — confirms users are finding it in its new location at all |
| **Measurement method** | New click event on the relocated control (same PostHog convention), compared against the captured baseline window. Measured by the Platform owner, reviewed 2 weeks post-release |
| **Feedback loop** | If click rate drops >20% and stays down past 2 weeks, the Platform owner considers a discoverability fix (e.g. a redirect/tooltip from the old topbar location) or reconsiders the relocation itself, per the risk already flagged in discovery |

### Metric 3: Original beta-reported friction resolved

| Field | Value |
|-------|-------|
| **What we measure** | Direct confirmation from the reporting beta user (Abhijeet Singh) that the shipped MVP scope addresses what he was looking for, across all 3 in-scope asks (locale, plan management, theme location) |
| **Baseline** | 3 explicit asks from one real beta user, 0 confirmed resolved as of discovery |
| **Target** | Beta user confirms all 3 in-scope asks are resolved to his satisfaction in a follow-up conversation |
| **Minimum validation signal** | Beta user confirms at least 2 of 3 are resolved, with the third having a clear, communicated reason (e.g. "plan management" resolved via existing Stripe portal fix rather than new UI, per the clarified scope decision) |
| **Measurement method** | A direct follow-up conversation/message with the beta user after release — qualitative, small-n check appropriate for a single named reporter, not a statistical claim. Owned by the Platform owner |
| **Feedback loop** | If the beta user reports the shipped scope doesn't address his needs (e.g. he still wants in-app plan management despite the portal fix), the Platform owner logs a new feedback signal and scopes a follow-up initiative rather than silently closing this one as done |

---

## Metric Coverage Matrix

<!-- Populated by /definition after stories are created. -->

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1: Locale preference adoption | si-s2 | Covered |
| Metric 2: Theme toggle relocation — no usage regression | si-s1 | Covered |
| Metric 3: Original beta-reported friction resolved | si-s1, si-s2, si-s3 | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
