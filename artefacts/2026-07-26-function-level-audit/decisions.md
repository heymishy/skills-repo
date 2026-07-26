# Decisions — function-level-audit

## Context

Follow-up to the storage-drift audit (`artefacts/2026-07-26-storage-drift-audit/`), per the operator's explicit request: audit the codebase more broadly for dead code, inconsistencies, or multiple independent implementations of the same feature/function — not limited to storage/persistence.

## Method

Scanned every `module.exports` in `src/web-ui` and cross-referenced each exported name against `src/`, `tests/`, `bin/`, and `scripts/` for external references. 381 exported names checked; 22 had zero references outside their defining file. Manually triaged each suspect rather than trusting the naive scan — most (~20) turned out to be false positives (private helpers legitimately used only within their own file, or D37 test-only adapter seams that already default to the real implementation, so server.js correctly never needs to call the setter).

Also followed the same technique that surfaced the storage-drift bugs — searching for multiple functions/files solving the same conceptual problem — applied to repo-root resolution, admin/role checks, rate limiting, and tenant-ID handling.

## Findings

Ranked by severity:

1. **CRITICAL, active, exploitable today — path-traversal write vulnerability.** `src/modules/migration-schema-parser.js`'s `writeAsBuiltDiagramArtefact()` (shared by `routes/as-built-diagrams.js` (csd-s5) and `routes/as-built-system-architecture.js` (csd-s7)) joined `repoRoot + 'artefacts' + featureSlug` with zero validation of `featureSlug`, which comes directly from `req.query.featureSlug`. Both routes are behind `authGuard`, so not anonymous, but any authenticated user could write an arbitrary JSON file anywhere the Node process has filesystem permission (e.g. `featureSlug=../../../../tmp/evil`). Directly violates the already-documented path-traversal guard convention in `CLAUDE.md` (`ougl.5`/`ougl.6`), which `routes/journey.js` and `adapters/sign-off-writer.js` already correctly follow. **Fixed same-day, see alrf-s5 below.**

2. **MEDIUM, dormant (not currently exploited on this deployment) — tenant-isolation bypass in the same two routes.** `as-built-diagrams.js`/`as-built-system-architecture.js` each define a private `_repoRoot()` that ignores `req` entirely and always resolves to the server's own static checkout directory — bypassing `adapters/repo-root.js`'s canonical `getRepoRoot(req)` (the tenant-aware resolver from the `wuce-multi-tenancy` epic, which honours `WUCE_TENANT_ROOT_BASE` + `req.session.tenantId`). `WUCE_TENANT_ROOT_BASE` is unset on both `fly.staging.toml` and `fly.toml`, so this doesn't diverge from correct behaviour on this specific deployment today — but the moment per-tenant repo isolation is configured (which is exactly what that epic exists to support), these two routes would silently read/write the wrong tenant's data, and the write side has no tenant namespacing at all (two tenants with the same feature slug could collide on the same artefact file). **Deferred to a batch fix per operator direction (2026-07-26).**

3. **LOW, functionality gap — orphaned module-assignment write path.** `adapters/modules-adapter.js`'s `assignFeatureToModule`/`unassignFeature` are fully implemented but never called from any route. The read side (`getFeatureModuleAssignments`) is wired and used by the product/kanban view, but there is currently no way for a user to actually set a feature's module assignment through the running app. **Deferred to a batch fix per operator direction (2026-07-26).**

4. **LOW, code-duplication, not a bug.** `routes/auth-email.js` reimplements its own in-memory sliding-window rate limiter (`_rateLimits` Map) rather than reusing `middleware/rate-limiter.js`'s `createRateLimiter` factory (which `routes/sign-off.js` correctly reuses with different params). Justified somewhat by different keying (per-IP, pre-auth) vs. the shared limiter's per-tenant keying (requires a session) — not a drift/correctness bug, just a missed DRY opportunity. Not pursued further this session.

## D1 — alrf-s5: path-traversal guard added to writeAsBuiltDiagramArtefact, applied immediately (not batched)

**Date:** 2026-07-26
**Decision:** unlike findings #2–#4 above (deferred to a batch per operator direction), finding #1 was fixed immediately given it's an active, exploitable vulnerability rather than a dormant inconsistency or missing convenience feature.
**Implementation:** added an `ArtefactPathTraversalError` class and a `path.resolve` + `startsWith(repoRoot + path.sep)` guard directly inside `writeAsBuiltDiagramArtefact()` (fixing both call sites at once, since they share this one function) — matching the exact pattern `routes/journey.js` already uses for its own artefact-path traversal guard. Both route handlers now catch this specific error by name and return HTTP 400 with a generic `"invalid featureSlug"` message, never echoing the raw traversal value, per the existing documented convention ("do not log the raw path value in production").
**Verification:** `tests/check-alrf-s5-artefact-path-traversal-guard.js` (10 ACs: module-level throw + no file written, legitimate slug still works, both routes return 400 not 500, no raw value leaked in the response). Full pre-existing `check-csd-s5-as-built-diagram-generation.js` (10/10), `check-csd-s6-drift-signal.js` (18/18), `check-csd-s7-as-built-system-architecture-diagram.js` (9/9) all pass unchanged.
