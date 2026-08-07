## Story: Start an impersonation session (search, reason-gated, session swap)

**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-d-admin-user-impersonation.md`
**Discovery reference:** `artefacts/2026-07-21-web-ui-experience-redesign/discovery.md`
**Benefit-metric reference:** `artefacts/2026-07-21-web-ui-experience-redesign/benefit-metric.md`

## User Story

As **Hamish King (Founder/Operator, in the platform-admin capacity, investigating a support issue)**,
I want to **search for a specific user, give a reason, and start viewing the app as that user**,
So that **I can reproduce exactly what they're experiencing instead of guessing from a support description or querying the database directly**.

## Benefit Linkage

**Metric moved:** Impersonation audit completeness
**How:** This story's own implementation must make the audit write and the session swap a single atomic action — a session cannot start without producing exactly one corresponding audit entry, which is what the metric measures directly.

## Architecture Constraints

- **This story requires a technical investigation before implementation, not just before this story's own coding — the epic's Complexity Rating (3, Unstable) reflects this.** Specifically: confirm how `req.session.tenantId`/`login`/`role` can be temporarily overridden while preserving the real admin identity for exit/audit, given this app's existing Redis-backed session persistence (`middleware/session.js`) and `requireAdmin`'s live per-request role re-check (`sec-perf-2`). This must be resolved and documented before AC1 can be implemented, not assumed.
- ADR-025 (multi-tenancy at the application layer, `tenant_id` scoping): the impersonation session swap must produce a session whose `tenantId` scoping behaves identically to a real login as that tenant — no code path should treat an impersonated session as exempt from the tenant-scoping checks every other session goes through.
- Must preserve this repo's canonical session-field rule: `req.session.accessToken`, never `.token` — confirmed via repo-wide grep at DoR per CLAUDE.md's own established check.
- Gated by `requireAdmin` — only an admin can initiate impersonation; this story does not introduce a new permission tier.
- D37 injectable-adapter pattern (mandatory): this story introduces a new injectable adapter for writing audit entries (e.g. `setImpersonationAuditAdapter()`), matching the existing `credit_audit_log` pattern's own approach. Per D37: (1) the stub default must throw, not silently succeed; (2) production wiring in `server.js` is a separate task from the session-swap handler; (3) the wiring test must assert real behavioural correctness (a genuine audit row is retrievable after a real write), not just that a function reference was assigned. See AC6 below.

## Dependencies

- **Upstream:** None within this feature, but implementation-blocking on the technical investigation noted above.
- **Downstream:** D2 (banner/exit/permission-scoping) and D3 (audit log view) both depend on this story's session-swap and audit-write mechanism.

## Acceptance Criteria

**AC1:** Given an admin on the Impersonate tab, When they search by login or tenant, Then a filtered list of real users/tenants is shown (matching the mockup's search behaviour).

**AC2:** Given an admin selects "Act as" for a specific user, When they attempt to confirm without entering a reason, Then the session does not start — a reason is mandatory, not optional, matching discovery's confirmed design.

**AC3:** Given an admin provides a reason and confirms, When the session starts, Then the effective session (`tenantId`, `login`, `role`) reflects the target user, AND exactly one audit log entry is written recording the real admin's identity, the target's identity, the reason, and a timestamp — as a single atomic operation, not two separate steps that could diverge if one fails.

**AC4:** Given the audit-write step fails for any reason (e.g. a transient DB error), When this happens, Then the session swap itself does NOT proceed — impersonation must never start without a corresponding audit record; a failed audit write is a failed session start, not a silent gap.

**AC5:** Given an admin attempts to start a second impersonation session while already impersonating someone else, When they try, Then this is rejected — only one impersonation context can be active per admin session at a time (no nested impersonation).

**AC6 (D37 wiring):** Given `setImpersonationAuditAdapter` is wired to a real Postgres-backed implementation in `server.js`, When two separate impersonation sessions are started (by the same or different admins), Then each produces its own genuinely distinct, independently-retrievable audit row — not merely confirming that `setImpersonationAuditAdapter` was called with some function, per this repo's own established D37 wiring-test standard.

## Out of Scope

- The persistent banner and exit flow — that is D2.
- The audit log *viewing* UI (the list of past sessions) — that is D3; this story only writes the audit entry.
- Time-limiting or auto-expiring sessions — confirmed out of scope at the epic level.

## NFRs

- **Performance:** Session start completes within 1 second under normal conditions.
- **Security:** This is the highest-risk story in this entire feature. The session-swap mechanism must be reviewed with specific attention to: (a) whether the real admin's original session state is fully recoverable on exit with no residual target-user state leaking back, (b) whether `requireAdmin`'s live role re-check could be tricked by an impersonated session's `role` field, (c) whether concurrent requests during the swap window could read an inconsistent session state. **This NFR is not satisfied by story-level testing alone — it requires the explicit NFR-security review performed in D4 before this story can be considered done.**
- **Accessibility:** The search/reason/confirm flow is fully keyboard-operable.
- **Audit:** Every session start writes exactly one audit entry — this is both an NFR and AC3/AC4's direct subject; the two are the same requirement viewed from different angles.

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable — pending the technical investigation named in Architecture Constraints.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
