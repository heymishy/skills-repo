# Decisions: CI regression scenarios review

**2026-11-16 | FINDING | CI cost and noise sit outside the functional tests**
**Evidence:** `artefacts/2026-11-15-production-error-sweep/reference/ci-regression-scenarios-audit.md` (1000 runs over about 3.5 days): 342 always-red runs, incident bot PRs 23% of PR gating, the staging end-to-end tests master rather than the PR and sets the time to green, and no CI scenario exercises the real production wiring.

**2026-11-16 | DECISION | Operator: fix the Improvement Agent ("dreaming"); disable Fleet Aggregation**
**Context:** the operator asked, after reading the audit, for the Improvement Agent workflow to be fixed and Fleet Aggregation to be disabled.
**Decision:** story `ciw-s1` fixes the dreaming workflow (it currently pushes to master, which the ruleset rejects, and stages about 3000 trace files); story `ciw-s2` disables Fleet Aggregation (missing `FLEET_PUSH_TOKEN`) and records the Pages decision as an open question (Pages is not enabled, so its deploy fails on every push).
**Rationale:** the dreaming workflow is a feature the operator wants; Fleet is not currently used.

**2026-11-16 | SEQUENCING | Do the wiring smoke test before moving the staging end-to-end off the PR gate**
**Decision:** `sep-s1` is blocked until `pws-s1` is merged. Low-risk noise removal (`ciw-s2`, `inc-s1`, `spa-s1`) can go first.
**Rationale:** the staging end-to-end does not test the PR's code, but it is the only end-to-end signal today; the wiring smoke test is its replacement on the PR.

**2026-11-16 | CONSTRAINT | The ruleset requires three status checks**
**Context:** a push to master by the dreaming workflow was rejected with "3 of 3 required status checks are expected". Any story that skips, renames or path-filters a workflow must first read which three checks are required, because a required check that never reports blocks every merge. Affects `inc-s1` and `sep-s1`.

## Proposed order

1. `ciw-s2` (disable Fleet; Pages decision), `spa-s1`, `trr-s1`: small and independent.
2. `ciw-s1` (fix dreaming), once its two open questions are answered.
3. `pws-s1`, then `inc-s1`, then `sep-s1`.
4. `bfl-s1` and `pbj-s1` in parallel with the above when convenient.

**2026-11-16 | DECISION | Operator: disable the Pages deploy; Pages publishing and the dashboards are "fully deprecated"**
**Context:** the Pages deploy has failed on every push because Pages was never enabled; enabling it would have published `pipeline-state.json` publicly. The operator, after reading what it publishes, said to disable it and that "all that is and should be fully deprecated".
**Decision:** `ciw-s2` deprecates both the Pages and the Fleet Aggregation workflows non-destructively (manual trigger only, DEPRECATED headers, a banner in `dashboards/README.md`). Nothing is deleted yet, because 8 test files and the viz governance checks reference `dashboards/`.
**Open:** whether to remove the `dashboards/` folder and its tests entirely is a separate story that needs the operator's explicit go-ahead.

**2026-11-16 | DECISION | Operator: no bot PR per production error issue; close the five open incident PRs; build inc-s2**
**Context:** the operator asked whether incident PRs are needed as well as GitHub issues ("I don't seem to ever see them"). Evidence: 10 such PRs ever opened, 3 merged, 2 closed, 5 left open and unreviewed; they were 23% of PR gating runs with a 38% failure rate; `workspace/incidents.json` on master holds 2 records, neither from the error chain; the record exists only on the PR until merged.
**Decision:** the issue is the thing to triage; the structured incident record is written into the fix PR when someone acts (story `inc-s2`: the `issues: opened` trigger is removed and a local script records one incident from an issue). The five open incident PRs (#1102, #1111, #1112, #1113, #1122) were closed on 2026-11-16 with an explanatory comment. `inc-s1` (lighter gates for incident PRs) is superseded.
**Rationale:** the PR-per-issue mechanism never delivered its record, and cost CI and attention; bookkeeping bundled with the implementation is already the repo's rule (CLAUDE.md).

**2026-11-16 | CORRECTION | Operator: no manual workflow and no local recording script either; the issue is the record**
**Context:** the first build of inc-s2 removed only the automatic trigger, kept a manual `workflow_dispatch` start and added a local script to write the record into the fix PR. The operator said: "I don't want a manual workflow. I still want errors to generate a real GitHub issue, I just don't want a PR also generated with redundant or unhelpful info which I'm not actioning. It should all be in the issue and then resolved as a short track and a PR."
**Decision:** inc-s2 is rescoped to deletion: the incident-record workflow is removed entirely, together with the tests that only guard it; the local script and the retired-trigger header were discarded unmerged; the bridge, the recogniser script and library (used by the eit-s1 title check) and everything else stay. An error issue is resolved as a short-track story (test plan, definition of ready, fix, draft PR) whose PR says `Fixes #<issue>`; the issue already holds the code, route label, time, environment and PostHog link, so no separate record is created.
**Rationale:** every added mechanism (manual start, local script) was more surface to maintain for a record nobody had used; the repo's short-track path already gives traceability from issue to fix.
**Lesson for the agent:** when the operator says a mechanism is not wanted, remove it; do not keep a quieter version of it.
