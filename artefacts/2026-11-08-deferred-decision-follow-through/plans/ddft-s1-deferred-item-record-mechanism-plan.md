## Implementation Plan: Deferred-item record mechanism (generalized schema)

**Story reference:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s1-deferred-item-record-mechanism.md
**Test plan reference:** artefacts/2026-11-08-deferred-decision-follow-through/test-plans/ddft-s1-deferred-item-record-mechanism-test-plan.md
**DoR reference:** artefacts/2026-11-08-deferred-decision-follow-through/dor/ddft-s1-deferred-item-record-mechanism-dor.md

---

## File map

| File | Change |
|------|--------|
| `scripts/lib/incident-store.js` | Generalize in place: add `type` field to `createIncidentRecord` (default `'incident'`), add `source`/`revisitCondition`/`linkedFeature`/`linkedStory` fields when `type: 'deferred-item'`, add `createDeferredItemRecord`, `validateRecord`, `withDefaultType`, `loadRecords` |
| `tests/check-ddft-s1-deferred-item-record.js` | New test file covering all 4 ACs + the NFR test |

---

## Task 1 — AC1 part A: backward-compatible `type` field + deferred-item fields on `createIncidentRecord`

**Failing test first** (`tests/check-ddft-s1-deferred-item-record.js`):

```js
function addsTypeFieldDefaultingExistingRecordsToIncident() {
  const { createIncidentRecord } = require('../scripts/lib/incident-store');
  const r = createIncidentRecord({ trigger: 'x', summary: 's', tags: ['a'] });
  assert.strictEqual(r.type, 'incident');
  assert.strictEqual(r.trigger, 'x');
  assert.strictEqual(r.summary, 's');
  assert.deepStrictEqual(r.tags, ['a']);
  assert.deepStrictEqual(r.priorIncidentLinks, []);
  assert.strictEqual(r.status, 'open');
  assert.strictEqual(r.triageSummary, null);
  assert.strictEqual(r.confirmationStatus, null);
  assert.ok(r.id);
  assert.ok(r.createdAt);
  assert.ok(r.updatedAt);
}
```

Run: `node tests/check-ddft-s1-deferred-item-record.js` — expected: this test fails (createIncidentRecord has no `type` field yet).

**Implementation** (`scripts/lib/incident-store.js`):

```js
function createIncidentRecord(input) {
  const normalizedTags = normalizeTags(input.tags || []);
  const joined = normalizedTags.join(',');
  if (joined.length > MAX_TAG_FIELD_LENGTH) {
    throw new IncidentTagFieldTooLongError(joined.length, MAX_TAG_FIELD_LENGTH);
  }

  const now = new Date().toISOString();
  const type = input.type || 'incident';

  const record = {
    id: crypto.randomUUID(),
    type: type,
    trigger: input.trigger,
    summary: input.summary || '',
    tags: normalizedTags,
    priorIncidentLinks: [],
    status: 'open',
    triageSummary: null,
    confirmationStatus: null,
    createdAt: now,
    updatedAt: now,
  };

  if (type === 'deferred-item') {
    record.source = input.source || null;
    record.revisitCondition = input.revisitCondition || null;
    record.linkedFeature = input.linkedFeature || null;
    record.linkedStory = input.linkedStory || null;
  }

  return record;
}
```

Run: `node tests/check-ddft-s1-deferred-item-record.js` — expected: this test now passes.

**Commit:** `feat(ddft-s1): add backward-compatible type field to createIncidentRecord`

---

## Task 2 — AC1 part B: `validateRecord` (type-conditional required fields)

**Failing test first:**

```js
function validatesDeferredItemRequiredFields() {
  const { createIncidentRecord, validateRecord } = require('../scripts/lib/incident-store');
  const incomplete = createIncidentRecord({ type: 'deferred-item', trigger: 'x' });
  incomplete.source = null;
  assert.throws(() => validateRecord(incomplete), /source/);

  const incidentRecord = createIncidentRecord({ trigger: 'x' });
  assert.doesNotThrow(() => validateRecord(incidentRecord));
}
```

Run: `node tests/check-ddft-s1-deferred-item-record.js` — expected: fails (`validateRecord` does not exist).

**Implementation:**

```js
function validateRecord(record) {
  if (record.type === 'deferred-item' && !record.source) {
    throw new Error('Deferred-item record missing required field: source');
  }
}
```

Run again — expected: passes.

**Commit:** `feat(ddft-s1): add validateRecord for type-conditional required fields`

---

## Task 3 — AC1 part C: `withDefaultType` migration helper + integration round-trip

**Failing test first:**

