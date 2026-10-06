# Story: Generate the feature-slug date prefix in the operator's own saved timezone, not raw UTC

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery; scope is the real, database-confirmed finding below, found while investigating a real operator report
**Benefit-metric reference:** None — short-track skips benefit-metric; this is a correctness/data-integrity fix, no metric moved
**Domain:** [web-ui]

## User Story

As an **operator creating a new feature (via `/journey` or a product's "New feature" flow) near a UTC day boundary**,
I want **the auto-generated feature slug's date prefix to reflect my own calendar day, not UTC's**,
So that **a session I start at, say, midday my own time doesn't silently land on "yesterday's" slug and create a second, disconnected feature record instead of continuing my existing one**.

## Benefit Linkage

No formal benefit-metric moved (short-track, correctness fix). Real incident, confirmed by direct production database inspection (2026-10-06), not a hypothetical: the operator (timezone `Pacific/Auckland`, UTC+13, confirmed set in `/settings` locale preferences... **actually not yet set — see Architecture Constraints' honest caveat below**) reported a feature's artefact page showing "No artefacts found" at `/features/2026-10-04-customer-journey-as-first-class`, despite having completed real discovery and clarify work. Root-caused via direct `journeys`/`artefacts` table queries (read-only, via `fly ssh console`, 2026-10-06):
- `journeys` row 1: `feature_slug='2026-10-04-customer-journey-as-first-class'`, `created_at='2026-10-04T23:09:29Z'`, zero completed stages, zero artefacts — an abandoned, orphaned record.
- `journeys` row 2: `feature_slug='2026-10-05-customer-journey-as-first-class'`, `created_at='2026-10-05T03:40:13Z'`, 2 completed stages (discovery, clarify), 2 real artefact rows — the operator's real, successful work.

`2026-10-04T23:09:29Z` is `2026-10-05, 12:09pm` in `Pacific/Auckland` (UTC+13) — a session started well into "the 5th" locally was slugged as "the 4th" because `routes/journey.js`'s `handlePostJourney` (and the identical pattern in `routes/products.js`'s `handlePostProductFeature`) compute the date prefix via `new Date().toISOString().slice(0, 10)` — always UTC, never the operator's own saved locale.

## Architecture Constraints

**Root cause, confirmed by direct code read:** both `routes/journey.js:529` and `routes/products.js:3734` independently compute `new Date().toISOString().slice(0, 10)` as the feature-slug date prefix. Both are UTC-only; neither consults any per-operator locale data.

**The fix infrastructure already exists and does not need to be built:** `si-s2` (`routes/settings.js`) already added a real, IANA-validated `people.timezone` column, a settings form to set it, and the `resolvePersonForIdentity(pool, identityKey)` lookup (`modules/identity-links.js`) keyed by `identityKey = req.session.tenantId` — the exact same identity key `handlePostJourney` already has in scope (`req.session.tenantId`, used one line below for the billing-cap check). This story only needs to read that existing data at slug-generation time, not create a new capture mechanism.

**Honest caveat, found while investigating:** the operator's own `people.timezone` was checked directly (read-only `SELECT timezone FROM people ...`) and is **currently unset (NULL)** — they never visited `/settings` to save it. This means today's incident would NOT have been prevented purely by reading existing data; the operator also needs to set their timezone once in `/settings` for this fix to take effect for them specifically. This is disclosed explicitly rather than overclaiming "this fixes the exact incident" — it fixes the general class for any operator who has (or later sets) a saved timezone, and leaves future incidents open for anyone who never sets one. Falling back to today's exact UTC behaviour when unset is therefore the only safe default (see AC2) — not a workaround, the correct behaviour for an unknown timezone.

**New shared helper, not two independent inline fixes:** both call sites need identical pool-lookup + fallback logic. Extracted to `src/web-ui/modules/person-locale.js`'s `getTenantLocalDateString(pool, identityKey)`, reused from both `routes/journey.js` and `routes/products.js` — avoids duplicating the resolve-timezone-then-format-date sequence twice, and gives one place to test it.

**Why this is NOT a D37 mandatory-throw adapter:** D37 applies to adapters whose silent misconfiguration should be loud (e.g. a wiring bug that makes a whole feature silently no-op). This is different: an operator with no saved timezone is the normal, expected majority case, not a misconfiguration — a silent fallback to UTC (today's existing, correct-for-anyone-without-a-preference behaviour) is the right behaviour, not a gap to alarm on. The helper is a plain function, not an injectable adapter with a throwing stub.

**No pool / lookup failure is non-fatal by design:** `getTenantLocalDateString` must never throw or block journey creation — a timezone lookup is a nice-to-have personalization, not a prerequisite for the core "create a feature" flow. Any DB error, missing pool (e.g. `NODE_ENV=test` with no `DATABASE_URL`), unresolved identity, or unset timezone all fall back to the current UTC behaviour, silently.

## Dependencies

- **Upstream:** `si-s2` (`routes/settings.js`, already merged) — owns the `people.timezone` column and its validation this story reads from.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given an operator whose `people.timezone` is set to a real IANA timezone (e.g. `Pacific/Auckland`), When they create a new feature at a moment that is "today" in that timezone but "yesterday" in UTC, Then the generated feature slug's date prefix matches their own local calendar day, not UTC's.

**AC2:** Given an operator whose `people.timezone` is unset (NULL), or whose identity cannot be resolved to a person, or when no database pool is wired at all (e.g. `NODE_ENV=test`), When they create a new feature, Then the generated slug's date prefix is identical to today's existing behaviour (`new Date().toISOString().slice(0, 10)`, UTC) — zero behavioural change for this case.

**AC3:** Given a database error occurs during the timezone lookup (e.g. the query itself fails), When a new feature is created, Then journey creation still succeeds using the UTC fallback — the lookup failure must never block or error the primary flow.

**AC4:** Given this repo's own existing tests for `handlePostJourney` and `handlePostProductFeature`'s slug generation, When this fix is applied, Then all pre-existing tests still pass unchanged (they exercise the no-timezone-set / no-pool path, per AC2).

## Out of Scope

- Detecting or warning about likely-duplicate feature names at creation time (a broader UX safeguard against this same class of accidental-duplicate, named here as a real `/improve` candidate, not built — this story fixes the root-cause date computation only).
- Any change to `/settings`'s own timezone capture UI (`si-s2`, already correct) — this story only consumes that existing data.
- Retroactively merging or fixing the two already-existing duplicate `customer-journey-as-first-class` records found during this investigation — that is real production data remediation, a separate, explicit operator decision, not a code change this story should make unilaterally.
- Any change to the `people` table schema — the `timezone` column already exists (`si-s2`).

## NFRs

- **Performance:** One additional indexed lookup (`identity_links` by `identityKey`, then `people` by `id`) on the feature-creation path only — not a hot/high-frequency route. Negligible.
- **Security:** None identified — reads only the requesting operator's own already-authenticated identity's own timezone preference; no new input surface.
- **Reliability:** Explicitly addressed by AC3 — the lookup is fail-open to current behaviour, never fail-closed.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->
