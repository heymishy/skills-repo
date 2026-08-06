## Benefit Metric: Cross-Surface State Sync Between pipeline-state.json and Web-UI Journeys

**Discovery reference:** artefacts/2026-08-07-cross-surface-state-sync/discovery.md
**Date defined:** 2026-08-07
**Metric owner:** Hamish King — Platform maintainer / Product owner (solo-maintainer repo — this feature is a platform-governance capability, not a customer-facing product feature, so the platform-maintainer persona is the appropriate Tier 1 owner per `product/mission.md`'s persona definitions)
**Reviewers:** Hamish King — Platform maintainer / Product owner

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No — this closes a real, load-bearing architectural gap (no mechanism exists today to keep the two state records in agreement), not a hypothesis test about tooling or process. The discovery's own "what could make this not worth building" risk (whether the drift problem generalizes beyond solo dogfooding) is a legitimate open risk, but it is a scope/prioritisation risk, not a meta-benefit — this feature is being built as real infrastructure, not as a pilot to validate a tooling approach.

**Product context alignment:** `product/mission.md` success outcome #4 ("Trust the governance output") — a stakeholder must be able to trust that the governance record is internally consistent across surfaces. `product/roadmap.md` Phase 5 WS4 ("Spec integrity" — drift detection, pre-flight validation) is the closest live roadmap theme; this feature is the pipeline-state analogue of that same drift-detection-and-correction pattern, applied across surfaces rather than across a single surface's spec versions.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Automatic cross-surface agreement rate

| Field | Value |
|-------|-------|
| **What we measure** | The percentage of phase-boundary state advances — a CLI-side `bin/skills advance`/`gate-advance` call, or a web-UI journey completing a stage/gate — that are reflected on the *other* surface without any manual action (no manual "Sync" button click, no operator editing either file/record by hand). |
| **Baseline** | 0% — confirmed via code inspection (discovery.md): today nothing writes back automatically in either direction; the only existing mechanism is `product-rollup.js`'s manual, one-directional, on-demand dashboard sync. |
| **Target** | 100% of phase-boundary advances on either side are reflected on the other automatically, within the async retry/reconciliation window defined at `/definition`. |
| **Minimum validation signal** | 90% of phase-boundary advances propagate automatically without requiring a manual reconciliation intervention, measured over the first 4 weeks of real usage after this feature ships. Below this threshold, the retry/reconciliation design (not the sync concept itself) needs rework before calling this feature done. |
| **Measurement method** | An integration test (per story) that advances one side and asserts the other reflects it with no operator intervention — run in CI on every change to the sync mechanism. In production: a count of reconciliation-log entries requiring manual intervention vs. total phase-boundary advances, reviewed by the platform maintainer weekly for the first 4 weeks post-ship, then monthly. |
| **Feedback loop** | If the minimum signal (90%) is not met after 4 weeks, the platform maintainer reviews the reconciliation log to identify the dominant failure mode (e.g. retry exhaustion, a specific gate type never propagating) and decides whether to extend the retry window, add a manual "force sync" escape hatch, or narrow the feature's scope — not to abandon the mechanism outright, since the underlying disconnect (confirmed via code inspection, not assumption) would still exist. |

### Metric 2: Conflict-resolution correctness (no silent overwrites)

| Field | Value |
|-------|-------|
| **What we measure** | For every genuine conflict detected (both sides advanced differently since the last sync), whether `pipeline-state.json`'s value was written to the journey side **and** the conflict was logged — as opposed to a silent overwrite with no record. |
| **Baseline** | Not applicable / no mechanism exists today — there is no conflict-resolution behaviour to compare against, since nothing currently detects or resolves cross-surface conflicts at all. |
| **Target** | 100% of detected conflicts produce both the correct resolution (pipeline-state.json wins, per the canonical-source decision in decisions.md) and a log entry — zero silent overwrites, measured indefinitely as an ongoing correctness invariant, not a one-time target. |
| **Minimum validation signal** | Zero silent-overwrite incidents observed in the first 4 weeks of production usage. Because conflicts are expected to be rare events (this is a correctness invariant, not a gradual improvement metric), any single silent overwrite in that window is treated as a failing signal requiring immediate investigation, not averaged against a threshold. |
| **Measurement method** | A test (per story) that manufactures a conflict and asserts both the resolution and the log entry — run in CI. In production: the platform maintainer reviews the reconciliation/conflict log weekly for the first 4 weeks, checking specifically for any advance that changed a journey's or pipeline-state.json's value with no corresponding log entry. |
| **Feedback loop** | Any observed silent overwrite is treated as a correctness defect, not a target miss — it triggers an immediate fix-forward story (per this repo's existing fix-forward pattern used for tpac-s1's CI-caught regression), not a scope renegotiation. |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Automatic cross-surface agreement rate | *(populated at /definition once story slugs are known)* | Gap — pending /definition |
| Conflict-resolution correctness | *(populated at /definition once story slugs are known)* | Gap — pending /definition |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts, written at `/definition`
- Implementation approach (sync trigger mechanism internals, retry/backoff design, storage of the reconciliation log) — that is `/definition`
- Sprint targets or velocity — these metrics are outcome-based (agreement rate, conflict correctness), not output-based (features shipped)
