## Story: Creating a feature no longer leaves an untagged placeholder journey on disk that every tenant's dashboard counts

**Epic reference:** None - short-track (a product defect found while repairing the quarantined `dsa-s2` spec)
**Discovery reference:** None - short-track skips discovery. Evidence, measured on 2026-11-21 on master (`5c20e393a`): `tests/e2e/dsa-s2-dashboard-restyle.spec.js` fails two of its eight tests alone, with the dashboard greeting reading "3 in-progress sessions" where the spec seeded 2, and "1 in-progress session" for a tenant that has none (both specs already use a fresh session and tenant). The dashboard builds its count from `listJourneys(repoRoot)` (journeys saved under `workspace/journeys/`) and keeps any journey with no `tenantId` for every tenant (`routes/dashboard.js`: "an untagged legacy journey stays visible"). Exactly one journey on disk has no tenant: slug `pending`. Cause, read in the code: `handlePostProductFeature` (`routes/products.js`) calls `_journeyStore.createJourney('pending', 'default')`, which, when the disk adapter is wired, saves the journey to `workspace/journeys/pending/journey.json` immediately; the handler then calls `setJourneyFields` with the real slug, tenant and product, which saves the journey to its real directory and leaves the `pending` directory behind, untagged, forever. Proof: with `COPILOT_REPO_PATH` pointing at an empty folder, all 8 `dsa-s2` tests pass. The disk adapter is wired only when `DATABASE_URL` is unset (`server.js`: Postgres replaces it), so the orphan appears in local development and the E2E harness, not in a Postgres deployment.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [web-ui] [journeys] [testing]

## User Story

As **a developer or operator running the platform with disk-backed journeys (local development and the E2E harness)**,
I want **creating a feature not to leave a placeholder journey with no tenant behind**,
So that **no tenant's dashboard counts another tenant's phantom session, and the `dsa-s2` spec can pass for the right reason**.

## Benefit Linkage

**Metric moved:** a feature creation leaves 0 untagged journeys on disk (before: 1, the `pending` directory); the `dsa-s2` spec goes from 2 failing tests of 8 in every recorded CI run to 8 of 8 passing; the E2E failing list on CI loses `dsa-s2` (two of the remaining four failing tests).
**How:** `createJourney` accepts an option that skips the disk save at creation; `handlePostProductFeature` uses it for its placeholder, so the journey is first saved to disk by `setJourneyFields`, already under its real slug with its tenant and product.

## Architecture Constraints

- Change confined to `src/web-ui/modules/journey-store.js` (`createJourney` gains an optional third argument), `src/web-ui/routes/products.js` (the one call site passes it), one new node check, one matrix entry (after CI), and artefacts. `src/` changes go through a pull request.
- Default behaviour is unchanged: `createJourney(slug, profile)` with no third argument still saves to disk, as every other caller expects. Only the placeholder call opts out.
- The Postgres write path (`_pgWrite`) is unchanged: the placeholder row is still written and then updated by `setJourneyFields`, keyed by `journeyId`.
- No journey data on any machine is deleted or migrated: existing orphan `pending` directories are left alone (see Out of Scope).
- Preserve each file's existing line endings.

## Dependencies

- **Upstream:** jrf-s2 (registers product-feature journeys through the shared journey store), das-s2 (the repo gate in the same handler), dsa-s2 (the dashboard counts), jdsk.1 (the disk adapter).
- **Downstream:** the `dsa-s2` matrix entry leaves quarantine once CI shows it passing.

## Acceptance Criteria

**AC1:** Given a disk adapter is wired, When `createJourney(slug, profile, { skipDisk: true })` is called, Then the journey exists in memory (`getJourney` returns it) and the disk adapter's `saveJourney` is not called for it; and When `setJourneyFields` is then called with a new `featureSlug`, `tenantId` and `productId`, Then `saveJourney` is called once, with that real slug, tenant and product.
**AC2:** Given a disk adapter is wired, When `createJourney(slug, profile)` is called without the option, Then `saveJourney` is called once for it, exactly as before.
**AC3:** Given a product with a connected repo and a wired disk adapter, When `handlePostProductFeature` creates a feature, Then the disk adapter is never asked to save a journey whose slug is `pending`, and it is asked to save the journey under its real slug with the session's tenant and the product id.
**AC4:** Given a clean journeys root (no earlier orphan), When `tests/e2e/dsa-s2-dashboard-restyle.spec.js` runs, Then all 8 tests pass (before: 2 fail), measured locally with `COPILOT_REPO_PATH` pointing at an empty folder and in the pull request's CI run.
**AC5:** Given the existing checks for journeys and for the features handler (including `check-das-s2-require-connected-repo` and `check-jrf-s2-register-product-feature-journeys`), When `npm test` runs, Then there is no new failure against the known baseline.
**AC6:** Given the pull request's CI run, When the E2E report is read, Then `dsa-s2` passes there (8 of 8); the matrix entry then moves from `quarantined` to `extended` with a rewritten reason, and CI runs on the final commit before the merge is requested.
**AC7:** Given the pull request, When its changed files are listed (and again on master after the merge), Then `src/` contains only `modules/journey-store.js` and `routes/products.js`, and the rest are the new check, the matrix file and artefacts.

## Out of Scope

- Deleting or migrating orphan `pending` directories that already exist on a machine (a developer can delete `workspace/journeys/pending`; no data is touched here). A fresh CI checkout has none.
- Changing the dashboard's rule that untagged legacy journeys stay visible to every tenant (a wider behaviour change, decided separately).
- Postgres deployments (the disk adapter is not wired there).
- The other quarantined specs (`ep3-s1`, `fpd-s4`) and any move to the blocking `core` lane.

## NFRs

- **Data safety:** no existing journey file or directory is read, moved or deleted by this change.
- **Backward compatibility:** every other `createJourney` caller behaves as before.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
