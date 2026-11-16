# Decisions: Scenario A and B on the pull request's own build (sep-s1)

**2026-11-17 | FINDING | The PR-time Scenario A and B jobs tested whatever was last deployed to staging, never the PR**
**Evidence:** both jobs check out the PR's spec files (`ref: head_ref`) and then run them against `E2E_STAGING_BASE_URL`, the live `wuce-staging` app, which holds the previously merged master; nothing deploys the PR. The a5 workflow comments and `delivery-patterns.md` (D44, "no PR-preview deploy mechanism") record the same gap from the other side: a PR that adds a new endpoint cannot pass a real-staging test of that endpoint before it merges.
**Consequence:** the required checks proved staging was healthy, not that the PR worked.

**2026-11-17 | DECISION | Operator: the scenarios must pass the new build before it merges onto staging, and again before production**
**Context:** asked "if we move them off gate do we lose quality?", the agent answered no loss for the PR's own code (it was never tested) but a lost brake; the operator replied "OK go ahead but I want the scenario a and b tests to actually pass new builds before they are merged onto staging and again prod".
**Decision:** keep the two required checks and their names, and make them test the PR's own build in a throwaway environment inside the runner; and make `promote-to-prod` need the existing post-deploy real-staging confirmation as well as the smoke test.
**Rationale:** it satisfies the operator's requirement, needs no ruleset change (the check names are unchanged), removes the shared-staging queue and 502 flakes from the PR gate, and closes the D44 gap (a new endpoint is now in the build under test).
**Accepted cost:** the check names still say "(staging)"; renaming is an operator ruleset change, offered as a later cleanup.

**2026-11-17 | DECISION | Operator: a failing post-deploy staging E2E now blocks promotion to production**
**Context:** reverses the 2026-07-29 pmec-s1 decision that `post-deploy-e2e-confirm` is "visibility only, not a release gate" (`staging-deploy.yml` comment, `check-pmec-s1` U3 and U4).
**Decision:** `promote-to-prod` needs `smoke-test` and `post-deploy-e2e-confirm`. The two pmec-s1 assertions are reversed with a dated comment, not loosened.
**Accepted cost:** a flaky post-deploy run blocks promotion until it is re-run.

**2026-11-17 | DECISION | Guards that encoded the shared-staging mechanism are reversed, each with a dated comment**
**Entries:** `check-cif-s1` U1 (scenario jobs no longer share the `deploy-group` concurrency group), `check-cif-s2` U1 to U3 (Scenario B no longer waits for Scenario A; neither joins the group; promote has a two-item `needs`), `check-fhff-s2` AC2 (e2e.yml has no `deploy-group` jobs), `check-pmec-s1` U3 and U4. `deploy-staging` keeps the group, and so does `post-deploy-e2e-confirm`'s ordering.
**Rationale:** these tests described the mechanism being removed on purpose; leaving them would fail CI for the intended change. Each now asserts the new design.
