# Epic: Operators can see and trust the real shape of what's designed and what's built, without reading a diff

**Discovery reference:** artefacts/2026-07-25-code-shape-diagrams/discovery.md
**Benefit-metric reference:** artefacts/2026-07-25-code-shape-diagrams/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

An operator running a real feature through this pipeline sees System Architecture, Program Design, and Data Model diagrams in the `/ideate` canvas before implementation starts, and — after the feature merges — sees as-built versions of the same diagrams in the same view, with an explicit match/diverged signal per diagram type, tuned to catch non-optimal design (a new or duplicate object created where an existing one already served the purpose). The operator never has to read a diff to know whether what got built matches what was designed.

## Out of Scope

- Test-plan visualisation (touchpoint 2 of discovery's three-touchpoint problem) — deferred to a fast-follow phase, flagged for revisit once this epic's mechanism is proven.
- draw.io or any editable diagram authoring — mermaid only.
- Fully automated semantic drift detection — the drift signal is a flagged comparison the operator interprets, not an AI-adjudicated verdict.
- Live database introspection for as-built Data Model diagrams — static migration-file parsing only for this epic; live-DB confirmation is a later validation step, not built here.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| P1: Time-to-drift-determination | Not yet established | Under 30 seconds | Story 6 (drift signal) puts the match/diverged status directly in the canvas view the operator already looks at. |
| P2: Diagram completion rate | 0% | 100% of features post-launch | Stories 3 and 4 make diagram production part of the standard `/design`/`/definition` flow, not an optional extra. |
| P3: Diverged-flag true-positive rate | Not yet established | Over 70% | Story 6's type-specific rules (esp. the Data Model non-optimal-design check) are designed specifically to keep false-positive noise down. |
| M1: Drift caught before it became a problem | Not yet established | At least 1 real catch in first 5 features | The whole epic exists to make this possible — stories 5 and 6 are the mechanism. |

## Stories in This Epic

- [ ] csd-s1: De-risk canvas diagram block + mermaid data-model fidelity
- [ ] csd-s2: Canvas rendering of the diagram content-block type
- [ ] csd-s3: `/design`/`/definition` produce System Architecture + Program Design diagrams
- [ ] csd-s4: `/design`/`/definition` produce Data Model diagrams
- [ ] csd-s5: As-built diagram generation via static migration-file parsing
- [ ] csd-s6: Drift signal — as-designed vs as-built comparison

## Human Oversight Level

**Oversight:** Medium
**Rationale:** This epic touches governed SKILL.md instruction files (per `CLAUDE.md`'s Platform change policy, requires PR review, not direct commit) and live app code in the paying SaaS product (`src/web-ui/`). Coding agent should pause for human review at PR for every story, not proceed fully autonomously — consistent with the operator's own "build it properly" posture on security/architecture-sensitive work established earlier this session.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
