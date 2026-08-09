## Definition of Ready: jlfc-s1 — Time-bound the journey list's pre-tenancy migration-grace filter

**Story:** artefacts/2026-08-09-journey-legacy-filter-cutoff/stories/jlfc-s1-journey-legacy-filter-cutoff.md
**Review artefact:** artefacts/2026-08-09-journey-legacy-filter-cutoff/review/jlfc-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-09-journey-legacy-filter-cutoff/test-plans/jlfc-s1-test-plan.md
**Date:** 2026-08-09

---

### Scope contract

**Files in scope (exact touchpoints):**
- `src/web-ui/routes/journey.js` — `handleGetJourney` (~line 308-319): add a time-bound condition to the existing migration-grace filter clause.
- `tests/check-jlfc-s1-*.js` (new) — unit tests per the test plan.

**Files explicitly out of scope (must not be touched):**
- `handlePostJourney` and any journey-creation code path — this story only narrows list-filtering, not creation.
- `src/web-ui/routes/products.js` — the sidebar's Postgres count query is already correct.
- `tests/check-s0.3-journey-list-filter.js` — must pass unmodified (regression baseline for AC4/AC5), not edited.

### Architecture Constraints

No new architectural decision — this narrows an existing filter clause with a historically-anchored constant. No ADR required.

### Human oversight

**Low** — a small, precisely-scoped addition to an existing filter, with the cutoff's provenance verified against the actual commit (`2c0fb7ca`) that introduced the clause being narrowed, and explicit regression ACs (AC4/AC5) protecting the two adjacent behaviours that must not change.

### Coding Agent Instructions

1. In `journey.js`, near the top of `handleGetJourney` or as a module-level constant near the top of the file, add:
   ```javascript
   // jlfc-s1: journeys created on/after this cutoff had real tenancy support
   // available (commit 2c0fb7ca, 2026-06-29 -- this exact migration-grace
   // filter's own introduction). A tenant-less journey created after this
   // point reflects a creation-path defect (e.g. a session that never
   // established a tenantId), not genuine pre-tenancy history, and must not
   // be granted grace visibility just because its ownerId happens to match
   // the current user.
   var _TENANCY_ROLLOUT_CUTOFF_MS = Date.parse('2026-06-29T00:00:00Z');
   ```
2. Replace the existing filter body:
   ```javascript
   journeys = journeys.filter(function(j) {
     if (j.tenantId === _tid) return true;
     if (j.tenantId == null && (j.ownerId == null || j.ownerId === _login)) return true;
     return false;
   });
   ```
   with:
   ```javascript
   journeys = journeys.filter(function(j) {
     if (j.tenantId === _tid) return true;
     var _createdMs = j.createdAt ? Date.parse(j.createdAt) : NaN;
     var _isPreTenancyLegacy = j.tenantId == null && (isNaN(_createdMs) || _createdMs < _TENANCY_ROLLOUT_CUTOFF_MS);
     if (_isPreTenancyLegacy && (j.ownerId == null || j.ownerId === _login)) return true;
     return false;
   });
   ```
   Note: `isNaN(_createdMs)` covers both "no `createdAt` field at all" and "an unparseable `createdAt` value" — both must be treated as pre-tenancy-legacy (AC3), since the code cannot prove recency without a valid timestamp.
3. Write the tests per the test plan, using `journeyRoute.setJourneyStoreModule(stubStore)` / `setRepoRoot(...)`, the exact seam already established in `tests/check-s0.3-journey-list-filter.js`.
4. Re-run `tests/check-s0.3-journey-list-filter.js` directly (unmodified) to confirm AC4/AC5 — zero regression to the already-correct tenant-matching and session-level backward-compat paths.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified (none — all ACs assert on filtered response body content, not rendered layout)

**PROCEED: Yes**
