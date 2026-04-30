## Epic: One-command platform bootstrap with reproducible lockfile

**Discovery reference:** artefacts/2026-04-30-governed-distribution-and-onboarding/discovery.md
**Benefit-metric reference:** artefacts/2026-04-30-governed-distribution-and-onboarding/benefit-metric/initiative-1-onboarding-benefit-metric.md
**Slicing strategy:** Walking skeleton — `platform:init` establishes the bootstrap foundation a new consumer runs first; `platform:pin` and `platform:verify` add the reproducibility layer on top.

## Goal

A platform consumer can bootstrap a new repo to use the skills pipeline with a single command, and a tech lead on a regulated team can pin the exact skill version they tested against and verify that installed skills have not drifted — providing the reproducibility guarantee required for enterprise and regulated adoption.

## Out of Scope

- `/orient` concierge skill — that is i1-orient-epic scope.
- Automated upgrade detection or breaking-change notifications — post-I1 scope.
- Multi-platform distribution via npm registry or GitHub Releases — post-I1 scope.
- Support for non-Node.js environments — Node.js + npm is the only supported runtime.
- GUI or web-based platform management — CLI only in MVP.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| I1-M1 — Time-to-first-skill-run | Not established; 15–45 min observed with support | Under 2 minutes | `platform:init` removes the "how do I install this?" friction that dominates onboarding time |
| I1-M2 — Zero orientation contacts from platform:init users | All onboarding has required direct engineering support | Zero orientation contacts in 30-day window | `platform:init` + `platform:fetch` create a self-service install path that does not require platform-team contact |
| I1-MM1 — platform:verify SHA mismatch error | Lockfile does not exist; skill drift is undetectable | 100% of verify runs on drifted repos produce 3-part error | `platform:verify` implements the detection; `platform:pin` provides the source of truth |
| I1-MM2 — CLI commands implemented with zero new npm deps | Commands exist as unimplemented stubs; lockfile schema absent | All four commands complete primary success path; zero new runtime npm deps | This epic implements init, fetch, pin, verify using Node.js built-ins only |

## Stories in This Epic

- [ ] i1.2 — `platform:init` and `platform:fetch` CLI: bootstrap a new repo and fetch skill files from upstream
- [ ] i1.3 — `platform-lock.json` schema + `platform:pin` + `platform:verify`: lockfile contract for reproducible skill versions

## Human Oversight Level

Medium — CLI scripts execute file-system operations on the consumer's repo; the platform maintainer should validate the scripts on a clean environment before recommending to external teams.