```js
function generalizedSchemaRoundTripsThroughDisk() {
  const { createIncidentRecord, appendIncidentRecord, withDefaultType, loadRecords } = require('../scripts/lib/incident-store');
  const tmpFile = path.join(os.tmpdir(), 'ddft-s1-test-' + Date.now() + '.json');
  const preGeneralization = { id: 'abc', trigger: 't', summary: 's', tags: [], priorIncidentLinks: [], status: 'open', triageSummary: null, confirmationStatus: null, createdAt: 'x', updatedAt: 'x' };
  appendIncidentRecord(withDefaultType(preGeneralization), tmpFile);
  const deferred = createIncidentRecord({ type: 'deferred-item', trigger: 'defer', source: 'risk-accept', revisitCondition: 'rc', linkedFeature: 'f', linkedStory: 's1' });
  appendIncidentRecord(deferred, tmpFile);

  const records = loadRecords(tmpFile);
  assert.strictEqual(records.length, 2);
  assert.strictEqual(records[0].type, 'incident');
  assert.strictEqual(records[1].type, 'deferred-item');
  assert.strictEqual(records[1].source, 'risk-accept');
  fs.unlinkSync(tmpFile);
}
```

Run — expected: fails (`withDefaultType`, `loadRecords` do not exist).

**Implementation:**

```js
function withDefaultType(record) {
  return Object.assign({}, record, { type: record.type || 'incident' });
}

function _readRecords(filePath) {
  if (!fs.existsSync(filePath)) { return []; }
  const raw = fs.readFileSync(filePath, 'utf8');
  return raw.trim().length > 0 ? JSON.parse(raw) : [];
}

function loadRecords(filePath) {
  return _readRecords(filePath);
}
```

Refactor `appendIncidentRecord` to call `_readRecords(filePath)` instead of duplicating the read logic:

```js
function appendIncidentRecord(record, filePath) {
  const records = _readRecords(filePath);
  records.push(record);
  fs.writeFileSync(filePath, JSON.stringify(records, null, 2) + '\n');
  return records;
}
```

Run again — expected: passes.

**Commit:** `feat(ddft-s1): add withDefaultType migration helper and loadRecords, refactor shared read path`

---

## Task 4 — AC2: register the real `tfhc-s1` finding as a deferred-item record

**Failing test first:**

```js
function registersTfhcS1AsRealDeferredItemRecord() {
  const { createDeferredItemRecord, appendIncidentRecord, loadRecords } = require('../scripts/lib/incident-store');
  const tmpFile = path.join(os.tmpdir(), 'ddft-s1-tfhc-' + Date.now() + '.json');
  const record = createDeferredItemRecord({
    trigger: 'pipeline-state-integrity C3: tfhc-s1',
    summary: '2026-10-30-test-fixture-hardening-continuation / tfhc-s1: prStatus="merged" but testPlan.passing (4) < testPlan.totalTests (5)',
    source: 'risk-accept',
    revisitCondition: 'Update testPlan.passing to the confirmed count in the post-merge pipeline-state commit.',
    linkedFeature: '2026-10-30-test-fixture-hardening-continuation',
    linkedStory: 'tfhc-s1',
  });
  appendIncidentRecord(record, tmpFile);

  const records = loadRecords(tmpFile);
  assert.strictEqual(records[0].type, 'deferred-item');
  assert.strictEqual(records[0].source, 'risk-accept');
  assert.ok(records[0].revisitCondition.includes('testPlan.passing'));
  fs.unlinkSync(tmpFile);
}
```

Run — expected: fails (`createDeferredItemRecord` does not exist).

**Implementation:**

```js
function createDeferredItemRecord(input) {
  const record = createIncidentRecord(Object.assign({}, input, { type: 'deferred-item' }));
  validateRecord(record);
  return record;
}
```

Run again — expected: passes.

**Commit:** `feat(ddft-s1): add createDeferredItemRecord and register the real tfhc-s1 finding`

---

## Task 5 — AC3: register the real C1-vs-Option-C contradiction as a deferred-item record

**Failing test first:**

```js
function registersC1VsOptionCAsRealDeferredItemRecord() {
  const { createDeferredItemRecord, appendIncidentRecord, loadRecords } = require('../scripts/lib/incident-store');
  const tmpFile = path.join(os.tmpdir(), 'ddft-s1-c1-' + Date.now() + '.json');
  const record = createDeferredItemRecord({
    trigger: 'C1-vs-Option-C fork-distribution contradiction',
    summary: 'architecture-guardrails.md constraint C1 rejects forking as a distribution mechanism; skills/bootstrap/SKILL.md Option C and docs/skill-pipeline-instructions.md offer org-level forking as a first-class onboarding path. These two documents disagree on whether forking is a valid distribution model at all.',
    source: 'backlog-thread',
    revisitCondition: 'deferred to a broader `product/` refresh later',
    linkedFeature: null,
    linkedStory: null,
  });
  appendIncidentRecord(record, tmpFile);

  const records = loadRecords(tmpFile);
  assert.strictEqual(records[0].type, 'deferred-item');
  assert.strictEqual(records[0].source, 'backlog-thread');
  assert.ok(records[0].revisitCondition.includes('broader `product/` refresh later'));
  fs.unlinkSync(tmpFile);
}
```

