# Discovery: Inner Loop Cycle Efficiency

**Status:** Approved
**Created:** 2026-11-04
**Approved by:** Hamish King — 2026-11-04
**Author:** Copilot

---

## Problem Statement

The inner loop (`/branch-setup` → `/implementation-plan` → `/subagent-execution` → `/verify-completion` → `/branch-complete` → `/definition-of-done`) has three concrete inefficiencies, each backed by real evidence gathered in the session that produced this discovery:

1. `/subagent-execution` runs spec-compliance review and code-quality review strictly sequentially per task, even though spec review passes clean the majority of the time at every Complexity Rating (56-83% depending on complexity) — the sequential dependency only pays for itself in the minority case where spec review fails.
2. `/branch-complete` has no "skip if fresh" guard for its test-verification step, unlike `/verify-completion` which already has one — causing a redundant full-suite rerun back-to-back with no intervening commits.
3. 22 of 819 stories across the repo are merged (`prStatus: merged`) but never reached `/definition-of-done` — including `fhff-s1/s2/s3` from the same session — because the handoff from `/branch-complete` to `/definition-of-done` is documented as a note in the SKILL.md text, not structurally enforced.

A fourth, independent problem underlies all three: **there is no cheap, repeatable way to measure inner-loop cycle time against a baseline.** Finding evidence for the three fixes above required ad hoc archaeology across raw Claude Code session-transcript logs (1.9GB of `.jsonl` across 5 files) — and that method proved genuinely unreliable: `gitBranch`-based attribution silently fails because this repo uses isolated git worktrees, and slug-text-matching produces false attribution when a story's slug is cited in later, unrelated sessions (confirmed: a story that merged in July showed 43 fabricated "active hours" purely from later citations). Without structured, purpose-built instrumentation, nobody can repeat this measurement next time without redoing the same expensive, error-prone log archaeology — so improvements against a baseline can't be verified empirically going forward.

## Who It Affects

**Primary persona: the operator running the inner loop** (currently Hamish King, acting as both product owner and implementer on this repo). This persona directly bears the cost of all four problems — waiting through a redundant test rerun in `/branch-complete`, waiting through a sequential code-quality review pass on code that spec-compliance review is about to reject anyway, manually having to remember to run `/definition-of-done` on already-merged stories with no system prompt to do so, and — when investigating any of this — having to do slow, error-prone manual log archaeology instead of reading a baseline report.

**Secondary persona: future consumers of this skills platform.** Per the platform's own stated purpose ("an open-framework, governed software delivery pipeline... from a single developer... to many teams... across a regulated enterprise"), any other team or operator who adopts this repo's `skills/` directory inherits the same sequencing defects and the same lack of repeatable measurement — so a fix here compounds in value as adoption grows, not just for this repo's own future stories.

## Why Now

Problem #3 (merged-but-no-DoD) is accumulated pain reaching a tipping point, not a new discovery: 22 stories across the repo are already stuck in this state, the count only grows over time since nothing currently stops it, and `fhff-s1/s2/s3` — merged in the same session that produced this discovery — are live current instances of it right now. The other two sequencing defects (#1 sequential review, #2 missing freshness guard) compound on every single story that goes through the inner loop, so the cost of leaving them unfixed scales with however many more stories get built — it doesn't shrink on its own.

Practically, acting now is also cheaper than acting later: the session immediately preceding this discovery did the empirical work (the contamination-resistant timing baseline, the review-finding-rate audit, the SKILL.md cross-reference) that turns these from a hunch into evidence, so the reasoning is documented and fresh rather than needing to be re-derived in a future session.

## MVP Scope

