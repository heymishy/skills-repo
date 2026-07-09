# Test Plan: Build the CI pipeline — PR checks through staging deploy

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.5-ci-pipeline-staging-deploy.md
**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-2-staging-environment.md
**Test plan author:** Copilot
**Date:** 2026-07-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | PR triggers lint/typecheck/`npm test`/build, merge blocked on failure | 3 tests (YAML structure) | — | — | 1 scenario | External-dependency (partial) | 🟡 |
| AC2 | Merge to `main` auto-deploys to `wuce-staging`, never `wuce-prod` | 2 tests (YAML structure) | — | — | 1 scenario | — | 🟢 |
| AC3 | Seed script (S2.4) runs automatically as the next pipeline step | 2 tests (YAML structure) | — | — | 1 scenario | — | 🟢 |
| AC4 | No push-to-main workflow deploys to `wuce-prod` outside the S2.6 promote job | 3 tests (static analysis) | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in this repo's Node suite | Handling |
|-----|----|----------|--------------------------------------------|---------|
| Actual enforcement that a failing PR check blocks the merge button | AC1 | External-dependency | Whether merging is *actually* blocked depends on a GitHub branch protection rule configured in repo Settings, not on the workflow YAML content itself — the YAML can define the check, but only GitHub's repo settings make it a required status check | Manual scenario — confirm the branch protection rule lists these checks as required, see AC verification script Scenario 1 🟡 |

---

## Test Data Strategy

**Source:** Fixtures — this story's testable surface is entirely GitHub Actions workflow YAML files. Tests read real workflow files from `.github/workflows/` (once created/modified by this story) plus synthetic fixture YAML files (written to a temp dir) to prove the static-analysis check correctly *catches* a violation, not just passes on a clean repo.
**PCI/sensitivity in scope:** No
**Availability:** Available now for fixture-based tests (synthetic YAML is generated in the test file). The real workflow file (e.g. a new `.github/workflows/ci-staging-deploy.yml` or a modified `fly-deploy.yml`) does not exist yet in its final form — tests targeting it fail until implementation lands.
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | The real CI workflow YAML (PR-triggered job) | Repo file, once created | None | Existing `.github/workflows/` already has PR-triggered checks for other purposes — this story's job may extend or add to that |
| AC2 | The real CI workflow YAML (push-to-main job) | Repo file, once created | None | Today's `.github/workflows/fly-deploy.yml` deploys straight to prod on push to `main` — this story replaces that behaviour |
| AC3 | Same workflow file, step ordering | Repo file | None | Step order matters — the seed step must come after the deploy step |
| AC4 | All `.github/workflows/*.yml` files, plus a synthetic "bad" fixture workflow containing a `--app wuce-prod` deploy outside the promote job | Repo files + synthetic fixture (written to tmp dir) | None | The synthetic fixture proves the check would actually catch a real violation, not just pass trivially on a clean repo — this is the "real unit-testable check" explicitly called for in this story's confirmed context |

### PCI / sensitivity constraints

None.

### Gaps

None — the real workflow file itself is the one piece of test data not yet available, which is expected (TDD red state), not a data-availability problem.

---

## Unit Tests

### T1 — A workflow exists that runs on `pull_request` and includes lint, typecheck, `npm test`, and a build step

- **Verifies:** AC1
- **Precondition:** `.github/workflows/*.yml` files are parsed as YAML
- **Action:** Find the workflow(s) triggered `on: pull_request`. Inspect their job steps for commands/step names matching lint, typecheck, `npm test`, and build (exact step naming is implementation-defined; this test looks for recognizable command substrings, e.g. `npm run lint`, `npm run typecheck` or `tsc`, `npm test`, `npm run build`)
- **Expected result:** All four categories of check are present in at least one `pull_request`-triggered workflow
- **Edge case:** No
- **Fails before implementation:** Yes, if any of the four checks is not yet wired into a PR-triggered workflow

---

### T2 — The `pull_request`-triggered workflow has no `continue-on-error: true` on any of the four checks

- **Verifies:** AC1 (a check that always "passes" even on failure would defeat "merging is blocked if any of these fail")
- **Precondition:** Same as T1
- **Action:** Inspect each of the four check steps for a `continue-on-error: true` key
- **Expected result:** None of the four checks has `continue-on-error: true` — a failure in any of them fails the job
- **Edge case:** Yes — this is exactly the kind of quiet defeat of an AC's intent that's easy to miss in a narrative review
- **Fails before implementation:** Yes, if the workflow doesn't exist yet or if any check is misconfigured with `continue-on-error`

---

### T3 — The `push`-to-`main`-triggered deploy step does not run on `pull_request` events

- **Verifies:** AC1, AC2 (trigger separation — PR checks and the staging deploy are distinct jobs/triggers)
- **Precondition:** Same as T1
- **Action:** Confirm the job containing the `wuce-staging` deploy step is scoped to `on: push: branches: [main]` and not also triggered by `pull_request`
- **Expected result:** The deploy job's trigger is `push` to `main` only
- **Edge case:** No
- **Fails before implementation:** Yes

---

### T4 — The push-to-main workflow's deploy step targets `wuce-staging`, not `wuce-prod`

- **Verifies:** AC2
- **Precondition:** Same as T1
- **Action:** Inspect the push-to-`main` job's deploy step command (e.g. `flyctl deploy` invocation) for the `--app` flag value
- **Expected result:** The `--app` value is `wuce-staging` (not `wuce-prod` and not the current `skills-framework` prod app name)
- **Edge case:** No
- **Fails before implementation:** Yes — today's `fly-deploy.yml` deploys directly with no explicit `--app` flag differentiation (it relies on the `fly.toml` in the working directory, which is prod's)

---

