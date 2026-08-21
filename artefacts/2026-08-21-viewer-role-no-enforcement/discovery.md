# Discovery: Viewer role has no actual write-blocking enforcement

**Status:** Draft — awaiting approval
**Created:** 2026-08-21
**Approved by:** [pending human review]
**Author:** Claude (agent) — found while writing the test plan for `rbg-s1` (`2026-08-18-bri-s3-3-role-boundary-guard-gap`)

---

## Problem Statement

`team-management.js`'s `VALID_ROLES` defines four roles: `admin`, `engineer`, `product`, `viewer`. An admin can assign any teammate the `viewer` role via the existing team-management UI/API, with the clear implication (per `bri-s3.3`'s own original story text: "a viewer-role team member (read-only)... attempts any write action... denied") that `viewer` means read-only access.

It doesn't. A full search of `src/web-ui/middleware/` and every route handler in the codebase confirms `'viewer'` exists only as a stored data value in `team_memberships.role` — no middleware or route anywhere checks for it or blocks a write action because of it. The only real role-based gate in the entire codebase is `requireAdmin` (admin vs. everyone else — it does not distinguish engineer/product/viewer from each other). A person assigned `viewer` currently has exactly the same write access as an `engineer` or `product` role person for every non-admin-gated route.

## Who It Affects

- **Admins/product owners** who assign a teammate `viewer` expecting to restrict them to read-only access (e.g. an external stakeholder, a contractor, an auditor) — they are silently granting full write access instead.
- **Any tenant with a real `viewer`-role person already assigned** — unknown whether this has happened in production; not checked as part of this discovery (see Assumptions).

## Why Now

Found directly during this session's retroactive DoD/finding-remediation work on `bri-s3.3` — its own AC3 ("viewer write attempt denied") was discovered to be an unimplemented placeholder test, and investigating what the test *should* assert revealed the underlying feature itself was never built, not just untested. This is a live authorization-model gap in an already-shipped, user-facing role option, not a hypothetical.

## MVP Scope

The smallest thing that validates viewer actually means read-only:
- Enumerate the write actions a `viewer` should plausibly be blocked from (this is the real open question this discovery needs to resolve — candidates: creating/editing products, creating/editing features, running skill sessions, team management changes, credits/billing actions).
- Add enforcement for that enumerated set via a shared, reusable gate (mirroring `requireAdmin`'s existing pattern) rather than ad-hoc checks scattered per-route.
- A real E2E test (extending or replacing `bri-s3.3`'s currently-placeholder AC3) proving a `viewer`-role person is denied on at least one real write route.

## Out of Scope

- **Fixing `bri-s3.3`'s own regression-guard test quality issue (AC1's weak assertion)** — already handled separately by `rbg-s1` (`2026-08-18-bri-s3-3-role-boundary-guard-gap`), which is scoped narrowly to testing the boundary that already exists (`requireAdmin`), not this gap.
- **Auditing whether any real production tenant currently has a `viewer`-role person** who may be relying on (or unknowingly exceeding) the intended restriction — a separate, potentially urgent investigation if this discovery is approved; not resolved here.
- **The `product` and `engineer` roles' own permission boundaries** — this discovery is scoped to `viewer` specifically, the role whose name most directly implies a restriction that isn't real.

## Assumptions and Risks

- **Assumption:** No real production tenant currently has a `viewer`-role person, so this is a latent gap rather than an active incident. **Not validated** — worth checking `team_memberships` in production directly before treating this as low-urgency.
- **Risk:** Enumerating "which write actions viewer should block" is itself a real product decision (not purely technical) — building the wrong boundary could be as confusing as having none.
- **Risk:** Retrofitting a write-blocking gate across many existing routes risks breaking legitimate access patterns for `engineer`/`product` roles if the gate is implemented too broadly (e.g. accidentally gating a route that should stay open to all non-admin authenticated roles).

## Directional Success Indicators

- A `viewer`-role person attempting a real write action (once the specific action set is decided) receives a real, tested denial — not a silent pass-through.
- No regression to `engineer`/`product`/`admin` roles' existing access.

## Constraints

- Depends on `rbg-s1` first (or at least awareness of it) — `rbg-s1` narrows `bri-s3.3`'s AC2 to test the boundary that exists today (non-admin denial), explicitly deferring "any write action" enforcement to this discovery.
- No regulatory/compliance driver identified yet — worth checking `product/constraints.md` if this proceeds, since role-based access control sometimes has compliance implications.

## Contributors

- Claude (agent) — investigation and discovery authoring

## Reviewers

- [pending — recommend the operator/product owner as a non-engineering-equivalent stakeholder for this access-control decision]

## Approved By

[pending]

---

**Next step:** Human review and approval → `/benefit-metric`
