## Story: Wire Scenario A as a CI-blocking gate

**Epic reference:** artefacts/2026-07-23-e2e-core-journey-coverage/epics/epic-a-new-user-journey-e2e-staging-auth-foundation.md
**Discovery reference:** artefacts/2026-07-23-e2e-core-journey-coverage/discovery.md
**Benefit-metric reference:** artefacts/2026-07-23-e2e-core-journey-coverage/benefit-metric.md

## User Story

As a **Hamish King (Founder/Operator)**,
I want to **have Scenario A (A1–A4's combined signup-through-ideate-canvas-resume spec) run in CI on every PR and block merge on failure, while the 29 existing local-mocked specs remain non-blocking exactly as today**,
So that **the E2E CI gate metric (m1) hits its stated minimum validation signal, and I stop being the only regression detector for this journey**.

## Benefit Linkage

**Metric moved:** E2E CI gate on core signup/billing/creation journeys (m1)
**How:** This story is the mechanism that actually converts "a passing spec exists" into "CI blocks merge on failure" — without it, A1–A4 would be exactly as inert as today's 29 non-blocking specs, and the metric's target (not just baseline) would not be met.

## Architecture Constraints

- **ADR-018:** Playwright is the E2E framework; specs live in `tests/e2e/`; devDependency only; the unit test chain (`npm test`) must not invoke Playwright — this story's CI wiring must add a distinct, separately-triggered job/step for the new staging spec, not fold it into the existing unit test command.
- New CI-blocking gate applies only to this new staging spec — the existing 29 local-mocked specs remain non-blocking, per discovery's `/clarify` resolution (resolved-via-clarify note in discovery.md). Do not flip the existing suite to blocking as a side effect.
- **Known limitation to log, not block on:** staging auto-deploy (`FLY_API_TOKEN`) has been broken since before this feature began (see `artefacts/2026-07-23-e2e-core-journey-coverage/decisions.md`, RISK entry). This story's CI job runs against whatever is currently deployed to `wuce-staging` — a failure could reflect stale staging content, not a genuine regression in the PR under test, until that token is refreshed. This is accepted per operator instruction, not a blocker for this story.

## Dependencies

- **Upstream:** A1, A2, A3, A4 — this story wires the combined spec these stories produce; it cannot be implemented before at least a draft of that combined spec exists and passes locally.
- **Downstream:** B2 (Epic B) extends this same CI gate to add Scenario B once B1 is ready.

## Acceptance Criteria

**AC1:** Given a PR that intentionally breaks a step covered by Scenario A (e.g. reverting A3's product-creation handler), When CI runs on that PR, Then the Scenario A E2E job fails and the PR's merge is blocked (not merely shown as a non-fatal warning).

**AC2:** Given a PR with no regression in Scenario A's covered path, When CI runs, Then the Scenario A E2E job passes and does not block merge.

**AC3:** Given the same CI run, When the 29 pre-existing local-mocked specs are also executed, Then their pass/fail outcome remains non-blocking exactly as today — this story's change is additive, not a global flip of `continue-on-error` behaviour.

**AC4:** Given `.github/context.yml`, When inspected after this story, Then it contains an explicit flag enabling the new staging E2E job (distinct from the existing non-blocking `audit.e2e_tests` semantics, or a documented reuse of that same key scoped correctly) — the gate's enablement is config-driven, not hardcoded into the workflow YAML alone, per ADR-004 (`context.yml` is the single config source of truth).

## Out of Scope

- Adding Scenario B to this gate — that is B2 (Epic B)
- Flipping the existing 29 specs from non-blocking to blocking — explicitly out of scope per discovery's clarification
- Fixing the `FLY_API_TOKEN` CI auto-deploy secret — tracked separately as an operator action item, not part of this story's scope

## NFRs

- **Performance:** The new CI job's own runtime should not multiply total PR CI wall-clock time unreasonably — target under 5 minutes for the Scenario A job specifically, given it drives a full browser session against a real remote environment.
- **Security:** Staging test credentials (Stripe test keys, staging auth-stub secrets from A1) are stored as CI secrets, never in workflow YAML literals or logs.
- **Accessibility:** Not applicable.
- **Audit:** CI run results for this gate are visible in the PR checks UI and queryable via `gh pr checks`, consistent with this repo's existing CI observability conventions.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
