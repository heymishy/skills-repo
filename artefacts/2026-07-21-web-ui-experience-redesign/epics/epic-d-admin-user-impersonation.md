## Epic: An admin can reproduce exactly what a specific user sees, safely and with full accountability

**Discovery reference:** `artefacts/2026-07-21-web-ui-experience-redesign/discovery.md`
**Benefit-metric reference:** `artefacts/2026-07-21-web-ui-experience-redesign/benefit-metric.md`
**Slicing strategy:** Vertical slice

## Goal

An admin debugging a reported issue can pick a specific user, give a reason, and see the app exactly as that user would see it — their permissions, their tenant's data, nothing extra layered on from the admin's own real access — under a persistent, unmissable banner that makes the state impossible to miss or forget, with every session logged for accountability, and exit back to the admin's own identity always available.

## Out of Scope

- Time-limiting or auto-expiring impersonation sessions — plausible future hardening, not committed to this epic.
- Step-up re-authentication before destructive actions taken while impersonating — deferred.
- Notifying the target user that they were impersonated — confirmed via /clarify: admin-visible audit log only, no target notification, matching the existing `credit_audit_log` visibility bar.
- A second admin/reviewer role for the audit log — this platform has one operator; the audit log has one class of reader (any admin), not a tiered access model.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Impersonation audit completeness | 0% (capability doesn't exist) | 100% (no session can start without logging) | The start/end flow writes an audit entry as an atomic part of the session-swap, not a separate optional step |
| Privilege leakage during impersonation (risk metric) | N/A | 0 admin-only surfaces reachable while impersonating a non-admin | Visibility of every admin-only nav item and settings tab is gated on the *effective* (impersonated) role, never the real admin's role, while a session is active |

## Stories in This Epic

- [ ] D1 — Start an impersonation session (search, reason-gated, session swap)
- [ ] D2 — Persistent viewing-as banner, exit flow, and permission-scoped visibility
- [ ] D3 — Impersonation audit log
- [ ] D4 — NFR-security review and hardening pass

## Human Oversight Level

**Oversight:** High
**Rationale:** This epic changes real session-security semantics (temporarily swapping `req.session.tenantId`/`login`/`role`) — per discovery's own flagged highest risk, a coding agent should not implement this autonomously without a human reviewing every story's implementation directly, not just at PR.

## Complexity Rating

**Rating:** 3
**Rationale:** High ambiguity in the actual session-swap mechanics — how the real admin identity is preserved for audit/exit while the effective session temporarily reflects the target user has not been designed at the code level yet, only demonstrated as client-side JS state in a mockup. Consider a technical spike on the session-swap mechanism before D1 begins implementation.

## Scope Stability

**Stability:** Unstable
**Rationale:** The session-swap mechanism's real design may reveal constraints (e.g. how Redis-backed sessions, `req.session.role` live-recheck via `requireAdmin`, and existing tenant-scoping middleware interact) that change story boundaries once investigated at the code level. Flag for frequent check-ins during implementation.
