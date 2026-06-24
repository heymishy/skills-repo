# Implementation Plan: shr.1 — Extend pipeline-state schema and harness for infra and migration track flags

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/shr.1.md
**DoR artefact:** artefacts/2026-06-22-skills-infra-migration-tracks/dor/shr.1-dor.md
**Test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/shr.1-test-plan.md
**Test file:** `tests/check-shr1-schema-harness.js`
**Worktree:** `.worktrees/shr.1` (branch: `feature/shr.1`)
**Plan author:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## Goal

Add four optional fields to `pipeline-state.schema.json` and extend the advance command to accept them with correct types. Schema and harness changes must land in a single commit (AC5). The 5 currently-blocked stories (inf.4, inf.5, mig.1, mig.3, mig.4) are unblocked once these fields exist in the schema.

---

## File Map

| File | Action | Rationale |
|------|--------|-----------|
| `tests/check-shr1-schema-harness.js` | **CREATE** | 11 tests (7 unit, 2 integration, 2 NFR) — written RED before implementation |
| `.github/pipeline-state.schema.json` | **MODIFY** | Add 4 fields to `features[].stories[].items.properties` block (lines ~133–150) |
| `scripts/check-pipeline-state-integrity.js` | **MODIFY** | Add 2 self-tests confirming new optional fields are accepted; add comment noting them |
| `src/enforcement/cli-advance.js` | **MODIFY** | Add `hasInfraTrack`, `hasMigrationTrack` to `BOOLEAN_FIELDS`; add `STRING_FIELDS` for `infraPlanPath`, `migrationReviewPath` (skip integer coercion) |

**Note on `bin/skills` vs `src/enforcement/cli-advance.js`:** The DoR lists "bin/skills (advance subcommand only)" as a touch point. The advance subcommand routes directly to `src/enforcement/cli-advance.js` — that module IS the advance subcommand. Modifying `cli-advance.js` satisfies the DoR touch point. No other `src/` files are touched (web-ui, modules, gateway, etc. are all out of scope per DoR constraint).

**Files explicitly NOT touched:**
- `src/web-ui/`, `src/modules/`, `src/enforcement/` (except `cli-advance.js`)
- `.github/skills/` (no SKILL.md changes)
- `pipeline-viz.html` or any dashboard file
- Any test file other than `tests/check-shr1-schema-harness.js`

---

## Tasks

### T1 — Write failing test file (RED)

**State:** `not-started`
**File:** `tests/check-shr1-schema-harness.js`
**Action:** Create the test file implementing all 11 tests from the test plan. Run it — expect failures.

**Expected RED failures before implementation:**
- `schema-contains-hasInfraTrack-field` — FAIL (field not in schema yet)
- `schema-contains-hasMigrationTrack-and-path-fields` — FAIL (fields not in schema yet)
- `advance-writes-hasInfraTrack-and-path` — FAIL (`hasInfraTrack` stored as string `"true"` not boolean `true`)
- `schema-and-harness-in-same-commit` — FAIL (commit not made yet)
- `advance-with-false-flag-passes-integrity` — FAIL (same type coercion issue)

**Expected GREEN before implementation:**
- `integrity-check-accepts-hasInfraTrack-true` — PASS (existing check ignores unknown fields)
- `integrity-check-accepts-hasMigrationTrack-with-path` — PASS
- `integrity-check-accepts-absent-flags` — PASS
- `integrity-check-passes-after-advance-write` — depends on T3
- `integrity-check-completes-within-5-seconds` — PASS
- `new-fields-reject-non-string-path-values` — FAIL until T3

**Run:** `node tests/check-shr1-schema-harness.js`

---

### T2 — Extend schema + add self-tests to integrity check (AC1, AC2, AC4, AC5)

**State:** `not-started`
**CRITICAL: Both files must be staged and committed in a SINGLE commit for AC5.**

#### 2a — Schema changes (`.github/pipeline-state.schema.json`)

In the `features[].stories[].items.properties` block (currently ending at the `tasks` property, ~line 218), add these 4 properties:

```json
"hasInfraTrack":       { "type": "boolean", "description": "True when this story has a corresponding infra-definition artefact (written by /infra-definition, read by H-INF gate at DoR)" },
"hasMigrationTrack":   { "type": "boolean", "description": "True when this story has a corresponding schema-migration artefact (written by /schema-migration-plan, read by H-MIG gate at DoR)" },
"infraPlanPath":       { "type": "string",  "description": "Relative path to the infra-plan artefact for this story, e.g. artefacts/feat/infra/s1-infra-plan.md" },
"migrationReviewPath": { "type": "string",  "description": "Relative path to the migration-review sign-off artefact for this story, e.g. artefacts/feat/migrations/s1-review.md" }
```

All 4 are in the `properties` block only — NOT in `required`. They are optional.

#### 2b — Integrity check acknowledgment (`scripts/check-pipeline-state-integrity.js`)

