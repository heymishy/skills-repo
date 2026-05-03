# Test Plan: Feature artefact index HTML view

**Story:** wuce.20 — Feature artefact index HTML view
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Test file:** `tests/check-wuce20-artefact-index-html.js`
**Total tests:** 17
**Passing at plan-write time:** 0 (tests written to fail — TDD)
**Review artefact:** review/wuce.20-artefact-index-html-view-review-1.md

---

## Test data strategy

Mock `listArtefacts(featureSlug, token)` returns:
```js
[
  { type: 'discovery', createdAt: '2026-04-01', path: 'artefacts/feat/discovery.md' },
  { type: 'benefit-metric', createdAt: '2026-04-02', path: 'artefacts/feat/benefit-metric.md' },
  { type: 'dor', createdAt: '2026-04-03', path: 'artefacts/feat/dor/story-dor.md' },
  { type: 'test-plan', createdAt: '2026-04-04', path: 'artefacts/feat/test-plans/story-test-plan.md' }
]
```
XSS test uses metadata with `<` and `>`. Empty state test uses `listArtefacts()` returning `[]`. Feature slug in URL is `2026-04-01-test-feature`.

---

## Tests

### T1 — Integration: GET /features/:slug Accept: text/html → 200 HTML

**AC:** AC1
**Type:** HTTP integration

```
GET /features/2026-04-01-test-feature
Accept: text/html

Expected:
  Status: 200
  Content-Type: text/html; charset=utf-8
  Body includes: <!doctype html
```

---

### T2 — Integration: HTML response contains renderShell nav

**AC:** AC1
**Type:** HTTP integration

```
Body includes: <nav aria-label="Main navigation">
```

---

### T3 — Integration: HTML response contains artefact list items

**AC:** AC1
**Type:** HTTP integration

```
Body includes: <li  (at least 4 occurrences for 4 artefacts)
```

---

### T4 — Integration: HTML — label "Discovery" displayed for type "discovery"

**AC:** AC3
**Type:** HTTP integration

```
Body includes: Discovery
Body does NOT include raw string: >discovery< (as browser-rendered text)
```

---

### T5 — Integration: HTML — label "Benefit Metric" for "benefit-metric"

**AC:** AC3
**Type:** HTTP integration

```
Body includes: Benefit Metric
```

---

### T6 — Integration: HTML — label "Ready Check" for "dor"

**AC:** AC3
**Type:** HTTP integration

```
Body includes: Ready Check
Body does NOT include raw: >dor<
```

---

### T7 — Integration: HTML — label "Test Plan" for "test-plan"

**AC:** AC3
**Type:** HTTP integration

```
Body includes: Test Plan
```

---

### T8 — Integration: GET /features/:slug Accept: application/json → JSON unchanged

**AC:** AC2
**Type:** HTTP integration

```
GET /features/2026-04-01-test-feature
Accept: application/json

Expected:
  Status: 200
  Content-Type: application/json
  Body parses as array
```

---

### T9 — Integration: no Accept header → JSON unchanged

**AC:** AC2
**Type:** HTTP integration

```
GET /features/2026-04-01-test-feature (no Accept)

Expected:
  Status: 200
  Content-Type: application/json
```

---

### T10 — Integration: HTML — XSS in artefact metadata escaped

**AC:** AC4
**Type:** HTTP integration (path with `<script>`)

```
Artefact path: 'artefacts/<script>alert(1)</script>/discovery.md'

Expected:
  Body does NOT include: <script>alert(1)</script>
  Body includes: &lt;script&gt;
```

---

### T11 — Integration: HTML — empty artefacts → empty-state message in main

**AC:** AC5
**Type:** HTTP integration (listArtefacts returns [])

```
GET /features/2026-04-01-test-feature Accept: text/html

Expected:
  Status: 200
  Body includes: No artefacts found (or equivalent)
  Body does NOT include: <ul  (no empty list)
```

---

### T12 — Integration: GET /features/:slug unauthenticated → 302

**AC:** AC6
**Type:** HTTP integration (no session)

```
Expected:
  Status: 302
  Location: /auth/github
```

---

### T13 — Integration: HTML — creation date displayed per artefact

**AC:** AC1
**Type:** HTTP integration

```
Body includes: 2026-04-01
Body includes: 2026-04-02
```

---

### T14 — Integration: HTML — link to /artefact/:slug/:type per item

**AC:** AC1
**Type:** HTTP integration

```
Body includes: href="/artefact/2026-04-01-test-feature/discovery"
```

---

### T15 — Unit: artefact-labels.js returns correct labels

**AC:** AC3
**Type:** Unit

```
const labels = require('../src/web-ui/utils/artefact-labels');
assert.strictEqual(labels.getLabel('dor'), 'Ready Check');
assert.strictEqual(labels.getLabel('benefit-metric'), 'Benefit Metric');
assert.strictEqual(labels.getLabel('test-plan'), 'Test Plan');
assert.strictEqual(labels.getLabel('discovery'), 'Discovery');
```

---

### T16 — Unit: artefact-labels.js unknown type returns fallback

**AC:** AC3
**Type:** Unit

```
const label = labels.getLabel('unknown-type');
assert(typeof label === 'string' && label.length > 0, 'fallback not empty');
```

---

### T17 — Integration: HTML — audit log written with featureSlug

**AC:** NFR audit
**Type:** HTTP integration

```
GET /features/2026-04-01-test-feature Accept: text/html

Expected:
  Audit log called with { userId, route: '/features/:slug', featureSlug: '2026-04-01-test-feature', timestamp }
```

---

## Gap table

| Gap | AC | Severity | Reason | Mitigation |
|-----|----|----------|--------|------------|
| No layout-dependent ACs | — | — | Pure content/data rendering | None |

---

## Test coverage map

| AC | Tests |
|----|-------|
| AC1 | T1, T2, T3, T13, T14 |
| AC2 | T8, T9 |
| AC3 | T4, T5, T6, T7, T15, T16 |
| AC4 | T10 |
| AC5 | T11 |
| AC6 | T12 |
