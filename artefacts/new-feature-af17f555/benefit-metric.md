# Benefit Metric: Cross-Channel Feature Continuity

**Status:** Active

**Date:** 2025-07-15

**Feature slug:** 2025-07-15-cross-channel-feature-continuity

## Tier 1: Product Metrics

### Metric 1: Web UI Session Start Share

**What we're measuring:**

Proportion of outer loop session starts (discovery, spike, benefit-metric, definition skills) initiated via the web UI versus Claude Code, measured as a percentage of total outer loop sessions.

**Baseline:** Unknown — to be established in first 2 weeks of post-launch measurement. Current state: inferred from repo commit patterns (majority of outer loop work occurs in Claude Code, exact ratio TBD).

**Target:** Web UI accounts for >50% of outer loop session starts within 4 weeks of feature launch.

**Minimum validation signal:** Web UI reaches 40% session share by week 2. If below 40% by end of week 2, feature is not reducing switching cost sufficiently and should be reviewed for capability gaps.

**How we measure it:**

- Web UI: count POST requests to `/api/skills/:name/sessions` for outer loop skills (discovery, spike, benefit-metric, definition, review) per day
- Claude Code: infer from daily repo commit patterns in `artefacts/` directory (commits that introduce new feature slugs or progress existing ones)
- Measurement owner: Platform maintainer (Hamish King or designate)
- Frequency: Daily aggregation; weekly review
- Feedback loop: If session share drops below target at week 2, escalate to platform team for root cause analysis (capability gap, UX friction, or friction in connecting repo). If feature load errors exceed 5% (see Metric 3), pause and investigate artefact parsing.

### Metric 2: Feature Discoverability — Load Success Rate

**What we're measuring:**

The percentage of in-progress features in `artefacts/` that successfully load in the web UI skill picker and are selectable without error.

**Baseline:** 100% (new feature; no prior data). For the first launch, we will measure: how many features discovered in `artefacts/` parse without error and render in the skill picker UI?

**Target:** ≥95% of discovered features load and render successfully. No feature should fail to display due to artefact parsing errors.

**Minimum validation signal:** ≥90% load success rate. If below 90%, parsing is fragile and must be hardened before wider rollout.

**How we measure it:**

- Count total features discovered via directory scan of `artefacts/[feature-slug]/discovery.md`
- Count features that parse without error and appear in skill picker UI
- Count features that fail to load (malformed YAML front matter, missing required fields, encoding errors)
- Measurement owner: Platform maintainer (Hamish King or designate)
- Frequency: Per session start; aggregated weekly
- Feedback loop: Log and surface any parse failures immediately in session start logs. If parse failure rate exceeds 5%, halt feature discovery and investigate artefact format consistency.

### Metric 3: Feature Continuity — Handoff Context Load Success

**What we're measuring:**

Of the features successfully loaded in the skill picker, the percentage for which prior artefacts (discovery, clarify, benefit-metric, definition) load successfully into the session's HANDOFF CONTEXT and are injected into the skill prompt without corruption or truncation.

**Baseline:** 100% (new feature; no baseline data yet). We will establish: how many loaded features have their prior artefacts successfully injected into the first turn's system prompt?

**Target:** ≥98% of loaded features have all accessible prior artefacts injected cleanly. No feature should fail to continue because prior context was corrupted or lost.

**Minimum validation signal:** ≥95% handoff success rate. Below this, feature continuity is unreliable and should not be promoted as a primary surface advantage.

**How we measure it:**

- For each feature loaded in skill picker, attempt to load all prior artefact files (discovery.md, clarify.md, benefit-metric.md, definition.md, review.md if present)
- Verify each artefact file loads without encoding errors and injects into HANDOFF CONTEXT section without truncation
- Log any missing, corrupted, or truncated artefacts per feature per session
- Measurement owner: Platform maintainer
- Frequency: Per session start; aggregated weekly
- Feedback loop: If any feature's prior artefacts fail to load, block that feature from the skill picker with a clear error message (e.g., "Feature [slug] has incomplete prior artefacts — contact platform team"). If handoff success drops below 95%, pause the feature and investigate file encoding, path resolution, and context injection logic.

## Metric Owner and Reviewers

**Metric Owner:** Hamish King, Platform Owner

**Reviewers:** Platform team (at least one non-engineering reviewer if product/business impact is primary; currently owned by platform owner)

## Measurement Timeline

- Weeks 1–2: Establish baselines; monitor for parse/load failures
- Week 2: Minimum signal checkpoint (40% session share, ≥90% load success, ≥95% handoff success)
- Week 4: Target checkpoint (>50% session share, ≥95% load success, ≥98% handoff success)
- Post-week 4: If target not met, conduct capability review (UX friction, handoff context sufficiency, or Claude Code feature parity) and decide on iteration

## Notes

- Baseline for session share is intentionally marked unknown and will be established empirically in the first 2 weeks. Inferring from repo patterns avoids guesswork.
- Metrics 2 and 3 are technical reliability measures; Metric 1 is the business outcome. All three must be monitored together — high technical success with low adoption indicates a capability or UX problem, not a feature success.
- No compliance, regulatory, or Tier 3 metrics apply to this feature.

---

*Backfilled 2026-09-01 from the production journey record (af17f555-dfa9-4f66-910b-32bec32d66b7) — see artefacts/2026-09-01-artefact-commit-durability-gap/discovery.md and the dcuf-s1 fix (PR #806). Reconstructed from the journey's rendered content; not a byte-identical copy of the original saved markdown source.*
