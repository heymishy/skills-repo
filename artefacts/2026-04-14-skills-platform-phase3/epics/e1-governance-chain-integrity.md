# Epic: Governance Chain Integrity Hardened

**Discovery reference:** artefacts/2026-04-14-skills-platform-phase3/discovery.md
**Benefit-metric reference:** artefacts/2026-04-14-skills-platform-phase3/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

When this epic is complete, the platform's own governance assurance chain has no known silent failure modes. Post-merge workflow failures surface within one CI cycle. The assurance gate evaluates governance substance — not just file existence. The test suite cannot self-certify through structural gaming. Bitbucket DC auth tests are resolved from permanent skip. The platform maintainer can rely on `npm test` as an honest governance verdict.

## Out of Scope

- Gate script structural independence (moving gate scripts to a separate repository) — that is Epic E3, which builds on the sound foundation this epic establishes.
- T3M1 trace field additions — those are Epic E2. This epic hardens the checks that evaluate existing trace content; new trace fields are a separate concern.
- Enterprise channel adapters — Epic E6.
- Any changes to `pipeline-viz.html` or `pipeline-state.schema.json` beyond what is strictly required for the substantive check additions in Priority 1B.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M2 — Assurance gate substantive signal (completedAt duration) | 1–2ms (structural-only) | >50ms | Priority 1B extends gate to content-level checks — real evaluation time |
| M3 — Post-merge silent failure detection rate | 4 silent failures in Phase 2 | Zero persisting beyond 1 CI cycle | Priority 1A adds `check-trace-commit.js` to `npm test` |
| MM3 — Priority 1 hardening: governance failure reduction | Non-zero post-merge failures in Phase 2 | Zero `npm test` failures on master after story merges | All five stories in this epic address known failure patterns |

## Stories in This Epic

- [ ] p3.1a — Add trace-commit observability to npm test and skill guidance
- [ ] p3.1b — Extend assurance gate to substantive content checks
- [ ] p3.1c — Test suite integrity: import path, passRate floor, anti-overfitting counter
- [ ] p3.1d — Resolve permanently-skipped Bitbucket DC auth tests
- [ ] p3.1e — Register agent behaviour observability as Phase 4 backlog item

## Human Oversight Level

**Oversight:** Medium
**Rationale:** All five stories modify the platform's own governance infrastructure (test scripts, gate logic, SKILL.md files). Changes that weaken a governance check could silently allow bad deliveries through. Human review at PR is required for each story.

## Complexity Rating

**Rating:** 2
**Overall complexity is moderate.** Each individual story is well-understood (specific gaps identified by adversarial audit). However, the stories interact: 1B substantive checks depend on the correct test baseline established by 1C. Execute in priority order within this epic.

## Scope Stability

**Stability:** Stable
Gaps were identified by adversarial audit with specific, concrete ACs. No discovery-level ambiguity remains.