**MVP (first epic to build and ship):** instrumentation (#4) + `/branch-complete`'s missing freshness guard (#2), as the validation slice — it mirrors a pattern that already works in `/verify-completion`, so it's lowest-risk, and gives a clean before/after signal to prove the instrumentation produces a trustworthy baseline before the riskier changes build on it.

**Sequenced after MVP, not cut from scope:** the `/subagent-execution` review-parallelization fix (#1 — biggest expected saving, riskiest behavior change, wants the proven instrumentation first) and the DoD-handoff structural enforcement (#3 — well-scoped and independent, no reason it couldn't run in parallel with #1 once MVP validates the approach). Both will be defined as stories, likely under their own epics, at `/definition` — this discovery's scope covers all four problems; MVP just orders the delivery.

## Out of Scope

- **Human-availability/focus-driven wait time** — and why excluded: explicitly excluded per the operator's own framing — this is about sequencing/orchestration defects in the skills themselves, not about when the operator is available or focused. Nothing here changes human response-time behavior.
- **Complexity-scaled review depth** (skipping or lightening spec-compliance/code-quality review for low-Complexity-Rating stories) — and why excluded: already tested and rejected in the session preceding this discovery, with real evidence — Complexity-1 stories caught real findings at 44%, higher than Complexity-2's 17% — so revisiting this lever is explicitly out of scope.
- **Retroactively backfilling `/definition-of-done` for the 22 already-identified merged-but-no-DoD stories** (including `fhff-s1/s2/s3`) — and why excluded: that's one-time operational cleanup, separate from building the structural mechanism that prevents future recurrence — the mechanism is in scope, clearing the existing backlog is not.
- **Lowering review rigor or changing what spec-compliance/code-quality review check** — and why excluded: this feature changes *when* and *how* the two review dispatches run (parallel vs. sequential), not *what* they evaluate or their pass/fail bar.

## Assumptions and Risks

**Assumptions:**
[RESOLVED via /clarify, 2026-11-04] Parallelizing spec-compliance and code-quality review dispatches is safe, with one required mechanism: run both in parallel by default; when spec-compliance requires a fix, discard the code-quality result (it was evaluated against pre-fix code and may be stale) and re-dispatch code-quality review against the post-fix code. This must be an explicit step in `/subagent-execution`'s SKILL.md, not an implicit assumption — pure "run both in parallel, keep both results unconditionally" was rejected as unsafe (a fix could introduce a new quality issue invisible to the original pre-fix review).
[RESOLVED via /clarify, 2026-11-04] The DoD-handoff enforcement check is built as a reconciliation check inside `/workflow`'s existing read of `pipeline-state.json` (merged + stage≠definition-of-done + age>threshold → flag) — no new CI infrastructure. To avoid repeating the original failure mode (a mechanism existing but nobody reliably invoking it), the check's output must be surfaced prominently in `/workflow`'s session-start report, not buried — reinforcing CLAUDE.md's existing "run /workflow at session start" convention rather than requiring a new always-on CI job.
[RESOLVED via /clarify, 2026-11-04] Instrumentation is a new, standalone append-only log — `.github/pipeline-timings.jsonl` — not fields added to `pipeline-state.json` (which would trigger the Artefact-first rule's schema-change requirement for no real benefit) and not further Claude Code session-transcript mining (confirmed unreliable in the session preceding this discovery). Each relevant skill appends one structured record as part of its own "State update — mandatory final step." No rollup mechanism for now — success indicators only need a before/after comparison via a small query script against raw records.

**Risks:**
- Parallelizing review accepts an occasional wasted code-quality-review pass (on the minority of tasks where spec review fails) as a tradeoff for time saved on the majority — this is a real cost, not a pure win, and the net benefit depends on the true spec-review failure rate holding steady across future stories.
- A DoD-enforcement check risks false-positive flags for stories that are legitimately paused or parked rather than abandoned — needs a way to distinguish "forgot" from "intentionally deferred."
- The quantified savings found in the session preceding this discovery (review-parallelization, freshness-guard) come from small samples with incomplete Complexity Rating data — actual measured impact after MVP ships could be smaller than the discovery evidence suggests.
- Adding a mandatory structured-logging write to every inner-loop skill invocation adds a small amount of overhead to every future skill run — if designed poorly, the fix for inefficiency could itself introduce a new source of friction.
- **Self-review risk:** CLAUDE.md's platform change policy assumes a separate platform team reviews SKILL.md changes before merge, but in this solo-operator repo that review is performed by the same person who wrote the change — the exact blind spot this session's own "verify independently, don't trust self-report" discipline exists to catch elsewhere. This feature doesn't change that repo structure; it just inherits the risk.

## Directional Success Indicators

1. **Review-dispatch active time per task.** Baseline: 22.0 active minutes/task for dispatched stories (bounded-window measurement from the session preceding this discovery, 13 stories/46 tasks). Target: a measurable reduction after parallelizing spec-compliance and code-quality review — exact target number uncertain since part of the 22.0-vs-direct-execution gap may reflect task complexity rather than pure sequencing overhead, so the honest target is "statistically real improvement," not a specific percentage yet. Measured via: the new structured timing log (#4), before/after comparison.
2. **Redundant full-suite reruns in `/branch-complete`.** Baseline: currently always reruns, even with a fresh `/verify-completion` result and no intervening commits (~1.7% of aggregate cycle time per the git-commit-timestamp baseline). Target: 0 redundant reruns when a fresh same-session result exists. Measured via: a skip/ran flag written to the structured timing log each time `/branch-complete` executes its test-verification step.
3. **New occurrences of the merged-but-no-DoD gap.** Baseline: 22 of 819 stories (2.7%) repo-wide, as of 2026-11-04 — this count is explicitly frozen as the starting baseline; fixing the existing 22 is out of scope. Target: 0 new occurrences among stories merged after this feature ships. Measured via: the structural reconciliation check, run at each `/workflow` invocation against `pipeline-state.json`.
4. **Repeatable baseline regeneration (the instrumentation itself).** Baseline: `[UNKNOWN BASELINE]` — no structured timing data exists today; the only precedent is the ad hoc, partially-unreliable log archaeology from the session preceding this discovery. Target: the baseline can be regenerated on demand from skill-written structured logs, reproducing consistent numbers without the contamination that session found. Measured via: re-running the regeneration process after shipping and confirming trustworthy, stable output.

## Constraints

- **Platform change policy (Phase 2+):** any change to `skills/`, templates, or governance-check scripts must go through feature branch → PR → platform-team-review before merging to the default branch. Directly affects delivery: problems #1-#3 each likely ship as separate governed PRs.
- **Artefact-first rule:** the governance check script for #3 and the SKILL.md behavior changes for #1/#2 each require the full discovery → benefit-metric → story → test-plan → DoR chain before implementation — this discovery is itself satisfying that constraint.
- **Team capability:** single operator (solo repo) performs both implementation and review for platform-governed changes — no separate platform-review team exists in practice, which is why the self-review risk was named above.
- **Technical dependency:** the instrumentation design (#4) requires edits to multiple existing SKILL.md files (at minimum `branch-setup`, `implementation-plan`, `subagent-execution`, `verify-completion`, `branch-complete` — each needs a new step writing a structured timing record), not just one new standalone script — meaning #4 is not purely additive tooling.
- No explicit time or budget constraint has been stated beyond the above.

---

## /clarify recommendation

This discovery contains 3 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- Parallelizing spec-compliance and code-quality review dispatches is safe within the current Agent-dispatch model without introducing new coordination bugs.
- A structural DoD-handoff enforcement check can be built as a `/workflow`-invoked script against `pipeline-state.json`, without requiring new CI infrastructure.
- The right instrumentation design is purpose-built structured logging written directly by each skill, not further mining of Claude Code's own session-transcript logs.

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions produces metrics that will require revision after clarification.

## Contributors

- Hamish King — Product/Engineering

## Reviewers

- None — solo-operator repo; no separate reviewer available. See the self-review risk recorded under Assumptions and Risks.

## Approved By

Hamish King — Product/Engineering — 2026-11-04

## Clarification log

[2026-11-04] Clarified via /clarify:
- Q: Is parallelizing spec-compliance and code-quality review dispatches safe within the current Agent-dispatch model? A: Yes, with a required mechanism — run both in parallel by default; when spec-compliance requires a fix, discard the code-quality result and re-dispatch it against the post-fix code. Must be an explicit SKILL.md step.
- Q: Can the DoD-handoff enforcement check be built as a `/workflow`-invoked script against `pipeline-state.json`, without new CI infrastructure? A: Yes — a reconciliation check inside `/workflow`'s existing read, surfaced prominently in the session-start report rather than buried, reinforcing the existing session-start convention instead of adding a new always-on CI job.
- Q: Is the right instrumentation design purpose-built structured logging written directly by each skill, or should it store into `pipeline-state.json` itself? A: A new standalone append-only log, `.github/pipeline-timings.jsonl` — kept separate from `pipeline-state.json` to avoid triggering the Artefact-first schema-change requirement, and separate from Claude Code session-transcript mining (confirmed unreliable this session).

---

**Next step:** Human review and approval → /benefit-metric
