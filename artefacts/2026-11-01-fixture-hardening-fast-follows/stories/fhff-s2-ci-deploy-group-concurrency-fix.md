## Story: Stop the deploy-group concurrency lock from silently cancelling E2E coverage

**Epic reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/epics/test-infra-fast-follow-batch.md
**Discovery reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/discovery.md
**Benefit-metric reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/benefit-metric.md

## User Story

As the **platform maintainer who owns this repo's CI reliability**,
I want **a PR whose E2E job gets cancelled by the `deploy-group` concurrency lock (because a newer push landed in the same group) to automatically recover, instead of silently shipping a skipped/red check**,
So that **a red or missing E2E check on a PR always means something real happened, not that two pushes happened to land close together** — the exact pattern that silently skipped coverage on `tfhc-s7`, `tfhc-s8`, and `tfhc-s9`'s own PRs this session.

## Benefit Linkage

**Metric moved:** CI `deploy-group` cancellation incidence (m6)
**How:** An automatic recovery mechanism (or, if feasible, a scoping change that avoids the cancellation entirely while keeping the lock correctly scoped to the one real shared `wuce-staging` resource) directly reduces the observed cancellation count to zero, or ensures every cancellation that does occur resolves itself within the same PR's check run rather than requiring a human to notice and manually rerun it.

## Architecture Constraints

None identified — checked against `.github/architecture-guardrails.md`. No Active ADR governs E2E deploy concurrency scoping specifically (ADR-009/010 cover audit-workflow trigger separation, a different concern).

## Dependencies

- **Upstream:** None.
- **Downstream:** None named yet.

## Acceptance Criteria

**AC1:** Given two pushes landing close together in the same `deploy-group` concurrency scope (e.g. a PR's own draft-PR-open commit immediately followed by a state-write commit, or two different PRs' pushes overlapping), When the fix is in place, Then the older push's Scenario A/B E2E job does not end up silently skipped with no human-visible signal — either the cancellation itself no longer occurs, or an automatic mechanism reruns the cancelled job without manual intervention.

**AC2:** Given the fix, When the updated workflow YAML is read, Then the concurrency key remains scoped to the single shared `wuce-staging` resource (not narrowed to a per-ref key) — confirmed by direct inspection, since narrowing it was already explicitly rejected as a regression (it would let two different PRs deploy/E2E-test against the same real app concurrently).

**AC3:** Given a cancellation still occurs despite the fix (the underlying GitHub Actions platform limitation — only one waiting request held per concurrency group — cannot be fully eliminated without the out-of-scope ephemeral-environments redesign), When the automatic recovery mechanism detects it, Then it reruns the cancelled job and the PR's check run reflects a real pass/fail result, not a silently-missing one.

**AC4:** Given the fix is merged, When observed across at least 2 subsequent PRs in this repo, Then zero cancellations go unresolved — either none occur, or every one that does occur is auto-recovered within that PR's own check run.

## Out of Scope

- Per-PR ephemeral staging environments — the bigger structural alternative; this story's fix is the narrower, bounded one.
- Narrowing the concurrency key to a per-ref scope — explicitly rejected, would be a regression against the single-shared-`wuce-staging`-app constraint.
- Any Fly.io infrastructure or configuration change — confirmed unnecessary via `/clarify` (this is a pure GitHub Actions workflow-level concern).

## NFRs

- **Performance:** None beyond the metric target itself (m6) — this story is about correctness/reliability of E2E coverage, not raw speed.
- **Security:** Any new workflow or step added to call the GitHub Actions rerun mechanism must use the minimum permission scope needed (least-privilege `permissions:` block), not broaden the existing workflow's token permissions carelessly.
- **Accessibility:** N/A — no UI.
- **Audit:** N/A — no audit-relevant surface beyond the existing CI job history itself.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

<!-- Rating 2: some real ambiguity (whether the default GITHUB_TOKEN permissions suffice for calling the rerun API, or whether a different token/App installation is needed -- a genuine implementation unknown), but the problem itself and its two viable solution shapes (narrower-but-correct scoping, or an auto-retry wrapper) are already well understood from this session's own root-cause diagnosis. Scope stability Stable -- the discovery's own /clarify step already confirmed no Fly.io dependency, closing the main source of potential scope surprise. -->

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
