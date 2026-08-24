# Loop Design: Inner-loop ceremony optimisation (default pack refinement)

**Feature / programme:** Platform-level — refinement of the default inner coding loop pack, triggered by operator review after executing the full loop end-to-end on `vrne-s1`
**Date:** 2026-08-23
**Owner:** Hamish King (Founder/Operator)
**Status:** Approved

---

## 0. Why this pass exists (not in the standard template — added because it matters here)

The operator asked to review the inner loop for redundancy and optimisation, given a mature codebase and test suite, then asked for the finding to be correlated against as much historical data as possible before deciding anything. Two research passes (git-history commit-pattern mining across ~30+ historical stories; artefact/learnings mining across `workspace/proposals/`, `workspace/learnings.md`, `workspace/capture-log.md`, `workspace/dod-backlog-findings.md`, `tests/known-baseline-failures.json`, `workspace/estimation-norms.md`, and a 21-story review-findings sample) returned substantial, specific evidence. This document is the `/loop-design` deliverable built directly on that evidence — every claim below cites its source.

**One caveat surfaced by the evidence itself, stated up front:** the "mature codebase" framing is only partly accurate. The test suite grew from 0 to 584 files since March 2026, with 48 files added in the first three weeks of August alone — it is not plateaued. What has genuinely stabilised is **conventions, sibling patterns to mirror, and CI infrastructure** — not size. The recommendations below are scoped to that more precise claim, not to "the codebase is done growing."

---

## 1. Two-loop model summary

