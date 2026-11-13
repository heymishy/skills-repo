# DoR Contract Proposal: GitHub issue opened by PostHog for each new production error issue (native destination)

> **SUPERSEDED 2026-11-13.** This artefact was written for the native PostHog GitHub destination design of coha-s6, which was abandoned the same day (decisions.md, "coha-s6 - native PostHog GitHub destination abandoned, custom bridge reinstated"). It is kept as a record, not as a live plan. coha-s6 returns to the custom bridge design and gets a new test plan, verification script and DoR.


**Story:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s6-alert-to-github-issue-bridge.md
**Date:** 2026-11-13
**Status:** PROPOSED, awaiting operator sign-off

**What will be built:**
No application code. One PostHog error-tracking alert (type `internal_destination`, `template_id` `template-github`), created through the PostHog tools once the operator has connected the GitHub integration, with trigger "issue created" only and a filter `environment = production`. One reference artefact, `reference/coha-s6-alert-configuration.md`, holding the alert's read-back configuration with no secrets and no installation id. One fixture note recording the real created issue's author, title shape and link pattern for coha-s7. Pipeline bookkeeping (state, timings, DoD).

**What will NOT be built:**
A webhook route, a `production_error_issues` table, a shared secret, a GitHub token, any file under `src/`, `scripts/` or `.github/workflows/`, the `production-error` label (coha-s7 adds it), incident records (coha-s7), alerts other than "issue created", and any Teams notification.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 integration reaches only the target repo, issue write only | Read the PostHog integrations list and repo list; operator states the GitHub permissions page (T1) | live-verified (half stated) |
| AC2 alert stored with the right trigger, filter, destination, repo | Read the stored alert back from PostHog and commit the read-back (T2) | live-verified |
| AC3 test run opens exactly one issue of the expected shape | One approved test-function run, list issues, record fixture (T3) | live-verified |
| AC4 no tenant text in a real scrubbed event (conditional) | Temporary unfiltered alert, one real staging event, separate approval, then delete and close (T4) | live-verified |
| AC5 staging error opens no issue | Raise coha-s5 scenario 10 error, confirm event visible, list issues (T5) | live-verified |
| AC6 first real production error opens one issue, repeats open none | Observe at first real error (T6) | production-observed, deferred |
| AC7 diff holds only artefacts, no credential | `git diff --name-only` plus a credential-shape scan reporting file names only (T7) | integration-real-code |

**Assumptions:**
1. PostHog's alert `filters.properties` can express `environment = production` on error-tracking events (the create schema lists a `properties` field; confirmed only by the AC2 read-back).
2. PostHog's GitHub destination applies no label and cannot drop the stack-frame section (read from the template on 2026-11-13); if it cannot be trimmed, AC3/AC4 judge the content as is.
3. Staging and production share one PostHog key (operator statement, unverified); AC5 re-opens it if the staging event is not visible in this project.
4. The operator connects the GitHub integration; the agent never handles a credential.

**Estimated touch points:**
Files: `artefacts/2026-11-08-cicd-observability-hardening-automation/reference/coha-s6-alert-configuration.md` (new), a coha-s7 fixture note under `reference/` (new), `decisions.md`, `nfr-profile.md`, `.github/pipeline-state.json`, `.github/pipeline-timings.jsonl`, `workspace/state.json`, the DoD artefact. Services: PostHog project 10908 (one alert, one temporary alert if AC4 applies), GitHub repo `heymishy/skills-repo` (test issues only). APIs: PostHog `error-tracking-alerts-create`/`-list`, `cdp-functions-invocations-create`, `cdp-functions-delete`, `integrations-list`, `integrations-github-repos-retrieve`; GitHub issues list.
