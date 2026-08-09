## Epic: Real usage gaps get caught before they reach a beta customer, not after

**Discovery reference:** artefacts/2026-08-09-rubber-duck-review-capture/discovery.md
**Benefit-metric reference:** artefacts/2026-08-09-rubber-duck-review-capture/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

An operator (or an AI agent, for the agent-driven mode) can run a real, end-to-end scenario against a just-shipped feature — narrating observations as they go, either by voice or by autonomous browser-driven commentary — and have those observations turned into structured, ready-to-append findings in this platform's existing feedback surfaces (`capture-log.md`, DoD-observation-equivalent entries). The riskiest question this epic answers first is whether the mechanism produces real signal at all, before any CI-integration investment is made.

---CANVAS-JSON: {"type":"program-design","title":"Program Design","content":{"mermaid":"flowchart LR\n    subgraph S1[Story 1: validate extraction]\n        REC1[operator recording] --> STT[speech-to-text API client]\n        STT --> EXTRACT[LLM extraction pass]\n    end\n    subgraph S2[Story 2: human-narrated tool]\n        TOOL[rubber-duck-review tool/script]\n        TOOL --> STT\n        TOOL --> EXTRACT\n        EXTRACT --> LOG[workspace/capture-log.md]\n    end\n    subgraph S3[Story 3: agent-driven review]\n        AGENT[agent-driven Playwright review]\n        AGENT --> SKILLEXEC[skill-turn-executor.js infra]\n        AGENT --> FIXTURES[seeded validation set]\n    end\n    subgraph S4[Story 4: CI wiring]\n        CIJOB[.github/workflows/e2e.yml new job]\n        CIJOB --> MGAR[mgar-s1 force-on step]\n        CIJOB --> AGENT\n        AGENT --> FINDINGS[CI job summary / findings output]\n    end\n    subgraph S5[Story 5: suggestion nudge]\n        DOD[definition-of-done completion output]\n        DOD --> SUGGEST[suggest rubber-duck-review]\n        SUGGEST --> TOOL\n    end"}}---

## Out of Scope

- Automatic story/PR creation from findings — a human decides whether/how to act, per discovery's explicit Out of Scope.
- Long-term storage or a playback/archive system for raw video/audio — transcribe-and-discard only, per discovery.
- A mandatory pipeline gate — this epic delivers the optional, suggested trigger mechanism only; a mandatory gate for specific conditions is an explicit fast-follow, not part of this epic.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Where real gaps get first detected, by pipeline stage | Not yet established (0 rubber-duck-review detections; tool doesn't exist) | ≥50% of newly-confirmed real gaps first detected via rubber-duck-review within 90 days | Delivers the mechanism itself — without it, this metric has no way to ever move |
| Findings signal quality (not noise) | Not yet established | ≥70% of findings confirmed real/actionable | Story 1 directly tests this before any further investment |
| Agent-driven mode issue-finding reliability | Not yet established | ≥80% detection rate on seeded validation set | Story 3 directly tests this against this session's own 2 confirmed real gaps as fixtures |
| Workflow adoption / clunkiness | 0% (tool doesn't exist) | ≥80% usage on eligible stories within 90 days | Story 5 delivers the proactive suggestion nudge that drives adoption |

## Stories in This Epic

- [ ] Validate findings-extraction signal quality on a real human-narrated recording
- [ ] Wire the human-narrated mode as an on-demand operator tool
- [ ] Build the agent-driven Playwright review and validate it against a seeded issue set
- [ ] Wire the agent-driven mode into CI against real staging
- [ ] Suggest rubber-duck review for eligible hero/customer-facing stories

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Touches real LLM API cost paths (subject to `mgar-s1`'s mock-gateway safety net) and, for stories 3-4, real staging infrastructure and credentials — not customer-facing/regulated, but not a pure internal-tooling change either given the CI/staging surface area.

## Complexity Rating

**Rating:** 3 — high ambiguity. This epic is explicitly testing 3 unconfirmed hypotheses (discovery's own `[ASSUMPTION]` lines) about whether the mechanism works at all; genuine unknown-unknowns exist in extraction quality and agent-driven detection reliability.

## Scope Stability

**Stability:** Unstable — flagged for more frequent check-ins, particularly after Story 1 and Story 3, since each directly tests a foundational assumption that could invalidate later stories in the sequence if it fails to meet even the minimum validation signal.
