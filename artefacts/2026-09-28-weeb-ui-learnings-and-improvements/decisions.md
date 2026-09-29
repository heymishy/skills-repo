# Decision Log: web-ui-learnings-and-improvements

**Feature:** Web UI Learnings and Improvements Integration
**Discovery reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/discovery.md
**Last updated:** 2026-09-30

## Outer-loop remediation: real gaps found in the pre-Sonnet-fix artefact chain (2026-09-30)

**Context:** This feature's outer loop (`/definition` through `/definition-of-ready`) was run through the real web UI before `psrc-s1-sonnet-verify-3story`'s Sonnet-routing fix was deployed — i.e. on `claude-haiku-4-5`, the exact skill set that fix targets. Resuming the feature (at the operator's request, to progress it) surfaced 3 concrete, real defects, none caught at the time:
1. **`benefit-metric.md` was a full duplicate of `discovery.md`** — same title, same `Skill: /discovery` field, identical problem statement. No real metrics, baselines, or targets had ever been defined. `/benefit-metric` never meaningfully ran despite `pipeline-state.json` claiming the feature had reached `test-plan` stage.
2. **`review.md` (top-level, singular) was a duplicate of the 3 stories' own content** — no findings, no scores, no verdict. A real review never happened, despite 2 of the 3 stories having DoR sign-offs that require a passed review as an entry condition.
3. **`stories/ep1-s1.md`'s own User Story clause is scrambled** (mid-sentence truncation, an unmatched parenthesis, "I want"/"So that" content swapped) and **all 3 stories regressed to a single, unlabeled AC** — while their own test plans (`test-plans/ep1-s1-test-plan.md`, `ep1-s2-test-plan.md`) were written against a richer AC1–AC5 version that still exists (mislabeled, inside the bogus `review.md`). The story files were evidently overwritten by a later, degraded pass after the test plans were already written against the better version.

**Decision:** Remediate in order: (1) a genuine `/benefit-metric` pass, built from `discovery.md`'s own Directional Success Indicators — done, see `benefit-metric.md`, 3 real Tier 1 metrics with baselines/targets; (2) a genuine `/review` pass against the current (broken) story content, documenting real findings; (3) repair the story files using the AC1–AC5 content that demonstrably already existed (not fabricated) before it was lost, plus fix `ep1-s1`'s scrambled prose; (4) re-review to confirm PASS; (5) `/test-plan` for `ep1-s3` (which has none); (6) a genuine `/definition-of-ready` pass for all 3 stories, replacing the two non-conformant DoR files that currently claim "PROCEED — Signed off" with no real Hard Blocks verification behind them.
**Rationale:** This is the second real, concrete casualty of the Haiku-routing bug found in this repo (after `tenant-admin-bootstrap`'s own test-plan/DoR shallow-completion, which the operator caught live and manually restarted) — except this one looked complete (real files, a PROCEED verdict) rather than obviously shallow, so it went uncaught until this remediation. The existing definition.md/epics/stories-as-originally-written content is genuinely solid; only the specific artefacts produced by `/review`-adjacent and `/definition-of-ready` sessions are compromised.
**Story:** Feature-level — affects all 3 stories in Epic 1 equally.
**Made by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh), at the operator's explicit direction to progress the feature properly.
