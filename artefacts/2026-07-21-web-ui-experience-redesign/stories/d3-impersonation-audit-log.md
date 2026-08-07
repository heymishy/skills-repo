## Story: Impersonation audit log

**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-d-admin-user-impersonation.md`
**Discovery reference:** `artefacts/2026-07-21-web-ui-experience-redesign/discovery.md`
**Benefit-metric reference:** `artefacts/2026-07-21-web-ui-experience-redesign/benefit-metric.md`

## User Story

As **Hamish King (Founder/Operator, in the platform-admin capacity, reviewing past support activity)**,
I want to **see a list of every past impersonation session — who, whom, when, why**,
So that **impersonation is fully accountable, matching the same transparency this platform already applies to credit adjustments via `credit_audit_log`**.

## Benefit Linkage

**Metric moved:** Impersonation audit completeness
**How:** This story is the read-side of the metric — D1 writes the entries this story displays; without a way to view them, the audit trail exists but isn't actually usable for accountability.

## Architecture Constraints

- New table follows the existing `credit_audit_log` convention (confirmed via code read of `server.js`'s table-creation blocks) — same tenant-scoping approach, same `CREATE TABLE IF NOT EXISTS` idempotent migration pattern used throughout this codebase's other audit tables.
- Confirmed via /clarify: admin-visible only, indefinite retention, no target-user notification — this story's read access is gated to any admin, not a tiered reviewer role.

## Dependencies

- **Upstream:** D1 (start impersonation session) — this story's table schema must match exactly what D1 writes; these two stories should be implemented and reviewed together or in immediate sequence, not far apart.
- **Downstream:** D4 (NFR-security review) checks this story's retention/visibility implementation against the confirmed decision log.

## Acceptance Criteria

**AC1:** Given at least one completed impersonation session (per D1/D2), When an admin opens the Impersonate tab, Then the audit list shows the admin's login, the target's login and tenant, the reason given, and start/end timestamps for every past session, most recent first.

**AC2:** Given a currently in-progress impersonation session (started but not yet exited), When an admin views the audit list, Then that session appears with a start timestamp and no end timestamp (not omitted, and not shown as if it had already ended).

**AC3:** Given a non-admin user, When they attempt to access the audit log directly (e.g. via a direct API call, not just the hidden UI tab), Then the request is rejected by the same `requireAdmin` gate protecting every other admin-only route — the audit log is not accidentally exposed by relying on UI-only hiding.

**AC4:** Given zero impersonation sessions have ever occurred, When an admin opens the Impersonate tab, Then the audit list shows a clear empty state ("No impersonation sessions yet"), not an error or blank table.

## Out of Scope

- Filtering, searching, or exporting the audit log — a simple reverse-chronological list is in scope; query/export tooling is not.
- Any notification to the impersonated user — confirmed out of scope per /clarify.
- A tiered reviewer role distinct from "admin" — this platform has one admin role.

## NFRs

- **Performance:** Audit list loads within 1 second for up to 1,000 historical sessions (generous headroom given this platform's current single-operator scale).
- **Security:** Read access gated by `requireAdmin` at the API layer, not just hidden in the UI (AC3) — this is the same principle already applied to the existing admin-credits route and must not be weakened here.
- **Accessibility:** The audit list is a real, semantic table/list structure, not a div soup — screen-reader-navigable.
- **Audit:** This story IS the audit surface — no further audit-of-the-audit is needed.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable (lower ambiguity than D1/D2 since this is a read-only view over an already-defined write path)

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
