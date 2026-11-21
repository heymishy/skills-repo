# Findings: the deploy-group lock and staging deploy reliability

Date: 2026-11-21. Read-only investigation, no CI or ruleset change made. Raised by the stand-back audit of the E2E suite and pipeline (the audit's third finding said the shared `deploy-group` lock was the largest friction in continuous delivery). Window: the last 500 workflow runs on the repository, 2026-11-19 02:40 to 2026-11-21 00:28 (about two days, 24 pull-request pushes), so rates are indicative, not statistics.

## Correction to the audit

The audit named the lock as the main cause of unreliable staging deploys. The data does not support that. The lock is not the problem in this window; flaky assertions in the staging smoke and confirmation steps are.

## What the data shows

- **The lock** (`concurrency: deploy-group`, shared by the staging deploy job and the Scenario A and B jobs in `e2e.yml`) cancels a waiting request when a third arrives. Across the 500 runs the only workflow with cancellations was `Staging Deploy` (12 cancelled runs); no `E2E Tests (Playwright)` run, and so no Scenario A or B job, was cancelled. Only 2 of the 500 runs were re-run at all. The 12 cancelled deploys were each superseded by a newer merge to master, which is the lock doing its job: only the latest commit needs deploying. The `Deploy Group Auto-Rerun` workflow ran 91 times in the window (59 completed, 32 skipped); nothing here suggests it is needed more than occasionally, and it is out of scope to remove.
- **Staging deploys that ran to completion:** 5 in the window, 1 success and 4 failures. All four failures are flaky assertions, not deploy errors (the deploy, the Cancel-superseded step and the other jobs succeeded):
  - 2026-11-20 19:13 (`255830384`): `Staging smoke test (@mocked)`, `bri-s3.3-multi-user-tenant-journey.spec.js:160`, `expect(...).toBe`, the known `GET /admin/credits` blip (see the saved note on that spec); 23 passed, 1 failed.
  - 2026-11-19 18:00 (`fc1c0fc54`): same job, `expect(received).toBe(expected)` (consistent with the same spec).
  - 2026-11-19 18:00 (`6d69f7049`): same job, `apiRequestContext.get: aborted` (a network abort).
  - 2026-11-19 05:58 (`08650edf7`): `Post-deploy real-staging E2E confirmation`, `a1-staging-auth-stub.spec.js:41`, "auth stub round-trip must complete in under 5s (NFR-Performance)", a timing assertion against live staging.
- **Cost of one transient:** the smoke step is `npx playwright test --grep "@mocked" --workers=1` and the confirmation step has no retry either, so a single failed assertion fails the whole deploy run and blocks the promote-to-production step until someone re-runs it by hand.
- **The flake policy exists but is unused:** `tests/FLAKE-POLICY.md` says in-run retries are off in this repository and a rerun that passes needs a ledger entry first; `tests/e2e/flake-ledger.json` has zero entries, although the `bri-s3.3` flake has been seen at least four times. No CI step runs `scripts/flake-check.js --strict`.
- **Current production state (for the record):** run `44843951925` (commit `ceb2d035c`) deployed to staging, passed its smoke and confirmation steps, and is waiting at "Promote to production (manual approval required)". Run `44685953879`, noted earlier as the one waiting, ended `cancelled` (superseded). Approval is the operator's.

## Options

| Option | What changes | For | Against |
|---|---|---|---|
| A. Leave the lock alone | nothing | the evidence shows no harm; its cancellations are useful coalescing | none |
| B. One in-run retry on the two staging steps, with ledger entries | add `--retries=1` to the `@mocked` smoke and the confirmation steps only; record the three seen flakes in `flake-ledger.json` (owner, issue, review within 14 days); print the flaky list in the step summary | one transient no longer blocks a promotion; Playwright reports a pass-on-retry as `flaky`, so it is still visible; the policy already allows it with a ledger entry | a retry can hide a real intermittent bug if the ledger is not reviewed; changes a stated repository default for these steps |
| C. Fix the flakes at source | find why `GET /admin/credits` returns a gateway error under the smoke run; replace the 5-second round-trip assertion on live staging with a measured threshold or a median of a few calls; look at the aborted request | removes the cause | needs investigation per flake; the gateway blip may be in infrastructure, not in this repository |
| D. Separate staging environments for PR scenario runs and for deploys | a second Fly app so the two stop sharing a lock | would end the lock's coupling | real cost and operational surface, and the coupling is not currently causing harm |

## Recommendation

A, plus B for the staging smoke and confirmation steps and C for the `bri-s3.3` and auth-stub flakes, in that order of effort. D is not justified by this data; revisit only if cancelled Scenario A or B runs show up in a longer window.

## Decision needed from the operator

Whether to run B (it changes a documented repository default for two CI steps and adds ledger entries with an owner and a 14-day review date, so it needs a named owner) and whether to chase C. No story is registered for them yet.
