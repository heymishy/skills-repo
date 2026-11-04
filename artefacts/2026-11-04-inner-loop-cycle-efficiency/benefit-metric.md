## Benefit Metric: Inner Loop Cycle Efficiency

**Discovery reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/discovery.md
**Date defined:** 2026-11-04
**Metric owner:** Hamish King — Product/Engineering (no separate non-engineering role exists in this solo-operator repo; inherits the self-review risk already logged in `decisions.md`)
**Reviewers:** None available for the same reason — solo-operator repo, no separate reviewer

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

Problem #4 from discovery (no repeatable measurement) is a tooling/process-capability goal, not a direct user outcome — tracked separately below as a meta metric. Problems #1-#3 are direct outcomes for the operator persona and are tracked as Tier 1 product metrics.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Review-dispatch active time per task

| Field | Value |
|-------|-------|
| **What we measure** | Real active wall-clock minutes per task for subagent-dispatched tasks in `/subagent-execution`, measured from each task's structured timing record (dispatch start → final review completion) |
| **Baseline** | 22.0 active minutes/task (bounded-window measurement from the session preceding this discovery, 13 stories / 46 tasks) |
| **Target** | A statistically real, sustained reduction vs. baseline — not a fixed percentage, since part of the 22.0-vs-direct-execution gap this session found may reflect task complexity rather than pure sequencing overhead |
| **Minimum validation signal** | At least a 10% reduction in average active-minutes/task, sustained across the first 10 dispatched tasks measured after shipping (not one lucky task) |
| **Measurement method** | Automatic — each `/subagent-execution` run appends its own timing to `.github/pipeline-timings.jsonl`; a small query script compares the rolling average to the 22.0 baseline. Measured by the pipeline itself, spot-checked by the operator at `/definition-of-done` for the implementing stories |
| **Feedback loop** | If the minimum signal isn't hit after 10 tasks, investigate whether discard-and-re-dispatch overhead (re-running code-quality review after a spec-fix) is eating the savings. Operator decides whether to keep, tune, or revert the parallelization — this is the revisit trigger already logged in `decisions.md` |

### Metric 2: Redundant full-suite reruns in `/branch-complete`

| Field | Value |
|-------|-------|
| **What we measure** | Whether `/branch-complete`'s test-verification step skipped a redundant full-suite rerun when a fresh `/verify-completion` result existed with no intervening commits — binary per story |
| **Baseline** | 0% skip rate today — always reruns, confirmed by reading the current SKILL.md |
| **Target** | 100% skip rate specifically among stories where the freshness condition is actually met (not 100% of all runs — only the subset where skipping is correct) |
| **Minimum validation signal** | The guard fires correctly (skips) on at least the first 3 stories after shipping where a fresh result genuinely exists |
| **Measurement method** | A skip/ran flag appended to `.github/pipeline-timings.jsonl` by `/branch-complete` itself on every run. Measured by the pipeline itself, reviewed by the operator at `/definition-of-done` |
| **Feedback loop** | If the guard doesn't fire correctly on the first 3 applicable stories, treat it as an implementation bug, not a design failure — fix and retest rather than abandon the approach |

### Metric 3: New occurrences of the merged-but-no-DoD gap

| Field | Value |
|-------|-------|
| **What we measure** | Count of stories where `prStatus=merged` and `stage != definition-of-done` beyond a reasonable age threshold, among stories merged **after** this feature ships |
| **Baseline** | 22 of 819 stories repo-wide as of 2026-11-04 — frozen as the starting count; these 22 are explicitly out of scope to fix (discovery, Out of Scope) |
| **Target** | 0 new occurrences among stories merged after this feature ships |
| **Minimum validation signal** | 0 new occurrences across the next 10 stories merged after shipping |
| **Measurement method** | The `/workflow` reconciliation check, run and surfaced prominently at session start. Measured automatically by the pipeline, reviewed by the operator each session |
| **Feedback loop** | If new occurrences keep appearing despite the check, escalate to the scheduled-CI-job alternative already named as the revisit trigger in `decisions.md` |

---

## Tier 2: Meta Metrics (Learning / Validation)

### Meta Metric 1: Repeatable baseline regeneration

| Field | Value |
|-------|-------|
| **Hypothesis** | Purpose-built structured logging, written at the source by each skill, is more reliable and cheaper to query than mining Claude Code's own session-transcript logs after the fact |
| **What we measure** | Whether the inner-loop timing baseline can be regenerated on demand from `.github/pipeline-timings.jsonl` records alone, reproducing consistent, trustworthy numbers |
| **Baseline** | `[UNKNOWN BASELINE]` — no structured timing data exists today; the only precedent is the session preceding this discovery's own ad hoc, partially-unreliable log archaeology (required a fork, multiple script rewrites, and still produced some contaminated numbers) |
| **Target** | Baseline regeneration takes a single small script run against `pipeline-timings.jsonl` — no raw Claude Code session-transcript mining required — and produces numbers free of the contamination patterns found this session (`gitBranch`/worktree mismatch, slug-citation contamination) |
| **Minimum signal** | Successfully regenerate Metric 1 (review-dispatch active time per task) from `pipeline-timings.jsonl` alone, for at least 5 real stories, with zero manual log archaeology |
| **Measurement method** | A regeneration script run once enough stories have shipped with the new instrumentation (at least 5-10). Measured by the operator, on demand — this is a "run it and see" metric, not continuously tracked |

---

## Tier 3: Compliance and Risk-Reduction Metrics

Not applicable. `context.yml` shows `meta.regulated: false`, no compliance frameworks configured, and no regulatory change, audit finding, or named operational/security risk motivates this feature.

---

## Metric Coverage Matrix

<!-- Populated by /definition once story slugs are known. -->

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1 — Review-dispatch active time | ilce-s3 (moves it); ilce-s1 (provides the measurement instrument) | Covered |
| Metric 2 — Redundant reruns eliminated | ilce-s2 | Covered |
| Metric 3 — New merged-but-no-DoD occurrences | ilce-s4 | Covered |
| Meta Metric 1 — Repeatable baseline regeneration | ilce-s1 | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
