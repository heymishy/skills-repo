## Epic: Walking skeleton — authenticate, read one artefact, write one sign-off

**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

A non-technical stakeholder can open a web URL, authenticate with their GitHub identity, read a single pipeline artefact in plain prose, and submit an attributed sign-off that commits back to the repository under their identity — from a browser, with zero install. This epic proves the architecture (GitHub OAuth → artefact read → GitHub Contents API write-back) before any further Phase 1 surface is built. Every subsequent Phase 1 story builds on this skeleton.

## Out of Scope

- Action queue, multi-feature navigation, or any listing view — that is Epic 2
- Rendering markdown beyond a single artefact — that is Epic 2
- Any skill execution or Copilot CLI integration — that is Epic 3 and 4
- Non-GitHub SCM (Bitbucket, Azure DevOps, GitLab) auth or write-back
- SAML/SSO enterprise federation configuration guide — documented separately, not implemented here
- Annotation or commenting on artefact content — sign-off only in this epic

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| P1 — Non-engineer self-service sign-off rate | 0% — no web surface exists | ≥80% eligible sign-offs via web UI within 3 months | Delivers the first working sign-off path; establishes the baseline for measurement |
| P3 — Non-technical attribution rate | 0% | ≥90% of approved discovery artefacts | Write-back commits under user's GitHub identity, populating Attribution |
| M2 — Phase 1 stakeholder activation rate | 0% | ≥60% activation within 30 days | First story cohort can activate on this epic alone — read + sign-off is the minimum viable action |

## Stories in This Epic

- [ ] wuce.1 — GitHub OAuth flow + authenticated session
- [ ] wuce.2 — Read and render a single pipeline artefact
- [ ] wuce.3 — Submit attributed sign-off via GitHub Contents API
- [ ] wuce.4 — Self-hosted deployment support (Docker + config injection)

## Human Oversight Level

**Oversight:** High
**Rationale:** Introduces a new hosted web service with GitHub OAuth integration and repo write-back. Security review required at each story before merge. Auth flows and commit attribution are non-negotiable governance properties — not safe for fully autonomous agent implementation.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
