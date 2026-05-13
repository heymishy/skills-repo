# Epic: Core Loop Infrastructure

**Discovery reference:** artefacts/2026-04-09-skills-platform-phase1/discovery.md
**Benefit-metric reference:** artefacts/2026-04-09-skills-platform-phase1/benefit-metric.md
**Slicing strategy:** Risk-first, walking skeleton first (P1.5 is the walking skeleton)

## Goal

The platform has three working infrastructure mechanisms: cross-session continuity (`workspace/state.json` + SESSION START hook + `/checkpoint` convention), an automated CI gate (assurance agent fires on PR open/update, produces an auditable `inProgress`→`completed` trace visible in the PR), and a watermark gate (blocks regressions below the best recorded score before human review). A solo operator can resume work cleanly after any session boundary. The first inner loop PR in the dogfood context has an automated gate verdict visible in the PR without opening a separate tool.

## Out of Scope

- The Phase 2 improvement agent — this epic establishes the state and trace infrastructure the improvement agent will read, but does not build the agent
- Cross-team observability and trace registry — Phase 3
- Push-based real-time state distribution — state.json is written at phase boundaries by operator-initiated phase skills, not streamed
- The eval suite growth mechanic (P1.6) and standards injection (P1.7) — separate Epic 4 stories that depend on this epic's infrastructure being stable

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M2 — CI-triggered assurance gate | Zero — no CI gate exists | First inner loop PR after P1.3 delivery satisfies all four sub-conditions | P1.3 directly delivers the CI gate; the first PR is the M2 acceptance test |
| M4 — Watermark gate blocks regression | Zero — no watermark gate exists | Synthetic regression blocked, both sub-conditions met | P1.4 directly delivers the watermark gate; the acceptance test is P1.4 DoD |
| MM2 — Cross-session resume | Zero — no cross-session resume attempted | Clean resume within two natural session boundaries | P1.5 delivers state.json and SESSION START hook; first natural boundary after P1.5 is the first test |
| MM3 — /checkpoint mid-phase write | Instructional, never tested | All three sub-conditions within two test invocations | P1.5 delivers the /checkpoint convention; deliberate test during dogfood run |
| T3M1 — Trace readability for risk review | Zero — no trace exists | All eight audit questions answerable from trace alone | P1.3 produces the trace; T3M1 acceptance test runs against the P1.3 acceptance test PR |

## Stories in This Epic

- [ ] Implement workspace/state.json cross-session continuity and /checkpoint convention — `stories/p1.5-workspace-state-session-continuity.md`
- [ ] Deploy assurance agent as automated CI gate on PR open/update — `stories/p1.3-assurance-agent-ci-gate.md`
- [ ] Implement watermark gate for eval regression detection — `stories/p1.4-watermark-gate.md`

## Human Oversight Level

**Oversight:** High
**Rationale:** New infrastructure mechanisms being validated in a dogfood context for the first time. P1.3 involves CI configuration that defaults to GitHub Actions (must be documented with Bitbucket equivalent). P1.5 schema will require at least one real-world correction from the cross-session resume test. Human reviews every gate run result and every resume test before marking DoD.

## Complexity Rating

**Rating:** 3 (P1.3 is 3; P1.5 is 2; P1.4 is 2 — highest rating governs the epic)

## Scope Stability

**Stability:** Unstable
