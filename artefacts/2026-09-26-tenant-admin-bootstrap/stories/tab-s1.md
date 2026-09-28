## Story: Bootstrap a brand-new tenant's first admin automatically on login

**Epic reference:** artefacts/2026-09-26-tenant-admin-bootstrap/epics/real-admin-bootstrap.md
**Discovery reference:** artefacts/2026-09-26-tenant-admin-bootstrap/discovery.md
**Benefit-metric reference:** artefacts/2026-09-26-tenant-admin-bootstrap/benefit-metric.md
**Domain:** [auth, security]

## User Story

As a **developer/engineer signing up for the first time on a brand-new tenant**,
I want **to automatically become admin the instant my first login completes**,
So that **I can immediately manage my own team without any manual intervention or operator step**.

## Benefit Linkage

**Metric moved:** Time-to-admin for a brand-new solo signup
**How:** This story wires an atomic `INSERT ... ON CONFLICT (tenant_id) DO NOTHING RETURNING` bootstrap directly into all 3 real login call sites, so admin resolution happens automatically in the same login flow — moving the metric from its confirmed "never happens" baseline to 0 seconds.

## Architecture Constraints

- **ADR-025 (tenant isolation):** the bootstrap check and write are scoped strictly by `tenant_id` — no cross-tenant read or write path.
- **Reuses the real, already-used role-resolution path:** the bootstrap writes a `team_memberships` row with `role='admin'`, the same table `resolveRoleForPerson` already reads — it does not introduce a second, parallel role source. A new sibling table (shape matching `tenant_plan`'s existing `tenant_id PRIMARY KEY` convention, per the discovery/clarify decision) is used purely as the atomic "has this tenant already been bootstrapped" race-safety gate, not as a role source of truth.
- **D37 (injectable adapter rule):** if this story introduces a new injectable adapter for the bootstrap check, the default stub MUST throw (not silently no-op), the wiring into `server.js`/`auth.js`/`auth-email.js` MUST be a separate task from the bootstrap logic itself, and the wiring test MUST assert a real behavioural outcome (a genuinely new tenant's first login resolves to admin), not just that a function reference was assigned.
- **MC-SEC-02:** no credentials/tokens introduced by this story.
- **Transactional atomicity (per /review finding 1-H1, Run 1):** the `tenant_admin_bootstrap` insert and the `team_memberships` admin-grant insert MUST occur within a single database transaction — committed together or not at all, never partially. If the second write fails after the first succeeds, the transaction rolls back entirely, so the bootstrap-table row is never left "claimed" without a real admin grant behind it.

## Dependencies

- **Upstream:** None — this is the epic's first story per its own risk-first ordering.
- **Downstream:** `tab-s3` (retiring the legacy path) depends on this story being merged and proven correct first — removing the legacy fallback before the new mechanism is trustworthy would leave a real gap.

## Acceptance Criteria

**AC1:** Given a person who has never logged in before, whose resolved `tenantId` has never been seen before (no `team_memberships` row and no bootstrap-table row exists for it), When their first login completes via any of the 3 real auth providers, Then their session role resolves to `'admin'` and a real `team_memberships` row exists for them with `role='admin'` for that tenant.

**AC2:** Given a tenant that has already been bootstrapped (a bootstrap-table row already exists for that `tenant_id`, regardless of who it belongs to), When a different person logs in for the first time into that same `tenant_id`, Then that second person's role does NOT automatically resolve to `'admin'` — they get whatever the existing default role assignment is, unaffected by this story.

**AC3:** Given two requests attempting to bootstrap the same brand-new `tenant_id` at effectively the same time, When both attempt the bootstrap concurrently, Then exactly one succeeds in becoming admin and the other does not — no tenant ever ends up with zero admins or a double-admin race outcome. Verified with a real concurrent-request test against the atomic `INSERT ... ON CONFLICT`, not a mocked/serialized simulation.

**AC4:** Given the bootstrap mechanism, When it runs for a first login via GitHub OAuth, Google OAuth, or email/password sign-up, Then admin resolves correctly and identically across all three — no provider-specific gap. This directly closes the GitHub-vs-email inconsistency already named on `product/roadmap.md`'s commercialisation track.

**AC5:** Given a person logging into a tenant that already has a real admin (via this mechanism or otherwise), When they log in, Then the bootstrap mechanism is a no-op — it never overwrites or downgrades an existing admin's role, and never grants admin to a second person in that tenant.

**AC6:** Given the second write (the `team_memberships` admin grant) fails after the first write (the bootstrap-table claim) succeeds, When the transaction is rolled back, Then no tenant is left in a claimed-but-adminless state — the bootstrap-table row is only ever committed together with the real admin grant, in the same transaction. Verified with a test that forces the second write to fail after the first succeeds, and confirms neither write is visible afterward.

## Out of Scope

- Backfilling admin for tenants that already existed before this story ships — that is `tab-s2`.
- Removing the legacy `ADMIN_GITHUB_LOGINS`/`user_roles`/`_backfillOne` path — that is `tab-s3`; this story only adds the new mechanism, it does not yet remove the old one.
- Any UI/notification telling the new admin "you're now admin" — out of scope for the whole epic.
- Admin demotion or transfer — out of scope for the whole epic.

## NFRs

- **Performance:** the bootstrap check adds no more than one additional indexed query/insert to the login path — no meaningful added latency (matches this app's own established RISK-ACCEPT pattern for comparable synchronous checks elsewhere in the login flow).
- **Security:** the atomic insert must be genuinely race-safe under real concurrent load (AC3) — a security-relevant property, since a race bug here could grant admin to the wrong person or to nobody.
- **Accessibility:** Not applicable — backend-only, no rendered UI.
- **Audit:** an `admin_bootstrap_granted` event is logged (person id, tenant id, timestamp) whenever this mechanism actually grants admin — never the raw identity string, matching `identity-links.js`'s own established audit-logging convention (SHA-256 hash or person id only).

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->

---CANVAS-JSON: {"type":"data-model","title":"Data model","content":{"mermaid":"erDiagram\n    TENANT_ADMIN_BOOTSTRAP {\n        varchar tenant_id PK\n        integer admin_person_id\n        timestamptz created_at\n    }\n    TEAM_MEMBERSHIPS {\n        integer person_id PK\n        varchar tenant_id PK\n        varchar role\n        timestamptz created_at\n    }\n    TENANT_ADMIN_BOOTSTRAP ||--|| TEAM_MEMBERSHIPS : \"winning admin_person_id becomes a role='admin' row\""}}---

