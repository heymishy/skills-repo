## Epic: Web-UI-created features are visible in pipeline-state.json without manual intervention

**Discovery reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/discovery.md
**Benefit-metric reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/benefit-metric.md
**Slicing strategy:** Walking skeleton — S1 builds the reusable, tested foundation (in-memory mutation core) with zero behaviour change to any existing caller; S2 builds the actual new write path on top of it and is where the real fix becomes observable.

## Goal

An operator creates or progresses a feature through the production web UI, and — without touching a terminal — that feature's real stage is durably reflected in `.github/pipeline-state.json` on `origin/master`, discoverable by `/workflow` and every other CLI-driven governance tool exactly as if the feature had been progressed from Claude Code. A write that genuinely cannot complete (exhausted retries under real concurrent-edit conflict) produces a signal an operator can actually find, instead of vanishing into a server log nobody reads.

## Out of Scope

- Retroactively backfilling pipeline-state.json entries for features that predate this fix (`new-feature-2b74a292`, the throwaway verification feature) — handled manually already; this epic fixes the mechanism going forward.
- Splitting `pipeline-state.json` into smaller per-feature files — a separate, larger architectural question, not needed for this epic's fix to work correctly.
- Any change to `src/web-ui/utils/definition-artefact-splitter.js` or `review-artefact-splitter.js` — already fixed and live this session (`asf-s1`); this epic is scoped to the pipeline-state write path only.
- Re-provisioning the production container with a local `.git` checkout — considered and explicitly rejected (see decisions.md).

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Pipeline-state accuracy for web-UI-originated features | 0% (confirmed absent for two independent features this session) | 100% | S2 delivers the actual GitHub-API write path that makes every stage-completion durable |
| Silent-failure elimination for governed state writes | 0 (failures are 100% invisible today) | Exhausted-retry failures are captured somewhere queryable | S2's own failure-handling path (PostHog capture on exhausted retry) |

## Stories in This Epic

- [ ] Extract cli-advance.js's mutation core into a reusable, state-object-based function — artefacts/2026-09-15-web-ui-pipeline-state-durability/stories/wsd-s1.md
- [ ] GitHub-API-backed pipeline-state writer for the production container, wired by environment, with failure visibility — artefacts/2026-09-15-web-ui-pipeline-state-durability/stories/wsd-s2.md

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Touches a governed, shared state file (`.github/pipeline-state.json`) that every CLI tool and gate reads — correctness matters, and a concurrency bug here would be subtle and hard to notice. Not High: the design is already fully reasoned through (this design.md), reuses proven existing mechanics (`artefact-commit-writer.js`'s GitHub API pattern, `cli-advance.js`'s validation rules), and both stories have a clear, narrow blast radius.

## Complexity Rating

**Rating:** 2 — some real ambiguity (concurrency behaviour under genuine contention is not directly testable end-to-end without a live multi-writer scenario), but the mechanics being composed are all individually well-understood and already proven in this codebase.

## Scope Stability

**Stability:** Stable
