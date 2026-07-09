## Test Plan: Signup → onboarding → first feature journey spec

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.2-signup-onboarding-journey.md
**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-3-test-suite.md
**Test plan author:** Copilot
**Date:** 2026-07-09

---

## AC Coverage

<!--
  Gap types:
    CSS-layout-dependent — relies on real browser rendering (drag-drop, getBoundingClientRect, CSS position)
    DOM-behaviour       — e2e-testable but not jsdom-compatible
    External-dependency — relies on third-party API/service unavailable in test
    Untestable-by-nature — inherently non-automatable (e.g. visual aesthetics, physical hardware)
-->

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Signup completes → dashboard with a path to create first product | — | — | 1 | — | — | 🟢 |
| AC2 | Outer loop (discovery → benefit-metric → definition → test-plan → definition-of-ready) driven entirely through browser UI, each stage hands off to the next | — | 1 | 1 | — | — | 🟢 |
| AC3 | DoR passes → inner loop build proceeds → gate pass visible in UI | — | 1 | 1 | — | — | 🟢 |
| AC4 | Deliberately failing input → gate fail visible in UI, distinct from AC3 | — | 1 | 1 | — | — | 🟢 |
| AC5 | Spec tagged `@mocked`, uses S3.1 gateway, zero real LLM calls | — | — | 1 | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Seeded staging database (bri-s2.4's synthetic tenants) + S3.1's mock LLM gateway fixtures
**PCI/sensitivity in scope:** No
**Availability:** Available now — depends on bri-s2.4 (seed script) and bri-s3.1 (mock gateway), both within this feature
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A fresh, not-yet-registered email/password identity | Synthetic (generated per test run) | None | Must not collide with bri-s2.4 seed tenants |
| AC2 | Discovery/benefit-metric/definition/test-plan/definition-of-ready fixture responses | S3.1 mock gateway fixtures | None | |
| AC3 | A complete, passing DoR input set | S3.1 mock gateway fixtures (success scenario) | None | |
| AC4 | An incomplete/failing input at one stage (e.g. unresolved hard block at DoR) | S3.1 mock gateway fixtures (failure scenario) | None | |
| AC5 | N/A — tag/behaviour assertion, not new data | N/A | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — this story introduces no new non-browser-level pure logic beyond consuming S3.1's gateway and the existing journey/gate routes. The response-shape and gate-evaluation logic exercised here are covered under Integration Tests below.

---

## Integration Tests

### `GET /api/journey/:id` response conforms to the ADR-024 contract

- **Verifies:** AC2, AC3, AC4 (the Playwright spec's stage-handoff and gate-result assertions all read this endpoint, so its shape must be trustworthy independent of rendering).
- **Components involved:** `routes/journey.js`, journey store adapter.
- **Precondition:** A journey exists with at least one completed stage.
- **Action:** Call `GET /api/journey/:id` directly (no browser).
- **Expected result:** Response includes `turns`, `stages`, `completedStages`, `stage`, `ownerId`, and `activeSkill` fields, correctly typed and populated — matches ADR-024's governed response shape.

### Definition-of-ready gate evaluator returns a distinct pass and fail result

- **Verifies:** AC3, AC4.
- **Components involved:** DoR gate evaluation logic (`src/enforcement/gate-map.js` and the DoR gate handler).
- **Precondition:** One complete/passing DoR input set; one incomplete/failing input set (unresolved hard block).
- **Action:** Evaluate both inputs directly against the gate evaluator.
- **Expected result:** The passing input returns a pass result; the failing input returns a fail result with a reason distinguishable from the pass case — this is the data-layer guarantee the Playwright spec's UI assertions depend on.

---

## E2E (Playwright — `tests/e2e/bri-s3.2-signup-onboarding-journey.spec.js`, tagged `@mocked`)

- **AC1:** Given a new email/password signup, When onboarding completes, Then the browser lands on the dashboard and a "create first product" path is visible and clickable.
- **AC2:** Given a first product is created, When the user drives discovery → benefit-metric → definition → test-plan → definition-of-ready entirely through the browser UI, Then each stage completes and hands off to the next without manual API calls or fixture injection outside the mock gateway.
- **AC3:** Given the outer loop reaches definition-of-ready with a passing gate, When the inner loop build stage runs, Then a gate pass result is visible in the UI.
- **AC4:** Given the same journey run with a deliberately incomplete/failing input at one stage, When the gate evaluates, Then a gate fail result is visible in the UI, visually and textually distinct from the AC3 pass case.
- **AC5:** Given the spec is tagged `@mocked`, When it runs in CI on every PR, Then it uses S3.1's mock gateway (asserted via a call-count spy on the real Copilot API client showing zero invocations across the whole spec file).

---

## NFR Tests

### `@mocked` suite runtime contribution

- **NFR addressed:** Performance
- **Measurement method:** Measured at the aggregate `@mocked` suite level (Metric 6, under 10 minutes total), not a new per-spec threshold — per this story's own NFR statement.
- **Pass threshold:** N/A per-spec; contributes to the shared suite-level budget tracked by S3.1's suite timing.
- **Tool:** CI suite timer (existing).

### No accessToken or password in test logs or trace artifacts

- **NFR addressed:** Security
- **Measurement method:** After a deliberate spec failure, scan the Playwright trace/log output for the literal password value used in signup and for any `accessToken`-shaped value.
- **Pass threshold:** Zero matches in trace artifacts or console logs on failure.
- **Tool:** Hand-rolled `assert`-based Node script scanning captured trace/log output.

### Accessibility

Not applicable to the spec itself — the flow it drives should already meet the app's existing accessibility bar; this story introduces no new accessibility requirement (confirmed with story owner).

### Audit

None beyond standard CI test-run logging — confirmed with story owner.

---

## Out of Scope for This Test Plan

- Google OAuth or GitHub OAuth signup variants — covered by S3.6 (auth journey spec), not duplicated here.
- Team/multi-user onboarding — S3.3's responsibility, not this solo-signup journey.
- The mock gateway's own internal logic (fixture matching, regeneration) — covered by S3.1's test plan.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None identified | This story is fully coverable now — no cross-feature or infrastructure dependency blocks it | N/A |
