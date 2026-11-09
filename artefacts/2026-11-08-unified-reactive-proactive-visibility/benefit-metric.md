## Benefit Metric: Unified Reactive + Proactive Visibility

**Discovery reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/discovery.md
**Date defined:** 2026-11-08
**Metric owner:** Hamish King (Platform Owner)
**Reviewers:** [Pending — at least one non-engineering reviewer is required for Tier 1 product metrics by this skill's own completion check; no such role exists in this personal-scope team.]

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This initiative delivers a direct product capability (a real visibility surface for reactive + proactive work) rather than testing a hypothesis about tooling, process, or team capability. No meta-metrics apply.

No Tier 3 compliance/risk-reduction obligations apply — `context.yml`'s `complianceProfile: standard`, `complianceFrameworks: []`. No regulatory change, audit finding, or named risk-register item motivates this initiative.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Reactive-work coverage on the surface

| Field | Value |
|-------|-------|
| **What we measure** | The percentage of existing short-track stories and `decisions.md` RISK-ACCEPT/SCOPE entries that are actually rendered on `kanban-view.js`, out of every such entry that exists in `pipeline-state.json`/`decisions.md` at measurement time. |
| **Baseline** | 0% — confirmed today: `kanban-view.js` renders zero short-track stories or `decisions.md` reactive entries. |
| **Target** | 100% — full coverage of what already exists, not a sample. |
| **Minimum validation signal** | ≥80%. Below this, the gap is large enough to indicate a rendering defect or a source-data mismatch, not just normal lag, and needs investigation before continuing to trust the number. |
| **Measurement method** | A count-comparison script (reactive entries in `pipeline-state.json`/`decisions.md` vs. entries actually rendered), run weekly for the first month post-ship, then monthly. |
| **Feedback loop** | If the minimum signal isn't met, the engineering owner investigates whether the gap is a rendering bug or a source-data gap before re-measuring — the fix differs depending on which. |

### Metric 2: EM/team-lead real usage for load visibility

| Field | Value |
|-------|-------|
| **What we measure** | Whether a team lead or EM actually consults the reactive/planned rollup to inform a real planning or reporting decision. |
| **Baseline** | Not yet established — no usage metric can exist before the surface ships. Will measure current state (zero, by construction) at ship time. |
| **Target** | At least one observed instance of the rollup informing a real planning or reporting decision, within the first month post-ship. |
| **Minimum validation signal** | At least one team lead opens/consults the rollup at all, even without a confirmed decision traced to it — a weaker, directly observable bar below the full target. |
| **Measurement method** | Direct follow-up/observation by the metric owner (not a synthetic usage/click count), checked at the end of month 1. |
| **Feedback loop** | If even the minimum signal isn't met in month 1, the owner interviews team leads on why before concluding the feature failed — the cause could be discoverability, not value. |

### Metric 3: Rollup completeness (undercount risk)

| Field | Value |
|-------|-------|
| **What we measure** | The fraction of real reactive work in a given week that is actually captured in short-track stories or `decisions.md`, versus staying informal (Slack, verbal handoff). |
| **Baseline** | Not yet established. Will measure via a spot-check in the first 2–4 weeks of deployment before assessing progress toward target. Genuinely unmeasured today — not assumed to be complete. |
| **Target** | A real spot-check completed within month 1, with the undercount rate known — whatever number it turns out to be. This metric's purpose is to get a real number for the first time, not to hit a specific completeness percentage yet. |
| **Minimum validation signal** | The spot-check is actually run at all. A known-bad number is still a win over an unknown one. |
| **Measurement method** | Compare a sample week of informal reactive work (direct observation by the metric owner) against what the surface shows for that same week. |
| **Feedback loop** | If the undercount rate is large, that is the trigger to revisit the discovery-stage decision not to add a manual capture mechanism — not before a real number exists. |

<!-- The discovery's 3rd Directional Success Indicator ("Fork-relationship reference value") was removed during /clarify — the fork-steward persona's actual consumption path is text artefacts, not the UI — and is correctly not carried forward as a metric here. -->

---

## Tier 2: Meta Metrics (Learning / Validation)

Not applicable — no meta-benefit flag (see Tier Classification above).

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Reactive-work coverage on the surface | urpv-s1 (makes real data reachable), urpv-s2 (short-track tagging), urpv-s3 (decisions.md entries) | Covered |
| EM/team-lead real usage for load visibility | urpv-s4 (ships the rollup this metric measures usage of) | Covered |
| Rollup completeness (undercount risk) | urpv-s4 (the prerequisite the post-ship spot-check compares against — the spot-check itself is an operator measurement action, not a coding story) | Covered (enabling story; measurement is a post-ship operational action, not further code) |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
