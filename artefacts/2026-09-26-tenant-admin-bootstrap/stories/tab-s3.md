## Story: Retire the legacy admin-bootstrap path

**Epic reference:** artefacts/2026-09-26-tenant-admin-bootstrap/epics/real-admin-bootstrap.md
**Discovery reference:** artefacts/2026-09-26-tenant-admin-bootstrap/discovery.md
**Benefit-metric reference:** artefacts/2026-09-26-tenant-admin-bootstrap/benefit-metric.md
**Domain:** [auth, security]

## User Story

As a **platform maintainer reading this codebase**,
I want **the legacy `ADMIN_GITHUB_LOGINS`/`user_roles`/`_backfillOne` machinery fully removed once the real bootstrap mechanism is proven**,
So that **nobody is misled into thinking a working admin-bootstrap mechanism exists when it doesn't — the exact confusion this feature's own discovery had to untangle**.

## Benefit Linkage

**Metric moved:** Manual admin-grant interventions needed
**How:** Removing the legacy path removes the only lever that ever required a manual intervention, and eliminates the confusing, partially-broken code that misled this feature's own investigation in the first place — closing the loop rather than leaving dead code that could mislead the next investigation too.

## Architecture Constraints

- **MC-SEC-02:** removing the `ADMIN_GITHUB_LOGINS` reference includes removing it from any docs/config that name it, not just the code path.
- **ADR-025 unaffected:** this story removes code, it does not add any new cross-tenant logic.
- **No schema change:** the `user_roles` table itself is left in place in the real database (see Out of Scope) — this story removes application-code references to it, not the table.

## Dependencies

- **Upstream:** `tab-s1` AND `tab-s2` must both be merged and proven correct first — a hard dependency. Removing the legacy fallback before the new mechanism is trustworthy would leave a real gap (per the epic's own risk-first ordering rationale).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the legacy `user_roles` table's own production wiring (`setGetUserRole`, `arl-s4`'s startup seeding block in `server.js`), When this story ships, Then that wiring is fully removed from `server.js` — the `user_roles` table itself is left in place in the real database (dropping tables is out of scope), but nothing in the running application reads, writes, or seeds it anymore.

**AC2:** Given `_backfillOne`'s phantom-row creation logic (`user-roles.js`), When this story ships, Then that function and its call site inside `resolveRoleForTenant` are removed entirely — `resolveRoleForTenant`'s own remaining behaviour (post-removal) never attempts a legacy-table fallback.

**AC3:** Given the `ADMIN_GITHUB_LOGINS` Fly secret currently set on both `wuce-staging` and production (`skills-framework`), When this story's own DoD is reached, Then the secret is removed from both real deployments — an explicit operator action, tracked in this story's own DoD, not silently left as orphaned config (matches the already-logged `workspace/state.json` pendingAction from 2026-09-26).

**AC4:** Given the removal in AC1/AC2, When the existing test suite is run (including any test file that references the legacy `getUserRole`/`user_roles` wiring), Then every test that was legitimately testing removed functionality is itself removed or updated to no longer assert on it, and the full suite passes with zero regressions to any test that was testing something else.

**AC5:** Given a fresh grep of the entire `src/web-ui/` tree for `ADMIN_GITHUB_LOGINS`, `getUserRole`, `setGetUserRole`, and `_backfillOne` after this story ships, Then zero production-code matches remain (a test file specifically asserting the absence is the only permitted exception, if one is written).

## Out of Scope

- Dropping the actual `user_roles` Postgres table from the schema — leaving the empty, unused table in place is lower-risk than a `DROP TABLE` migration; a separate future cleanup if ever needed.
- Any change to `resolveRoleForPerson`'s own primary (non-legacy) resolution logic — already correct, untouched by this story.
- The broader dead-code audit flagged in `workspace/capture-log.md` (2026-09-26) — this story only removes the specific legacy path named in the epic's own scope.

## NFRs

- **Performance:** Not applicable — pure removal, no new query path.
- **Security:** removing `ADMIN_GITHUB_LOGINS` closes a misleading, partially-broken privilege-grant surface — a net security-hygiene improvement, not just cleanup.
- **Accessibility:** Not applicable — backend-only.
- **Audit:** Not applicable — no new write path introduced.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
