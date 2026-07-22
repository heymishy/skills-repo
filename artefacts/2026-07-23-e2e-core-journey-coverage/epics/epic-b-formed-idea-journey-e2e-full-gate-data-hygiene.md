## Epic: A formed-idea feature can be driven through the full outer loop to DoR entirely on real staging, with the story-map canvas verified and both journeys blocking CI

**Discovery reference:** artefacts/2026-07-23-e2e-core-journey-coverage/discovery.md
**Benefit-metric reference:** artefacts/2026-07-23-e2e-core-journey-coverage/benefit-metric.md
**Slicing strategy:** User journey

## Goal

An operator with a formed feature idea can drive a single scenario through `/discovery` → `/benefit-metric` → `/definition` → `/review` → `/test-plan` → `/definition-of-ready` entirely on real deployed `wuce-staging`, see the `/definition` story-map canvas render correctly as epics/stories are written, close the browser mid-session, and reopen it to find the full turn history and canvas state restored exactly as left. This is proven automatically by a Playwright spec against real staging, and — completing what Epic A started — both Scenario A and Scenario B now block merge in CI, with a documented mapping of which real user-facing step each assertion proves. Staging's accumulating test data (users, products, Stripe test customers) created by these journeys running on every PR has an explicit, designed handling strategy rather than growing unbounded.

## Out of Scope

- The new-user signup/billing/product-creation path and the `/ideate` canvas — that is Epic A
- Any outer-loop stage beyond `/definition-of-ready` (the coding/inner loop, DoD) — Scenario B stops at DoR sign-off, matching discovery's MVP scope
- Testing every possible story-map layout or epic/story permutation — one representative scenario only, per discovery
- Automated production data purging outside of staging — this epic's cleanup story is scoped to staging only

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| E2E CI gate on core signup/billing/creation journeys (m1) | 0/2 journeys covered; E2E non-blocking even when run manually | Both scenarios pass in CI on every PR, failure blocks merge | Delivers Scenario B (formed-idea outer loop through DoR, story-map canvas, resume) and completes the metric's full target by adding Scenario B to the CI-blocking gate Epic A established |

## Stories in This Epic

- [ ] B1 — Drive the formed-idea outer loop to DoR and assert the /definition story-map canvas, close/resume mid-SSE — artefacts/2026-07-23-e2e-core-journey-coverage/stories/b1-formed-idea-outer-loop-story-map.md
- [ ] B2 — Add Scenario B to the CI-blocking gate and publish the spec-to-journey-step coverage mapping — artefacts/2026-07-23-e2e-core-journey-coverage/stories/b2-ci-gate-scenario-b-coverage-mapping.md
- [ ] B3 — Design and implement a staging test-data cleanup strategy for E2E-generated accounts and records — artefacts/2026-07-23-e2e-core-journey-coverage/stories/b3-staging-test-data-cleanup.md

## Human Oversight Level

**Oversight:** High
**Rationale:** Same Operating Posture basis as Epic A (solo operator, W4 RISK-ACCEPT, High oversight is implicit). B2 changes the final CI merge-gate behaviour for the whole repo; B3 touches real data lifecycle on shared staging — both warrant human-reviewed PRs.

## Complexity Rating

**Rating:** 2

<!-- Some ambiguity: B1 reuses Epic A's staging-auth-stub foundation and this session's already-hardened outer-loop session-restore code, but the story-map canvas assertion and DoR sign-off automation are new; B3's cleanup mechanism choice (nightly job vs naming convention vs accept-and-monitor) is an open decision from decisions.md, not yet made. -->

## Scope Stability

**Stability:** Stable
