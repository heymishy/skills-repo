## Story: Required checks take their rules from master, and changes to gate files are visible

**Epic reference:** None - short-track (a CI-quality story from the 2026-11-17 gate integrity audit, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: `artefacts/2026-11-17-testing-cicd-audit/spikes/gate-integrity-audit.md` (findings table and recommendations 1 to 4).
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [ci] [governance]

## User Story

As **the operator who merges every pull request, many of them written by an agent using my own account**,
I want **the three required checks to take their on/off switches from master and every pull request that edits a gate-defining file to say so, loudly**,
So that **a pull request cannot turn a required check into a pass by editing one line in a file it owns, and I never merge a change to a gate without having been told**.

## Benefit Linkage

**Metric moved:** None formal. Today `Scenario A E2E (staging)` and `Scenario B E2E (staging)` read their opt-in flag from the pull request's own `.github/context.yml`; setting the flag to `false` makes the job print "skipped" and report success without running a browser test. The unit baseline file and several policy files are equally editable by the change they judge.
**How:** read the flags from the base branch, report (without failing) any pull request that touches a protected gate file, and make the unit regression check ignore baseline entries a pull request adds. Observe mode first, as the article this came from recommends; enforcing is a later decision.

## Architecture Constraints

- **Read rules from the base branch, never the pull request.** Anything that decides whether a check runs or passes is read with `git show origin/<base>:<path>` (or the API) in the workflow, never from the checked-out head.
- **No pull-request-target footgun.** The new reporting workflow runs on `pull_request_target` (so its definition and its protected-path list always come from master), and therefore it must never check out or execute code from the pull request: it reads the changed file list through the API only, and its permissions are `contents: read` and `pull-requests: write` (for one comment).
- **Observe mode: reports, never fails.** The reporting workflow always succeeds; its mode is a field in the base-branch protected-path file, so enforcing later is a separate, reviewed change.
- **Required checks keep their names** so the ruleset does not change. The jobs gain a small shared script and a fetch of the base ref; nothing else about their behaviour changes while the flags are true on master.
- **The unit baseline decision uses the intersection of the pull request's and master's baselines.** Removing an entry (a fix) is honoured; adding one is ignored and reported. No new npm dependency, no YAML parser (the project has none): the flag is read with the same small hand-written reader the workflows already use.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; platform change policy followed (workflows and scripts change by pull request).

## Dependencies

- **Upstream:** the gate integrity audit; `sep-s1` (the Scenario jobs), `lpw-s2` (the core job).
- **Downstream:** enforce mode and a separate identity for agent pull requests (operator decisions, out of scope).

## Acceptance Criteria

**AC1:** Given the jobs `Scenario A E2E (staging)`, `Scenario B E2E (staging)` and `Core browser tests`, When a pull request runs, Then each reads its opt-in flag through a shared script from the base branch's `.github/context.yml`, not from the pull request's checkout; a pull request that sets the flag to `false` still runs the job; and a flag that is absent on the base branch is treated as off (so forks of this template keep their opt-in behaviour). Tests: the script against temporary git repositories (flag true on base and false on head returns true; false on base and true on head returns false; absent returns false), and workflow-text checks that the three jobs call the script and no longer read the checkout's `context.yml` for their flag.

**AC2:** Given a new workflow `.github/workflows/gate-files-changed.yml` triggered on `pull_request_target`, When a pull request touches any path in the protected list (`.github/gate-files.json`, read from the base branch), Then the job summary and one pull-request comment (updated in place on later pushes) list those paths and say that each is a file that decides whether a check passes; the job always succeeds; it never checks out or runs the pull request's code. Tests: the pure matcher (`findGateFileChanges`) with exact paths and globs; workflow-text checks (trigger is `pull_request_target`, no `ref:` of the head, permissions limited, no step that runs a script from the head, the job has no way to fail on a match in observe mode).

**AC3:** Given `scripts/ci-test-regression-check.js`, When a pull request's `tests/known-baseline-failures.json` has entries that master's does not, Then those added entries are not honoured (a test that fails only because it was added to the baseline is reported as a new regression) and are listed in the output; entries the pull request removes are honoured; with no base baseline supplied the behaviour is unchanged. Tests: the function with two baselines (addition ignored and reported, removal honoured, identical unchanged, no base given unchanged).

**AC4:** Given the protected list, When it is first committed, Then it names at least: `.github/workflows/**`, `.github/scripts/**`, `.github/context.yml`, `.github/governance-gates.yml`, `.github/trace-validation.yml`, `.github/gate-files.json`, `tests/known-baseline-failures.json`, `tests/e2e/capability-matrix.json`, `scripts/ci-test-regression-check.js`, and the guard tests `tests/check-a5-ci-gate-config.js` and `tests/check-b2-ci-gate-config.js`; and a test fails if a protected path pattern matches nothing in the repository (so the list cannot rot).

**AC5 (live, on the pull request):** Given this story's own pull request (which edits workflows and `context.yml`'s neighbours), When its CI runs, Then `Gate files changed` reports the files this pull request itself touches, and the three required checks still pass; recorded in the Definition of Done. The ordering caveat is recorded too: the new workflow cannot report on the pull request that introduces it (a `pull_request_target` workflow is read from master), so its first real report is the next pull request.

## Out of Scope

- Enforce mode (a required, failing `Gate files changed`) and any ruleset change; a separate identity for agent pull requests; `CODEOWNERS` and required reviews.
- Reading `governance-gates.yml`'s content in the assurance gate (the audit's recommendation 4, a follow-up once the observe data exists).
- The production-promotion environment and the dreaming workflow.

## NFRs

- **Security:** the `pull_request_target` workflow never executes or checks out pull-request code; the comment contains only paths and fixed text, never content from the pull request.
- **Reliability:** if the base ref cannot be fetched the three jobs fail closed (the job fails, it does not silently skip).
- **Runtime:** the base-flag read adds seconds, not minutes, to each job.

## Complexity Rating

**Rating:** 2 - small pieces, but `pull_request_target` and the base-ref fetch cannot be proved end to end before merge.
**Scope stability:** Unstable - the existing `check-a5` and `check-b2` guards assert on the jobs' flag steps and may need matching changes (which is the very kind of edit this story makes visible).
