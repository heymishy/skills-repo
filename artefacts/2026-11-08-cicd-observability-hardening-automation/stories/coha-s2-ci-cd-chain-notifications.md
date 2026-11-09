## Story: CI/CD chain notifications (announce, status, auto-retry visibility)

**Epic reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/epics/coha-e1-detect-and-alert.md
**Discovery reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/benefit-metric.md

## User Story

As a **delivery engineer**,
I want to **get notified when a patch is about to build, when build/test/deploy completes, and when an auto-retry already fired for a cancelled run**,
So that **I don't have to actively poll GitHub Actions to know what's happening with the code I just merged, and I don't manually re-verify whether a cancellation was already handled**.

## Benefit Linkage

**Metric moved:** CI/CD chain notification coverage; Manual CI toil reduction for known-flaky patterns
**How:** Every merge-to-master transition (announce, status, retry) calls `coha-s1`'s adapter directly from the relevant workflow step, so the notification-coverage percentage is a direct function of this story's wiring correctness. The auto-retry visibility specifically removes the need for the 3 confirmed manual `gh run rerun` interventions this session's `actr-s1/s2/s3` pattern required.

## Architecture Constraints

- Hooks into three existing, verified-in-code workflows: `staging-deploy.yml`, `e2e.yml` (announce + status), and `deploy-group-auto-rerun.yml` (retry visibility — confirmed its real trigger is `workflow_run` `types: [completed]` with `if: github.event.workflow_run.conclusion == 'cancelled'`, and that `isDeployGroupEviction()` in `scripts/lib/is-deploy-group-eviction.js` is the real decision function distinguishing a genuine eviction from a real failure).
- `product/constraints.md` #13: the test plan must assert the notification step actually ran and called the adapter for a given workflow outcome — not just that the workflow YAML contains the step (a CI-gate-verifiable assertion, not an instruction-level trust).
- CLAUDE.md Platform change policy: changes to `.github/workflows/*.yml` go via branch + PR, never direct to master.
- No new injectable adapter here — this story is a caller of `coha-s1`'s adapter, not a new D37 surface.

## Dependencies

- **Upstream:** coha-s1 (the adapter this story calls).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a push merges to master, When `staging-deploy.yml` begins its deploy job, Then a "patch announce" notification is sent via `coha-s1`'s adapter before the build/deploy steps run, identifying the commit/PR.

**AC2:** Given `staging-deploy.yml` or `e2e.yml` completes (success or failure), When the workflow's final status is known, Then exactly one status notification is sent reflecting that outcome — never zero, never more than one for the same run.

**AC3:** Given `deploy-group-auto-rerun.yml`'s existing `isDeployGroupEviction()` check confirms a cancellation was a genuine deploy-group eviction (not a real failure) and the rerun fires, When the rerun is triggered, Then a notification is sent stating that an auto-retry occurred for this run and why — so a human sees "this was handled automatically" instead of having to manually confirm it via `gh run rerun --failed`.

**AC4:** Given `isDeployGroupEviction()` determines a cancellation was a genuine failure, not an eviction (the `if:` gate's existing behaviour), When no rerun fires, Then no misleading "auto-retry occurred" notification is sent — this story must never notify about a retry that didn't actually happen.

## Out of Scope

- Any change to `isDeployGroupEviction()`'s own decision logic — this story only adds a notification call downstream of its existing, unmodified result.
- Notifying on PR-branch (non-master) CI runs — scoped to master-merge events per the discovery's own MVP wording ("100% of merges to master").

## NFRs

- **Performance:** The notification call must not add meaningful latency to the deploy pipeline — fire it as a non-blocking step where the workflow structure allows, consistent with `coha-s1`'s own bounded-timeout design.
- **Security:** None beyond what `coha-s1` already provides — this story introduces no new credential handling.
- **Accessibility:** Not applicable.
- **Audit:** Notification dispatch is logged, enabling Metric 1's CI-run-count-vs-dispatch-count measurement method.

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
