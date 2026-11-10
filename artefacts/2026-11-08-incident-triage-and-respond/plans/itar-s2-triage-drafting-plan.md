# Implementation Plan: Triage drafting via structured-field Jaccard matching

**Story reference:** artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s2-triage-drafting.md
**Test plan reference:** artefacts/2026-11-08-incident-triage-and-respond/test-plans/itar-s2-triage-drafting-test-plan.md
**DoR reference:** artefacts/2026-11-08-incident-triage-and-respond/dor/itar-s2-triage-drafting-dor.md

---

## File map

| File | Change |
|------|--------|
| `src/modules/drift-comparator.js` | Add `jaccardSimilarity` to `module.exports` (alias of existing `_jaccard`, no behavioural change) |
| `scripts/lib/incident-store.js` | Add `loadIncidentRecords(filePath)` and `saveIncidentRecords(records, filePath)` — additive only, existing exports untouched |
| `src/modules/triage-drafter.js` (new) | `INCIDENT_JACCARD_THRESHOLD` constant + `draftTriageSummary(newRecordId, filePath)` |
| `tests/check-itar-s2-triage-drafting.js` (new) | All unit + integration + NFR tests from the test plan |

---

## Task 1 — Export `jaccardSimilarity` from `drift-comparator.js`

**Test first (red):**
```js
test('jaccardSimilarity_isExportedAndCallable_fromDriftComparator', () => {
  const { jaccardSimilarity } = require('../src/modules/drift-comparator');
  assert.strictEqual(typeof jaccardSimilarity, 'function');
  assert.strictEqual(jaccardSimilarity(['a', 'b'], ['a', 'c']), 1 / 3);
});
```
Fails today: `jaccardSimilarity` is `undefined` on the exports object.

**Implementation:** in `src/modules/drift-comparator.js`, change the `module.exports` block (line 518) to add `jaccardSimilarity: _jaccard` alongside the existing exports. No change to `_jaccard`'s internal body.

**Run:** `node tests/check-itar-s2-triage-drafting.js` → this test passes; no other test file's behaviour changes (confirmed by also running `node tests/check-drift-comparator*.js` if such a file exists, or the full suite).

**Commit:** `feat(itar-s2): export jaccardSimilarity from drift-comparator for cross-module reuse`

---

## Task 2 — Add `loadIncidentRecords` / `saveIncidentRecords` to `incident-store.js`

**Test first (red):**
```js
test('loadIncidentRecords_returnsEmptyArray_whenFileDoesNotExist', () => { ... });
test('loadIncidentRecords_returnsParsedArray_whenFileExists', () => { ... });
test('saveIncidentRecords_writesArrayBackToDisk_overwritingPriorContent', () => { ... });
```

**Implementation:** mirror `appendIncidentRecord`'s existing read branch for `loadIncidentRecords`; mirror its existing write line for `saveIncidentRecords`. Add both to `module.exports` alongside the existing four exports — do not reorder or rename anything already there.

**Commit:** `feat(itar-s2): add loadIncidentRecords/saveIncidentRecords to incident-store`

---

## Task 3 — `triage-drafter.js`: AC4 (cannot-score) first

**Test first (red):** the two `returnsCannotScoreResult_*` tests and the `distinguishesCannotScoreFromGenuineNoMatch` test.

**Implementation:**
```js
function draftTriageSummary(newRecordId, filePath) {
  const records = loadIncidentRecords(filePath);
  const newRecord = records.find((r) => r.id === newRecordId);
  if (!newRecord) {
    throw new Error('draftTriageSummary: no record with id ' + newRecordId + ' found in ' + filePath);
  }

  if (!Array.isArray(newRecord.tags) || newRecord.tags.length === 0) {
    newRecord.triageSummary = 'Cannot score — no tags present on this record.';
    newRecord.priorIncidentLinks = [];
    newRecord.updatedAt = new Date().toISOString();
    saveIncidentRecords(records, filePath);
    return { status: 'cannot-score', triageSummary: newRecord.triageSummary, priorIncidentLinks: [] };
  }
  // ... AC1/AC2/AC3 below
}
```
Malformed shapes (`tags: null`, `tags: "not-an-array"`) both fail the `Array.isArray` check and land here identically.

