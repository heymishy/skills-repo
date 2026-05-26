# Benefit Metric: BSR Workforce Planner

**Discovery reference:** artefacts/2026-05-26-bsr-workforce-planner/discovery.md
**Date defined:** 2026-05-26
**Metric owner:** Hamish King — Head of Engineering
**Reviewers:** [Finance / planning lead — to be named before DoR; at minimum one non-engineering reviewer required before stories are signed off]

---

## Tier Classification

**META-BENEFIT FLAG:** No

This is an operational planning tool. There is no tooling-process hypothesis being tested alongside user value. Standard Tier 1 product metrics only.

---

## Tier 1: Product Metrics (User Value)

### M1: Workforce + Initiative Reconciliation Time

| Field | Value |
|-------|-------|
| **What we measure** | Elapsed time from running `workforce-map` on a current roster to a complete FTE delta view across all reviewable initiative submissions being available for review, without opening any xlsx file |
| **Baseline** | Not yet established. Informal estimate: 2–4 hours for manual cross-referencing across 5 xlsx files. Will measure actual current-state time before the first `workforce-map` invocation. |
| **Target** | Under 10 minutes |
| **Minimum validation signal** | Under 60 minutes at first live use |
| **Measurement method** | Hamish King; timed from skill invocation to dashboard load; measured at each pre-GM preparation session |
| **Feedback loop** | If under 60 min not achieved at first use: investigate data quality (xlsx normalisation config, portfolio file currency). If under 10 min not achieved by 3rd use: investigate skill performance and portfolio file completeness. Decision point: if 10 min target not achieved after 3 planning cycles, re-scope skill or simplify the reconciliation model. |

---

### M2: Pre-GM Initiative FTE Cross-Check Coverage

| Field | Value |
|-------|-------|
| **What we measure** | Percentage of initiative submissions included in an upcoming GM review pack that have an associated `workforce-map` gap report (actual vs claimed FTE and cost delta) produced before the GM session begins |
| **Baseline** | 0% — no tooling exists for this cross-check today |
| **Target** | 100% for the first FY planning GM session where this tool is in use |
| **Minimum validation signal** | ≥ 80% of submissions by FTE volume at the first GM session |
| **Measurement method** | Hamish King; confirmed by checking that `workforce/initiative-map.json` contains entries for all initiatives in the GM review pack; measured before each GM session |
| **Feedback loop** | If < 80% at first session: identify which submissions lack portfolio files (enterprise fork not current) or which initiatives are unmapped (`workforce-map` not run for that slug). If 100% not achieved by 2nd session: mandate that initiative-intake must precede any GM review pack preparation, and make `workforce-map` a mandatory pre-session step. |

---

### M3: Hiring Gap Specificity Rate

| Field | Value |
|-------|-------|
| **What we measure** | Percentage of net-new hiring gaps surfaced by `workforce-map` that include all three required fields: role (from `cost-model.json` roles), skill tags (from the required-tag set at invocation), and initiative slug (from portfolio) |
| **Baseline** | 0% — no current mechanism produces role-specific, initiative-linked gaps. Today hiring needs are expressed as headcount numbers only. |
| **Target** | 100% — the skill enforces this structurally; any gap without all three fields is a skill defect, not an operator gap |
| **Minimum validation signal** | ≥ 1 fully-specified hiring gap (all three fields populated) produced at first `workforce-map` run against a real initiative |
| **Measurement method** | Hamish King; inspect `workforce/initiative-map.json` net-new entries after each `workforce-map` invocation; measured at first use and at each FY planning cycle |
| **Feedback loop** | Any gap without all three fields is treated as a bug and fixed before the next invocation. The metric should be at 100% by design; anything below 100% indicates a defect in the skill's output structure. |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1: Reconciliation time | wfp.1 (roster ingest), wfp.2 (roster update), wfp.3 (workforce-map core), wfp.5 (roster view), wfp.6 (allocation matrix), wfp.8 (multi-team rollup — eliminates manual aggregation for cross-team initiatives) | Covered |
| M2: Pre-GM FTE coverage | wfp.3 (map core — produces initiative-map.json), wfp.4 (profile-match extends coverage), wfp.6 (allocation matrix — the visual confirmation surface), wfp.8 (rollup view — confirms parent-level FTE coverage for multi-team initiatives before GM session) | Covered |
| M3: Hiring gap specificity | wfp.4 (net-new mode structurally enforces role + tags on every gap), wfp.7 (hiring gap view — the measurement surface) | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
