## Story: Build the mock LLM gateway and fixture set

**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-3-test-suite.md
**Discovery reference:** artefacts/2026-07-09-beta-readiness-infra/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-beta-readiness-infra/benefit-metric.md

## User Story

As **Hamish (Founder/Operator)**,
I want a backend mock LLM gateway service (not just Playwright route interception) returning canned responses keyed by `(stage, model, scenarioName)`,
So that E2E journey specs run deterministically and fast, without depending on real LLM API calls or their latency/cost/nondeterminism.

## Benefit Linkage

**Metric moved:** Metric 6 — `@mocked` suite runtime under 10 minutes
**How:** Real LLM calls are the dominant source of both latency and nondeterminism in E2E tests of this app — a backend mock gateway is what makes a sub-10-minute, flake-free `@mocked` suite possible at all.

## Architecture Constraints

- D37: the mock gateway is wired as an injectable adapter alongside the real `skill-turn-executor.js` client — swapped in for `@mocked`-tagged test runs via `NODE_ENV=test` or an equivalent explicit test-mode flag, never activatable by production configuration error (mirrors the ADR-018 auth-bypass-fixture pattern).
- Per `decisions.md` (2026-07-09): the fixture matrix covers confirmed LLM-invoking stages first (discovery, benefit-metric, definition, test-plan, definition-of-ready); `branch-setup`/`branch-complete` are verified against actual code in this story (AC4) before deciding whether they need fixtures too — not assumed either way.

## Dependencies

- **Upstream:** None within this epic.
- **Downstream:** S3.2–S3.6 (all journey specs) consume this gateway for their `@mocked`-tagged runs.

## Acceptance Criteria

**AC1:** Given a request keyed by `(stage='discovery', model=<configured>, scenarioName='success')`, When the mock gateway receives it, Then it returns the corresponding canned fixture response deterministically — same input, same output, every time.

**AC2:** Given each of the 7 `gate-map.js` stages (discovery, benefit-metric, definition, test-plan, definition-of-ready, branch-setup, branch-complete — all confirmed LLM-invoking, since `branch-setup`/`branch-complete` are listed in the same `SLASH_CAPABILITY_MAP` structure as every other skill in `routes/journey.js`, driven by the same model-first skill-session architecture; `limitedOnWebUI: true` reflects missing git/bash/PR-creation capabilities in a browser context, not a bypass of the LLM), When fixtures are inventoried, Then at least one success and one failure/edge-case fixture exists per stage — minimum 14 fixtures across all 7 stages.

**AC3:** Given fixtures live in version control under a documented path (e.g. `tests/e2e/fixtures/llm-gateway/`), When a regeneration script is run against real dev/staging responses, Then it refreshes the fixture files in place without requiring manual hand-editing of the JSON/response format.

**AC4:** Given `branch-setup` and `branch-complete` are both confirmed (2026-07-09, verified against `routes/journey.js`'s `SLASH_CAPABILITY_MAP`) to invoke the LLM gateway via the same model-first skill-session mechanism as every other stage, When this story is implemented, Then fixtures are built for both, per AC2's 7-stage matrix — resolving the open question from `decisions.md` (2026-07-09) rather than leaving it open into Epic 3's remaining stories.

**AC5:** Given a journey spec is tagged `@mocked` and run, When it executes against the mock gateway, Then it completes without making any real network call to the GitHub Copilot Chat Completions API.

## Out of Scope

- `@live` fixture equivalents (real API calls for nightly/pre-release runs) — this story builds the mock gateway only; `@live` tests call the real API directly, no gateway involved.
- Fixture coverage for `implementation-plan`, `subagent-execution`, and `verify-completion` (inner-loop stages beyond the 7 gate-map.js stages) — out of scope for this story; the 7-stage matrix covers exactly the gated pipeline stages, not every skill in `SLASH_CAPABILITY_MAP`.

## NFRs

- **Performance:** Mock gateway responds in under 50ms per call (no real network round-trip) — this is what makes the sub-10-minute `@mocked` suite target achievable.
- **Security:** Mock gateway is only reachable when explicitly activated by test configuration (mirrors ADR-018's `NODE_ENV=test` guard pattern) — cannot be activated in production by configuration error.
- **Accessibility:** Not applicable.
- **Audit:** Fixture regeneration runs are logged (which fixtures changed, from what real response) so drift between mock and real behaviour is traceable.

## Complexity Rating

**Rating:** 3
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
