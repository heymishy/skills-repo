# Benefit Metric: Impact/Effort Matrix Workshop Tool

**Feature slug:** 2026-06-04-impact-effort-matrix-workshop
**Status:** Active
**Defined:** 2026-06-04
**Linked discovery:** artefacts/2026-06-04-impact-effort-matrix-workshop/discovery.md

---

## Attribution

**Defined by:** [confirm name] — 2026-06-04
**Metric owner:** [TO BE NAMED — a non-engineering role is required for Tier 1 product metrics, e.g. the facilitator or product lead who owns workshop outcomes]
**Reviewers:** [TO BE NAMED — at least one reviewer from outside engineering required]
**Discovery Approved By:** Verbal approval given 2026-06-04. Update `artefacts/2026-06-04-impact-effort-matrix-workshop/discovery.md` with the approver's full name before DoR.

---

## Metrics

### Metric 1 — Facilitator write-up time

**What we're measuring:** Elapsed time from workshop session end to a complete, exportable write-up ready for use — time to export, not word count or reconstruction effort.

**Baseline:** Not yet established. Facilitator self-reports current average over the first 3 workshops before tool adoption.

**Target:** < 5 minutes per session — facilitator exports immediately after the session with no manual reconstruction required.

**Minimum validation signal:** ≥ 50% reduction from the established baseline after 3 uses of the tool.

**Measurement approach:** Facilitator logs session-end time and export-ready time after each session. Measured by: facilitator. Frequency: per session.

---

### Metric 2 — Clarifying questions in outer loop discovery runs

**What we're measuring:** Count of open questions marked `[ASSUMPTION]` and `[RISK]` in the `## Assumptions and risks` section of discovery artefacts — compared across runs where input is sourced from manual write-up versus from this tool's export.

**Baseline:** Not yet established. Count open questions across the first 3 discovery runs using manual write-up inputs before tool adoption.

**Target:** ≥ 30% fewer open questions per discovery run compared to the manual write-up baseline.

**Minimum validation signal:** Any visible reduction across 3 paired comparisons (one manual-sourced run, one tool-sourced run, same facilitator per pair).

**Measurement approach:** Review the `## Assumptions and risks` section of each discovery artefact; count `[ASSUMPTION]` and `[RISK]` entries. Measured by: pipeline operator. Frequency: per discovery run.

---

### Metric 3 — Discovery run speed

**What we're measuring:** Elapsed time from `/discovery` invocation to discovery artefact approved.

**Baseline:** Not yet established. Time 3 discovery runs using manual write-up inputs before tool adoption.

**Target:** ≥ 20% faster per run compared to the manual write-up baseline.

**Minimum validation signal:** Any measurable reduction after 3 paired comparisons.

**Measurement approach:** Log session start timestamp and artefact approval timestamp for each run. Measured by: pipeline operator. Frequency: per discovery run.

---

### Metric 4 — Workshop health (failure condition monitor)

**What we're measuring:** Workshop sessions run per month over the 3 months following tool adoption, compared to the 3 months prior.

**Baseline:** To be confirmed by facilitator — approximate current monthly frequency (e.g. "roughly 2 per month"). Required before the 3-month comparison window can be assessed.

**Target:** Workshop frequency maintained or increased over the 3-month adoption window — not declining.

**Minimum validation signal:** No month-on-month decline in workshop frequency over any month in the 3-month window.

**Measurement approach:** Facilitator count of workshops run per month. Measured by: facilitator. Frequency: monthly.

**Note:** This is a failure condition monitor, not a success target. A declining trend signals the tool is replacing facilitated sessions rather than enhancing them, which is an explicit failure condition stated in the discovery artefact.

---

## Tier 3 — Compliance and risk-reduction metrics

No compliance obligations, regulatory frameworks, or named risk-reduction requirements identified in the discovery artefact. No Tier 3 metrics defined.

---

## Quality gate

- ✅ Every metric has a baseline or an explicit plan to establish one
- ✅ Targets are specific and directional (< 5 min, ≥ 30% fewer, ≥ 20% faster, frequency maintained)
- ✅ Minimum validation signals sit below the full targets
- ✅ Feedback loops name who measures, what they measure, and how often
- ✅ No metric is an output — all are outcomes
- ⚠️ Metric owner not yet named — required before DoR
- ⚠️ Reviewers not yet named — at least one non-engineering reviewer required before DoR
- ⚠️ Workshop baseline frequency (Metric 4) not yet confirmed — facilitator to provide before definition

---

## Pending before /definition

1. Populate `Approved By` in the discovery artefact with the approver's full name
2. Name a Metric owner (non-engineering role) for Tier 1 product metrics
3. Name at least one Reviewer from outside engineering
4. Facilitator to confirm approximate current workshop frequency (Metric 4 baseline)