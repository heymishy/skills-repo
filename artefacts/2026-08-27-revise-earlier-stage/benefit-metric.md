## Benefit Metric: Revise an Earlier Stage Mid-Journey

**Discovery reference:** `artefacts/2026-08-27-revise-earlier-stage/discovery.md` (Approved 2026-08-27, Hamish King — Platform Owner)
**Date defined:** 2026-08-27
**Metric owner:** Hamish King — Platform Owner
**Reviewers:** Hamish King — Platform Owner

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No — this is a real, standing product capability for this platform's own operators (solo PO/engineers running the outer loop), not a tooling/process pilot or hypothesis test. Standard product metrics only.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Earlier-stage revisions completed without a journey restart

| Field | Value |
|-------|-------|
| **What we measure** | The count of distinct journeys where an operator reopened a previously completed (not just the current) stage via the step-nav's "done" link, sent at least one new turn in that reopened session, and the journey was *not* subsequently abandoned/restarted. |
| **Baseline** | 0% — the capability does not exist today; every occurrence of this specific pain (2 known: Hamish, Abhi) currently ends in either living with the flawed earlier stage or restarting the journey. |
| **Target** | At least 1 real, non-test usage of the feature per week across active journeys once live in beta, with the journey continuing to completion afterward (not abandoned within the same session). |
| **Minimum validation signal** | At least 1 genuine usage in the first 2 weeks post-release that results in the journey continuing to completion — proves the mechanism works end-to-end for a real case, not just synthetic/test traffic. |
| **Measurement method** | New PostHog/audit event `earlier_stage_reopened` (journeyId, stageName, timestamp) fired when this flow is used, joined against journey-completion status queried from `journey.complete`/`journey.abandoned`-equivalent state. Reviewed weekly by the metric owner during the beta window. |
| **Feedback loop** | If zero genuine usages occur in the first 4 weeks post-release, the metric owner investigates whether the feature is undiscoverable (UX/entry-point issue) vs. genuinely not needed as built — decides whether to adjust the entry point or accept the feature was a lower priority than the 2 reported occurrences suggested. |

### Metric 2: Materiality-suggestion acceptance rate

| Field | Value |
|-------|-------|
| **What we measure** | Of all times the model presents a materiality suggestion after a revision, the proportion where the operator's chosen action (flag / re-run / leave-as-is) matches the model's suggested action. |
| **Baseline** | Not yet established — feature does not exist today. Will measure from the first real usage. |
| **Target** | ≥70% of suggestions are accepted (operator's choice matches the model's suggestion) once at least 10 genuine suggestions have been logged — signals the suggestion is trustworthy enough to be useful, not routinely second-guessed. |
| **Minimum validation signal** | ≥50% acceptance over the same 10-suggestion sample — below this, the suggestion is closer to noise than signal and the materiality-judgment approach itself needs rethinking, not just tuning. |
| **Measurement method** | Log the model's suggested action and the operator's actual chosen action together at the point of decision (same event or a paired event). Reviewed by the metric owner once 10 suggestions have accumulated, then monthly thereafter. |
| **Feedback loop** | If acceptance falls below the minimum signal (50%) after 10 real suggestions, the metric owner decides whether to refine the materiality-judgment prompt/heuristic, simplify to a binary always-ask-no-suggestion model, or deprioritize the materiality-suggestion sub-feature while keeping the core "reopen and revise" capability. |

### Metric 3: Recurrence of the original blocking pain

| Field | Value |
|-------|-------|
| **What we measure** | Count of new, distinct operator reports of "I had to restart/abandon a journey because I couldn't revise an earlier stage" after this feature ships — the exact pain pattern that originated this discovery. |
| **Baseline** | 2 known occurrences (Hamish, Abhi) before this feature existed. |
| **Target** | 0 further occurrences of this specific pain pattern reported after release. |
| **Minimum validation signal** | No more than 1 further occurrence in the first month post-release, and that occurrence is traceable to a scope gap this MVP explicitly deferred (e.g. an entry point not yet covered per the discovery's Out of Scope note) rather than the core mechanism failing. |
| **Measurement method** | Manual — direct operator report via the same channel that surfaced this discovery (live usage feedback, `workspace/capture-log.md` signal), reviewed by the metric owner. |
| **Feedback loop** | Any new occurrence triggers a direct root-cause check: is it the same class of gap this feature was meant to close (a real regression/incompleteness in this feature), or a genuinely new, different gap that needs its own discovery. |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Earlier-stage revisions completed without a journey restart | res-s1, res-s2 (primary); res-s4 (secondary — closes the loop) | Covered |
| Materiality-suggestion acceptance rate | res-s3, res-s4 | Covered |
| Recurrence of the original blocking pain | res-s1, res-s2, res-s4 | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
