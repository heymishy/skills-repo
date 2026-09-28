## Epic: Every tenant has a real, working admin

**Discovery reference:** artefacts/2026-09-26-tenant-admin-bootstrap/discovery.md
**Benefit-metric reference:** artefacts/2026-09-26-tenant-admin-bootstrap/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

A brand-new solo developer signing up gets admin on their own tenant automatically, with zero operator intervention, the instant their first login completes — across all 3 real auth providers (GitHub, Google, email/password). Every existing real tenant that currently has members but no admin gets one automatically (the earliest member, promoted once). The legacy `ADMIN_GITHUB_LOGINS`/`user_roles`/`arl-s4` machinery — dead code that only ever worked by accident and is now confirmed inert for anyone with real usage history — is fully retired, so nobody reading the codebase is misled into thinking it's a working mechanism.

---CANVAS-JSON: {"type":"program-design","title":"As designed: Program design","content":{"mermaid":"flowchart LR\n    AUTH[routes/auth.js]\n    AUTHEMAIL[routes/auth-email.js]\n    BOOTSTRAP[modules/tenant-admin-bootstrap.js]\n    TAB_TABLE[(tenant_admin_bootstrap)]\n    TM[(team_memberships)]\n    MIGRATE[scripts/backfill-tenant-admin.js]\n    SERVER[server.js]\n    USERROLES[modules/user-roles.js]\n\n    AUTH -->|tab-s1| BOOTSTRAP\n    AUTHEMAIL -->|tab-s1| BOOTSTRAP\n    BOOTSTRAP -->|atomic INSERT ON CONFLICT| TAB_TABLE\n    BOOTSTRAP -->|role=admin| TM\n    MIGRATE -->|tab-s2, one-time| TM\n    SERVER -.tab-s3: legacy wiring removed.-> USERROLES"}}---

## Out of Scope

- Admin transfer/demotion UI — once a tenant has a working admin, handing off or stepping down from admin is a separate feature.
- Perfect concurrency handling for two people landing on the same brand-new shared org tenant at the exact same instant — the atomic `INSERT ... ON CONFLICT DO NOTHING RETURNING` mechanism handles this correctly (exactly one wins), but no additional UX/notification is built around the losing side; they simply aren't admin, same as any other non-first member.
- Any change to non-admin role semantics (engineer/product/viewer) or the pod-role vocabulary (`rtri-s2`).
- Any change to the invite/add-teammate flows themselves (`team-invitations.js`, `client-invitations.js`) beyond removing the legacy admin-seeding path they never depended on.
- A broader dead-code audit of the rest of the codebase — logged separately in `workspace/capture-log.md` (2026-09-26) for a future pass.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| Time-to-admin for a brand-new solo signup | Infinite / never (confirmed live) | 0 seconds, automatic, all 3 auth providers | Story 1 wires the atomic bootstrap into every real login call site |
| % of real tenants with at least one working admin | `[UNKNOWN BASELINE]`; at least 1 tenant confirmed at 0% | 100% | Story 1 covers new tenants going forward; Story 2 backfills existing ones |
| Manual admin-grant interventions needed | Effectively 100% of tenants today | 0 | Story 3 removes the only lever that ever required one |

## Stories in This Epic

- [ ] `tab-s1` — Bootstrap a brand-new tenant's first admin automatically on login — artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s1.md
- [ ] `tab-s2` — Backfill admin for every existing real tenant that has members but no admin — artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s2.md
- [ ] `tab-s3` — Retire the legacy admin-bootstrap path — artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s3.md

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Security-sensitive — this epic grants elevated (admin) access and touches the real login path for every auth provider. Coding agent should pause for human review at PR, matching the established oversight level for this repo's other role/auth-boundary epics (e.g. `viewer-role-no-enforcement`).

## Complexity Rating

**Rating:** 2

Some genuine ambiguity remains in implementation detail (exact schema shape for the new bootstrap row, exact migration mechanics for the backfill), but the core design decisions were already locked in during `/clarify` — this isn't unknown-unknowns territory.

## Scope Stability

**Stability:** Stable

All 3 `/clarify` rounds resolved the open design questions before this epic was written; scope is not expected to shift during implementation.
