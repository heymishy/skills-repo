## Story: Wire the agent-driven mode into CI against real staging

**Epic reference:** epics/epic-1-rubber-duck-review-capture-mvp.md
**Discovery reference:** artefacts/2026-08-09-rubber-duck-review-capture/discovery.md
**Benefit-metric reference:** artefacts/2026-08-09-rubber-duck-review-capture/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **developer/operator running the outer loop**,
I want to **have the agent-driven review run automatically in CI against real, deployed staging, for a curated set of scenarios**,
So that **gaps that only surface in real usage are caught continuously, without requiring me to remember to run a manual review (Tier 1 Metric 1)**.

## Benefit Linkage

**Metric moved:** Tier 1 Metric 1 — Where real gaps get first detected, by pipeline stage
**How:** This story makes the agent-driven mode (validated in Story 3) run continuously against real staging rather than only on manual invocation, increasing the chance any given real gap is caught via `rubber-duck-review` before it reaches DoD or production.

## Architecture Constraints

- **ADR-018** (Active): Playwright is the E2E framework, specs in `tests/e2e/`, devDependency only. This story's CI job must follow the same shape as this repo's existing `scenario-a-staging-e2e`/`scenario-b-staging-e2e` jobs.
- **Real staging** (per discovery's clarified constraint): this job runs against real, deployed wuce-staging — reusing the `e2e-test-admin` identity and the `mgar-s1` mock-gateway safety net (the CI-force-on step), and sharing the `deploy-group` concurrency guard so this job never collides with a real deploy.
- **Bounded scope, not blanket coverage** (per discovery's explicit Out of Scope): this job targets a small, curated set of scenarios — not every shipped feature on every PR/deploy.

## Dependencies

- **Upstream:** `rdrc-s3` — this story does not proceed until Story 3's AC3 minimum detection rate is confirmed met against the validation set.
- **Downstream:** None within this epic; feeds Tier 1 Metric 1's ongoing measurement.

## Acceptance Criteria

**AC1:** Given the agent-driven review mechanism validated in Story 3, When a new CI job (e.g. `rubber-duck-review-staging` in `.github/workflows/e2e.yml`) runs, Then it executes that mechanism against a small, explicitly-named, curated set of real staging scenarios (e.g. the hero features from `landing-page-hero-features`) — not an open-ended crawl of the whole product surface.

**AC2:** Given the CI job runs, When it authenticates against real staging, Then it reuses the existing `e2e-test-admin` identity and secrets-store pattern (`E2E_STAGING_*` secrets) exactly as `scenario-a/b-staging-e2e` already do — no new credential mechanism introduced.

**AC3:** Given the CI job runs, When it makes any real LLM calls as part of the agent-driven review, Then it first invokes `mgar-s1`'s force-on step (or an equivalent explicit check) to ensure the mock gateway is not left in a stale "off" state — this job must not be a new, unguarded source of real-token-cost risk.

**AC4:** Given the CI job produces findings, When it completes, Then those findings are written to a location an operator reviews (e.g. a job summary, an uploaded artifact, or directly into `capture-log.md` via a follow-up manual step) — not silently discarded, and not automatically actioned without human review (per discovery's Out of Scope on auto-created follow-ups).

**AC5:** Given this job's opt-in flag (following the existing `audit.staging_e2e_scenario_a`-style pattern in `context.yml`), When the flag is unset, Then the job step is skipped cleanly with a clear log message, matching the established pattern in `scenario-a-staging-e2e`.

## Out of Scope

- Expanding the curated scenario set beyond the initial small list — a deliberate, separate scope decision for later, not part of this story.
- Automatic story/PR creation from findings — AC4 requires human review before any action.
- The human-narrated mode — Stories 1-2.

## NFRs

- **Performance:** The job should complete within a bounded time budget (matching `scenario-a-staging-e2e`'s existing `timeout-minutes: 10`), given the curated, bounded scenario set.
- **Security:** No new credential mechanism (AC2); reuses existing, already-audited staging-auth patterns.
- **Accessibility:** Not applicable.
- **Audit:** AC4's findings-output location is itself the audit trail for this job's runs, feeding Tier 1 Metric 1's measurement.

## Complexity Rating

**Rating:** 2 — the underlying mechanism (Story 3) and the CI-wiring pattern (an established precedent from `scenario-a/b-staging-e2e` and `mgar-s1`) are both already proven; this story is primarily integration work following existing patterns, not new mechanism design.
**Scope stability:** Stable (conditional on Story 3's signal being confirmed).

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
