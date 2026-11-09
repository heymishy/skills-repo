## Benefit Metric: Deferred Decision Follow-Through

**Discovery reference:** artefacts/2026-11-08-deferred-decision-follow-through/discovery.md
**Date defined:** 2026-11-08
**Metric owner:** Hamish King (Platform Owner)
**Reviewers:** [Pending — at least one non-engineering reviewer is required for Tier 1 product metrics by this skill's own completion check; no such role exists in this personal-scope team.]

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This initiative builds a concrete follow-through mechanism (records, scan, self-registration, UI) rather than testing a hypothesis about whether something works in the abstract — unlike initiative 3's explicit validation-exercise shape. The one open question this discovery resolved (whether PostHog telemetry is a useful signal) was already settled during `/clarify` with real data (found sparse, corrected to supplementary), so it doesn't carry forward as a meta-metric here. No meta-metrics apply.

No Tier 3 compliance/risk-reduction obligations apply — this is internal pipeline hygiene, not a response to an external regulatory, audit, or named security-risk signal.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Deferred-item record mechanism existence

| Field | Value |
|-------|-------|
| **What we measure** | Whether the two real seeded cases (`tfhc-s1` pipeline-integrity failure, C1-vs-Option-C fork-distribution contradiction) exist as structured, correctly-typed deferred-item records. |
| **Baseline** | 0 structured deferred-item records exist today — both cases are known but unstructured (a flagged note, not a record). |
| **Target** | Both seeded cases exist as structured records. |
| **Minimum validation signal** | Same as target — this is a binary existence check against 2 known, named cases, not a graduated metric. |
| **Measurement method** | Direct confirmation that both seeded cases are present and correctly typed, once story 1 ships. |
| **Feedback loop** | If either seeded case is missing or mistyped, story 1's schema or seeding logic has a defect — fix before relying on it for anything else in this MVP. |

### Metric 2: Periodic review scan coverage

| Field | Value |
|-------|-------|
| **What we measure** | Whether registered deferred-item records actually get surfaced by the periodic review scan. |
| **Baseline** | 0% — `tfhc-s1` has sat unfixed across multiple sessions without once reaching a decision point via any mechanism. |
| **Target** | 100% of registered records surfaced at least once per scan cycle. |
| **Minimum validation signal** | Same as target for the first run — the first scan must include both seeded real records, or the mechanism has failed its own first real test. |
| **Measurement method** | Direct check of the first scan run's output against the 2 known seeded records. |
| **Feedback loop** | If a seeded record is missing from the scan output, the scan's own query logic (not the record mechanism) is the likely defect. |

### Metric 3: Real telemetry signal feed quality

| Field | Value |
|-------|-------|
| **What we measure** | Whether scan output cites real `featureSlug`-keyed PostHog telemetry when it exists for a given feature, and degrades gracefully (no false "no signal" conclusion, no crash) when it doesn't. |
| **Baseline** | 0% of any review today includes real cost/commit-reliability data — none exists anywhere in the pipeline. Confirmed during `/clarify` that real volume is currently sparse (`stage_completed` fired once in 60 days). |
| **Target** | Scan output cites real PostHog-sourced figures whenever they exist, and never silently fails or misreports "no activity" when volume is simply sparse rather than genuinely zero. |
| **Minimum validation signal** | The scan runs without error against a feature with zero telemetry — graceful degradation is the lower, more achievable bar given today's real sparse-data reality, below "cites real figures" which depends on data that often won't exist yet. |
| **Measurement method** | A direct check that the report contains real PostHog-sourced figures when available, and a separate check that it degrades gracefully (no crash, no false conclusion) when volume is zero. |
| **Feedback loop** | If the sparse-data path produces a false "nothing happened" conclusion rather than an honest "no data" one, that's a real defect to fix before trusting this feed for anything else. |

### Metric 4: Self-registration coverage

| Field | Value |
|-------|-------|
| **What we measure** | Whether deferrals created by `/discovery`, `/decisions`, or `/benefit-metric` automatically register a deferred-item record, with zero manual steps. |
| **Baseline** | 0% of new deferrals automatically become structured records today — every one requires a manual follow-up step that, per this whole initiative's own premise, usually never happens. |
| **Target** | 100% of deferrals created by all three skills after this ships register a record automatically. |
| **Minimum validation signal** | At least 1 of the 3 hooked skills (`/discovery`, `/decisions`, or `/benefit-metric`) correctly self-registers in its next real run — a graduated rollout bar below full 3-skill coverage, given this is the most structurally invasive story in the whole tranche (3 separate governed-file PRs). |
| **Measurement method** | The next real `/discovery`, `/decisions`, or `/benefit-metric` cycle after this ships, confirmed by checking whether a record was created without a manual step. |
| **Feedback loop** | If one hooked skill's self-registration works but another's doesn't, that isolates the defect to a specific skill's final-step implementation, not the record mechanism itself. |

### Metric 5: Web UI rendering existence

| Field | Value |
|-------|-------|
| **What we measure** | Whether deferred-item records render in the same shared surface as incident records. |
| **Baseline** | 0 deferred-item records visible anywhere today. |
| **Target** | Deferred-item records render in the shared surface alongside incident records. |
| **Minimum validation signal** | Same as target — this is a binary existence check against at least one seeded real record, not a graduated metric. |
| **Measurement method** | A direct check that the surface renders ≥1 seeded real record without error, once story 5 ships. |
| **Feedback loop** | This story depends on initiative 4's story 3 already existing — if this check fails, confirm first whether the dependency actually shipped before assuming this story's own code is broken. |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Deferred-item record mechanism existence | [Populated at /definition] | Gap — stories not yet written |
| Periodic review scan coverage | [Populated at /definition] | Gap — stories not yet written |
| Real telemetry signal feed quality | [Populated at /definition] | Gap — stories not yet written |
| Self-registration coverage | [Populated at /definition] | Gap — stories not yet written |
| Web UI rendering existence | [Populated at /definition] | Gap — stories not yet written |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
