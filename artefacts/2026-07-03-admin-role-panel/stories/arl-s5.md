## Story: Audit trail for admin credit adjustments

**Epic reference:** artefacts/2026-07-03-admin-role-panel/epics/arl-e1.md
**Discovery reference:** artefacts/2026-07-03-admin-role-panel/discovery.md
**Benefit-metric reference:** artefacts/2026-07-03-admin-role-panel/benefit-metric.md
**Track:** Short-track (`/test-plan -> /definition-of-ready -> coding agent`) — this story closes a gap explicitly named as deferred scope in the feature's own discovery doc; it does not introduce new product surface area, so discovery/benefit-metric are not re-run.

## User Story

As a **Platform operator (Hamish King)**,
I want **every admin credit top-up processed by `POST /api/admin/credits/adjust` to write an immutable audit row recording who made the adjustment, which tenant was adjusted, the balance before and after, and when it happened**,
So that **I can answer "who changed this tenant's balance, by how much, and when" without direct SQL forensics, and admin credit actions are traceable for compliance and incident review**.

## Benefit Linkage

**Gap closed:** `artefacts/2026-07-03-admin-role-panel/discovery.md` Out of Scope section states: "Audit logging of admin actions — admin credit top-ups are not written to an audit trail in this story; deferred to a future admin panel evolution story." arl-s3 (Admin credits page) shipped the top-up form and handler with zero audit trail — confirmed by `grep -n audit src/web-ui/routes/admin-credits.js` returning no results. This story is that deferred evolution.
**Why now:** Every admin credit adjustment currently made through the shipped `/admin/credits` page is unattributed and unrecoverable — there is no record of who adjusted which tenant's balance, by how much, or when. This is an operational and compliance gap on a route that directly moves billable credits.
**How measured:** Not tied to a numeric M-metric target (M1-M3 in `pipeline-state.json` cover admin bypass and top-up UI speed, not audit coverage). Success is binary: every successful adjustment produces exactly one retrievable audit row with correct before/after values and correct admin attribution.

## Architecture Constraints

- **ADR-011 (artefact-first):** This story artefact and DoR must exist before any implementation code is written.
- **No new D37 injectable adapter:** The audit write reuses the existing `_db` wired by `setCreditsAdapter` in `src/web-ui/modules/credits.js` (same precedent as arl-s3's `getAllTenantBalances`/`getValidTenantIds` — see arl-s3-dor.md H-ADAPTER: "D37 does not apply to additive functions on an already-injectable module"). No second setter is introduced.
- **Idempotent migration convention:** `credit_audit_log` table is created via `CREATE TABLE IF NOT EXISTS` in the same auto-migration startup block in `server.js` where `credits` and `stripe_events` are created (server.js lines ~214-228), matching this repo's existing convention exactly.
- **No Express:** Route matching via `pathname.match()` in `server.js`. Handler functions export plain `(req, res)` functions.
- **No new npm dependencies.**
- **Node.js CommonJS only.**
- **`req.session.accessToken` is never used as admin identity.** Admin identity for the audit row is derived from `req.session.login` (falling back to `req.session.userId`) — never the raw OAuth access token. This is a stricter application of the existing "`req.session.accessToken` is canonical for API calls, never `req.session.token`" rule: the audit trail must never persist a credential value.
- **Immutability:** `credit_audit_log` has no UPDATE or DELETE code path anywhere in this story. Rows are insert-only.

## Dependencies

- **Upstream:** arl-s3 must be DoD-complete (provides the `POST /api/admin/credits/adjust` handler this story instruments). Confirmed: arl-s3 status is `definition-of-done`, PR #435 merged.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given an admin submits a valid top-up (`tenantId` matching an existing tenant, `amount` a positive integer) to `POST /api/admin/credits/adjust`, When the balance adjustment succeeds, Then exactly one new row is inserted into `credit_audit_log` recording `tenant_id`, `admin_id`, `delta` (the amount applied), `balance_before`, `balance_after`, and a `created_at` timestamp.

**AC2:** Given an audit row is written for a top-up, When `balance_before` and `balance_after` are compared, Then `balance_after - balance_before` equals `delta` exactly (the same amount that was applied to the `credits` table).

**AC3:** Given two different admins each adjust a different tenant in sequence, When their respective audit rows are queried back by `tenant_id`, Then each row's `admin_id` correctly identifies which admin performed which specific adjustment — no cross-contamination between the two records (this is the D37-style behavioural wiring check: retrieval must prove correctness per-actor, not merely that a write occurred).

**AC4:** Given an admin submits an invalid adjustment request that is rejected before the balance is written — invalid `amount` (per arl-s3 AC4: zero, negative, non-integer, empty) or an unknown `tenantId` (per arl-s3 AC8) — When the request returns HTTP 400, Then no row is written to `credit_audit_log`.

**AC5:** Given a fresh database with no `credit_audit_log` table, When the server starts, Then the table is created idempotently via `CREATE TABLE IF NOT EXISTS` in the same auto-migration startup block as `credits`/`stripe_events`, and a second server start against the same database does not error.

**AC6 (wiring correctness):** Given the audit-write path is wired to the real Postgres adapter via `setCreditsAdapter` in `server.js` (the same adapter already wired for arl-s1/arl-s3), When an adjustment is made and the audit log is queried back through the same adapter, Then the retrieved row's `admin_id` and `balance_before`/`balance_after` values match what was actually adjusted for that specific admin and tenant — not merely that a function reference was assigned to the adapter slot.

**AC7 (security — no credential leakage):** Given an admin session where `req.session.accessToken` is set to a GitHub OAuth token, When an audit row is written for that admin's adjustment, Then the `admin_id` column contains `req.session.login` (or `req.session.userId` if `login` is absent) and never contains the raw `accessToken` value.

## Out of Scope

- A UI or route to view the audit log — `getAuditLog()` is a query function used by tests and future stories; no `/admin/credits/audit` page or endpoint is built in this story.
- Auditing `GET /admin/credits` (read access) — only the balance-mutating `POST /api/admin/credits/adjust` path is audited.
- Retention policy, archival, or pagination of `credit_audit_log` — table grows unbounded in MVP.
- Auditing any other admin action outside credit adjustments (e.g. `tir-s3` team role changes have their own logging, out of scope here).
- Alerting or notification on audit events — this story is data capture only.

## NFRs

- **Immutability:** No code path in this story issues `UPDATE` or `DELETE` against `credit_audit_log`.
- **Integrity:** `balance_before`/`balance_after` must be captured atomically with the balance write — using `UPDATE ... RETURNING balance` on the same statement that adjusts the balance, not a separate read-then-write that is subject to a race.
- **Security:** Admin identity stored is `req.session.login`/`req.session.userId` only. Never the raw access token, never PII beyond what is already in the session.
- **Performance:** The audit insert is a single additional `INSERT` per successful adjustment — negligible overhead, no N+1.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

Single new table, one new write path in an already-injectable module, one call-site change in `admin-credits.js`. Direct precedent exists in arl-s3 for additive functions on `credits.js` sharing the existing adapter. No new adapter, no new route, no UI.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic (Medium — arl-e1)
- [ ] D37/H-ADAPTER classification confirmed (no new adapter — additive functions on already-injectable `credits.js`)
