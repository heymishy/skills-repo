# Benefit Metric: Live Test — Playback-Evidence Capture Mechanism

**Feature:** 2026-10-25-ppc-capture-live-test
**Status:** Active
**Date:** 2026-10-25
**Metric owner:** Operator — Platform maintainer

---

## Product context alignment

**Mission success outcome mapped:** "Trust the governance output" — a risk or compliance stakeholder reviewing the assurance trace can confirm that evidence records exist and are durable.
**Roadmap alignment:** Phase 5 active delivery — improvement loop signal infrastructure.

---

## Metrics

### Metric 1 — Capture record exists and is structurally valid post-session

**What we are measuring:** Whether at least one durable, structurally valid capture record is written to the configured GitHub repository storage path during a live production session.

**Baseline:** 0 records. No capture records currently exist at the configured artefacts path for this feature.

**Target:** ≥ 1 record written and retrievable after the session completes, meeting all structural validity criteria (see below).

**Minimum validation signal:** The committed file exists and is a non-empty file at the expected path. The full structural validity check (PNG format + successful commit) is required to count as a pass.

**Structural validity criteria (pass requires all three):**
1. The committed file exists at the expected artefacts path in the GitHub repository
2. The file is a non-empty, well-formed PNG image
3. The GitHub commit completed successfully (no partial or failed write)

**How measured:** Direct inspection via two verification surfaces after the session completes:
- GitHub repository API-level storage path — confirm the file exists, is non-empty, and the commit status is success
- Capture UI inline display — confirm the tenant-scoped screenshot route returns and renders the same file

**Who measures:** Operator — Platform maintainer

**When measured:** Immediately after the live test session completes (single measurement point — this is a binary verification exercise, not a recurring metric)

**Feedback loop:** Binary outcome. If the record exists and is structurally valid: mechanism confirmed as production-functional; improvement loop can begin relying on capture output. If not: investigate the failure path (commit failure, format error, or route misconfiguration) before proceeding.

**Metric owner:** Operator — Platform maintainer

**Reviewers:** Operator — Platform maintainer (solo operator context; W4 RISK-ACCEPT applied)

---

## Meta-benefit check

No meta-benefit situation detected. This is a verification-only exercise — no tooling hypothesis, pilot, or process experiment is being tested. The sole question is whether the already-built mechanism works in production.

---

## Tier 3 metrics

No compliance, regulatory, or risk-reduction obligations apply to this verification exercise.

---

## Quality checks

- ✅ Metric has a baseline (0 records) and an explicit plan to measure post-session
- ✅ Target is specific and directional (≥ 1 record, with named structural criteria)
- ✅ Minimum validation signal is defined (file exists and is non-empty)
- ✅ Feedback loop names who measures, when, and what happens in each outcome
- ✅ Metric is an outcome (record exists and is valid), not a feature delivery output (mechanism built)
- ✅ No fabricated baseline — current state is a confirmed zero

---

## Appendix — Skill Performance Capture

<!-- EXP-010-fable5-model-sweep -->
```yaml
experiment_id: EXP-010-fable5-model-sweep
model_label: claude-sonnet-4-6
cost_tier: fast
skill_name: benefit-metric
artefact_path: artefacts/2026-10-25-ppc-capture-live-test/benefit-metric.md
run_timestamp: 2026-10-25T00:00:00Z
fidelity_self_report: >
  Model correctly identified the single directional indicator from the discovery artefact,
  avoided fabricating a baseline, confirmed the two verification surfaces map to one
  underlying record before metric finalisation, and applied the structural validity
  criteria as operator-defined rather than assumed.
```