# Decisions: required checks take their rules from master (gic-s1)

**2026-11-17 | DECISION | Read the opt-in flags of the required checks from the base branch, and the reader too**
**Context:** the gate integrity audit found that setting `audit.staging_e2e_scenario_a` (or `_b`) to `false` in a pull request's own `.github/context.yml` makes the required job print "skipped" and report success without running a browser test.
**Decision:** each of the three jobs fetches the base branch, reads the flag with `git show origin/<base>:.github/context.yml` through `scripts/read-base-flag.js`, and takes the reader itself from the base branch as well. A base ref that cannot be fetched or resolved fails the step; it never means "off". A flag that is absent on the base is false, so forks of this template keep their opt-in behaviour.
**Rationale:** flipping a flag then needs its own merge to master first, which the operator sees as a single-purpose pull request. Taking the reader from the base closes the obvious next move (editing the reader). The one exception is the pull request that introduces the reader (the base does not have it yet); that run uses its own copy and says so in the log. After this merges the exception cannot be triggered, because the base always has the script.

**2026-11-17 | DECISION | The unit baseline decision uses the intersection of the pull request's and master's baselines**
**Context:** `tests/known-baseline-failures.json` lists test files excused from failing the unit job; a pull request can add a failing test to its own copy to hide a regression.
**Decision:** with master's baseline supplied, only entries in both are honoured. An entry the pull request removes is honoured (fixing a test and removing its entry in one pull request still works, as bfl-s1 requires); an entry it adds is ignored, reported by name, and the failing test is a new regression.
**Rationale:** the baseline is empty today, so the rule costs nothing now and keeps the file from being a back door later. Growth of the baseline needs its own earlier merge.

**2026-11-17 | DECISION | Changes to gate files are reported in observe mode first, by a `pull_request_target` workflow that cannot run pull-request code**
**Context:** the agent and the operator share one GitHub identity, so an approval, label or comment gate would be satisfiable by the agent, and a required review would block the operator (GitHub does not let an author approve their own pull request).
**Decision:** a workflow on `pull_request_target` (definition, list and script all from master) lists the changed paths through the API and reports any that match `.github/gate-files.json` in the job summary and one comment updated in place. It never fails (`mode: observe`). It has no checkout of the head, no install step and only `contents: read` and `pull-requests: write`; a test asserts each of those.
**Rationale:** the controls that work without a second identity are visibility and reading rules from the base. Observe-before-enforce follows the article that prompted the audit (off, observe, enforce) and lets the list be tuned on real pull requests before anything can block a merge.
**Known limit:** because the workflow is read from master it cannot report on the pull request that adds it; its first real report is the next pull request that touches a gate file.

**2026-11-17 | NOT DONE (operator decisions) | Enforce mode, a separate identity for agent pull requests, `CODEOWNERS` with a required review**
Each needs a decision that is not mine: a second GitHub identity (an App or bot account) for agent pull requests is what would make an approval step mean something.

**2026-11-17 | NOTE | The assurance gate checks that `governance-gates.yml` exists, not what it says**
Recorded in the audit (recommendation 4) and left as a follow-up once the observe-mode data shows how often gate files change.
