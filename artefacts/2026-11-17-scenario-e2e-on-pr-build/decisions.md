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

**2026-11-17 | FINDING | A fresh database does not boot cleanly: startup migrations race and run out of order (needs an operator decision)**
**Evidence:** against an empty Postgres the app's startup migrations fail on the first boot (`customer_journey_stages` before `customer_journeys` exists, `pod_assignments` before `pods`, and several `duplicate key value violates unique constraint "pg_type_typname_nsp_index"` from concurrent `CREATE TABLE`), and it takes three boots for them to settle (CI log: "migrations settled on boot 3"). Long-lived staging and production never show it because their tables already exist.
**Consequence:** a brand-new environment (a new staging, disaster recovery, a preview deploy) cannot be brought up by deploying the app alone. The PR environment works around it by booting until a boot reports no failed migration (at most six). Not fixed here; candidate story: run the startup migrations in dependency order, one at a time.

**2026-11-17 | FINDING | The durable chat table `session_turns` is created only by a manual script**
**Evidence:** `scripts/migrate-schema-pg.js` creates `session_turns` and `session_turns_archive`; no deploy step and no startup code runs it, so a new environment saves no durable chat turns (`session_turns_pg_save_failed: relation "session_turns" does not exist`) and `dsh-s4` fails. The PR environment runs the script before booting.
**Candidate story:** run it from the startup migrations, or from the deploy.

**2026-11-17 | DECISION | Setup changes the first CI runs forced, each recorded**
1. **No seed step.** `scripts/seed-staging.js` forces SSL on its connection and the specs create their own `e2e-test-` tenants, so the throwaway environment does not seed (the seed exists for the `@mocked` smoke suite).
2. **`http://localhost:3000`, not `127.0.0.1`.** The app's session cookie is always `Secure`; Playwright's request client sends a `Secure` cookie back over plain http only to a localhost name. With 127.0.0.1, the a1 sign-in check and the b1 signup failed (403).
3. **Postgres with ssl on.** The app always connects over SSL (as production does); the throwaway Postgres is started in the step with a self-signed certificate, so it is closer to production than disabling SSL in the app would be.
4. **Boot until the migrations settle**, and **run `migrate-schema-pg.js`**, per the two findings above.
5. **No spec was edited.**

**2026-11-17 | EVIDENCE | AC5 and AC6**
- First green run on the PR's own build: runs 43927295257 (three attempts, all green): Scenario A 2m19s, 1m28s, 2m33s; Scenario B 2m21s, 1m51s, 1m49s (each under the 8-minute budget).
- Negative control: a deliberately broken sign-in stub route (commit `5ee86a87a`, reverted in `8d1a39293`) turned Scenario A red (run 43929296446, job 133517103013); Scenario B stayed green because it signs in by email, not through that stub. At least one job failing is what AC6 requires.
- The unit chain, with the reversed guards, passed on this PR ("Lint, typecheck, test, build", 3m12s).

**2026-11-17 | CONSTRAINT | What the new gates do and do not cover (operator question 2026-11-17)**
Scenarios A and B run on the PR's own build (before merge) and against `wuce-staging` after each deploy (blocking promotion). Nothing runs A or B against production itself after promotion, and `promote-to-prod` builds its own separate image from the same commit, so production's own secrets, database and real model are not exercised by them. A read-only post-promotion check (`/health`, `/version` and the deployed commit) is possible; running A or B against production is not recommended (they create test tenants and need the auth-stub secret in production).
