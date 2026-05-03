# Test Plan: Feature list HTML view

**Story:** wuce.19 — Feature list HTML view
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Test file:** `tests/check-wuce19-feature-list-html.js`
**Total tests:** 16
**Passing at plan-write time:** 0 (tests written to fail — TDD)
**Review artefact:** review/wuce.19-feature-list-html-view-review-1.md

---

## Test data strategy

Mock `listFeatures(token)` returns a fixed array of 2 features:
```js
[
  { slug: '2026-04-01-my-feature', stage: 'definition', updatedAt: '2026-04-01' },
  { slug: '2026-04-02-other-feature', stage: 'test-plan', updatedAt: '2026-04-02' }
]
```
XSS test uses `stage: '<b>bad</b>'`. Empty state test uses `listFeatures()` returning `[]`. All HTTP integration tests use `NODE_ENV=test` auth bypass with mock session.

---

## Tests

### T1 — Integration: GET /features Accept: text/html → 200 with HTML shell

**AC:** AC1
**Type:** HTTP integration

```
GET /features
Accept: text/html

Expected:
  Status: 200
  Content-Type: text/html; charset=utf-8
  Body includes: <!doctype html
  Body includes: <nav aria-label="Main navigation">
```

---

### T2 — Integration: GET /features HTML — <ul> present with one <li> per feature

**AC:** AC1
**Type:** HTTP integration

```
GET /features Accept: text/html (2 features in mock)

Expected:
  Body includes: <ul
  Count of <li occurrences: ≥ 2
```

---

### T3 — Integration: GET /features HTML — feature slug in each item

**AC:** AC1
**Type:** HTTP integration

```
Expected:
  Body includes: 2026-04-01-my-feature
  Body includes: 2026-04-02-other-feature
```

---

### T4 — Integration: GET /features HTML — stage displayed per item

**AC:** AC1
**Type:** HTTP integration

```
Expected:
  Body includes: definition
  Body includes: test-plan
```

---

### T5 — Integration: GET /features HTML — link to /features/:slug per item

**AC:** AC1
**Type:** HTTP integration

```
Expected:
  Body includes: href="/features/2026-04-01-my-feature"
  Body includes: href="/features/2026-04-02-other-feature"
```

---

### T6 — Integration: GET /features Accept: application/json → JSON unchanged

**AC:** AC2
**Type:** HTTP integration

```
GET /features
Accept: application/json

Expected:
  Status: 200
  Content-Type: application/json
  Body parses as array with slug field
```

---

### T7 — Integration: GET /features no Accept header → JSON unchanged

**AC:** AC2
**Type:** HTTP integration

```
GET /features (no Accept header)

Expected:
  Status: 200
  Content-Type: application/json
```

---

### T8 — Integration: GET /features empty features → HTML with empty-state message

**AC:** AC3
**Type:** HTTP integration (listFeatures returns [])

```
GET /features Accept: text/html

Expected:
  Status: 200
  Body includes: No features found (or equivalent empty-state message)
  Body does NOT include: <ul  (or empty ul — no children)
```

---

### T9 — Integration: GET /features HTML — XSS in stage value escaped

**AC:** AC4
**Type:** HTTP integration (stage: '<b>bad</b>')

```
GET /features Accept: text/html

Expected:
  Body does NOT include: <b>bad</b>
  Body includes: &lt;b&gt;bad&lt;/b&gt;
```

---

### T10 — Integration: GET /features unauthenticated Accept: text/html → 302

**AC:** AC5
**Type:** HTTP integration (no session cookie)

```
GET /features Accept: text/html (no auth)

Expected:
  Status: 302
  Location: /auth/github
```

---

### T11 — Integration: GET /features unauthenticated Accept: application/json → 302

**AC:** AC5
**Type:** HTTP integration (regression — authGuard applies to all paths)

```
GET /features Accept: application/json (no auth)

Expected:
  Status: 302
  Location: /auth/github
```

---

### T12 — Integration: GET /features HTML — date displayed per item

**AC:** AC1
**Type:** HTTP integration

```
Expected:
  Body includes: 2026-04-01
```

---

### T13 — Integration: GET /features HTML — audit log written

**AC:** AC1 / NFR audit
**Type:** HTTP integration

With audit log spy:
```
GET /features Accept: text/html

Expected:
  Audit log called with { userId, route: '/features', timestamp }
```

---

### T14 — Integration: GET /features HTML — no extra API round-trip

**AC:** NFR performance
**Type:** HTTP integration — adapter call count spy

```
listFeatures called exactly once during GET /features Accept: text/html
```

---

### T15 — Integration: GET /features HTML — renderShell wraps output

**AC:** AC1
**Type:** HTTP integration — structural

```
Body includes: <nav aria-label="Main navigation">
(confirms renderShell called, not raw feature list)
```

---

### T16 — Integration: GET /features HTML — special chars in slug escaped

**AC:** AC4
**Type:** HTTP integration (slug: 'feat-<test>')

```
Body does NOT include: feat-<test>
Body includes: feat-&lt;test&gt;
```

---

## Gap table

| Gap | AC | Severity | Reason | Mitigation |
|-----|----|----------|--------|------------|
| No layout-dependent ACs | — | — | No CSS rendering assertions needed | None |

---

## Test coverage map

| AC | Tests |
|----|-------|
| AC1 | T1, T2, T3, T4, T5, T12, T15 |
| AC2 | T6, T7 |
| AC3 | T8 |
| AC4 | T9, T16 |
| AC5 | T10, T11 |
