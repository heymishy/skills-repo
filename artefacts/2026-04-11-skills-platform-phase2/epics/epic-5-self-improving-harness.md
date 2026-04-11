## Epic: Self-improving harness — improvement agent, challenger pre-check, and proposal review

**Discovery reference:** artefacts/2026-04-11-skills-platform-phase2/discovery.md
**Benefit-metric reference:** artefacts/2026-04-11-skills-platform-phase2/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

When this epic is complete, the platform has a systematic, evidence-based mechanism to improve its own SKILL.md files. The improvement agent reads delivery traces through a queryable interface, identifies recurring failure and staleness patterns, and writes structured diff proposals to `workspace/proposals/`. For each proposal, a challenger spec and proposed SKILL.md are generated for a human-run pre-check session. The platform maintainer reviews each proposal using a defined workflow — accepting, rejecting, or deferring with mandatory rationale. Every accepted change to a skill file is backed by a proposal ID, a pre-check result, and a commit message referencing both. The platform can close its own quality gaps systematically rather than depending on individual operator observations.

## Out of Scope

- Fully automated challenger execution — Phase 2 pre-check is human-assisted; one session cannot auto-spawn another (A3). Full automation is Phase 3.
- Cross-team or cross-repository trace ingestion for improvement agent — local workspace trace archive only.
- ML-based failure clustering — lexical pattern matching only in Phase 2.
- Improvement agent self-modification — the agent writes proposals for other skill files; it does not write proposals targeting its own SKILL.md.
- Template file changes via the improvement agent — scope is limited to `.github/skills/*/SKILL.md` files.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M3 — Improvement agent first SKILL.md diff proposal | Zero — no improvement agent exists | ≥1 proposal in `workspace/proposals/` referencing a real trace; challenger pre-check result recorded; proposal reviewed and actioned | p2.11 delivers the trace interface, detection, and proposal generation; p2.12 delivers the pre-check and review workflow — together they satisfy all 4 M3 sub-conditions |
| MM3 — Improvement loop first proposal reviewed within one feature cycle | Zero — no proposals exist | First proposal reviewed and actioned within Phase 2 delivery | p2.12 proposal review workflow closes MM3 when the first proposal from real Phase 2 delivery is processed |

## Stories in This Epic

- [ ] p2.11 — Improvement agent: queryable trace interface, failure and staleness detection, and diff proposals
- [ ] p2.12 — Improvement agent: challenger pre-check, proposal review workflow, and improvement-agent SKILL.md (depends on p2.11)

## Human Oversight Level

**Oversight:** High
**Rationale:** Both stories deliver mechanisms that can modify the platform's own governance infrastructure (SKILL.md files). The anti-overfitting gate (p2.11) and the human-assisted challenger pre-check (p2.12) are the controls against unsafe self-modification. High human oversight is non-negotiable — the improvement agent must not be run in a mode where skill files are modified without a human acceptance decision and explicit commit approval. Additionally, both stories are sequenced after the first Phase 2 inner loop batch: they cannot be dispatched until real delivery traces exist.

## Complexity Rating

**Rating:** 3

## Scope Stability

**Stability:** Unstable
**Note:** Sequencing dependency on real Phase 2 inner loop traces means the inner loop batch must complete before these stories can be fully tested at DoR. The failure pattern heuristics (threshold count, pattern label format) and anti-overfitting gate logic are high-ambiguity areas. Both stories should be held at /test-plan stage until the inner loop sequencing gate is cleared.
