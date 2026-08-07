# Story: Prevent a staging redeploy from racing a PR's real-staging E2E job

**Epic reference:** None — short-track (infra fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the pattern already confirmed 5 times this session below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **an operator (or coding agent) reviewing a PR's CI status**,
I want **a staging redeploy and a PR's real-staging E2E job (Scenario A/B) to never run at the same time**,
So that **I never have to root-cause and manually re-run a false-negative CI failure caused by a deploy interrupting a test mid-flight**.

## Benefit Linkage

**Metric moved:** None formal (short-track infra fix, no benefit-metric artefact) — operational reliability, quantified below.
**How:** This exact collision (a `chore:` bookkeeping push to master, which auto-triggers `staging-deploy.yml`'s redeploy, landing within seconds of a PR's `Scenario A/B E2E (staging)` job starting) was confirmed 5 separate times across the `durable-session-history` epic this session (PRs #626, #627, #628, #629, #630), each requiring manual root-cause investigation (checking timestamps, reading failure logs, confirming the symptom matched the known pattern) and a manual re-run — real, recurring operator/agent time cost for a structural gap, not a code defect. This story closes the gap directly using GitHub Actions' own concurrency-group mechanism.

## Architecture Constraints

- **Reuse, don't invent:** `staging-deploy.yml`'s `deploy-staging` job already declares `concurrency: deploy-group` (added for a different reason — serializing concurrent staging deploys against each other). This story reuses the SAME group name on `e2e.yml`'s `scenario-a-staging-e2e` and `scenario-b-staging-e2e` jobs, rather than inventing a new mechanism — GitHub Actions concurrency groups are matched by name across the whole repository, not scoped to a single workflow file.
- **No `cancel-in-progress` override:** the bare-string form (`concurrency: deploy-group`, no explicit `cancel-in-progress`) already gives GitHub's documented default behaviour — a job entering an occupied group queues (waits) rather than cancelling the currently-running job. This is exactly the desired behaviour: neither a real staging deploy nor a real E2E test run should ever be cancelled mid-flight, they should simply take turns.

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `.github/workflows/e2e.yml`'s `scenario-a-staging-e2e` job, When the workflow file is read, Then it declares `concurrency: deploy-group` — the same group name already used by `staging-deploy.yml`'s `deploy-staging` job.

**AC2:** Given `.github/workflows/e2e.yml`'s `scenario-b-staging-e2e` job, When the workflow file is read, Then it also declares `concurrency: deploy-group`.

**AC3 (edge case, explicitly NOT changed):** Given `staging-deploy.yml`'s `smoke-test` and `promote-to-prod` jobs, and `e2e.yml`'s other existing job (`e2e`, the local-mocked Playwright smoke suite), When the workflow files are read, Then none of these gain a new `concurrency` declaration — this story is scoped precisely to the confirmed collision (a redeploy racing a *real-staging* E2E job), not every job that happens to touch staging.

**AC4:** Given both modified workflow files, When their YAML is parsed, Then both remain syntactically valid YAML with no structural changes beyond the added `concurrency:` lines.

## Out of Scope

- Solving every possible concurrent-staging-usage scenario (e.g. `smoke-test` racing Scenario A/B, or Scenario A racing Scenario B) — out of scope; this story fixes only the specific, repeatedly-confirmed "deploy racing a PR's real-staging test" collision.
- Any change to `staging-deploy.yml`'s `deploy-staging` job itself — its existing `concurrency: deploy-group` declaration already exists and is reused as-is, not modified.
- A documented tradeoff, explicitly accepted rather than solved: since Scenario A and Scenario B now share the same concurrency group as `deploy-staging`, they also become mutually exclusive with *each other* (previously ran in parallel within the same PR-triggered workflow run) — GitHub Actions concurrency groups are transitively determined by exact group-name match, not pairwise relationships, so there is no way to make A/B mutually exclusive with the deploy job without also making them mutually exclusive with each other. This adds roughly one Scenario job's wall-clock time (~2 min) to each PR's CI run. Accepted as a reasonable tradeoff against a recurring, confusing false-negative failure that has already cost real investigation time 5 times.

## NFRs

- **Performance:** CI wall-clock time for a PR touching Scenario A/B increases by roughly the smaller of the two jobs' duration (they now run sequentially instead of in parallel) — acceptable given the story's own stated tradeoff above.
- **Security:** None — no new secrets, no new permissions, no change to what either job can access.
- **Accessibility:** N/A — no UI surface.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 1 — a two-line addition to an existing, already-used mechanism (concurrency groups), no new infrastructure.
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
