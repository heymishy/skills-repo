## Benefit Metric: Programme Entry Points

**Discovery reference:** artefacts/2026-11-08-programme-entry-points/discovery.md
**Date defined:** 2026-11-08
**Metric owner:** Hamish King (Platform Owner)
**Reviewers:** [Pending — at least one non-engineering reviewer is required for Tier 1 product metrics by this skill's own completion check; no such role exists in this personal-scope team.]

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

Unlike initiatives 1 and 2, this initiative is explicitly a validation exercise: story 1 tests the hypothesis that `/programme` actually holds up end-to-end for a real top-down invocation, and story 3 tests the hypothesis that a simple heuristic can reliably distinguish genuine programme-candidates from normal complex features. Both are learning goals, not just delivery goals — if the dry-run finds the skill structurally broken, or the heuristic can't reliably separate the two known cases, that's still a successful outcome of this initiative (a real finding), even though it isn't the product outcome originally hoped for. Splitting product and meta metrics accordingly, per this skill's own Step 2 guidance.

No Tier 3 compliance/risk-reduction obligations apply — no regulatory, audit, or named security-risk signal is present in this initiative's scope.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Qualification-gate fix validated against a real case

| Field | Value |
|-------|-------|
| **What we measure** | Whether the revised `/programme` Step 0 qualification gate correctly passes `skills-platform-phase4`'s real historical profile while still rejecting a normal complex feature. |
| **Baseline** | Step 0's gate fails by construction today (`context.yml`: `meta.scope: "personal"`, `scaling.target_team_count: 1`) — `skills-platform-phase4` itself could not have passed it as currently written. |
| **Target** | The revised gate passes the `skills-platform-phase4` case (fail → pass) and still fails at least one normal multi-story feature from `pipeline-state.json` (pass → still fail, no false positive introduced). |
| **Minimum validation signal** | The gate passes the `phase4` case alone, even if the false-positive check against a normal feature hasn't been separately verified yet. |
| **Measurement method** | A before/after gate-logic check run directly against both cases, once story 2's patch lands. |
| **Feedback loop** | If the gate passes `phase4` but also starts passing normal features (a false positive), the fix is too loose and needs tightening before it ships. |

### Metric 2: Routing visibility for a genuine big-bet candidate

| Field | Value |
|-------|-------|
| **What we measure** | Whether `/orient` or `/discovery`'s own entry point surfaces `/programme` as an option when a new idea's framing matches transformative/multi-team/multi-phase signals. |
| **Baseline** | 0 routing states mention `/programme` today — confirmed by reading `/orient` and `/workflow` directly; it's reachable only via an explicit cold menu pick. |
| **Target** | At least 1 routing path surfaces `/programme` as an option under the right framing signals. |
| **Minimum validation signal** | Same as target — this is a binary existence check, not a graduated metric. |
| **Measurement method** | A routing-state count before vs. after, verified by re-reading the edited skill files once story 2 lands. |
| **Feedback loop** | If no routing path is added, re-confirm with the operator whether this was deliberately descoped or missed during `/definition`. |

---

## Tier 2: Meta Metrics (Learning / Validation)

### Meta Metric 1: Retrospective dry-run validity

| Field | Value |
|-------|-------|
| **Hypothesis** | `/programme`'s existing Step 0–6 design holds up end-to-end for a real top-down invocation, with at most targeted gaps — not a structural failure. |
| **What we measure** | A pass/fail/gap verdict recorded for each of the 7 steps, run retrospectively against `skills-platform-phase4`'s real historical artefacts. |
| **Baseline** | 0 of 342 tracked features have ever had `/programme` Step 0–6 run against them, even synthetically. |
| **Target** | "Validated" = the dry-run completes all 7 steps and finds only targeted, patchable gaps — no step reveals a structural redesign need. |
| **Minimum signal** | "Not invalidated" = the dry-run completes and produces an actionable, documented gap report at all, even if several steps show real gaps — the point of this metric is learning, not a specific pass rate. |
| **Measurement method** | The dry-run write-up artefact itself (story 1's output), read directly once produced. |

### Meta Metric 2: Bottom-up detection heuristic validity

| Field | Value |
|-------|-------|
| **Hypothesis** | Epic count (primary) plus `decisions.md` dependency density (secondary) can reliably distinguish genuine programme-candidates from normal complex features, having already dropped calendar timeline span as a signal (confirmed inverted during `/clarify`). |
| **What we measure** | True-positive/true-negative classification against the 2 known historical cases: `skills-platform-phase4` (5 epics) and `team-identity-roles` (1 epic). |
| **Baseline** | No detection mechanism exists at all today — a complete-absence baseline, not a false-positive-rate baseline. |
| **Target** | "Validated" = the script correctly classifies both seeded cases (true positive on `phase4`, true negative on `team-identity-roles`). |
| **Minimum signal** | "Not invalidated" = the script correctly classifies `phase4` as a true positive, even if the `team-identity-roles` true-negative check is borderline — the stronger signal (epic count) is the one actually load-bearing per the `/clarify` findings. |
| **Measurement method** | Script run against both known historical cases, pre-ship (story 3's own acceptance check). |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Qualification-gate fix validated against a real case | [Populated at /definition] | Gap — stories not yet written |
| Routing visibility for a genuine big-bet candidate | [Populated at /definition] | Gap — stories not yet written |
| Retrospective dry-run validity (meta) | [Populated at /definition] | Gap — stories not yet written |
| Bottom-up detection heuristic validity (meta) | [Populated at /definition] | Gap — stories not yet written |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