**Commit:** `feat(itar-s2): triage-drafter handles cannot-score case for empty/malformed tags`

---

## Task 4 — `triage-drafter.js`: AC1 (match + rank) and AC3 (no-match)

**Test first (red):** the 5 AC1 matching/ranking tests + the AC3 no-match test.

**Implementation (continuing the function body):**
```js
  const others = records.filter((r) => r.id !== newRecordId);
  const scored = others
    .map((r) => ({ record: r, score: jaccardSimilarity(newRecord.tags, r.tags || []) }))
    .filter((s) => s.score >= INCIDENT_JACCARD_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    newRecord.triageSummary = 'No relevant prior incident was found for this record\'s tags.';
    newRecord.priorIncidentLinks = [];
    newRecord.updatedAt = new Date().toISOString();
    saveIncidentRecords(records, filePath);
    return { status: 'no-match', triageSummary: newRecord.triageSummary, priorIncidentLinks: [] };
  }

  newRecord.priorIncidentLinks = scored.map((s) => s.record.id);
  newRecord.triageSummary = buildMatchedSummary(scored); // Task 5
  newRecord.updatedAt = new Date().toISOString();
  saveIncidentRecords(records, filePath);
  return { status: 'matched', triageSummary: newRecord.triageSummary, priorIncidentLinks: newRecord.priorIncidentLinks };
```

`INCIDENT_JACCARD_THRESHOLD = 0.3` — provisional, domain-tuned reasoning documented as a code comment (see Task 4 code): incident tag sets are typically 2-4 short keywords: 1 shared tag out of a union of 3 scores 0.33 (above), 1 shared out of a union of 5 scores 0.2 (below) — this cutoff treats "shares at least one clearly relevant tag, for a small tag set" as a match while excluding near-fully-disjoint sets, consistent with the discovery's own instruction that short incident tags behave differently from the longer column-name lists `DUPLICATE_SIMILARITY_THRESHOLD` (0.5) was tuned for. Per `decisions.md`'s revisit trigger, this is explicitly provisional pending real/fixture data at volume.

**Commit:** `feat(itar-s2): triage-drafter scores and ranks matches via jaccardSimilarity`

---

## Task 5 — `triage-drafter.js`: AC2 (narrative summary content)

**Test first (red):** `draftTriageSummary_includesKnownTriedBeforeAndNextStep_whenMatchFound`.

**Implementation:**
```js
function buildMatchedSummary(scored) {
  const top = scored[0].record;
  const known = 'What\'s known: a similar prior incident (' + top.id + ') was triggered by "' + top.trigger + '".';
  const tried = top.status
    ? ' What\'s been tried: the matched incident\'s current status is "' + top.status + '"' + (top.triageSummary ? ' — ' + top.triageSummary : '') + '.'
    : ' What\'s been tried: no resolution status recorded yet on the matched incident.';
  const next = ' Suggested next step: review incident ' + top.id + '\'s own triage notes and prior-incident links before investigating from scratch.';
  return known + tried + next;
}
```

**Commit:** `feat(itar-s2): triage-drafter builds a narrative summary, not a bare score`

---

## Task 6 — Integration test: persistence to real file

**Test first (red):** `draftTriageSummary_persistsSummaryOnRecordInStore_whenRunAgainstRealIncidentsFile`.

Uses `os.tmpdir()` + a uniquely-named fixture file, not the real `workspace/incidents.json`, to avoid any shared-state risk across concurrent CI runs.

**Commit:** `test(itar-s2): integration test confirms triageSummary persists to disk, not just in-memory`

---

## Task 7 — NFR-AUDIT-1

**Test first (red):** `updatedAt` strictly later than `createdAt` after drafting runs.

Already satisfied by Task 3/4's `newRecord.updatedAt = new Date().toISOString()` lines — this task is confirmation, not new code.

**Commit:** `test(itar-s2): confirm NFR-AUDIT-1 (updatedAt advances on triage drafting)`