After the existing self-tests (before the `if (selfFailed > 0)` check), add:

```javascript
// shr.1: optional infra/migration track fields — absence and presence both valid
{
  const s = { id: 's1', hasInfraTrack: true, infraPlanPath: 'artefacts/f/infra/s1.md' };
  selfAssert(checkStory('f', s).every(function(x) { return x.code !== 'C9'; }),
    'shr.1: hasInfraTrack present → no C-check fires');
}
{
  const s = { id: 's1' };
  selfAssert(checkStory('f', s).every(function(x) { return x.code !== 'C9'; }),
    'shr.1: hasInfraTrack absent → no C-check fires');
}
```

Note: These self-tests assert that `checkStory` does not fire any unexpected check code when the new fields are present or absent. Since `checkStory` is already tolerant of unknown fields (it only checks C1–C8), these tests will pass immediately. Their purpose is to make the harness explicitly aware of the new fields and satisfy AC5's same-commit requirement.

**Run after commit:**
```
node scripts/check-pipeline-state-integrity.js
```
Expect: 0 fail.

---

### T3 — Extend advance command to support new field types (AC3, AC4)

**State:** `not-started`
**File:** `src/enforcement/cli-advance.js`

#### 3a — Add boolean fields

In the `BOOLEAN_FIELDS` array (line 19–26), add:
```javascript
'hasInfraTrack',
'hasMigrationTrack',
```

#### 3b — Add string-only path fields (skip integer coercion)

After the `BOOLEAN_FIELDS` declaration, add:
```javascript
// Path fields: always stored as strings — integer coercion skipped (NFR: no numeric paths).
var STRING_FIELDS = [
  'infraPlanPath',
  'migrationReviewPath',
];
```

In the `Object.keys(stateUpdate).forEach` apply loop (line 154), before the `BOOLEAN_FIELDS` coercion, add a `STRING_FIELDS` guard that skips integer coercion:

Current code at line 157:
```javascript
    if (/^\d+$/.test(val)) { val = Number(val); }
```

Replace with:
```javascript
    if (/^\d+$/.test(val) && STRING_FIELDS.indexOf(key) === -1) { val = Number(val); }
```

This ensures `infraPlanPath=42` stays as the string `"42"` rather than the number `42`.

**Run after change:**
```
node tests/check-shr1-schema-harness.js
```
Expect: all 11 tests PASS.

---

### T4 — Full test suite verification (GREEN)

**State:** `not-started`

Run all three checks in the worktree:

```bash
node tests/check-shr1-schema-harness.js
node scripts/check-pipeline-state-integrity.js
npm test
```

Expected results:
- `check-shr1-schema-harness.js`: 11/11 PASS
- `check-pipeline-state-integrity.js`: 0 fail, N stories checked
- `npm test`: no new failures (pre-existing `checkpoint-skill-references-schema-path` failure is known-pre-existing — confirmed baseline)

If any new failures appear in `npm test`, investigate before proceeding. Do not open the PR with new test regressions.

---

### T5 — Open draft PR

**State:** `not-started`

```bash
git push -u origin feature/shr.1
gh pr create --draft \
  --title "feat(shr.1): extend pipeline-state schema and harness for infra/migration track flags" \
  --body "..."
```

PR body must include:
- Link to DoR: `artefacts/2026-06-22-skills-infra-migration-tracks/dor/shr.1-dor.md`
- Summary of 4 new schema fields and their purpose
- Note that 5 downstream stories (inf.4, inf.5, mig.1, mig.3, mig.4) are unblocked after this merges
- Test result: 11/11 passing

Do NOT mark ready for review. Leave as draft. Add PR URL to pipeline-state.json via `node bin/skills advance` on master after pushing.

---

## Commit Strategy

| Commit | Files | Message |
|--------|-------|---------|
| 1 (RED) | `tests/check-shr1-schema-harness.js` | `test(shr.1): add failing test harness for schema + advance extension` |
| 2 (GREEN — AC5 same-commit) | `.github/pipeline-state.schema.json` + `scripts/check-pipeline-state-integrity.js` | `feat(shr.1): add infra/migration track fields to pipeline-state schema and harness` |
| 3 (GREEN) | `src/enforcement/cli-advance.js` | `feat(shr.1): extend advance command boolean/string-field support for track flags` |

---

## Pipeline State Write Safety

Do NOT use the worktree's stale disk copy of `pipeline-state.json` for any `skills advance` call. Always run from the main repo root, or fetch from origin:

```bash
# From main repo root (not worktree):
node bin/skills advance "2026-06-22-skills-infra-migration-tracks" "shr.1" stage=implementation-plan
```

If running from within the worktree:
```bash
git fetch origin master
node bin/skills advance ... # reads from disk — but disk is stale after master commits
```
Prefer running `node bin/skills advance` from the main repo root (`C:\Users\Hamis\code\skills repo`) for all pipeline-state writes.