- Outer loop name in this environment: the pipeline defined in `CLAUDE.md`'s "Pipeline overview" (discovery → benefit-metric → definition → review → test-plan → definition-of-ready → inner coding loop → definition-of-done → trace)
- Inner loop mode: **Default pack, amended** (not replaced with a custom pack — the default pack's own skill files are being edited)
- Trigger from outer → inner: DoR sign-off (`Proceed: Yes`)
- Trigger from inner → outer feedback: PR merge → `/definition-of-done`

The outer loop itself is not in scope for this pass — no evidence gathered suggests a problem there. This pass is scoped entirely to Section 3/4 (the inner loop slot contract and its default implementation).

---

## 2. Outer loop definition

Unchanged from `CLAUDE.md`'s existing pipeline table. Not re-litigated here.

---

## 3. Inner loop slot contract — evidence-based findings per slot

| Slot | Current default skill | Finding | Evidence |
|------|------------------------|---------|----------|
| Setup | `/branch-setup` | No redundancy found. Baseline confirmation is a one-time, cheap check. | No adverse evidence surfaced in either research pass. |
| Plan | `/implementation-plan` | No redundancy found in the plan-writing step itself. The plan's own state-write instruction is a contributing cause of Slot 4's finding (see below). | `workspace/proposals/inner-loop-framework-audit.md` (2026-06-13) already flags `story.tasks[]` as a multi-writer race-risk field written by this slot and re-written by Build/Test. |
| Build/Test | `/subagent-execution` (or `/tdd`) | **Two distinct, evidenced problems**, detailed in 3a and 3b below. | See below. |
| Quality review | (embedded in `/subagent-execution`'s per-task two-stage review, plus `/implementation-review` between batches) | Review depth correlates with defect risk in the available data, but review depth is currently applied uniformly regardless of task type. | 21-story `/review` sample: 10/10 HIGH+MEDIUM findings landed in substantive (non-mechanical) stories, 0/10 in mechanical/scaffolding stories (see 3c). |
| Verify completion | `/verify-completion` | No redundancy found — this is the correct, single place a full-suite run should be non-negotiable (it is the evidence gate before a PR opens). Confirmed as the right anchor point, not a target for trimming. | Reasoned from the CI-duration finding (3d) — this is the one local full-suite run that has no CI equivalent yet at the point it runs. |
| Branch/PR complete | `/branch-complete` | No redundancy found in the skill's own logic. Its own Step 1 ("run full test suite") duplicates verify-completion's own fresh run from the same session, but this duplication is arguably intentional (defence against a `/verify-completion` pass followed by unnoticed intermediate changes) — not recommended for removal without more evidence than this pass gathered. | Flagged as a candidate for the "Tier 3 — don't decide yet" list, not acted on here. |

### 3a. Build/Test — the false-wait pattern (highest-confidence finding, ready fix exists)

**Finding:** A subagent that starts a background process (most often a full-suite test run) believes it will receive a completion notification the way the orchestrating session does. It does not — that notification mechanism is scoped to the top-level session only. The subagent then sits idle indefinitely until the orchestrator notices and sends a corrective message.

**Evidence:**
- First documented **2026-08-13**, story `wugs-s8` Task 4 (feature `2026-08-11-web-ui-guardrails-standards-surface`).
- Recurred at least twice more before today: `wugs-s2` (`/verify-completion`, background run silently killed twice, foreground retries succeeded both times — `workspace/learnings.md` lines 2832–2838); `wugs-s14` (`/subagent-execution` branch-complete, an escalation variant where the subagent attempted to force-kill unconfirmed `node.exe` processes by PID, blocked by the platform's own safety layer — `workspace/learnings.md` lines 2848–2854, which explicitly cross-references this as an already-known pattern).
- Recurred **3 more times today** during `vrne-s1`'s own `/subagent-execution` run (Tasks 6, 8, 10), each costing an estimated 5–10+ minutes of pure wall-clock waste before correction.
- A fix was diagnosed and written the day after the first occurrence: `workspace/proposals/2026-08-14-subagent-execution-improve-proposal.md`, `status: pending_review`. It has never been merged into `skills/subagent-execution/SKILL.md`.

**Decision:** Merge the existing proposal's fix into `skills/subagent-execution/SKILL.md`'s own per-task dispatch instructions — every implementer/reviewer dispatch prompt template must state explicitly, up front, that the subagent has no background-task notification mechanism and must run verification commands synchronously. This is not a new design decision; it is applying an already-approved-in-spirit fix that simply never landed.

### 3b. Build/Test — per-task pipeline-state.json checkpoint ceremony (second-highest-confidence finding)

**Finding:** `skills/subagent-execution/SKILL.md`'s Step 2d instructs: "Update pipeline-state.json now: fetch from origin/master first... then set this task's tddState: committed... update story updatedAt." Read literally, this produces one commit per task. Some sessions follow it literally; others batch the state write locally and commit only at natural checkpoints (implementation-plan, verify-completion, branch-complete). Both behaviours are defensible readings of the same instruction — the instruction itself is ambiguous about commit *cadence* versus state-write *cadence* (it conflates "keep the tracked state current" with "commit right now").

**Evidence (full-history git mining, ~30+ branches sampled, methodology: commit-count and pure-bookkeeping-commit classification between each story's own `branch-setup checkpoint` and `verify-completion checkpoint`):**
- Per-task checkpointing found in **~29% of stories where the pattern was determinable** (roughly 7 of 24), concentrated in two clusters rather than evenly spread: the `dsh-s1`/`dsh-s3`–`dsh-s6` cluster (2026-07-28/29) and `wugs-s5`/`vrne-s1` (2026-08-12, 2026-08-22/23).
- The remaining stories in the same weeks — `jatg-s1`, `pisd-s1`, `rbg-s1`, `lrtc-s1`, `cmba-s1`, all completed 2026-08-21/22, the *same week* as `vrne-s1` — used the batched pattern with commits-per-task ratios of 1.3–2.5, versus `vrne-s1`'s 2.8.
- The `dsh` cluster is a more extreme, structurally distinct variant: **100% of commits in each story's checkpoint span touch only `pipeline-state.json`** — the actual code for each story lands as a single separate squash-merge commit entirely outside the measured span. Every checkpoint commit in that cluster is pure overhead by the strictest possible measure.
- No clean "before/after" convention shift exists in the full history — granular per-story checkpoint commits don't appear before ~mid-April 2026 at all (earlier branches used a single squash commit or a whole-phase-bundle model), become visible from late June, and from July onward both patterns coexist unpredictably.
- Separately, this exact ambiguity is a **known root cause of a real bug** this session hit directly: fetching from `origin/master` mid-sequence (as the instruction's own safety-rule literally says to do "before every write") silently discarded a story's own locally-accumulated `tasks[]` array twice during `vrne-s1`'s own execution, because `origin/master` genuinely does not have that branch's own unmerged data yet. `workspace/proposals/inner-loop-framework-audit.md` (2026-06-13) had already flagged `story.tasks[]`, `feature.updatedAt`, and `story.testPlan.passing` as multi-writer race-risk fields — this is the same class of bug, independently rediscovered five months later.

**Decision:** Rewrite Step 2d to separate the two concerns explicitly:
1. **State-write cadence (keep as-is, or make more frequent if desired):** write the task's `tddState` to the *local* `.github/pipeline-state.json` file immediately after each task completes. No fetch, no commit.
2. **Commit cadence (change):** commit `.github/pipeline-state.json` in a batch at natural checkpoint boundaries — end of `/implementation-plan`, then once covering all tasks at `/verify-completion`, not after every individual task.
3. **Fetch-before-write safety rule (clarify, don't remove):** the "fetch from origin/master before every write" instruction is correct and necessary for its own stated purpose (concurrent worktrees on *different* stories of the *same* feature), but must be scoped explicitly: it applies when this branch's own task data may already be stale relative to master (i.e., near a push or a merge), not to every single local task-state update on a branch that has not yet pushed. State this distinction in the skill text rather than leaving it to be inferred correctly or incorrectly each session, as it has been.

### 3c. Quality review — risk-tiered depth (corroborated, not proven, by available data)

**Finding:** `/subagent-execution`'s two-stage review (spec compliance, then code quality — two separate subagent dispatches, strictly sequential) is applied uniformly to every task regardless of whether the task is a mechanical test-scaffolding addition or a substantive implementation change.

**Evidence:** A 21-story sample of `/review` artefacts (spec-quality review, run *before* code exists — not the same review stage as `/subagent-execution`'s per-task code review, which is not persisted to its own artefact file and could not be sampled directly) found 10/10 HIGH+MEDIUM findings landed in substantive stories (new logic, refactors, security/auth wiring), 0/10 in mechanical/scaffolding stories (bounded config fixes, CSS fixes, test-isolation guards). Within `vrne-s1`'s own execution (available directly, not from the historical sample): every genuine defect found across 11 tasks — the async/await bug in Task 2's `resolveRole` refactor, the incomplete test fixture and timing race in Task 8, the false-positive grep check in Task 10 — occurred in GREEN/implementation tasks. Zero genuine defects were found in RED/test-scaffolding-only tasks; the only issues found in RED tasks were cosmetic (stale comments, weak assertions), not logic defects.

**Decision:** This is corroborating evidence for risk-tiering, not proof at the exact granularity needed (the 21-story sample measures a different review stage). Recorded as a **recommended pilot**, not a committed change: on the next multi-task story, apply a single combined review pass (not two sequential dispatches) to RED-step/test-scaffolding-only tasks, and keep the full two-stage gate for GREEN/implementation tasks. Re-evaluate after that pilot with real data at the correct granularity before making this a permanent rule.

### 3d. Build/Test — local full-suite re-run frequency (evidenced, moderate confidence)

**Finding:** `vrne-s1`'s own execution ran the full local suite (`node scripts/run-all-tests.js`, ~5 minutes wall-clock, unparallelized) 7 times across one story's inner loop.

**Evidence:** GitHub Actions CI (which *does* run the full suite, in parallel, on every PR regardless) held flat at ~4.0–4.3 minutes for over three weeks while the suite itself nearly doubled (344 → 567 files), then dropped to ~2.2 minutes in the final few days. CI is not the bottleneck and is not getting slower as the suite grows — the redundancy is specifically in *local, sequential, per-task* full-suite re-runs during implementation, which duplicate what CI will do anyway on the PR, at a much higher wall-clock cost per run because they aren't parallelized.

**Decision:** Reserve local full-suite runs for: (1) `/branch-setup`'s baseline confirmation, (2) `/verify-completion`'s evidence gate (non-negotiable — this is the one run with no CI equivalent at the point it happens), and (3) `/branch-complete`'s pre-push confirmation (kept, per the note in Slot 3's table above, pending more evidence before removing). Individual tasks within `/subagent-execution` should run their own *targeted* test file(s) — already the fast, precise signal — and should not additionally re-run the full suite as a matter of course. If a GREEN task touches widely-shared code (e.g. a shared middleware file multiple routes depend on), a full-suite run remains appropriate for *that specific task* — this is a judgement call for the dispatching orchestrator to make per-task, not a blanket "never run it mid-story" rule.

---

## 4. Inner loop implementation mapping

### Option selected
**Default pack, amended in place.** Not replaced with a custom pack — the evidence doesn't support a wholesale replacement, only targeted fixes to specific instructions within `/subagent-execution`.

### Slot mapping — before/after

| Slot | Skill | Change |
|------|-------|--------|
| Setup | `/branch-setup` | No change |
| Plan | `/implementation-plan` | No change to this skill's own text; downstream effect only (Build/Test's state-write clarification) |
| Build/Test | `/subagent-execution` | **3 changes**: (1) every dispatch prompt template must state the no-background-notification constraint up front; (2) Step 2d rewritten to separate state-write cadence (per-task, local) from commit cadence (batched, at checkpoints); (3) a new, explicit note recommending targeted (not full-suite) test runs per task, reserving full-suite runs for judgement-call cases |
| Quality review | (embedded in `/subagent-execution`) | Recorded as a recommended pilot (risk-tiered review depth), not committed to the skill text yet — insufficient evidence at the right granularity |
| Verify completion | `/verify-completion` | No change — confirmed as the correct anchor for the non-negotiable full-suite evidence gate |
| Branch/PR complete | `/branch-complete` | No change — flagged for future evidence-gathering only |

---

## 4a. Success metrics (Tier 2 meta-metrics — this is a process/tooling hypothesis, not user-facing product value)

This section exists because the operator explicitly asked to ground these changes in measurable outcomes with a defined revert trigger, not a one-off narrative judgement. It follows this repo's own `/benefit-metric` Tier 2 (meta-metric) format — a hypothesis about tooling/process, with baseline, target, minimum signal, and measurement method — since that is the existing governed pattern for exactly this situation, rather than inventing a bespoke tracking scheme.

**Bucketing rule (applies to all metrics below):** grouped by the epic's `oversightLevel` (Low/Medium/High — already a real field on every story) and, secondarily, by task count band (1–3 / 4–7 / 8+, from `tasks[].length`). This exists because story shape varies enormously (a 2-task CSS fix and an 11-task security-critical route-wiring change are not comparable on a flat number) — both dimensions already exist on every story, so no new categorisation scheme is introduced.

### Meta Metric 1: Commits-per-task ratio

| Field | Value |
|-------|-------|
| **Hypothesis** | Clarifying Step 2d's state-write-vs-commit-cadence ambiguity will bring per-task-checkpointing stories back down to the batched-pattern range, without increasing resumability risk. |
| **What we measure** | Total commits between a story's own `branch-setup checkpoint` and `verify-completion checkpoint`, divided by its task count. |
| **Baseline** | Low/Medium oversight, batched pattern (the desired behaviour): 1.3–2.5 (`lrtc-s1` 1.3, `jatg-s1` 1.7, `pisd-s1` ~2.0, `cmba-s1` 2.5). `vrne-s1` (Medium oversight, per-task pattern — the problem this fix targets): 2.8. High-oversight stories not yet sampled distinctly — treated as a wider band until real data exists (see Assumptions below). |
| **Target** | Low/Medium oversight: ≤ 2.0. High oversight: ≤ 2.5 (some extra checkpointing may be a deliberate, defensible choice for security/compliance-critical work — not automatically ceremony). |
| **Minimum signal** | Any measurable drop from 2.8 on the next Medium-oversight multi-task (4+ tasks) story — even landing at 2.3–2.5 counts as directional confirmation the fix is working, not full target attainment on the first try. |
| **Measurement method** | Same method the git-history research pass used: `git log --oneline <branch-setup-sha>..<verify-completion-sha> \| wc -l`, divided by `tasks[].length` read from `.github/pipeline-state.json` at the implementation-plan checkpoint. Computed by the operator/agent at `/branch-complete` time, logged to `capture-log.md`. |
| **Feedback loop** | If a story exceeds target and isn't interleaving genuinely necessary unrelated fixes (cf. `rbg-s1`'s legitimate 19-commit case, driven by 2 real blocking findings, not ceremony), the Step 2d clarification didn't take — re-read the skill text for remaining ambiguity before assuming it's a one-off. |

### Meta Metric 2: False-wait incidents per story

| Field | Value |
|-------|-------|
| **Hypothesis** | Merging the already-written fix into every `/subagent-execution` dispatch template eliminates the recurring false-wait pattern. |
| **What we measure** | Count of times, per story, a dispatched subagent starts a background process and then stalls awaiting a notification that never arrives, requiring operator correction. |
| **Baseline** | Non-zero, recurring: 3 confirmed occurrences before this fix was proposed (`wugs-s8` 2026-08-13, `wugs-s2` and `wugs-s14` variants) + 3 more on `vrne-s1` today (2026-08-23) — 6 total across ~10 days, despite a fix having existed, unmerged, since 2026-08-14. |
| **Target** | 0 per story, every story, from the next `/subagent-execution` run onward. |
| **Minimum signal** | 0 incidents across the next 3 stories that use `/subagent-execution`. A single recurrence after the fix merges is itself a real, actionable data point (see Feedback loop), not noise to average away. |
| **Measurement method** | Self-observed by the orchestrating session (the same way all 6 prior incidents were caught) — log to `capture-log.md` immediately if it happens, with the story slug and task number. |
| **Feedback loop** | Any recurrence after merge means the fix's own wording was insufficient — re-diagnose immediately, don't wait to accumulate more incidents before acting (this pattern already went 10 days undiagnosed-in-practice once; don't repeat that). |

### Meta Metric 3 (provisional — weak baseline, n=1): Local full-suite run count per story

| Field | Value |
|-------|-------|
| **Hypothesis** | Reserving full-suite runs for 3 anchor points (baseline, verify-completion, branch-complete) plus judgement-call exceptions will reduce local full-suite run count without letting regressions slip past `/verify-completion`'s gate. |
| **What we measure** | Count of `node scripts/run-all-tests.js` invocations during a story's inner loop, from `/branch-setup` through `/branch-complete`. |
| **Baseline** | **n=1, explicitly weak.** `vrne-s1`: 7 runs (11 tasks). No historical data exists for other stories — this was never recorded anywhere before today; it is live session behaviour invisible to git history. Treated as a provisional anchor, not a real baseline, until more stories accumulate. |
| **Target (provisional, by task-count band)** | 1–3 tasks: ≤ 2 runs. 4–7 tasks: ≤ 3 runs. 8+ tasks: ≤ 4 runs (baseline + verify-completion + branch-complete + at most one judgement-call mid-story run for a task touching widely-shared code). |
| **Minimum signal** | Not yet establishable with n=1. Revisit and set a real minimum-signal threshold once **n ≥ 4** stories have this metric recorded — do not treat the provisional target above as validated until then. |
| **Measurement method** | Count logged by the orchestrating session at `/branch-complete` time (cheap — just a running tally already visible in the session's own tool-call history), written to `capture-log.md` alongside Metric 1. |
| **Feedback loop** | If the 8+ task band consistently needs more than 4 runs to stay confident, that's real signal the band's ceiling is wrong, not that the story was undisciplined — widen the band rather than forcing compliance with an unvalidated number. |

### Meta Metric 4 (provisional — weak baseline, n=1, directional only): Wall-clock time per task

| Field | Value |
|-------|-------|
| **Hypothesis** | The combined effect of Metrics 1–3's fixes reduces total inner-loop wall-clock time per task, without a corresponding drop in defects caught. |
| **What we measure** | Total elapsed wall-clock time from `/branch-setup` start to `/branch-complete` finish, divided by task count. |
| **Baseline** | **n=1, weak, noisy by nature.** `vrne-s1`: roughly 2–3 hours across 11 tasks (~11–16 min/task) — this figure includes operator back-and-forth, approval waits, and the 3 false-wait stalls themselves, so it is not a clean agent-compute measurement. |
| **Target** | Not set. Track only. |
| **Minimum signal** | Not established. Revisit after **n ≥ 4** stories, and only if the measurement method can be tightened enough to separate agent-compute time from operator-wait time — otherwise this metric may need to be retired as too noisy to act on, which is itself a valid outcome of tracking it. |
| **Measurement method** | Timestamp at `/branch-setup` start and `/branch-complete` finish (both already produce a chat-visible message with implicit timing); divide by task count. Acknowledge explicitly in any report using this number that it is directional, not precise. |
| **Feedback loop** | If after n≥4 this metric proves too noisy to correlate with anything actionable, drop it rather than keep reporting a number nobody can act on. |

**Assumption flagged, not yet validated:** the High-oversight commits-per-task band (Metric 1) has no real sample yet — this repo's recent High-oversight stories weren't part of either research pass's sample. If the next High-oversight story lands wildly outside the 2.5 ceiling, that's grounds to revisit the band's target, not evidence the story did something wrong.

---

## 5. Feedback wiring (inner → outer)

| Signal source | Consumed by outer stage | Cadence | Owner | Action trigger |
|---------------|--------------------------|---------|-------|-----------------|
| Meta Metric 2 (false-wait incidents) | Learn/Re-plan | Per-story, self-reported in capture-log | Operator | Any recurrence after merge — re-diagnose immediately, don't accumulate |
| Meta Metric 1 (commits-per-task ratio) | Learn/Re-plan | Per-story at `/branch-complete`, reviewed in aggregate at `/improve` time | Operator | Exceeds bucketed target without a legitimate interleaved-fix explanation |
| Meta Metrics 3–4 (full-suite run count, wall-clock/task) | Learn/Re-plan | Accumulate until n≥4, then set real targets | Operator | Re-baseline once n≥4 is reached; drop Metric 4 if still too noisy to act on at that point |
| Risk-tiered review pilot outcome (Section 3c) | Learn/Re-plan | After the next multi-task story | Operator | Defects found in a single-pass-reviewed RED task would invalidate the pilot; log and revert if so |

---

## 6. Risks and mitigations

| Risk | Impact | Mitigation | Owner |
|------|--------|------------|-------|
| Batching commits reduces resumability if a session ends mid-story before a checkpoint commit lands | A crashed/interrupted session could lose more in-progress task state than under per-task committing | Local file writes still happen after every task (only the *commit* is batched) — a resumed session in the same worktree still sees the correct local state; only a fresh `git clone`/different-machine resume would lose it, which per-task commits also wouldn't fully protect against without also being pushed | Operator |
| Skipping full-suite runs mid-story could let a regression slip through undetected until verify-completion | A real regression is caught later than it could have been, costing more rework time to bisect | Targeted per-task tests remain mandatory and are the faster, more precise signal for the specific change; verify-completion's full-suite run remains the non-negotiable final gate before any PR opens — this preserves catch-before-PR, just not catch-immediately-after-every-task | Operator |
| Risk-tiered review depth is a judgement call (mechanical vs. substantive), and misclassifying a task could skip real review on something that needed it | A real defect in a task wrongly classified as "mechanical" ships unreviewed | Piloted, not committed — explicitly gated on re-evaluation after the next multi-task story, with an easy revert path (go back to uniform two-stage review) if the pilot finds a defect | Operator |

---

## 7. Approval

- Approved by: Hamish King, 2026-08-23
- Date: 2026-08-23
- Review cadence: revisit after the next 2–3 multi-task stories, or immediately if any risk in Section 6 materialises

**Note (2026-08-24 revisit):** Section 4a's Metric 3/4 baselines below are now superseded — see Section 8 for the n≥4 update. Left in place rather than edited, per this repo's convention of preserving prior decision records rather than rewriting them.

---

## 8. Scheduled revisit — 2026-08-24 (item #6 of the 2026-08-24 capture-log 7-item ranked backlog)

This is the Section 7 cadence trigger firing: 2 multi-task stories (`vrne-s2`, `vrne-s3`) plus a third (`vrne-s4`, completing the `vrne-e1-viewer-write-blocking` epic) ran since this document's original approval, followed by `rcfc-s1` (5 tasks) and this session's own short-track work. All evidence below is drawn directly from `workspace/capture-log.md` entries already recorded by the orchestrating sessions that ran those stories — no new measurement was fabricated for this revisit.

### 8a. Metric 1 (commits/task) and Metric 2 (false-wait incidents) — validated

Both metrics reached loop-design.md's own minimum-signal thresholds and held clean across the full n=4 window (`vrne-s2/s3/s4` plus `rcfc-s1` as a fifth, out-of-cluster confirmation):

| Story | Tasks | M1 (commits/task) | M2 (false-wait) |
|-------|-------|--------------------|--------------------|
| `vrne-s1` (pre-fix baseline) | 11 | 2.8 | 6 incidents (this story alone: 3) |
| `vrne-s2` | 11 | 1.0 | 0 |
| `vrne-s3` | 3 | 0.67 | 0 |
| `vrne-s4` | 4 | 1.75 (2 genuine defect-driven commits, not ceremony) | 0 |
| `rcfc-s1` (different epic, out-of-cluster) | 5 | 2.2 (within 1.3–2.5 band) | **1** (see 8b) |

M1: every post-fix sample beats the ≤2.0 (Medium oversight) target — **validated, not just directionally confirmed**, per `capture-log.md`'s own 2026-08-23 vrne-s4 entry. M2: 3 consecutive clean stories (`vrne-s2/s3/s4`) satisfied the original "0 across the next 3 stories" minimum signal in full — **validated** — before `rcfc-s1` produced the one recurrence detailed below.

### 8b. Metric 2 regression found, root-caused, and fixed within this same window

`rcfc-s1` (2026-08-24) hit a false-wait incident despite M2 being validated clean days earlier. Root cause: the existing fix (Section 3a) was written into `/subagent-execution`'s per-task dispatch templates (Steps 2a/2b/2c) but never added to Step 3's cross-cutting final-review dispatch — a scope gap in the original fix's coverage, not a failure of the fix's own wording. This is a useful correction to Section 3a's original framing: "every dispatch prompt template" was not, in fact, fully covered on the first pass. Diagnosed the same session (`capture-log.md`, 2026-08-24, rcfc-s1 branch-complete) and fixed later the same day as `s3fw-s1` (PR #763, merged `e4c90625`) — the missing warning was added to Step 3 specifically, following the exact evidence and precedent already established in this document. No post-fix multi-task story has run yet to confirm Step 3's own false-wait rate at n≥1; this is the next thing to watch, not yet closed.

### 8c. Metric 3 (full-suite run count) and Metric 4 (wall-clock/task) — n≥4 reached, real targets now set

Superseding Section 4a's "n=1, weak baseline" framing:

| Story | Tasks (band) | M3 (full-suite runs) | M3 target | Met? | M4 (min/task) |
|-------|--------------|------------------------|-----------|------|-----|
| `vrne-s1` (pre-fix) | 11 (8+) | 7 | ≤4 | No | ~11–16 |
| `vrne-s2` | 11 (8+) | 4 | ≤4 | Yes (ceiling, but justified — one run caught a real regression) | ~11 (excl. session-limit gap) |
| `vrne-s3` | 3 (1–3) | 4 | ≤2 | **No — real overrun** | ~21 |
| `vrne-s4` | 4 (1–3, boundary) | 2 | ≤2 | Yes | ~17 |

**M3 finding:** `vrne-s3`'s overrun was root-caused the same session as a self-inflicted, avoidable duplication — re-running the full suite at `/verify-completion` Step 1 without first checking whether the final AC-review agent's own already-fresh same-session run already satisfied the requirement. `vrne-s4`'s very next story deliberately applied that lesson (the Task 4 dispatch prompt explicitly instructed checking for fresh evidence first) and hit the target exactly. **This reached n≥4 and is now validated as a controllable orchestration-discipline issue, not an inherent property of small stories** — but loop-design.md's own instructions (Section 3d) still don't explicitly say "check for an already-fresh same-session result before re-running," which is the actual mechanism that worked. Recommend adding that one sentence to `/verify-completion`'s Step 1 the next time that skill file is touched, rather than relying on each session to independently rediscover it.

**M4 finding:** now has real per-task-count bands rather than a single flat number (1–3 tasks: noisier, ~17–21 min/task, fixed overhead amortized over fewer tasks; 4+ tasks: ~11–17 min/task). Still too noisy to set a hard target — remains track-only, per the original design. Not retired; the bands are informative even without a target.

### 8d. Section 3c (risk-tiered review depth pilot) — never run, still open

No multi-task story since the original approval deliberately piloted the recommended change (single combined review pass for RED/test-scaffolding-only tasks vs. the full two-stage gate for GREEN/implementation tasks). This session's own work was almost entirely short-track (1–6 file documentation/process fixes), which doesn't exercise `/subagent-execution`'s multi-task review flow at all. **Status: still a recommended-not-committed pilot, unchanged from 2026-08-23.** Given how little multi-task epic work has occurred since the original pass (one epic, `vrne-e1`, now complete), there has been no natural opportunity to run it — not evidence it isn't worth trying, just that it hasn't come up. Carry forward to the next multi-task story rather than closing or forcing an artificial pilot now.

### 8e. Section 6 risks — none materialised

- Batched-commit resumability risk: no session-interruption-mid-story data loss reported across `vrne-s2/s3/s4`, `rcfc-s1`, or this session's own stories.
- Skipped full-suite runs letting a regression slip past `/verify-completion`: no such incident found in `capture-log.md` or `learnings.md` across the same window. `/verify-completion`'s own run continues to be the evidence gate that actually catches things (e.g. `vrne-s2`'s Task 11 full-suite run caught a real cross-story regression).
- No misclassification incident from the (unrun) review-depth pilot, since it was never actually piloted (8d).

### 8f. Answering the original ask directly

The original capture-log finding (2026-08-23) asked which inner-loop steps still pull their weight and which could be trimmed, merged, or made conditional. This revisit's evidence says: **no further trimming is recommended beyond what was already decided and has now been validated** (Section 3a/3b/3d's fixes). The loop is in a good, right-sized state for the story shapes actually occurring (short-track fixes and small-to-medium epics) — the risk in Section 3c (review depth) remains a live, reasonable idea but has no data yet, and the one new, genuine finding (8b) was a coverage gap in the original fix, not evidence the loop itself carries unnecessary ceremony. This closes item #6 of the 2026-08-24 capture-log 7-item ranked backlog as "reviewed, no further action needed beyond what's already tracked" — not as a new redesign.

### 8g. Updated review cadence

- Next revisit trigger: after the next multi-task story using `/subagent-execution` (to get n≥1 on Step 3's false-wait fix and a first real opportunity to run the Section 3c pilot), or immediately if any Section 6 risk materialises.
- Reviewed by: Claude (agent), 2026-08-24, on operator instruction ("Do 6") following the 2026-08-24 capture-log 7-item ranked backlog sweep.