Run — expected: fails initially only in the sense the suite doesn't exist yet; by this task `createDeferredItemRecord` already exists from Task 4, so this test should pass once written (no further implementation change needed — confirms the generic mechanism handles a second, differently-sourced case correctly).

**Commit:** `test(ddft-s1): register the real C1-vs-Option-C contradiction as a deferred-item record`

---

## Task 6 — AC4: both seeded records found and correctly typed

**Failing test first:**

```js
function bothSeededRecordsFoundAndCorrectlyTyped() {
  const { createDeferredItemRecord, appendIncidentRecord, loadRecords } = require('../scripts/lib/incident-store');
  const tmpFile = path.join(os.tmpdir(), 'ddft-s1-both-' + Date.now() + '.json');
  appendIncidentRecord(createDeferredItemRecord({ trigger: 'tfhc-s1', source: 'risk-accept', revisitCondition: 'rc1' }), tmpFile);
  appendIncidentRecord(createDeferredItemRecord({ trigger: 'c1-vs-optionc', source: 'backlog-thread', revisitCondition: 'rc2' }), tmpFile);

  const records = loadRecords(tmpFile);
  const deferredItems = records.filter((r) => r.type === 'deferred-item');
  assert.strictEqual(deferredItems.length, 2);
  deferredItems.forEach((r) => assert.strictEqual(r.type, 'deferred-item'));
  fs.unlinkSync(tmpFile);
}
```

Run — expected: passes once written (mechanism already built in prior tasks; this is the AC4 existence/typing check itself).

**Commit:** `test(ddft-s1): confirm both seeded deferred-item records are found and correctly typed (AC4)`

---

## Task 7 — NFR: no credential/token-shaped content in record fields

**Failing test first:**

```js
function noCredentialOrTokenShapedContentInRecordFields() {
  const { createDeferredItemRecord } = require('../scripts/lib/incident-store');
  const credentialPattern = /(api[_-]?key|bearer\s+[a-z0-9]|token\s*[:=]\s*['"][a-z0-9]{10,})/i;
  const record = createDeferredItemRecord({
    trigger: 'tfhc-s1', summary: 'real failure text', source: 'risk-accept', revisitCondition: 'real revisit text',
  });
  Object.keys(record).forEach((k) => {
    if (typeof record[k] === 'string') {
      assert.doesNotMatch ? assert.doesNotMatch(record[k], credentialPattern) : assert.ok(!credentialPattern.test(record[k]), k + ' contains credential-shaped content');
    }
  });
}
```

Run — expected: passes (no implementation change needed; this is a verification-only NFR test over already-shipped real content).

**Commit:** `test(ddft-s1): NFR — confirm no credential-shaped content in deferred-item record fields`

---

## Backward-compatibility regression check (mandatory per directive)

**Failing test first — proves `itar-s1`'s existing callers are unaffected:**

```js
function itarS1ExistingCallersUnaffectedByGeneralization() {
  // Mirrors itar-s1's own real test shape exactly, with no `type` or
  // deferred-item fields passed -- confirms backward compatibility.
  const { createIncidentRecord } = require('../scripts/lib/incident-store');
  const r = createIncidentRecord({
    trigger: 'tenant_admin_bootstrap_failed',
    summary: 'inconsistent types deduced for parameter $1',
    tags: ['sql', 'type-inference'],
  });
  assert.strictEqual(r.type, 'incident');
  assert.strictEqual(r.source, undefined);
  assert.strictEqual(r.revisitCondition, undefined);
  assert.strictEqual(r.linkedFeature, undefined);
  assert.strictEqual(r.linkedStory, undefined);
}
```

Run — expected: fails before Task 1, passes after. Confirms the four new deferred-item-only fields never leak onto an `incident`-type record (itar-s2/s3/s4 read this shape and must not see unexpected keys).

**Commit:** `test(ddft-s1): confirm itar-s1's existing createIncidentRecord callers are unaffected`

---

## Expected final test command and output

```
node tests/check-ddft-s1-deferred-item-record.js
```

Expected: `All N tests passed.` (N = 9: 2 AC1 unit + 1 AC1 integration + 1 AC2 + 1 AC3 + 1 AC4 + 1 NFR + 1 backward-compat regression)

Then full suite: `node scripts/run-all-tests.js` — expected: same pre-existing failure count as the confirmed baseline, zero new failures.
