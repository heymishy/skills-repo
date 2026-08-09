## Story: Extend the existing staging-cleanup script's matching pattern and table coverage to close three real gaps

**Epic reference:** None — short-track (bug fix, root-caused via live staging investigation this session)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As the **operator of `wuce-staging`**,
I want **the existing `scripts/cleanup-e2e-staging-data.js` to actually catch the E2E-test data this session found accumulating**,
So that **running it for real would actually clear the ~1000 tenant-less journeys and the 1833-row Credits-page pollution, not just the narrower `e2e-test-`-prefixed `users`/`products` rows it already handles**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — a real cleanup mechanism already exists (`b3-staging-test-data-cleanup`, PR #561, closed 2026-07-23, decision recorded in `artefacts/2026-07-23-e2e-core-journey-coverage/decisions.md`), but this session's investigation found it has three coverage gaps that line up almost exactly with the two pollution findings from this session (~1000 tenant-less journeys; 1833/1838 rows on the admin Credits page).

**How:**
1. **Matching-pattern gap:** `isTaggedForE2E` matches only a strict `e2e-test-` prefix. The Credits-page pollution (`bri-s3-2-<timestamp>-<random>@example.test`) uses an older, different tagging convention that predates story A3's `e2e-test-` standardisation and never matches that prefix.
2. **Table-scope gap:** the script deletes `users`, `products` (cascading to their `journeys`/`standards`/`standard_product_optouts` via `product_id`), and Stripe test-mode customers — but never explicitly touches `credits`, `tenant_plan`, or `user_roles`, and only ever reaches a `journeys` row *via* a matched product's cascade, never by a tenant-less journey's own `tenant_id` directly. This is exactly the shape of the ~1000 tenant-less journeys this session found.
3. **Auth-mechanism gap:** `findEligibleUsers` only ever reads the `users` table, which exclusively backs email/password signup (`routes/auth-email.js`). GitHub-OAuth and stub-created tenants (`a1`'s GitHub stub, `bri-s3.3`/`s3.6`'s named-identity stub) never write a `users` row at all, so they can never be found via that path — only incidentally, if such a tenant also happens to own a matched `products` row.

## Architecture Constraints

- **Extend the existing script and its existing test file** (`scripts/cleanup-e2e-staging-data.js`, `tests/check-b3-cleanup-script.js`) — do not create a parallel/duplicate script. Every existing exported function, the CLI flag shape (`--execute`, `--retention-days=N`), and the dry-run-by-default safety posture must remain unchanged and pass unmodified where the existing tests assert them.
- **Broaden `isTaggedForE2E` additively, never narrow it.** Add an `@example.test` suffix match alongside the existing `e2e-test-` prefix match (an OR, not a replacement) — every value the function already correctly flags as tagged or non-tagged today must classify identically after this change (verified by re-running the existing `check-b3-cleanup-script.js` suite unmodified).
- **`credits`/`tenant_plan`/`user_roles` have no `created_at` column and are one-row-per-tenant (`tenant_id` is their `PRIMARY KEY`)** — for these three tables only, match by `tenant_id` pattern with no age/retention gate (the pattern match itself is the sole and sufficient safety signal, consistent with how `findEligibleProducts` already matches by `tenant_id`/`name` pattern). `journeys` (the new, direct-by-tenant_id path) keeps the existing age-gated (`created_at < cutoff`) behaviour, consistent with `users`/`products`.
- **Respect the `artefacts → journeys` foreign key** (`artefacts.journey_id REFERENCES journeys(journey_id)`, no `ON DELETE CASCADE`) for the new direct-journey-deletion path — delete a journey's `artefacts` rows before the journey row itself.
- **The new direct-journey-deletion path is expected to overlap with the existing product-cascade path** (a matched product's journeys will already be gone by the time the new path runs) — this is safe and intentional (a `DELETE` on an already-deleted row affects 0 rows, not an error), not a bug to prevent.

## Dependencies

- **Upstream:** None (extends already-shipped, already-closed `b3-staging-test-data-cleanup` code).
- **Downstream:** None known. Does not reopen or revise the `decisions.md` "Staging test-data accumulation" RISK entry — the *mechanism* decision (manual, tag-based, not scheduled) stands unchanged; only the tag's own matching pattern and the set of tables it reaches are being widened.

## Acceptance Criteria

**AC1:** Given a tenant ID shaped like the pre-A3 convention (`<label>-<timestamp>-<random>@example.test`, not starting with `e2e-test-`), When `isTaggedForE2E` is called on it, Then it returns `true` — this convention is now recognised alongside the existing `e2e-test-` prefix.

**AC2:** Given the existing `e2e-test-`-prefix behaviour (every case already covered by `check-b3-cleanup-script.js`'s existing AC2 tests: exact prefix match, non-anchored lookalike rejection, case-mismatch rejection, non-string/empty rejection), When those exact same inputs are re-tested after this change, Then every one classifies identically to before — zero behavioural change to the already-tested cases.

**AC3:** Given an old (past the retention cutoff), tagged, tenant-less journey (no `product_id` at all), When `run()` executes with `dryRun: false`, Then that journey's row AND its `artefacts` rows are deleted — closing the exact gap this session's ~1000-tenant-less-journey finding exposed.

**AC4:** Given old, tagged rows in `credits`, `tenant_plan`, and `user_roles` (matching either `isTaggedForE2E` pattern), When `run()` executes with `dryRun: false`, Then all three are deleted — closing the exact gap behind this session's Credits-page-pollution finding.

**AC5:** Given a real, non-tagged tenant's journey, credits row, tenant_plan row, or user_roles row (regardless of age), When `run()` executes in either dry-run or execute mode, Then none of them are ever reported as eligible or deleted — the existing false-positive-safety guarantee extends to every newly-covered table.

**AC6:** Given `run()` executes in dry-run mode (the default), When it completes, Then the newly-covered tables' eligible-but-undeleted rows are reported in the returned summary exactly the same way `users`/`products`/`stripeCustomers` already are, and zero `DELETE` statements are issued for any of the new tables.

## Out of Scope

- **Any change to the mechanism decision itself** (manual-trigger vs. scheduled) — `decisions.md`'s RISK entry and its own passing test (`check-b3-cleanup-script.js`'s AC3) are untouched.
- **`credit_audit_log`, `organisations`, `impersonation_audit_log`** — not implicated in any observed symptom this session, left for a future pass if ever needed.
- **Actually running `--execute` against real staging** — building and testing the extension is this story's scope; running it for real is a separate, explicit operator action after this ships.
- **Any change to the CLI wrapper's flag parsing or `DATABASE_URL`/`STRIPE_SECRET_KEY` wiring** — untouched.

## NFRs

- **Safety (the primary NFR, unchanged from the original story):** the additive-only broadening of `isTaggedForE2E` and the explicit AC2/AC5 regression guards exist specifically to prevent this extension from introducing a new false-positive path.
- **Auditability:** the existing per-record `_logDeletion` audit-line mechanism (record type, id, timestamp) extends to the newly-covered record types (`journey`, `creditsRow`, `tenantPlanRow`, `userRolesRow`) with no new logging mechanism needed.

## Complexity Rating

**Rating:** 2 — the new matching/deletion logic itself is mechanically similar to what already exists for `users`/`products`, but correctly reasoning about the three tables' differing shapes (no `created_at`, `tenant_id` as `PRIMARY KEY`) and proving zero regression to the already-shipped, already-tested behaviour (AC2) both require real care.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
