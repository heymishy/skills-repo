# Epic: Phase 0 — Authorization Guard

**Feature:** wuce-multi-tenancy
**Epic slug:** phase-0-authorization-guard
**Status:** Not started
**Slicing strategy:** Risk-first — highest-severity security bug closed first; no infrastructure dependency; ships as a standalone PR before any Phase 1–5 work begins
**Guardrails availability:** Architecture guardrails checked — the active ADRs in `.github/architecture-guardrails.md` apply to viz, schema, and scripts only. This epic touches `src/web-ui/routes/journey.js` and adds `src/web-ui/middleware/journey-access.js`. Relevant constraints from CLAUDE.md: injectable adapter rule (D37), `req.session.accessToken` canonical field name, path-traversal guard standard, ADR-024 response shape contract.

## Rationale

The KNOWN BUG (9 route handlers check only "is someone logged in", not "is this person allowed to see this resource") is the highest-priority work in this feature. It is independently shippable — no infrastructure change required, no OAuth scope change, no storage refactoring. Closing this bug first reduces the attack surface immediately and establishes the guard module that all subsequent phases extend.

## Stories

| Story | Title | Complexity |
|-------|-------|------------|
| p0.1 | Authorization guard module — `journey-access.js` | 2 |
| p0.2 | Wire guard into all KNOWN BUG routes; integration tests | 2 |

## Out of scope for this epic

- Tenant-level identity (Phase 1) — `isSameTenant()` always returns `true` until Phase 1 populates `tenantId` on both sides
- Storage namespacing, repoRoot parameterisation (Phase 2)
- Postgres/Redis persistence (Phase 3)
- `read:org` OAuth scope change (Phase 1)

## Metric linkage

- **M1** (Authorization coverage rate): closes from 18% → 100%
- **T3-M1** (KNOWN BUG closure): closes from 9 open → 0 open
