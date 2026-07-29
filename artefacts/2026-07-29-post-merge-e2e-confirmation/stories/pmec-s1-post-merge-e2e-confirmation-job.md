# Story: Auto-confirm real-staging E2E specs immediately after every master deploy

**Epic reference:** None — short-track (infra fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the pattern already confirmed twice this session (see Benefit Linkage)
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **an operator (or coding agent) shipping a PR that introduces a brand-new staging-safe endpoint alongside its own real-staging E2E test**,
I want **that new endpoint's real-staging E2E spec to be automatically re-run against the actually-deployed app immediately after merge**,
So that **I get a same-day, automatic confirmation signal instead of having to remember to manually re-run the spec from a local worktree**.

## Benefit Linkage

**Metric moved:** None formal (short-track infra fix, no benefit-metric artefact) — operational confidence, evidenced below.
**How:** `workspace/capture-log.md` (2026-07-28, dsh-s4 subagent-execution entry) documents the exact gap: a PR that both introduces a new staging-safe test endpoint AND adds a real-staging E2E test of that same endpoint in the same PR cannot pass that check on its own pre-merge CI run, because `staging-deploy.yml` only deploys on push to master (no PR-preview deploy mechanism exists). dsh-s4's `POST /test/evict-skill-session` hit this exactly — its own PR's Scenario A check failed with the endpoint returning the generic sign-in page (not yet deployed), even though the endpoint's own unit test already proved its logic correct. It was resolved manually: merge with the one known-red check, then confirm the real behaviour via a manual local re-run against the freshly-deployed app (`workspace/capture-log.md`, 2026-07-28, dsh-s4 post-merge confirmation entry — this same entry also documents that `gh run rerun` cannot be used for this confirmation once GitHub deletes the merged PR's source branch). This story closes the gap by making that confirmation automatic instead of dependent on a human remembering to do it.

## Architecture Constraints

- **Runs inside `staging-deploy.yml`, not `e2e.yml`:** the new job is added to `.github/workflows/staging-deploy.yml` with `needs: deploy-staging`, so it only ever runs after a real deploy to `wuce-staging` has completed on that same workflow run (triggered by `push: branches: [master]`) — never racing the deploy itself, and never needing the `deploy-group` concurrency guard cif-s1 already added to `e2e.yml`'s Scenario A/B jobs (this job is sequenced by `needs:`, not a separate triggered workflow).
- **Reuses the exact same spec files and flags as `e2e.yml`'s Scenario A/B jobs** (`audit.staging_e2e_scenario_a` / `audit.staging_e2e_scenario_b` in `.github/context.yml`) — no new opt-in flag, no new spec files. This is a re-run of the same coverage against confirmed-live code, not new test coverage.
- **Non-blocking / informational only:** this job does not gate `promote-to-prod` (which already depends on `smoke-test`, unchanged) and does not block any other job. Its purpose is same-day visibility into whether the specs that could not be meaningfully validated pre-merge (because their target endpoint didn't exist yet) now pass against the real, deployed app — not to add a new release gate.

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `.github/workflows/staging-deploy.yml`, When the workflow file is read, Then it contains a new job (e.g. `post-deploy-e2e-confirm`) with `needs: deploy-staging`.

**AC2:** Given that new job, When its steps are read, Then it runs the same Scenario A spec files as `e2e.yml`'s `scenario-a-staging-e2e` job (gated by the same `audit.staging_e2e_scenario_a` flag) and the same Scenario B spec file as `e2e.yml`'s `scenario-b-staging-e2e` job (gated by the same `audit.staging_e2e_scenario_b` flag).

**AC3:** Given the new job, When `promote-to-prod`'s `needs:` is read, Then it still names only `smoke-test` — the new job is not added as a dependency of `promote-to-prod` (non-blocking, per Architecture Constraints).

**AC4:** Given the new job, When a failure occurs in one of its spec runs, Then the job does not fail the overall `staging-deploy.yml` workflow run in a way that blocks `promote-to-prod` — confirmed via AC3 (no `needs:` edge into it) rather than a `continue-on-error` override, matching this repo's established convention (per `check-bri-s2.6-smoke-test-promote-gate.js`'s T2, only `smoke-test` itself is permitted to gate promotion; this new job must remain structurally incapable of doing so).

**AC5:** Given a new standards document, When it is read, Then it documents: (a) why the bootstrapping gap happens (no PR-preview deploy mechanism), (b) how to recognise it in a PR's CI output (Scenario A/B failing with a sign-in-page/JSON-parse-style error, not a real assertion failure), (c) the manual workaround for the period between merge and this job's own completion (direct local worktree run against the live target — never `gh run rerun` on a merged PR, per the documented gap), and (d) a pointer to this new automated job as the primary same-day confirmation mechanism going forward.

## Out of Scope

- Changing `e2e.yml`'s pre-merge Scenario A/B jobs in any way — they are unchanged; this story only adds a new, separate post-deploy job.
- Making this new job a release gate (e.g. blocking `promote-to-prod` on its result) — deliberately non-blocking per Architecture Constraints; a failure here is a signal to investigate, not an automatic rollback trigger.
- A general "which specs are new since the last deploy" detection mechanism — out of scope; this job always re-runs the full current Scenario A/B spec set on every master push, which is simpler and sufficient (the specs that matter are already known — the same ones `e2e.yml` runs pre-merge).
- Retroactively re-running this confirmation for dsh-s4 or any other already-merged story — this story is forward-looking only.

## NFRs

- **Performance:** CI wall-clock time for every push to master increases by roughly the combined duration of the Scenario A/B spec suites (~3 minutes based on this session's observed run times) — acceptable given this runs once per master push, not per PR, and does not block any other job.
- **Security:** None new — reuses the same secrets (`E2E_STAGING_BASE_URL`, `E2E_STAGING_AUTH_STUB_SECRET`, `E2E_STAGING_ADMIN_PASSWORD`) already used by `e2e.yml`'s Scenario A/B jobs, with no new scope.
- **Accessibility:** N/A — no UI surface.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 1 — reuses existing spec files, existing flags, existing secrets; the only new structure is one job definition plus a documentation file.
**Scope stability:** Stable.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
