# Epic: Enterprise Channel Adapters and AGENTS.md Compatibility Matrix

**Discovery reference:** artefacts/2026-04-14-skills-platform-phase3/discovery.md
**Benefit-metric reference:** artefacts/2026-04-14-skills-platform-phase3/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

When this epic is complete, non-engineering approvers in enterprise environments can complete DoR sign-off from Microsoft Teams or Jira without visiting GitHub Issues. Each adapter authenticates via service credentials or OAuth (not personal tokens), writes the correct `dorStatus: "signed-off"` record to `pipeline-state.json` without channel-specific fields, and is unit-testable against a mock channel API. A verified AGENTS.md compatibility matrix documents which non-GitHub inner loop tooling is confirmed compatible with the platform's surface adapter, with a clear Phase 4 story registered for the first live delivery run.

## Out of Scope

- A live delivery run using real non-GitHub tooling — deferred to Phase 4 per ASSUMPTION-04 confirmation. The Phase 3 story produces the compatibility matrix and tooling checklist only.
- Confluence and Slack adapters — not in Priority 8 scope; may be added as Phase 4 stories after Teams and Jira are validated.
- GitHub Issue adapter modifications — the existing adapter (Phase 2 p2.8) is not changed by this epic.
- Enterprise SSO configuration for approval channel authentication — out of scope; authentication uses service credentials or OAuth with documented configuration instructions, not SSO integration.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M4 — Enterprise approval channel end-to-end | GitHub Issues only | Teams or Jira sign-off confirmed end-to-end | p3.8 delivers two enterprise adapters |
| M5 — AGENTS.md adapter: non-GitHub inner loop validated | Fixture mocks only | Compatibility matrix produced, live run deferred to Phase 4 | p3.9 delivers the matrix and Phase 4 registration |

## Stories in This Epic

- [ ] p3.8 — Implement Microsoft Teams and Jira DoR approval channel adapters
- [ ] p3.9 — Produce AGENTS.md compatibility matrix for non-GitHub inner loop tooling

## Human Oversight Level

**Oversight:** Medium
**Rationale:** p3.8 introduces authentication flows (service credentials/OAuth). ADR-006 (approval-channel adapter pattern) and the `pipeline-state.json` write contract must be respected. Human review is required to confirm credential handling and that no channel-specific fields are introduced into state without schema backing. p3.9 is documentation only — Low oversight would be appropriate, but Medium is inherited from the epic.

## Complexity Rating

**Rating:** 2
p3.8 follows the established adapter pattern from Phase 2 (p2.8). The Teams Adaptive Card + webhook and Jira workflow transition patterns are well-documented externally. p3.9 is complexity 1 (documentation artefact).

## Scope Stability

**Stability:** Stable for p3.9; Stable for p3.8 (adapter pattern is established)
