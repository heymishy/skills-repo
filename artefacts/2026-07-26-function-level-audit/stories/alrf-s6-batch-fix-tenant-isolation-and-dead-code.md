# Retrospective Story: Batch fix — tenant-isolation, dead code, rate-limiter re-assessment

**Story ID:** alrf-s6
**Retrospective audit date:** 2026-07-26
**Risk classification:** LOW (one additive tenant-aware fix with existing dormant-only impact; one pure dead-code removal with zero live callers confirmed)

**Epic reference:** `artefacts/2026-07-25-code-shape-diagrams/epics/csd-e1-code-shape-diagrams.md` (finding #2's routes belong to this epic)
**Parent audit:** `artefacts/2026-07-26-function-level-audit/decisions.md` — batch fix for findings #2–#4, deferred at the time of the original audit per operator direction

## What was delivered

Closes the remaining findings from the function-level audit, batched per the operator's original direction ("keep auditing first, fix in a batch after"):

**Finding #2 — tenant-isolation bypass (FIXED).** `as-built-diagrams.js` and `as-built-system-architecture.js` each had a private `_repoRoot()` ignoring `req` entirely, always resolving to the server's own static checkout — bypassing `adapters/repo-root.js`'s canonical, tenant-aware `getRepoRoot(req)`. Both routes now use the canonical adapter. Dormant on this deployment today (`WUCE_TENANT_ROOT_BASE` unset everywhere), but would have silently bypassed per-tenant repo isolation, and let two tenants with the same feature slug collide on one artefact file, the moment that config is turned on.

**Finding #3 — orphaned module-assignment write path (RE-ASSESSED, then removed as dead code, not wired to a route).** Deeper investigation found the original framing was wrong: `assignFeatureToModule`/`unassignFeature` weren't a missing feature — the real, live write mechanism is `bulkAssignFeaturesToModule` (tmc-s1), already fully wired to `PUT /products/:id/features/module` (`routes/products.js:2116`), tested, and used even for single-feature assignment via a one-item array. `assignFeatureToModule` was a pure, never-called convenience wrapper over it; `unassignFeature` had no caller at all (there is no user-facing "revert to Unclassified" action — only whole-module deletion cascades features to Unassigned). Zero routes and zero tests referenced either function. Deleted both rather than wiring them to a route that was never actually missing.

**Finding #4 — `auth-email.js`'s rate-limiter (RE-ASSESSED, confirmed acceptable, no code change).** Closer reading found this isn't a DRY oversight: `auth-email.js`'s limiter carries a documented, incident-driven 3-gate staging-only E2E bypass (fixing two real past incidents, `bri-s3.4` and `serlb-s1`) that the shared `middleware/rate-limiter.js` doesn't have and shouldn't be forced to carry. Consolidating them would either bloat a simple generic utility with one-off business logic, or risk reintroducing the exact incidents this custom logic exists to prevent. Downgraded from "fix" to "confirmed acceptable" in `decisions.md` — no code change made.

## Benefit Linkage

**Metric moved:** closes the dormant multi-tenancy correctness gap before it can ever become live; removes genuinely dead code rather than building unneeded UI for a feature that already works via its real path; avoids a counterproductive consolidation that would have reintroduced two previously-fixed incidents.

## Acceptance Criteria

**AC1 — `as-built-diagrams.js` resolves `repoRoot` via the tenant-aware `getRepoRoot(req)`, not a private static function**
Status: MET — `tests/check-alrf-s6-as-built-tenant-isolation.js` AC1.

**AC2 — `as-built-system-architecture.js` resolves `repoRoot` via the same tenant-aware adapter**
Status: MET — AC2.

**AC3 — two different tenants requesting the same feature slug resolve to two different repo roots (no cross-tenant collision)**
Status: MET — AC3.

**AC4 — no regression to existing as-built diagram generation behaviour**
Status: MET — `check-csd-s5-as-built-diagram-generation.js` (10/10), `check-csd-s6-drift-signal.js` (18/18), `check-csd-s7-as-built-system-architecture-diagram.js` (9/9), `check-alrf-s5-artefact-path-traversal-guard.js` (10/10) all pass unchanged.

**AC5 — `assignFeatureToModule`/`unassignFeature` removal has zero regressions (confirmed genuinely dead: zero route callers, zero test references)**
Status: MET — `check-a1-modules-taxonomy-crud.js` (26/26), `check-a2-reassign-epics-between-modules.js` (11/11), `check-a4-module-grouped-rendering.js` (11/11), `check-fps-s1-progress-proxy.js` (7/7), `check-pvc-s1-consolidate-and-tab-features-view.js` (14/14), `check-tmc-s1-persist-feature-module-classification.js` (29/29) — 98 checks combined, all unchanged.

## Out of Scope

- The newly-reported resume-session bug and its root cause (staging's `MOCK_LLM_GATEWAY=true` has no way to distinguish E2E test traffic from real operator traffic, and all four mock fixtures hardcode the same `mock-fixture-feature` slug) — logged in `workspace/capture-log.md` per operator instruction, not yet fixed, tracked as a separate, larger finding.
- Feeding the as-built Data Model/System Architecture snapshot into `/design` sessions as grounding context for "existing entities this feature touches" — raised by the operator as an architecture question, not yet scoped as a story.

## Traceability Linkage

**DoR artefact:** not written — retrospective story, same convention as this session's other same-day fixes
**Test plan:** `tests/check-alrf-s6-as-built-tenant-isolation.js` (8 ACs, all passing)
**DoD artefact:** not yet written
