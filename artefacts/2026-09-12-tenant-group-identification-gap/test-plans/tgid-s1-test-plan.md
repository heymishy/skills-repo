# Test Plan: Wire identifyTenantGroup() into the real session-bootstrap path (tgid-s1)

**Story:** artefacts/2026-09-12-tenant-group-identification-gap/stories/tgid-s1-wire-identify-tenant-group-into-session-bootstrap.md
**Track:** Short-track

---

## Test Cases

| Test | AC | Type | Description |
|------|----|------|-------------|
| U1 | AC1 | Unit | `bootstrapFlags(req, deps)` with a real `tenantId` on a fresh session calls the injected `identifyTenantGroup` exactly once |
| U2 | AC2 | Unit | A second `bootstrapFlags` call within the same session (cached `req.session.flags`) does not call `identifyTenantGroup` again |
| U3 | AC3 | Unit | `bootstrapFlags(req, deps)` with no `req.session.tenantId` never calls `identifyTenantGroup` |
| U4 | AC4 | Unit | A slow/hanging injected `identifyTenantGroup` does not delay `bootstrapFlags`'s own return beyond the documented budget, and flag resolution still completes correctly |
| U5 | AC1 | Unit | The `tenantId` passed to `identifyTenantGroup` matches `req.session.tenantId` exactly (no transformation) |
| N1 | AC4 (NFR) | Unit | Total `bootstrapFlags` duration with both a slow `isEnabled` and a slow `identifyTenantGroup` (both racing their own timeouts) still stays within budget |

## Regression coverage

- `tests/check-bri-s1.3-server-side-bootstrap.js` (the sibling story whose own function this story modifies) re-run unmodified — all existing U1-U3, IT1-IT6, N1 must still pass.
- `tests/check-bri-s1.4-tenant-level-targeting.js` (identifyTenantGroup's own defining story) re-run unmodified — this story reuses that function's existing contract exactly, does not change it.

## Out of Scope (per story)

- Any change to `isEnabled()`'s own automatic `groups.tenant` targeting derivation.
- Wiring `identifyTenantGroup` into any session-establishing path other than `bootstrapFlags`.
- Retroactive PostHog group registration for already-bootstrapped sessions.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
