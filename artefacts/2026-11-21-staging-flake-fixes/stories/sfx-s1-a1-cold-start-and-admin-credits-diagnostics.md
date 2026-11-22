## Story: The first post-deploy auth call gets a cold-start budget, and the /admin/credits call records what it needs to explain its flake

**Epic reference:** None - short-track (the fix the operator approved on 2026-11-21 after the flake-ledger review question)
**Discovery reference:** None - short-track skips discovery. Evidence, from `tests/e2e/flake-ledger.json` (issue #1181) and re-checked 2026-11-21: (1) `a1-staging-auth-stub.spec.js` AC1 failed "auth stub round-trip must complete in under 5s (NFR-Performance)" in the post-deploy confirmation on 2026-11-19 (run 44468809588). AC1 is the first test of the first spec of that run, so its timed `POST /auth/e2e-stub/github` is the first request a freshly deployed app receives and includes the cold start; the same 5 s check in AC2 (email signup, later in the run, warm) never failed. `stubGithubLogin` times only that one POST (`tests/e2e/fixtures/staging-auth.js`). (2) `bri-s3.3-multi-user-tenant-journey.spec.js` AC1 failed on its `GET /admin/credits` call three times in three days: `apiRequestContext.get: aborted` after a `200 OK` (run 44583265861, 2026-11-19), an `expect(...).toBe` at line 160 (run 44800060471, 2026-11-20) and, in the staging smoke run 44880044029 on 2026-11-21, a first attempt whose status was not 200 that passed on the retry (the first save by the `--retries=1` change, sfr-s1). The handler renders every tenant on the shared staging database with one plan lookup per tenant (`src/web-ui/routes/admin-credits.js`, `getAllTenantBalances` plus `Promise.all(getPlanState)`), staging is a 512 MB shared-CPU machine, and nothing records how long the call took or how many tenants it rendered, so the cause is a hypothesis.
**Benefit-metric reference:** None - short-track
**Domain:** [testing, ci]

## User Story

As **the operator who reviews the flake ledger by 2026-12-05**,
I want **the cold-start timing flake fixed at its cause, and the other flake to leave evidence each time the call runs**,
So that **I can delete one ledger entry on merit and renew or fix the other from data rather than a guess**.

## Benefit Linkage

**Metric moved:** `a1` AC1 timing failures caused by a cold start: one in the window to none expected (the entry becomes deletable after a quiet fortnight); `bri-s3.3` AC1 flakes with no evidence: every occurrence so far (status unknown, tenant count unknown) to every run printing status, elapsed time and tenant rows.
**How:** `a1` AC1 times a first (cold) and a second (warm) stub login and judges them against 15 s and 5 s respectively; `bri-s3.3` AC1 prints one diagnostics line per `/admin/credits` call and rethrows any error.

## Architecture Constraints

- Change confined to `tests/e2e/a1-staging-auth-stub.spec.js`, `tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js`, two new small fixtures (`tests/e2e/fixtures/latency-budget.js`, `tests/e2e/fixtures/admin-credits-diagnostics.js`), the `bri-s3.3` entry's `note` in `tests/e2e/flake-ledger.json` (dates unchanged), one new node check, and artefacts. No change under `src/`, to `playwright.config.js`, to any workflow, or to the product.
- **The 5-second NFR-Performance requirement is kept for a warm service:** only the first call gets the larger cold-start budget; a second call and AC2 keep 5 s. A broken deploy still fails (15 s, and any later slow call).
- **No assertion is weakened or removed:** `bri-s3.3` still asserts alice 200, bob 403 and zero real LLM calls; `a1` AC1 still asserts the identity, the session and `/api/me`. The diagnostics only print; a thrown error is logged then rethrown.
- Logic that can be tested without staging lives in the two fixtures and is exercised directly by the new check; the specs' use of them is checked as text; the real `bri-s3.3` spec is also run locally against the test server.
- Preserve each file's existing line endings (the specs and the ledger are CRLF).

## Dependencies

- **Upstream:** sfr-s1 (the retry and the ledger), a1 and bri-s3.3 (the specs), flk-s1 (the ledger rules).
- **Downstream:** the operator's ledger review by 2026-12-05: delete the `a1` entry after a quiet fortnight; renew or fix `bri-s3.3` with the evidence this story starts collecting. A possible later story batches the per-tenant plan lookups in `/admin/credits` if the data supports it.

## Acceptance Criteria

**AC1:** Given the `a1` AC1 test, When it runs, Then it times a first stub login and a second stub login, judges the first against a 15000 ms cold-start budget and the second against the 5000 ms NFR-Performance budget through `evaluateBudgets`, and keeps its identity, session and `/api/me` assertions; the single 5-second check on the first call is gone and AC2's own 5-second check is unchanged.
**AC2:** Given `evaluateBudgets`, When a first call is over 15000 ms, or a warm call is 5000 ms or more, or either timing is missing or not a number, Then it reports a failure naming which call and which budget; a slow first call (for example 9 s) with a fast warm call passes.
**AC3:** Given the `bri-s3.3` AC1 test, When it runs, Then it prints one line for alice's `GET /admin/credits` (status, elapsed milliseconds, tenant row count; on a thrown error the elapsed time and the error, with the tenant count unknown, then rethrows) and one for bob's call, and its assertions (alice 200, bob 403, no real LLM calls) are unchanged.
**AC4:** Given the flake ledger, When it is read, Then the `bri-s3.3` entry's `note` records the 2026-11-21 occurrence (run 44880044029) with `firstSeen` 2026-11-21 and `reviewBy` 2026-12-05 unchanged, `node scripts/flake-check.js --check` passes, and `check-sfr-s1` and `check-flk-s1` pass.
**AC5:** Given the pull request, When the real `bri-s3.3` spec is run locally against the test server, Then it passes and prints the diagnostics lines; and CI is green on the final commit, with the pull request body naming this folder so the assurance gate resolves the feature.

## Out of Scope

- Fixing the cause of the `bri-s3.3` flake: batching the per-tenant plan lookups in `/admin/credits`, changing the staging machine, or retrying inside the test (the global retry already covers a one-off, and a quiet in-test retry would hide the evidence).
- Changing the 5-second NFR-Performance requirement, the pull request Scenario A and B jobs, or any other spec.
- Deleting or renewing ledger entries (the operator's review by 2026-12-05).

## NFRs

- **Safety:** the cold-start budget is a ceiling, not an exemption: a slow warm call or a very slow first call still fails.
- **Evidence:** the diagnostics line is printed on every run of the spec, passing or failing.

## Complexity Rating

**Rating:** 1. **Scope stability:** Stable.
