## Epic: Distribution Model — Zero-Commit Install and Conflict-Free Sync

**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md
**Slicing strategy:** Risk-first — Spike C must have a PROCEED or REDESIGN verdict before any E2 story enters DoR

## Goal

A consumer — Craig, Thomas, or a team they onboard — can install the platform skills sidecar into their repository with a single command that generates no commits in their repo, receive skill updates without manual conflict resolution across 90% or more of upgrade cycles, and optionally configure commit-format validation so that regulated consumers can enforce traceability standards without platform involvement. The installation, pinning, upgrade, and verification commands are all driven by configuration sourced from `.github/context.yml`. The upstream authority (authoritative source of SKILL.md, POLICY.md, and standards files) is a specific, decided repository or publishing layer — not heymishy's personal fork at runtime. Craig and Thomas can onboard, upgrade, and migrate from their existing fork-based setup without requiring a pull request to the platform repo or support from heymishy.

## Out of Scope

- Enforcement mechanism implementation — the fact that a consumer has installed the sidecar is not the same as enforcement; E3 implements CLI (p4.enf-cli) and MCP (p4.enf-mcp) adapters around the installed content; E2 distributes content, E3 enforces governance
- Teams or non-git-native surface distribution — the Teams bot receives skill content through the enforcement adapter, not the sidecar directly; non-git-native distribution design is E4 scope
- Publishing infrastructure for the upstream source — Phase 4 scopes to a decided upstream authority and a working sync mechanism; the CI/CD pipeline that publishes tagged releases from that source is a separate operational concern
- Consumer customisation of skill files in the sidecar — the sidecar is an installed read-only copy; modifications that diverge from the lockfile hash fail `verify`; sidecar-local overrides are deferred to Phase 5

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|------------------------|
| M1: Distribution sync | 0% zero-commit install | 100% zero-commit install + ≥90% conflict-free sync | All 8 E2 stories directly implement the distribution mechanism that M1 measures |
| M2: Consumer confidence | 0 unassisted onboardings | ≥1 team member completes outer loop unassisted | Distribution ease (zero-commit install, clear upgrade flow, transparent lockfile) is a prerequisite for unassisted onboarding; without it the consumer must read the platform repo internals to understand where their skills came from |

## Stories in This Epic

- [ ] p4.dist-install — Sidecar install via `init` without forking
- [ ] p4.dist-no-commits — Install generates zero commits in consumer repo
- [ ] p4.dist-commit-format — Operator-configured commit-format validation
- [ ] p4.dist-lockfile — Lockfile structure, pinning, and transparency
- [ ] p4.dist-upgrade — Upgrade command with diff and confirm flow
- [ ] p4.dist-upstream — Upstream authority configuration
- [ ] p4.dist-migration — Migration path for existing fork consumers
- [ ] p4.dist-registry — Consumer registry and fleet visibility

## Human Oversight Level

**Oversight:** Medium
**Rationale:** The implementation follows a decided architecture (Spike C output). The risk is primarily in schema correctness (lockfile format, fleet-state.json field additions) and in the migration path for Craig and Thomas's existing fork-based setups. Human review at each story PR is appropriate; a blanket High oversight level is not warranted for individual implementation tasks.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Unstable — depends on Spike C verdict; if Spike C produces REDESIGN, individual E2 stories may need to be rewritten against the revised distribution design before entering DoR.
