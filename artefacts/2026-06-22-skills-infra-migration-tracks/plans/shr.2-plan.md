# Implementation Plan: shr.2 — Support `ops/` path prefix for standalone infra changes

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/shr.2.md
**DoR artefact:** artefacts/2026-06-22-skills-infra-migration-tracks/dor/shr.2-dor.md
**Test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/shr.2-test-plan.md
**Test file:** `tests/check-shr2-ops-path.js`
**Worktree:** `.worktrees/shr.2` (branch: `feature/shr.2`)
**Plan author:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## Goal

Add a C9 slug-format check to `check-pipeline-state-integrity.js` that validates `ops/`-prefixed feature slugs. A slug matching `ops/YYYY-MM-DD-*` with no traversal sequences passes. A slug with `ops/../../` is rejected. Standard (non-ops) slugs are unaffected — no existing behaviour changes.

---

## File Map

| File | Action | Rationale |
|------|--------|-----------|
| `tests/check-shr2-ops-path.js` | **CREATE** | 8 tests (7 unit, 1 NFR) — written RED before implementation |
| `scripts/check-pipeline-state-integrity.js` | **MODIFY** | Add C9 ops-slug validation to `checkFeature()`; add 4 self-tests |

**Files NOT touched:** src/, .github/skills/, pipeline-state.schema.json, bin/skills, any dashboard file.

---

## Tasks

### T1 — Write failing test file (RED)
**State:** `not-started`

Create `tests/check-shr2-ops-path.js` with 8 tests. Expected RED: C9 doesn't exist yet — tests that call `checkFeature` with an `ops/../../` slug will see no FAIL (the check doesn't fire), so the traversal-guard tests will fail. Tests for valid ops slugs will also fail if we write them as "assert no C9 error" — actually those will PASS since no C9 exists. Let me reconsider the RED/GREEN split:

Pre-implementation state (no C9 exists):
- `ops-slug-accepted-by-integrity-check` → PASS (no check rejects it)
- Path-resolution tests → PASS (pure math, no code needed)
- `traversal-in-ops-slug-does-not-escape-repoRoot` → needs to assert slug IS REJECTED → FAIL (no rejection exists)
- `ops-path-traversal-guard-is-mandatory` → FAIL (no guard)

So at least 2 tests will be RED before implementation.

Run: `node tests/check-shr2-ops-path.js`

### T2 — Add C9 ops-slug validation to check-pipeline-state-integrity.js
**State:** `not-started`

In `checkFeature()`, after the C7 stage check, add:

```javascript
// C9: ops/ slug must match ops/YYYY-MM-DD-[descriptor] with no traversal sequences
if (feature.slug && feature.slug.startsWith('ops/')) {
  var opsRemainder = feature.slug.slice(4); // after 'ops/'
  // Reject if remainder contains '..' (traversal) or does not match date pattern
  if (opsRemainder.indexOf('..') !== -1 || !/^\d{4}-\d{2}-\d{2}-./.test(opsRemainder)) {
    findings.push({
      level: 'fail',
      code: 'C9',
      message: 'Feature ' + slug + ': ops/ slug "' + feature.slug + '" is invalid. ' +
               'ops/ slugs must match ops/YYYY-MM-DD-[descriptor] with no traversal sequences.',
    });
  }
}
```

Add 4 self-tests to the self-test block:
- Valid ops slug → no C9
- Second valid ops slug → no C9
- Traversal slug `ops/../../etc/passwd` → C9 fires
- Standard slug with no ops prefix → no C9

Run: `node tests/check-shr2-ops-path.js` → expect all 8 PASS.

### T3 — Full verification + commit + draft PR
**State:** `not-started`

1. `node tests/check-shr2-ops-path.js` — 8/8 PASS
2. `node scripts/check-pipeline-state-integrity.js` — 0 fail
3. Commit: `test(shr.2): RED` then `feat(shr.2): add C9 ops-slug validation`
4. Push + `gh pr create --draft`
