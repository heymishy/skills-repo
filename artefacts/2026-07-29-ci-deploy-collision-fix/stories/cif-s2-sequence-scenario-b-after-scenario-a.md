# Story: Sequence Scenario B after Scenario A so they never simultaneously race for the shared concurrency slot

**Epic reference:** None — short-track (infra fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the defect confirmed live on PR #633 below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **an operator (or coding agent) whose PR triggers both Scenario A and Scenario B real-staging E2E jobs**,
I want **those two jobs to never both actively request the shared `deploy-group` concurrency group at the same instant**,
So that **neither job gets outright cancelled by GitHub Actions' concurrency-queue eviction, even when a third, unrelated request for the same group (another open PR's Scenario A/B, or a master-triggered deploy) arrives at a similarly busy moment**.

## Benefit Linkage

**Metric moved:** None formal (short-track infra fix, no benefit-metric artefact) — operational correctness, evidenced below.
**How:** cif-s1 (this same feature, story cif-s1, merged 2026-07-29 as PR #632) gave `scenario-a-staging-e2e` and `scenario-b-staging-e2e` the same bare-string `concurrency: deploy-group` already used by `deploy-staging`, to stop a redeploy from racing a real-staging E2E run. This was confirmed working for the deploy-vs-E2E race it targeted. However, cif-s1's own story explicitly accepted that Scenario A and B would become "mutually exclusive with each other too" — the *intent* was that they'd simply queue and run sequentially. In practice, GitHub Actions' documented concurrency behaviour allows only one RUNNING job plus at most one QUEUED (not-yet-started) job per group at a time; if a *third* request for the same group arrives before that queued job starts, the queued job is CANCELLED outright, not delayed further. Since Scenario A and Scenario B have no `needs:` relationship and both fire from the same `pull_request` event, they both request `deploy-group` simultaneously on every push — meaning any time a third concurrent request for the group exists at that moment (a second open PR's own Scenario A/B pair, or a `deploy-staging` run from a master push landing at a similarly busy instant), one of Scenario A or B is at risk of being cancelled outright rather than just delayed. Confirmed directly on PR #633 (pmec-s1): two rapid pushes to that PR produced four simultaneous requests for `deploy-group` (two runs × two jobs each), and `Scenario B E2E (staging)` was cancelled with the annotation "Canceling since a higher priority waiting request for deploy-group exists." Re-running that exact job in isolation (no competing request) passed cleanly, confirming the mechanism, not a fluke of the double-push specifically.

## Architecture Constraints

- **Add `needs: scenario-a-staging-e2e` to `scenario-b-staging-e2e`** in `.github/workflows/e2e.yml` — this is the minimal fix. Sequencing them via GitHub Actions' own job-dependency graph (deterministic) means Scenario B's job does not even START, let alone request `deploy-group`, until Scenario A has finished with it. At any moment, at most one of {Scenario A, Scenario B} is an active requester of the group — freeing the group's single "queued" slot for genuine cross-PR/deploy contention instead of Scenario A and B consuming it against each other.
- **Do not remove the `concurrency: deploy-group` declaration from either job** — that guard (cif-s1) still correctly prevents a real deploy from racing either scenario; this story only adds ordering between the two scenarios themselves, it does not change their relationship to `deploy-staging`.
- **No change to `staging-deploy.yml`** — `deploy-staging`'s own `concurrency: deploy-group` declaration is unrelated to this fix and stays as-is.

## Dependencies

- **Upstream:** cif-s1 (`2026-07-29-ci-deploy-collision-fix`) — already merged (PR #632); this story is a direct fix-forward correction of a gap discovered in that same shipped work.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `.github/workflows/e2e.yml`'s `scenario-b-staging-e2e` job, When the workflow file is read, Then it declares `needs: scenario-a-staging-e2e`.

**AC2:** Given both jobs, When their `concurrency:` declarations are read, Then both remain unchanged (`concurrency: deploy-group`, matching `deploy-staging`'s group name) — this story adds ordering, it does not remove or alter the existing concurrency guard.

**AC3 (edge case, explicitly NOT changed):** Given the other jobs in both workflow files (`e2e` in `e2e.yml`; `smoke-test`, `promote-to-prod`, `deploy-staging` in `staging-deploy.yml`), When the workflow files are read, Then none of them gain a new `needs:` edge as a side effect of this change.

**AC4:** Given both modified files, When their YAML is parsed, Then both remain syntactically valid with no structural changes beyond the added `needs:` line.

## Out of Scope

- Any change to `staging-deploy.yml` — unrelated to this fix, entirely untouched.
- A general fix for the "third concurrent requester" problem across the whole repo (e.g. multiple simultaneous PRs each running their own Scenario A/B pair still contend with each other and with `deploy-staging` for the single queued slot) — that remains a real, accepted limitation of GitHub Actions' own concurrency-group mechanism (only one queued slot per group, repo-wide); this story only removes Scenario A and B's *redundant self-competition*, which was the avoidable, in-scope portion of the risk.
- Re-verifying pmec-s1's own PR (#633) against this fix — that PR already passed cleanly on manual re-run before this story existed; no action needed there.

## NFRs

- **Performance:** Adds Scenario A's own duration (already incurred serially via the shared concurrency group in practice) as an explicit, deterministic dependency instead of an implicit, racy one — no additional wall-clock cost beyond what cif-s1 already introduced; this story makes the existing sequential cost reliable rather than adding a new one.
- **Security:** None new — no change to secrets, permissions, or job scope.
- **Accessibility:** N/A — no UI surface.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 1 — a single `needs:` line addition, no new mechanism.
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
