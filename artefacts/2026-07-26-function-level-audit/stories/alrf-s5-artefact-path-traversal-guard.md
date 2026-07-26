# Retrospective Story: Path-traversal guard for as-built diagram artefact writes

**Story ID:** alrf-s5
**Retrospective audit date:** 2026-07-26
**Risk classification:** CRITICAL finding, LOW-RISK fix (additive validation guard; no change to legitimate-input behaviour)

**Epic reference:** `artefacts/2026-07-25-code-shape-diagrams/epics/csd-e1-code-shape-diagrams.md` — the vulnerable routes (csd-s5, csd-s7) belong to this epic
**Parent audit:** `artefacts/2026-07-26-function-level-audit/decisions.md` — found during the broader function-level audit requested after the storage-drift audit concluded

## What was delivered

The function-level audit found that `src/modules/migration-schema-parser.js`'s `writeAsBuiltDiagramArtefact()` — shared by both `routes/as-built-diagrams.js` (csd-s5) and `routes/as-built-system-architecture.js` (csd-s7) — joined `repoRoot + 'artefacts' + featureSlug` with **zero validation** of `featureSlug`, which comes directly from an unauthenticated-looking `req.query.featureSlug`. Both routes sit behind `authGuard`, so exploitation requires a valid signed-in account, but any authenticated user could supply `featureSlug=../../../../tmp/evil` (or similar) to write an arbitrary JSON file anywhere the Node process has filesystem write permission — a real, active path-traversal vulnerability, not a dormant one. This directly violates the already-documented path-traversal guard convention in `CLAUDE.md` (`ougl.5`/`ougl.6`), which `routes/journey.js` and `adapters/sign-off-writer.js` already correctly implement — the newer csd-s5/csd-s7 routes simply didn't follow it.

**Fix:** added `ArtefactPathTraversalError` and a guard inside `writeAsBuiltDiagramArtefact()` itself (fixing both call sites at once, since they share this one function), matching the exact `path.resolve` + `startsWith(repoRoot + path.sep)` pattern already used in `routes/journey.js`. Both route handlers now catch this specific error by name (not by string-matching the message) and return HTTP 400 with a generic message, never echoing the raw traversal value back to the client — per the existing "do not log the raw path value in production" rule.

## Benefit Linkage

**Metric moved:** closes an active, exploitable arbitrary-file-write vulnerability affecting any authenticated user of the SaaS product.
**How:** matches the codebase's own pre-existing security convention rather than inventing a new one — the guard shape is identical to `journey.js`'s own, just relocated into the shared writer function so both vulnerable routes are fixed by a single change.

## Acceptance Criteria

**AC1 — `writeAsBuiltDiagramArtefact()` throws `ArtefactPathTraversalError` for a traversal `featureSlug`, and writes nothing to disk outside `repoRoot`**
Status: MET — `tests/check-alrf-s5-artefact-path-traversal-guard.js` AC1.

**AC2 — a legitimate `featureSlug` still writes successfully (no regression)**
Status: MET — AC2, plus full pre-existing `check-csd-s5-...`/`check-csd-s6-...`/`check-csd-s7-...` suites (37/37 combined) passing unchanged.

**AC3 — `GET /api/as-built-diagrams/data-model` returns 400 (never 500) for a traversal `featureSlug`, without echoing the raw value**
Status: MET — AC3.

**AC4 — `GET /api/as-built-diagrams/system-architecture` returns 400 (never 500) for a traversal `featureSlug`, without echoing the raw value**
Status: MET — AC4 (same shared writer function, second route, confirms the fix covers both call sites).

## Out of Scope

- The dormant tenant-isolation gap in these same two routes' `_repoRoot()` (ignoring `req`/`WUCE_TENANT_ROOT_BASE`) — a separate, lower-urgency finding from the same audit, deferred to a batch fix per operator direction (see `decisions.md` finding #2).
- The orphaned `assignFeatureToModule`/`unassignFeature` write path and the `auth-email.js` rate-limiter duplication — also deferred, see `decisions.md` findings #3–#4.

## Traceability Linkage

**DoR artefact:** not written — retrospective story, same convention as this session's other same-day fixes
**Test plan:** `tests/check-alrf-s5-artefact-path-traversal-guard.js` (10 ACs, all passing)
**DoD artefact:** not yet written
