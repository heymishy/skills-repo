# Implementation Plan: Wire identifyTenantGroup() into the real session-bootstrap path (tgid-s1)

**Story:** artefacts/2026-09-12-tenant-group-identification-gap/stories/tgid-s1-wire-identify-tenant-group-into-session-bootstrap.md
**Test plan:** artefacts/2026-09-12-tenant-group-identification-gap/test-plans/tgid-s1-test-plan.md
**DoR:** artefacts/2026-09-12-tenant-group-identification-gap/dor/tgid-s1-dor.md

---

## Task 1: Wire identifyTenantGroup() into bootstrapFlags() (AC1, AC2, AC3, AC4)

**Files:** `src/web-ui/modules/flag-bootstrap.js`

- Inside `bootstrapFlags`, after the AC2 cache-check early return and before flag resolution, call `identifyTenantGroup(tenantId)` exactly once when `req.session.tenantId` is truthy, bounded by the same `_withTimeout` wrapper used for flag resolution.
- `identifyTenantGroup`/`isEnabled` both come from `require('./posthog-flags')` by default, both overridable via `deps` for testability — matches the file's existing injection convention exactly.

**Status:** committed

---

## Task 2: Regression test file (AC1, AC2, AC3, AC4, NFR)

**Files:** `tests/check-tgid-s1-wire-identify-tenant-group.js` (new)

- U1/U5: identifyTenantGroup called once with the exact session tenantId.
- U2: a second bootstrap call in the same session doesn't re-call it.
- U3: no tenantId means it's never called.
- U4/N1: a hanging identifyTenantGroup is bounded by timeout, flag resolution still completes correctly.

**Status:** committed

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
