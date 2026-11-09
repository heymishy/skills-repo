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
| **Baseline** | `[CORRECTED 2026-11-09 at /definition]` Step 0 is a conversational Q1–Q4 gate (team count, cross-team dependencies, phase gates, consumer migration) — it never reads `context.yml` (confirmed by direct grep against `skills/programme/SKILL.md`). Answered honestly for phase4's real history, it fails every scoring signal today — correct gate behaviour for a genuinely single-team effort, not a bug, but with no structured path for a solo-operator effort that is still programme-scale in epic count. |
| **Target** | A new epic-count-based signal added to Step 0's scoring table (reusing story 3's own validated primary signal) passes the `skills-platform-phase4` case (fail → pass) and still fails at least one normal multi-story feature from `pipeline-state.json` (pass → still fail, no false positive introduced). |
| **Minimum validation signal** | The gate passes the `phase4` case alone, even if the false-positive check against a normal feature hasn't been separately verified yet. |
| **Measurement method** | A before/after gate-logic check run directly against both cases, once story 2's patch lands. |
| **Feedback loop** | If the gate passes `phase4` but also starts passing normal features (a false positive), the fix is too loose and needs tightening before it ships. |

### Metric 2: Routing visibility for a genuine big-bet candidate

| Field | Value |
|-------|-------|
| **What we measure** | `[CORRECTED 2026-11-09 at /definition]` Whether `/workflow`'s existing `/programme` routing defers to Step 0 rather than duplicating it, and whether `/orient` gains the cross-reference it currently lacks. |
| **Baseline** | Wrong as originally stated — `/workflow` already has substantial `/programme` routing (option 5 of its route selector, a Complex-track signal, and an informal Q1–Q4-equivalent pre-check that duplicates Step 0's own gate logic almost exactly). Only `/orient` genuinely has 0 mentions, confirmed by direct grep. |
| **Target** | `/workflow`'s pre-check defers to `/programme`'s Step 0 instead of duplicating its questions (removing the duplication-drift risk); `/orient` gains ≥1 cross-reference to `/programme` under transformative/multi-team/multi-phase framing. |
| **Minimum validation signal** | The `/orient` cross-reference alone, even if the `/workflow` de-duplication isn't completed in the same story — it's the more clearly net-new, binary piece. |
| **Measurement method** | Re-reading `/workflow`'s edited section to confirm it defers rather than duplicates; a routing-state count for `/orient` specifically — 0 today, ≥1 after. |
| **Feedback loop** | If `/workflow`'s duplication is left in place, log why (e.g. a deliberate UX choice to keep a fast inline pre-check) rather than silently leaving two gates to drift apart unexplained. |

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
| Qualification-gate fix validated against a real case | pep-s2 (patch), informed by pep-s3 (signal source) | Covered |
| Routing visibility for a genuine big-bet candidate | pep-s2 | Covered |
| Retrospective dry-run validity (meta) | pep-s1 | Covered |
| Bottom-up detection heuristic validity (meta) | pep-s3 | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
