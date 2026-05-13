# Epic: Distribution and Surface Model

**Discovery reference:** artefacts/2026-04-09-skills-platform-phase1/discovery.md
**Benefit-metric reference:** artefacts/2026-04-09-skills-platform-phase1/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

A consuming squad can load skills from the versioned platform package without forking the skills-repo, and platform skill updates propagate to their assembled context without any merge action by the squad. The `copilot-instructions.md` base layer is assembled from platform + domain + squad layers, with phase-sequenced progressive skill disclosure reducing fixed session overhead. The surface adapter contract (`execute(surface, context) → result`) is defined with a git-native reference implementation and Path B (`context.yml`) surface type resolution — leaving Path A (EA registry) unforeclosed for Phase 2.

## Out of Scope

- EA registry integration (Path A surface type resolution) — Phase 2
- Non-git-native surface adapter implementations (IaC, SaaS-API, SaaS-GUI, M365-admin, manual) — Phase 2
- Cross-team observability and drift detection — Phase 3
- Automated context injection without operator-initiated session open — not possible in Copilot Agent mode; not attempted
- The `context.yml` MCP credentials section — already governed by product constraint #12; not modified by this epic

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1 — Update channel latency | Currently infinite — no update channel exists; all squad adoption requires fork-and-pull | Update present in consuming squad's assembled context within one cycle, zero squad merge steps | P1.1 directly delivers the distribution mechanism; M1 acceptance test runs at P1.1 DoD |
| MM1 — Solo operator outer loop | Baseline being established by this dogfood run | All outer loop stages complete, zero blocking lookups | P1.1 progressive disclosure reduces session overhead (27% fixed overhead dogfood finding); P1.2 surface model enables correct AC scoping for surface-aware stories |

## Stories in This Epic

- [ ] Implement versioned skill distribution and progressive skill disclosure — `stories/p1.1-distribution-progressive-disclosure.md`
- [ ] Implement surface adapter model foundations (Path B, git-native reference) — `stories/p1.2-surface-adapter-model-foundations.md`

## Human Oversight Level

**Oversight:** High
**Rationale:** P1.1 changes how `copilot-instructions.md` is assembled — the base layer for every session. A misconfigured assembly silently breaks every downstream skill invocation. The distribution mechanism design decision (push vs pull model) is still open and must be resolved during P1.1 decomposition. Human reviews assembly output and update channel test before DoD.

## Complexity Rating

**Rating:** 3 (P1.1 is 3; P1.2 is 2 — highest rating governs)

## Scope Stability

**Stability:** Unstable (P1.1 has an open design decision between push and pull distribution model)
