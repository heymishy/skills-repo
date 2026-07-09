## Story: Signup → onboarding → first feature journey spec

**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-3-test-suite.md
**Discovery reference:** artefacts/2026-07-09-beta-readiness-infra/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-beta-readiness-infra/benefit-metric.md

## User Story

As a **first beta customer**,
I want the full path from signing up to seeing a gate pass/fail result on my first feature to actually work, exactly as a real new customer would experience it,
So that the single most important first impression of the product is protected by a deterministic, tagged Playwright spec rather than untested hope.

## Benefit Linkage

**Metric moved:** Metric 4 — Risk-critical journeys have deterministic E2E coverage
**How:** This is the journey most likely to be a new beta customer's literal first experience of the product — a browser-driven spec covering it end-to-end directly closes 1 of the 5 required journeys.

## Architecture Constraints

- ADR-018: browser-driven Playwright spec under `tests/e2e/`, devDependency only.
- ADR-024: any assertion against journey state (`GET /api/journey/:id`) must respect the governed response shape contract — `turns`, `stages`, `completedStages`, `stage`, `ownerId`, `activeSkill`.
- Consumes S3.1's mock LLM gateway for the `@mocked`-tagged variant of this spec.

## Dependencies

- **Upstream:** S3.1 (mock LLM gateway) — required for the `@mocked` variant to run without real API calls.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a new user signs up (email/password, per the existing auth flow), When onboarding completes, Then they land on a dashboard with a path to create their first product.

**AC2:** Given a first product is created, When the user starts their first feature through the outer loop (discovery → benefit-metric → definition → test-plan → definition-of-ready), Then each stage completes and hands off to the next, driven entirely through the browser UI.

**AC3:** Given the outer loop reaches definition-of-ready with a passing gate, When the inner loop build stage runs, Then it proceeds and a gate pass result is visible in the UI.

**AC4:** Given the same journey is run with a deliberately incomplete/failing input at one stage (e.g. an unresolved hard block at DoR), When the gate evaluates, Then a gate fail result is visible in the UI, distinct from the pass case in AC3 — this spec covers both outcomes, not just the happy path.

**AC5:** Given this spec is tagged `@mocked`, When it runs in CI on every PR, Then it uses S3.1's mock gateway and completes without any real LLM API call.

## Out of Scope

- Google OAuth or GitHub OAuth signup variants for this specific journey — this spec covers email/password signup; OAuth signup paths are covered by S3.6 (auth journey spec), not duplicated here.
- Team/multi-user onboarding — this is the solo, single-user signup path; multi-user scenarios are S3.3's responsibility.

## NFRs

- **Performance:** This spec, as part of the `@mocked` suite, contributes to the overall under-10-minute target (Metric 6) — no individual per-spec budget beyond that shared target.
- **Security:** No real accessToken or password appears in test logs or Playwright trace artifacts on failure.
- **Accessibility:** Not applicable to the spec itself, though the flow it drives should already meet the app's existing accessibility bar (not a new requirement introduced here).
- **Audit:** None beyond standard CI test-run logging.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