### T5 — No push-to-main-triggered workflow step contains `--app wuce-prod` (or equivalent) outside the S2.6 promote job

- **Verifies:** AC4
- **Precondition:** All `.github/workflows/*.yml` files are parsed
- **Action:** For every workflow triggered by `push` to `main`, scan every job's every step for a `--app wuce-prod` (or `app: wuce-prod` / equivalent Fly app reference to the prod app, whatever its final name) command, excluding any job explicitly identified as the manual-approval promote job introduced by S2.6 (identified by a documented job id or name convention, e.g. `promote-to-prod`, gated behind `environment:` or `workflow_dispatch`)
- **Expected result:** Zero matches outside the allowlisted promote job
- **Edge case:** No
- **Fails before implementation:** Yes, until the workflow is rewired away from today's direct-to-prod behaviour

---

### T6 — Synthetic fixture: the check correctly flags a violation when one is deliberately introduced

- **Verifies:** AC4 (proves the check is a real detector, not a check that trivially passes)
- **Precondition:** A synthetic fixture workflow YAML is written to a temp dir, containing a `push`-to-`main`-triggered job with a step running `flyctl deploy --app wuce-prod` — deliberately outside any promote-job allowlist
- **Action:** Run the same static-analysis check function used by T5, pointed at the temp dir containing only the synthetic fixture
- **Expected result:** The check reports a violation for the synthetic fixture (non-zero findings), proving the detection logic actually works rather than passing vacuously
- **Edge case:** Yes — this is the "prove the test can fail" sanity check
- **Fails before implementation:** Yes — the check function doesn't exist yet; once it does, this test should always pass (it's testing the check itself against a fixture, not the real repo state)

---

## Integration Tests

### IT1 — The seed script step runs immediately after the deploy step, within the same job

- **Verifies:** AC3
- **Components involved:** The push-to-`main` workflow's job step ordering
- **Precondition:** The workflow YAML is parsed into an ordered step list
- **Action:** Find the index of the `wuce-staging` deploy step and the index of the seed-script invocation step (e.g. `node scripts/seed-staging.js`, per S2.4)
- **Expected result:** The seed step's index is immediately after (or later than, but before any subsequent unrelated step) the deploy step's index, within the same job — not a separate manually-triggered workflow
- **Fails before implementation:** Yes

---

## NFR Tests

### NFR1 — Performance

- **NFR addressed:** Performance — PR-check pipeline completes within a reasonable CI budget; "not specified further here since it's an existing, already-tuned pipeline being extended, not built from scratch" (per story)
- **Measurement method:** Not applicable — no new budget defined by this story
- **Pass threshold:** N/A
- **Tool:** N/A
- **Note:** None further specified — confirmed with story owner. If a new PR-check step meaningfully changes the existing pipeline's tuned runtime, that would surface during real CI runs, not a unit test.

---

### NFR2 — Security (staging deploy uses only staging-scoped secrets)

- **NFR addressed:** Security — staging deploy uses staging-scoped Fly/Neon/Upstash/PostHog secrets exclusively; no prod secret is ever accessible to the staging deploy job
- **Measurement method:** Inspect the staging deploy job's `env:`/`secrets:` references in the workflow YAML. Cross-check against a documented list of prod-only secret names (e.g. any secret name containing `PROD` or matching prod-specific naming, if such a naming convention is adopted at implementation time).
- **Pass threshold:** The staging deploy job references no secret name identifiable as prod-only
- **Tool:** Node.js YAML parse + string matching
- **Note:** This test's precision depends on a clear secret-naming convention existing at implementation time (e.g. `STAGING_DATABASE_URL` vs `PROD_DATABASE_URL`, or a shared `FLY_API_TOKEN` that is account-scoped rather than app-scoped). If secrets aren't named with an environment prefix, this test can only assert the *job* doesn't reference any secret documented elsewhere as prod-exclusive — flagged as a soft assertion, not a hard guarantee, in Test Gaps below.

---

### NFR3 — Accessibility

- **NFR addressed:** Not applicable (per story)
- **Measurement method:** N/A
- **Pass threshold:** N/A
- **Tool:** N/A

---

### NFR4 — Audit

- **NFR addressed:** GitHub Actions run history is the audit trail for every deploy; no additional custom logging needed (per story)
- **Measurement method:** N/A — no custom logging to test
- **Pass threshold:** N/A
- **Tool:** N/A
- **Note:** None — confirmed with story owner.

---

## Out of Scope for This Test Plan

- Actually running the workflows on GitHub Actions' real infrastructure — tests are static YAML analysis only
- Verifying branch protection rules are configured to make these checks "required" (AC1's enforcement gap — see Coverage gaps)
- Preview/per-PR ephemeral environments — explicitly out of scope per story
- Rollback automation — explicitly out of scope per story (covered manually by S2.6)

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC1's "merging is blocked if any of these fail" enforcement | Depends on a GitHub branch protection rule (repo Settings), not the workflow YAML content | Manual scenario in AC verification script confirms the branch protection rule lists these checks as required |
| NFR2's secret-naming assertion is soft without a documented naming convention | No environment-prefixed secret naming convention exists yet in this repo (current secrets like `FLY_API_TOKEN` are account-wide, not app-scoped in name) | Flag at implementation time — if secrets remain unprefixed, NFR2 should instead assert no *literal prod connection value* leaks into the staging job's logs (a runtime concern, closer to a manual smoke check) rather than a purely static name check |
| T5/T6 depend on a documented promote-job allowlist convention from S2.6 | S2.6 (which introduces the promote job) has not landed yet at the time this test plan is written | T5/T6 use a documented job-id/name convention (e.g. `promote-to-prod`) as the allowlist key; if S2.6's implementation names the job differently, update the allowlist string in this test, not the check's underlying logic |
