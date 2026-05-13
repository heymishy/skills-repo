## Epic: Non-Technical Access — C7-Compliant Teams Bot for Outer Loop Participation

**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md
**Slicing strategy:** Risk-first — Spike D verdict (PROCEED or REDESIGN or DEFER) is the mandatory gate before any E4 story begins, except p4.nta-surface which implements what Spike D prototyped

## Goal

A product manager, business analyst, or risk reviewer with no git access and no terminal access can participate in the outer delivery loop — running discovery, reviewing stories, approving definitions of ready — via a Microsoft Teams bot. The bot structurally enforces C7 (one question at a time: structural, not conventional), produces governance artefacts (discovery.md, benefit-metric.md, DoR observations) that are identical in format and content quality to artefacts produced by git-native operator sessions, and routes approval events (DoR sign-off, definition approvals) to the existing persona-routing approval channel. Non-technical participation is first-class, not a degraded alternative path.

## Out of Scope

- Distribution model (E2) — the bot does not install or manage sidecars; it consumes existing platform governance outputs via the approval-channel adapter
- Enforcement mechanisms for technical surfaces (E3) — the MCP and CLI adapters are separate; the bot is not an MCP server
- Mode 2 and Mode 3 CLI (Craig's deferred phases) — no overlap with the CLI approach; the bot is a separate surface class
- Consumer customisation of the Teams bot workflow topology — Phase 4 provides a standard outer-loop workflow; consumer customisation of the bot's step graph is Phase 5
- Mobile or web UI surfaces — the bot targets Teams only in Phase 4

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|------------------------|
| M3: Teams bot C7 fidelity | Not implemented | Structural C7 enforcement (3-turn minimum pass) | All E4 stories contribute directly; C7 fidelity is the primary success criterion |
| M2: Consumer confidence | 0 unassisted onboardings | ≥1 team member completes outer loop unassisted | Non-technical roles completing outer loop via Teams bot extends the consumer base; artefact parity (p4.nta-artefact-parity) ensures artefacts produced via bot are accepted by downstream pipeline steps |

## Stories in This Epic

- [ ] p4.nta-surface — Teams bot runtime implementation (C11 compliant)
- [ ] p4.nta-gate-translation — Non-technical approval channel routing and translation
- [ ] p4.nta-artefact-parity — Artefact landing parity for non-technical surface outputs
- [ ] p4.nta-standards-inject — Standards injection for non-technical discipline roles
- [ ] p4.nta-ci-artefact — CI artefact integration for non-git-native governance surfaces

## Human Oversight Level

**Oversight:** High
**Rationale:** The Teams bot introduces a new surface class to the governance model. It produces artefacts that are consumed by the pipeline's downstream steps (review, test-plan, DoR). Any error in artefact format or approval routing that propagates downstream is difficult to detect and rollback. High oversight ensures each story's implementation is reviewed before it enters the main branch.

## Complexity Rating

**Rating:** 3

## Scope Stability

**Stability:** Unstable — depends entirely on Spike D PROCEED verdict; if Spike D returns DEFER (Azure / Microsoft account unavailable), E4 stories are deferred to Phase 5 pending environment resolution.
