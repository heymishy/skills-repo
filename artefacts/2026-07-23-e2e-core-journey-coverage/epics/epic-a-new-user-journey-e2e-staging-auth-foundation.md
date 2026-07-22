## Epic: New users can complete signup-through-first-feature entirely on real staging, with the run blocking CI on failure

**Discovery reference:** artefacts/2026-07-23-e2e-core-journey-coverage/discovery.md
**Benefit-metric reference:** artefacts/2026-07-23-e2e-core-journey-coverage/benefit-metric.md
**Slicing strategy:** User journey

## Goal

A new operator (or future paying user) can sign up on real deployed `wuce-staging` via either a stubbed GitHub OAuth identity or email/password, select a plan against the real Stripe test-mode environment with a test card, create a product, create a first feature via the "rough idea" path into `/ideate`, watch the `/ideate` canvas render and update live, close the browser mid-session, and reopen it to find the canvas and turn history exactly as they left it. Every step of this is proven automatically, on every PR, by a Playwright spec driving the real browser DOM against real staging — and a failure in any of these steps blocks merge, not merely shows a warning.

## Out of Scope

- Real (non-stubbed) GitHub OAuth test accounts — auth uses a staging-safe stub mechanism, not a live third-party GitHub identity (see A1)
- Google OAuth signup — only GitHub (stubbed) and email/password are covered, matching discovery's MVP scope
- The formed-idea path, `/discovery`-through-DoR outer loop, and the `/definition` story-map canvas — that is Epic B
- Load or concurrency testing of the signup/billing/creation path
- Pixel-perfect visual regression (screenshot diffing) of the `/ideate` canvas — functional assertions only (canvas contains expected elements/markers)

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| E2E CI gate on core signup/billing/creation journeys (m1) | 0/2 journeys covered; E2E non-blocking even when run manually | Both scenarios pass in CI on every PR, failure blocks merge | Delivers Scenario A (signup → billing → product/feature creation → /ideate canvas → resume) end to end and wires it as a CI-blocking gate — this alone satisfies the metric's stated minimum validation signal |

## Stories in This Epic

- [ ] A1 — Stand up a staging-safe GitHub OAuth/email auth stub for real-staging E2E — artefacts/2026-07-23-e2e-core-journey-coverage/stories/a1-staging-safe-auth-stub.md
- [ ] A2 — Drive Stripe test-mode plan selection on real staging — artefacts/2026-07-23-e2e-core-journey-coverage/stories/a2-stripe-test-mode-plan-selection.md
- [ ] A3 — Drive product + first-feature creation via rough-idea/ideate, assert canvas and artefact persistence — artefacts/2026-07-23-e2e-core-journey-coverage/stories/a3-product-feature-ideate-canvas.md
- [ ] A4 — Assert full session close/resume mid-SSE-stream for the ideate canvas — artefacts/2026-07-23-e2e-core-journey-coverage/stories/a4-ideate-session-resume.md
- [ ] A5 — Wire Scenario A as a CI-blocking gate — artefacts/2026-07-23-e2e-core-journey-coverage/stories/a5-ci-gate-scenario-a-blocking.md

## Human Oversight Level

**Oversight:** High
**Rationale:** Per this repo's Operating Posture (solo operator / W4 RISK-ACCEPT), human oversight defaults to High — the operator is also the reviewer and final approver. Additionally, A5 changes CI behaviour from non-blocking to blocking on the whole repo's merge path, and A1 introduces a new auth-stub mechanism reachable on a real deployed environment — both warrant a human-reviewed PR, not autonomous merge.

## Complexity Rating

**Rating:** 2

<!-- Some ambiguity: the staging-safe OAuth stub mechanism (A1) and real-Stripe-test-mode driving (A2) are known unknowns not yet designed; the rest of the epic (A3, A4) reuses this session's already-hardened session-persistence and canvas-rendering code. -->

## Scope Stability

**Stability:** Stable
