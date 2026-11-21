## Story: A production promotion is not refused because of bookkeeping commits that landed after the deployed commit

**Epic reference:** None - short-track (found on 2026-11-21 when the operator's approval of run 44873189915 was refused)
**Discovery reference:** None - short-track skips discovery. Evidence, measured 2026-11-21: the operator (`heymishy`) approved the "Promote to production" step of `Staging Deploy` run 44873189915 (commit `8ba55c2b7`) at 06:33:23 UTC and the job failed 7 seconds later in its first step, `node scripts/promotion-guard.js`: "this run's commit is not the head of master, so it will not be promoted" (run commit `8ba55c2b7`, master head `6ba9ef180`). The two commits after `8ba55c2b7` (`6ba9ef180`, `4c87c33d3`) changed six files, all under `artefacts/` and `.github/pipeline-state.json`: pipeline bookkeeping that the deploy workflow ignores (`staging-deploy.yml` `paths-ignore`: `workspace/**`, `artefacts/**` except `artefacts/*/playback/**`, `.github/pipeline-state.json`), so no deploy run exists for them and the deployed code was identical to master's code. The guard (spg-s1, `scripts/promotion-guard.js`) accepts only a run whose commit is exactly the head of master. The repository's own rule is to apply state and DoD updates to master after a code merge, so after every code merge the waiting promotion was already unpromotable by the time it was reported. This is why nothing has reached production in the 2026-11-19 to 2026-11-21 window.
**Benefit-metric reference:** None - short-track
**Domain:** [ci, release]

## User Story

As **the operator who approves production promotions**,
I want **a promotion to be accepted when the only commits after the deployed one are bookkeeping commits, and still refused when any code has changed**,
So that **recording a DoD or a pipeline state after a merge no longer makes the build I tested and approved unpromotable**.

## Benefit Linkage

**Metric moved:** promotions refused for bookkeeping-only differences: every promotion that followed a post-merge bookkeeping push (all of them in the window) to none; promotions of a stale code commit: still refused.
**How:** when the run's commit is not the head, the guard asks GitHub to compare the two commits and accepts only when the head is strictly ahead and every changed path (including the old name of a rename) is a bookkeeping path from one shared list that a test keeps in step with the workflow's `paths-ignore`.

## Architecture Constraints

- Change confined to `scripts/promotion-guard.js`, a new `scripts/lib/bookkeeping-paths.js`, one new node check, and artefacts (bundled in this pull request; nothing is pushed to master for this story). `staging-deploy.yml` is not changed: the promote job already has `contents: read`, which the compare request needs.
- **Fails closed.** Accepted only when the comparison status is `ahead`, the commit and file lists are complete (the API's page limits are treated as possibly truncated), and every changed path is bookkeeping. A failed or malformed comparison, an unwired adapter, a `diverged` or `behind` status, a truncated list, a code path, a playback media file or a rename out of a code path all refuse.
- **One list, kept honest:** `isBookkeepingPath` mirrors the workflow's `paths-ignore`; a test parses the workflow and fails if the two ever classify a sample path differently.
- The injectable adapter rule (D37) applies: the compare adapter's default throws; it is wired in `main()` with the real `githubRequest`, and the check drives the real script against a fake GitHub API over HTTP.
- The promote job still builds and deploys its own run's commit; it is behind the head only by files that are not part of the built code. Preserve each file's existing line endings (`promotion-guard.js` is CRLF).

## Dependencies

- **Upstream:** spg-s1 (the guard and `check-spg-s1-stale-promotion-guard`, which must keep passing unchanged), sdsb-s1 (the workflow's `paths-ignore`).
- **Downstream:** the operator approves a promotion run after this merges; the DoD for this story and for `sfr-s1` are written only after that promotion has been approved (they are pushes to master).

## Acceptance Criteria

**AC1:** Given a run whose commit is behind the head of master and the comparison shows head `ahead` with every changed file a bookkeeping path, When the guard runs, Then it exits 0, says the difference is bookkeeping only and prints both commits; the compare request is `GET /repos/<repo>/compare/<run sha>...<head sha>` with the bearer token.
**AC2:** Given the comparison lists any file that is not a bookkeeping path (including a playback media file under `artefacts/<dir>/playback/`, and the previous name of a renamed file), When the guard runs, Then it exits 1 with REFUSED and names the file.
**AC3:** Given the comparison cannot be read (a failed request, an answer without files or commits), the status is `diverged`, `behind` or `identical`, or the lists may be truncated (300 files, or fewer commits than `total_commits`), When the guard runs, Then it exits 1 with REFUSED.
**AC4:** Given the run's commit is the head of master, When the guard runs, Then it exits 0 as before and makes no compare request.
**AC5:** Given the deploy workflow's `paths-ignore` list, When the guard's classifier and that list are applied to a set of sample paths, Then they agree on every one.
**AC6:** Given the compare adapter is not wired, When a stale commit is checked, Then it is refused (the default stub throws); and `check-spg-s1-stale-promotion-guard` passes unchanged.
**AC7:** Given the pull request, When CI runs on its final commit, Then it is green; and the pull request body names this folder so the assurance gate resolves the feature.

## Out of Scope

- Changing the deploy workflow's `paths-ignore`, the promote job's steps, or what the promote job builds.
- Cancelling superseded promotions (spa-s1) and the rest of `cancel-superseded-promotions.js`.
- Approving or promoting anything: the operator's.
- Moving the promote job to the head's commit (the job still deploys its own run's commit).

## NFRs

- **Safety:** never promotes a commit when any code path has changed since it, and never when the comparison is in doubt.
- **Visibility:** the output prints both commits and, on refusal, the first non-bookkeeping paths.

## Complexity Rating

**Rating:** 2 (a production-safety guard, fail-closed, with a drift test). **Scope stability:** Stable.
