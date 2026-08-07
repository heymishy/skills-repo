## Story: Install dependencies before the staging-deploy seed step runs

**Short-track:** bug fix -- `deploy-staging`'s seed step has never actually run successfully since bri-s2.4 shipped it, masked by an unrelated, longer-standing `FLY_API_TOKEN` failure earlier in the same job.

## User Story

As **Hamish King (Founder/Operator)**,
I want **`scripts/seed-staging.js` to actually run successfully as part of `Staging Deploy`**,
So that **staging keeps its known, idempotent synthetic tenant data after every deploy, instead of the seed step silently failing on every run**.

## Background / Investigation

While fixing `FLY_API_TOKEN` (expired, causing every `Staging Deploy` run to fail at the `flyctl deploy` step since ~2026-07-23), re-running a completed job surfaced a second, independent, previously-masked failure: the `deploy-staging` job's "Seed staging database (bri-s2.4)" step runs `node scripts/seed-staging.js` directly, but the job never installs npm dependencies first -- confirmed via the job's own step list (`checkout` -> `setup-flyctl` -> `flyctl deploy` -> `node scripts/seed-staging.js`, no `npm ci` anywhere). `seed-staging.js` requires `pg`, so this step has always failed with `Cannot find module 'pg'` -- it just never surfaced because the job failed earlier at the token step first, every time, since before this gap was ever exercised in a passing state.

A second, separate gap was found and fixed by the operator directly (not part of this story): the `STAGING_DATABASE_URL` GitHub Actions secret this step also depends on did not exist at all.

## Architecture Constraints

- **Mirror the exact `Set up Node.js` / `Install dependencies` pattern already used by the `smoke-test` job in the same file** (`actions/setup-node@v4`, `node-version: '20'`, `cache: 'npm'`, then `npm ci`) -- do not introduce a different Node setup convention for the same workflow file.
- **Insert the new steps between `Deploy to wuce-staging` and `Seed staging database`** -- the seed step is the only one in this job that needs `node_modules`; no other step's ordering changes.

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a push to `master`, When the `deploy-staging` job runs, Then a `Set up Node.js` step (Node 20, npm cache) and an `Install dependencies` (`npm ci`) step run after `Deploy to wuce-staging` and before `Seed staging database`.

**AC2:** Given dependencies are installed, When `Seed staging database` runs, Then `node scripts/seed-staging.js` no longer fails with `Cannot find module 'pg'` (verified by re-running the actual failed job after this fix + the operator's own `STAGING_DATABASE_URL` fix land).

## Out of Scope

- Setting the `STAGING_DATABASE_URL` secret itself -- operator-owned, handled separately.
- Any change to the `smoke-test` or `promote-to-prod` jobs.

## NFRs

- **Performance:** `npm ci` adds a small, fixed amount of time to every deploy (same cost the `smoke-test` job already pays) -- acceptable, matches existing convention.

## Complexity Rating

**Rating:** 1 -- two steps copied verbatim from an existing, already-working job in the same file.
**Scope stability:** Stable.
