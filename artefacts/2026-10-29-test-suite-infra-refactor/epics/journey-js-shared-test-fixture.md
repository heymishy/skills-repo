## Epic: journey.js tests stop silently diverging on their own mock request shape

**Discovery reference:** artefacts/2026-10-29-test-suite-infra-refactor/discovery.md
**Benefit-metric reference:** artefacts/2026-10-29-test-suite-infra-refactor/benefit-metric.md
**Slicing strategy:** Walking skeleton

<!-- ---CANVAS-JSON: {"type":"program-design","title":"As designed: Program design","content":{"mermaid":"flowchart LR\n    FIXTURE[tests/helpers/journey-fixture.js]\n    SELFTEST[tests/check-journey-fixture-self-test.js]\n    CONSUMER[tests/check-ep1-s1-journey-feature-merge.js]\n    CHECK[scripts/check-journey-fixture-usage.js]\n    REVIEW[skills/review/SKILL.md]\n    SELFTEST --> FIXTURE\n    CONSUMER --> FIXTURE\n    CHECK --> CONSUMER\n    REVIEW --> CHECK"}}--->
---CANVAS-JSON: {"type":"program-design","title":"As designed: Program design","content":{"mermaid":"flowchart LR\n    FIXTURE[tests/helpers/journey-fixture.js]\n    SELFTEST[tests/check-journey-fixture-self-test.js]\n    CONSUMER[tests/check-ep1-s1-journey-feature-merge.js]\n    CHECK[scripts/check-journey-fixture-usage.js]\n    REVIEW[skills/review/SKILL.md]\n    SELFTEST --> FIXTURE\n    CONSUMER --> FIXTURE\n    CHECK --> CONSUMER\n    REVIEW --> CHECK"}}---

## Goal

A developer or AI coding agent touching `journey.js`'s test coverage has exactly one canonical `mockReq`/`mockRes` shape to import — not 17+ hand-rolled variants that can silently drift apart, as two of them did in `ctpl-s1`. That shared module is itself directly tested (so a regression in it fails loudly at its own source, not confusingly across dozens of consumers), and `/review` structurally flags any new or modified `journey.js`-touching test file that hand-rolls its own fixture instead of using the shared one — giving the adoption target real enforcement rather than relying on habit.

## Out of Scope

- Retrofitting the existing 42 `journey.js`-touching files to use the shared fixture — this epic proves the pattern with one migrated example (Story 1, AC2); the full retrofit is a deliberate non-goal of this MVP (discovery.md Out of Scope).
- Extending this fixture/check pattern to `skills.js` (49 consumers), `products.js` (40), or `journeys.js` (40) — planned as a near-term next slice once this pattern is proven here, not bundled into it.
- Runner parallelization (`scripts/run-all-tests.js`) — deferred per discovery.md, unrelated to this epic's fixture-duplication problem.
- Promoting the structural check (Story 3) from a `/review` finding to a `/definition-of-ready` hard block — explicitly a next-slice decision per `decisions.md`'s revisit trigger, not in this epic.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Fixture duplication | 17/42 existing files hand-roll today | 0 new hand-rolled fixtures on journey.js-touching stories after this MVP | Story 1 provides the one canonical fixture to import instead of hand-rolling; Story 3 structurally flags a new hand-rolled one |
| Divergence-bug incidence | 1 confirmed occurrence (ctpl-s1) | 0 further occurrences | Story 1 provides the single correct shape; Story 2 bounds the blast radius of a future regression in that shared shape |
| Adoption | 0/42 use a shared fixture today | 100% of new journey.js-touching stories use it | Story 3's structural `/review` check gives this target a real enforcement mechanism |

## Stories in This Epic

- [ ] Extract a shared mockReq/mockRes fixture module for journey.js tests
- [ ] Add a dedicated self-test for the shared journey.js fixture module
- [ ] Add a structural /review check flagging hand-rolled mockReq on journey.js-touching test files

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Low technical risk (test-only tooling, no production code path), but this epic exists specifically because a fixture-divergence gap contributed to a real security-relevant incident (`ctpl-s1`). A PR-stage human checkpoint is proportionate — not because the work is risky to run, but because the whole point is closing a gap that was previously invisible until it caused a real bug.

## Complexity Rating

**Rating:** 1

<!-- Well understood, clear path — this is a bounded, mechanical test-infrastructure change with a proven precedent (check-design-tokens.js, check-wuce17-e2e-infra.js) for every piece of it. -->

## Scope Stability

**Stability:** Stable

<!-- Scope was tightened via /clarify (2 assumptions resolved by investigation, 2 resolved by adding bounded scope, 2 explicitly deferred) before any story was written. -->
