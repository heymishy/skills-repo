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
| **What we measure** | Click-through rate on the relocated theme toggle control (Settings > Profile tab, post-relocation) |
| **Baseline** | **Revised 2026-09-12 (operator decision, ral/si follow-up sweep):** no pre-relocation baseline was ever captured — si-s1 shipped the relocation directly, without the 2-week topbar-baseline window this metric originally called for. That comparative baseline is now permanently unrecoverable (the topbar control no longer exists to measure). Retargeted to an absolute floor instead of a before/after comparison. |
| **Target** | Post-relocation click rate is non-zero and stable (not trending toward zero) over the first 2 weeks of real measurement from whenever `enfr`/`ral`-style telemetry review next runs — confirms users are finding and using the control in its new location, without requiring a baseline that no longer exists to compare against |
| **Minimum validation signal** | At least one real signed-in user (beyond ad-hoc agent/QA sessions) fires the relocated toggle's click event at least once within the first 2 weeks measured |
| **Measurement method** | Existing click event on the relocated control (same PostHog convention, si-s1 AC4), reviewed by the Platform owner over any 2-week window post-release — no baseline comparison required |
| **Feedback loop** | If the click rate is zero or trends to zero over 2 full weeks of real measurement, the Platform owner considers a discoverability fix (e.g. a redirect/tooltip from the old topbar location, if still remembered by users) or reconsiders the relocation itself, per the risk already flagged in discovery |

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
