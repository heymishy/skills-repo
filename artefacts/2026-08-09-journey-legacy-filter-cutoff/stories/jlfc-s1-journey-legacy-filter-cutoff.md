## Story: Time-bound the journey list's pre-tenancy migration-grace filter so it stops surfacing tenant-less test artifacts as "yours"

**Epic reference:** None — short-track (bug fix, found via live Chrome-browser exploration of the operator's real staging environment)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **user viewing `GET /journey`** (the "No product" journeys list),
I want **the list to only ever show my own real journeys**,
So that **I don't see over a thousand unrelated automated-test artifacts mixed in with my actual work, and the sidebar's journey count stays trustworthy**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — found live on `wuce-staging.fly.dev` (2026-08-09): the "No product" sidebar badge shows "7," but the actual `/journey` page it links to renders **"FEATURES (1010)"** — over a thousand entries, almost all clearly automated-test artifacts (`B1 e2e ac1 1786259101739...`, `Tenant a feature`, `A4 e2e nfr feature feat...`).

**How:** Root-caused via direct source read of `src/web-ui/routes/journey.js`'s `handleGetJourney`. The sidebar count comes from a strict Postgres query (`WHERE tenant_id = $1`, no fallback). The `/journey` page instead applies a "migration grace" filter (introduced in commit `2c0fb7ca`, 2026-06-29, the original tenancy rollout) meant to keep pre-tenancy journeys visible to their original owner: `if (j.tenantId == null && (j.ownerId == null || j.ownerId === _login)) return true`. This clause has no time boundary — it grants grace visibility to *any* journey ever created with `tenantId == null`, not just ones that genuinely predate tenancy. Journeys get `ownerId: req.session.login` and `tenantId: req.session.tenantId || null` at creation time (`journey.js:422-423`); any session that creates a journey without establishing a `tenantId` — e.g. automated test/CI activity authenticating against this shared staging environment — produces exactly this shape, and if that session's login happens to be the real operator's own account, the grace clause surfaces it forever. This story narrows the grace clause to genuinely pre-rollout journeys only; it does not change how any session authenticates or acquires a `tenantId` (tracked separately).

## Architecture Constraints

- **Time-bound the grace clause, don't remove it.** Genuinely pre-tenancy journeys (created before commit `2c0fb7ca`, 2026-06-29) must remain visible to their original owner — this is documented, intentional backward-compat behaviour (`tests/check-s0.3-journey-list-filter.js` AC4 already covers the session-level version of this: a session with no `tenantId` at all still sees everything). This story only narrows the JOURNEY-level check (a journey created without a `tenantId`), not the session-level backward-compat path, which stays untouched.
- **Cutoff is a fixed constant, not configurable** — this is a one-time historical boundary tied to a specific already-merged commit, not a policy that changes over time.
- **Do not change how journeys are created** (`handlePostJourney`, `_journeyStore`'s create path) — this story only narrows which *existing* tenant-less journeys are treated as legitimate legacy data when listing, it does not address why new tenant-less journeys keep being created (tracked as a separate follow-up investigation into shared-credential test/CI authentication against staging).
- **Do not touch the sidebar's own Postgres count query** (`products.js`) — it is already correctly scoped and is not the buggy side of this discrepancy.

## Dependencies

- **Upstream:** None (this narrows already-shipped, already-merged filter logic from `2c0fb7ca`, sprint-0 tenant isolation).
- **Downstream:** None known. Related but explicitly out of scope: (a) investigating why automated test/CI activity against staging authenticates as the real operator's account rather than an isolated test identity, and (b) bulk-cleanup of the already-accumulated tenant-less journeys. Both are tracked as separate follow-up items, not blocked on or blocking this story.

## Acceptance Criteria

**AC1:** Given a journey has `tenantId == null` and a `createdAt` timestamp on or after the tenancy-rollout cutoff (2026-06-29T00:00:00Z), When the current session has a real `tenantId` and requests `GET /journey`, Then that journey does NOT appear in the response, regardless of whether its `ownerId` matches the current session's login.

**AC2:** Given a journey has `tenantId == null` and a `createdAt` timestamp BEFORE the tenancy-rollout cutoff, When the current session's login matches that journey's `ownerId` (or the journey has no `ownerId` at all), Then that journey DOES appear in the response — genuine pre-tenancy legacy visibility is preserved unchanged.

**AC3:** Given a journey has `tenantId == null` and NO `createdAt` field at all, When the current session's login matches that journey's `ownerId` (or the journey has no `ownerId`), Then that journey still appears (missing `createdAt` is treated as pre-tenancy-legacy, not as disqualifying — the codebase cannot prove a record is recent if it lacks a timestamp, so it must not be silently hidden).

**AC4:** Given a journey has a real, matching `tenantId`, When `GET /journey` is requested, Then it appears exactly as before — this story must not regress the already-correct, already-tested tenant-matching path (`tests/check-s0.3-journey-list-filter.js` AC1-AC3).

**AC5:** Given a session has no `tenantId` at all (pre-s0.2 session), When `GET /journey` is requested, Then all journeys are still shown unfiltered — this story must not regress the session-level backward-compat path (`tests/check-s0.3-journey-list-filter.js` AC4), which is a separate check from the journey-level one this story narrows.

## Out of Scope

- **Why tenant-less journeys keep being created in the first place** (e.g. shared-credential test/CI authentication against staging) — a separate, larger investigation, not a code-scoped short-track fix.
- **Bulk cleanup of the ~1000 already-accumulated tenant-less journeys** — a separate data-cleanup action, tracked independently.
- **Any change to the sidebar's Postgres-backed count query** — already correct.
- **Any change to journey creation** (`handlePostJourney`) — this story only narrows a list-filtering check.

## NFRs

- **Correctness/Security:** Closes an over-broad data-visibility rule — a tenant-less journey created well after tenancy existed should never be treated as equivalent to genuine pre-tenancy history, regardless of whose login happens to match its `ownerId`.
- **Performance:** Negligible — one additional `Date.parse` comparison per journey in an already-existing `Array.filter`.

## Complexity Rating

**Rating:** 2 — the code change itself is small (one additional time-bound condition in an existing filter), but correctly reasoning about the cutoff's provenance (tied to a specific historical commit, not an arbitrary date) and about the missing-`createdAt` edge case (AC3, must remain permissive, not disqualifying) requires care to avoid either under- or over-narrowing the grace clause.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
