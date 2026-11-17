# Gate integrity audit: which checks can the change they judge edit?

Date: 2026-11-17. Prompted by Addy Osmani's "How the Claude Code team thinks about verification" (17 Nov 2026), which says a check is broken if the change under review can modify it, and that review rules should be read from the base or default branch. This is a read-only audit of this repository's gates; nothing was changed to produce it.

## Method

For each check that runs on a pull request: where its workflow, its script and its rules come from (the pull request's own branch, or master), and what a pull request would have to edit to make it pass without doing its job. Sources: `gh api repos/heymishy/skills-repo/rulesets/14979696`, `.github/workflows/*.yml`, `.github/scripts/run-assurance-gate.js`, `scripts/ci-test-regression-check.js`, `.github/context.yml`.

## The merge rules in force

- Ruleset 14979696 is active. Required status checks: `Run assurance gate`, `Scenario A E2E (staging)`, `Scenario B E2E (staging)`. Also: pull request required, linear history, no deletion, no force push.
- Required approving reviews: **0**. No code owner review. No `CODEOWNERS` file. The repository admin role bypasses the ruleset.
- The agent opens pull requests through `gh` with the operator's own GitHub identity, so any approval, label or comment the operator could give, the agent could give too. This limits what a technical control can separate (see "What cannot be fixed with a check").

## Findings

Every workflow that runs on `pull_request` uses the workflow files and scripts of the pull request's own merge commit and, where it checks out code, `ref: ${{ github.head_ref }}`, so a pull request controls them.

| Gate | Required? | Rule or policy comes from | What the same pull request can edit to neutralise it | Risk |
|---|---|---|---|---|
| Run assurance gate | yes | `.github/scripts/run-assurance-gate.js` from the PR; it checks that `governance-gates.yml` *exists* and that state files are valid JSON, not what they say | the script, or the gate files it merely checks for existence | high: required, and weak even when intact |
| Scenario A E2E (staging) | yes | flag `audit.staging_e2e_scenario_a` read from the PR's `.github/context.yml`; the job's own steps and the specs | set the flag to `false`: the job runs only a step that prints "skipped" and the check reports success, with no browser test run | **high: one line turns a required check into a pass** |
| Scenario B E2E (staging) | yes | flag `audit.staging_e2e_scenario_b`, same shape | same | **high** |
| Unit chain (`PR Checks`) | no (not in the ruleset) | `tests/known-baseline-failures.json` from the PR; `ci-test-regression-check.js` from the PR; guard tests `check-a5-*`, `check-b2-*` read the workflow text from the PR | add a failing test to the baseline; edit the guard and the workflow together | medium: not required today, and the operator is considering making it required |
| Core browser tests | no (a candidate) | flag `audit.core_browser_tests` and `tests/e2e/capability-matrix.json` from the PR | flag to `false` (same skip-is-green shape); move a failing spec to `extended` or `quarantined` | medium |
| Trace validation | no | `.github/trace-validation.yml` (`reference_dirs`, exempt tracks) from the PR | add a folder to `reference_dirs` (this session's `lpw-s3` change did exactly that, legitimately) | medium |
| Watermark gate, cross-tenant repeat gate | no | scripts from the PR | edit the script | lower |
| Quarantine guard (`check-lpw-s2-capability-matrix`) | no | matrix and dates from the PR | re-date or edit entries | lower: dates are bounded to 45 days by the guard, which the PR can also edit |

The "skipped is green" pattern is the sharpest: it exists so forks of this template can opt into jobs, but in this repository it means the required checks are only as strong as one boolean in a file the pull request owns.

## What is already good

- The pull request, linear history and three required checks are real gates for a change that does not touch the gate files.
- The operator reads and merges every pull request, so a gate change is visible in the diff; nothing here is a hidden bypass.
- Quarantine entries have owners, review dates and a guard; `ci-test-regression-check` fails on a stale baseline entry as well as a new failure (bfl-s1).
- Gates already use a baseline mechanism (`known-baseline-failures.json`), so reading it from master instead of the PR is a small change.

## What cannot be fixed with a check

The agent and the operator share one GitHub identity. A "needs human approval" label, comment or review is something the agent's token can add, and GitHub does not let an author approve their own pull request, so a required review would also block the operator. A real separation needs a second identity for agent pull requests (a GitHub App or bot account), which is a larger decision. Until then the controls that work are the ones that need no approval step: read rules from master, and make changes to gate files loud.

## Recommendations (cheapest and highest value first)

1. **Read the opt-in flags of the three required jobs from master, not from the pull request.** In each job, replace the read of `.github/context.yml` from the checkout with `git show origin/master:.github/context.yml` (or the API). A pull request that sets a flag to `false` then changes nothing for its own run; flipping a flag becomes a merge to master first. Also make the skipped step fail on a pull request whose base is `master` and whose flag (from master) is true but the job did not run. Small, testable, closes the sharpest hole.
2. **Make changes to gate-defining files loud, in observe mode first** (the article's off, observe, enforce). A workflow on `pull_request_target`, whose definition always comes from master, lists any touched path from a protected list (workflows, `.github/scripts/**`, `context.yml`, `governance-gates.yml`, `trace-validation.yml`, `known-baseline-failures.json`, the capability matrix, the `check-a5/b2` guards) in the job summary and a pull request comment. It never fails. After a few weeks of data, decide whether to enforce (a required check the operator passes by deliberate bypass).
3. **Compare the unit baseline with master's.** `ci-test-regression-check.js` reads `known-baseline-failures.json` from master (`git show origin/master:...`) for the failing/not-failing decision and reports, separately, any entry the pull request added. Legitimate growth then needs its own earlier merge.
4. **Make the assurance gate check content, not existence.** Verify the hash of `governance-gates.yml` against master's and fail on a difference (folds into 2 once enforced).
5. **Later, and a decision for the operator:** a separate identity for agent pull requests, and `CODEOWNERS` plus a required review once that exists.

## Limits of this audit

Read from the workflow and script text and the ruleset API only; I did not open a test pull request that flips a flag to prove the skipped-is-green behaviour end to end (it follows from the three "skipped (opt-in flag not set)" steps and the flag read in `e2e.yml`, and would be the first test of the fix). I did not review the production-promotion environment or the dreaming workflow here.
