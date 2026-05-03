# Test Plan: Status board HTML view

**Story:** wuce.22 — Status board HTML view
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Test file:** `tests/check-wuce22-status-board-html.js`
**Total tests:** 16
**Passing at plan-write time:** 0 (tests written to fail — TDD)
**Review artefact:** review/wuce.22-status-board-html-view-review-1.md

---

## Test data strategy

Mock `getPipelineStatus(token)` returns:
```js
{
  features: [
    { slug: '2026-04-01-my-feature', phase: 'definition', health: 'green', blockers: [] },
    { slug: '2026-04-02-blocked', phase: 'test-plan', health: 'red', blockers: ['Missing test plan'] }
  ]
}
```
XSS test uses `slug: '<script>'` or `phase: '<b>phase</b>'`. All tests use `NODE_ENV=test` auth bypass.

---

## Tests

### T1 — Integration: GET /status Accept: text/html → 200 HTML

**AC:** AC1
**Type:** HTTP integration

```
GET /status Accept: text/html (authenticated)

Expected:
  Status: 200
  Content-Type: text/html; charset=utf-8
  Body includes: <!doctype html
  Body includes: <nav aria-label="Main navigation">
```

---

### T2 — Integration: HTML — feature slugs displayed in status board

**AC:** AC1
**Type:** HTTP integration

```
Body includes: 2026-04-01-my-feature
Body includes: 2026-04-02-blocked
```

---

### T3 — Integration: HTML — phase displayed per feature

**AC:** AC1
**Type:** HTTP integration

```
Body includes: definition
Body includes: test-plan
```

---

### T4 — Integration: HTML — health/blocker information displayed

**AC:** AC1
**Type:** HTTP integration

```
Body includes: Missing test plan  (blocker text from second feature)
```

---

### T5 — Integration: HTML — colour health indicator accompanied by text label

**AC:** AC3
**Type:** HTTP integration

For feature with `health: 'red'`:
```
Body includes a text label such as "Blocked" or "At risk"
Body does NOT rely on colour alone (text label present regardless of colour class)
```

---

### T6 — Integration: HTML — "In progress" or "On track" text for green health

**AC:** AC3
**Type:** HTTP integration

For feature with `health: 'green'`:
```
Body includes text label such as "On track" or "In progress"
```

---

### T7 — Integration: GET /status Accept: application/json → JSON unchanged

**AC:** AC2
**Type:** HTTP integration

```
GET /status Accept: application/json

Expected:
  Status: 200
  Content-Type: application/json
  Body parses with features array
```

---

### T8 — Integration: GET /status no Accept header → JSON unchanged

**AC:** AC2
**Type:** HTTP integration

```
GET /status (no Accept header)

Expected:
  Status: 200
  Content-Type: application/json
```

---

### T9 — Integration: GET /status HTML — XSS in feature slug escaped

**AC:** AC4
**Type:** HTTP integration (slug: '<script>alert(1)</script>')

```
Body does NOT include: <script>alert(1)</script>
Body includes: &lt;script&gt;
```

---

### T10 — Integration: GET /status HTML — XSS in phase label escaped

**AC:** AC4
**Type:** HTTP integration (phase: '<b>phase</b>')

```
Body does NOT include: <b>phase</b>
Body includes: &lt;b&gt;phase&lt;/b&gt;
```

---

### T11 — Integration: GET /status unauthenticated Accept: text/html → 302

**AC:** AC5
**Type:** HTTP integration (no session)

```
Expected:
  Status: 302
  Location: /auth/github
```

---

### T12 — Integration: GET /status/export unchanged after wuce.22

**AC:** AC6
**Type:** HTTP integration

```
GET /status/export (authenticated)

Expected:
  Status: 200
  Response identical in shape to pre-wuce.22 (same fields, same content-type)
```

---

### T13 — Integration: GET /status/export unauthenticated → 302

**AC:** AC6 / regression
**Type:** HTTP integration

```
GET /status/export (no session)
Expected: 302
```

---

### T14 — Integration: renderStatusBoard used (not rewritten inline)

**AC:** AC1 / NFR
**Type:** HTTP integration — adapter call spy

```
renderStatusBoard called exactly once with the status data during GET /status text/html
```

---

### T15 — Integration: GET /status HTML — audit log written

**AC:** NFR audit
**Type:** HTTP integration

```
Audit log called with { userId, route: '/status', timestamp }
```

---

### T16 — Integration: GET /status HTML — no extra API round-trip

**AC:** NFR performance
**Type:** HTTP integration — adapter call count spy

```
getPipelineStatus called exactly once
```

---

## Gap table

| Gap | AC | Severity | Reason | Mitigation |
|-----|----|----------|--------|------------|
| No layout-dependent ACs | — | — | — | None |
| Colour rendering not assertable in jsdom | AC3 | LOW | Text label presence covers WCAG requirement; colour is visual enhancement only | T5, T6 assert text labels |

---

## Test coverage map

| AC | Tests |
|----|-------|
| AC1 | T1, T2, T3, T4, T14 |
| AC2 | T7, T8 |
| AC3 | T5, T6 |
| AC4 | T9, T10 |
| AC5 | T11 |
| AC6 | T12, T13 |
