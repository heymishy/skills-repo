# Test Plan: Action queue HTML view

**Story:** wuce.21 — Action queue HTML view
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Test file:** `tests/check-wuce21-action-queue-html.js`
**Total tests:** 16
**Passing at plan-write time:** 0 (tests written to fail — TDD)
**Review artefact:** review/wuce.21-action-queue-html-view-review-1.md

---

## Test data strategy

Mock `getPendingActions(userIdentity, token)` returns:
```js
[
  { id: 'a1', title: 'Review wuce.18 DoR', feature: '2026-05-02-web-ui', actionType: 'Sign-off required', artefactPath: 'artefacts/wuce/dor/wuce.18-dor.md' },
  { id: 'a2', title: 'Check test plan', feature: '2026-05-01-auth', actionType: 'Review requested', artefactPath: 'artefacts/auth/test-plans/auth-test-plan.md' }
]
```
Empty state test uses `getPendingActions()` returning `[]`. XSS test uses `title: '<img onerror=alert(1)>'`. All HTTP tests use `NODE_ENV=test` auth bypass.

---

## Tests

### T1 — Integration: GET /actions → 200 with HTML shell

**AC:** AC1
**Type:** HTTP integration

```
GET /actions (authenticated)

Expected:
  Status: 200
  Content-Type: text/html; charset=utf-8
  Body includes: <nav aria-label="Main navigation">
```

---

### T2 — Integration: GET /actions — action title displayed per item

**AC:** AC1
**Type:** HTTP integration

```
Body includes: Review wuce.18 DoR
Body includes: Check test plan
```

---

### T3 — Integration: GET /actions — feature slug displayed per item

**AC:** AC1
**Type:** HTTP integration

```
Body includes: 2026-05-02-web-ui
Body includes: 2026-05-01-auth
```

---

### T4 — Integration: GET /actions — action type label displayed

**AC:** AC1
**Type:** HTTP integration

```
Body includes: Sign-off required
Body includes: Review requested
```

---

### T5 — Integration: GET /actions — link to artefact per item

**AC:** AC1
**Type:** HTTP integration

```
Body includes: href="/artefact/  (or direct link to artefactPath)
```

---

### T6 — Integration: GET /actions empty queue → empty-state message

**AC:** AC2
**Type:** HTTP integration (getPendingActions returns [])

```
Expected:
  Status: 200
  Body includes: No pending actions (or equivalent)
  Body does NOT include: <ul  (no empty list rendered)
```

---

### T7 — Integration: GET /api/actions → JSON unchanged after wuce.21

**AC:** AC3
**Type:** HTTP integration

```
GET /api/actions (authenticated)

Expected:
  Status: 200
  Content-Type: application/json
  Body parses as array
```

---

### T8 — Integration: GET /api/actions not affected by GET /actions addition

**AC:** AC3
**Type:** HTTP integration — route isolation

```
GET /api/actions and GET /actions are distinct routes
GET /api/actions returns JSON
GET /actions returns HTML
Both return 200 for authenticated user
```

---

### T9 — Integration: GET /actions XSS in action title escaped

**AC:** AC4
**Type:** HTTP integration (title: '<img onerror=alert(1)>')

```
Body does NOT include: <img onerror=
Body includes: &lt;img onerror=
```

---

### T10 — Integration: GET /actions XSS in feature slug escaped

**AC:** AC4
**Type:** HTTP integration (feature: '<b>hack</b>')

```
Body does NOT include: <b>hack</b>
Body includes: &lt;b&gt;hack&lt;/b&gt;
```

---

### T11 — Integration: GET /actions unauthenticated → 302

**AC:** AC5
**Type:** HTTP integration (no session)

```
Expected:
  Status: 302
  Location: /auth/github
```

---

### T12 — Integration: GET /dashboard nav "Actions" link points to /actions

**AC:** AC6
**Type:** HTTP integration

```
GET /dashboard Accept: text/html (authenticated)

Expected:
  Body includes: href="/actions"
  Body does NOT include: href="/api/actions"
```

---

### T13 — Integration: GET /actions audit log written

**AC:** NFR audit
**Type:** HTTP integration

```
Expected:
  Audit log called with { userId, route: '/actions', timestamp }
```

---

### T14 — Integration: GET /actions — link text is descriptive (not just "view")

**AC:** NFR accessibility
**Type:** HTTP integration

```
Each action link includes the action title or "View [title]" — not bare "view" or "click here"
```

---

### T15 — Integration: GET /actions — list uses ul/li structure

**AC:** AC1 / NFR accessibility
**Type:** HTTP integration

```
Body includes: <ul
Body includes: <li
```

---

### T16 — Integration: GET /api/actions still requires auth

**AC:** AC3 / NFR regression
**Type:** HTTP integration (no session)

```
GET /api/actions (no auth)
Expected:
  Status: 302
```

---

## Gap table

| Gap | AC | Severity | Reason | Mitigation |
|-----|----|----------|--------|------------|
| No layout-dependent ACs | — | — | — | None |

---

## Test coverage map

| AC | Tests |
|----|-------|
| AC1 | T1, T2, T3, T4, T5, T15 |
| AC2 | T6 |
| AC3 | T7, T8, T16 |
| AC4 | T9, T10 |
| AC5 | T11 |
| AC6 | T12 |
