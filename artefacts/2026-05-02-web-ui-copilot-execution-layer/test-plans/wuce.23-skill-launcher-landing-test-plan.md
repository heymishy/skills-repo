# Test Plan: Skill launcher landing

**Story:** wuce.23 — Skill launcher landing
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Test file:** `tests/check-wuce23-skill-launcher-landing.js`
**Total tests:** 16
**Passing at plan-write time:** 0 (tests written to fail — TDD)
**Review artefact:** review/wuce.23-skill-launcher-landing-review-1.md

---

## Test data strategy

Mock `listSkills(token)` returns:
```js
[
  { name: 'discovery', description: 'Structures a raw idea into a discovery artefact.' },
  { name: 'test-plan', description: 'Writes a failing test plan for a reviewed story.' }
]
```
XSS test uses `description: '<img onerror=alert(1)>'`. POST tests use `name: 'discovery'`. All HTTP tests use `NODE_ENV=test` auth bypass. Mock `createSession(skillName, token)` returns `{ id: 'sess-abc123' }`.

---

## Tests

### T1 — Integration: GET /skills → 200 HTML with skill list

**AC:** AC1
**Type:** HTTP integration

```
GET /skills (authenticated)

Expected:
  Status: 200
  Content-Type: text/html; charset=utf-8
  Body includes: <!doctype html
  Body includes: <nav aria-label="Main navigation">
```

---

### T2 — Integration: GET /skills — skill names displayed

**AC:** AC1
**Type:** HTTP integration

```
Body includes: discovery
Body includes: test-plan
```

---

### T3 — Integration: GET /skills — skill descriptions displayed

**AC:** AC1
**Type:** HTTP integration

```
Body includes: Structures a raw idea into a discovery artefact.
Body includes: Writes a failing test plan
```

---

### T4 — Integration: GET /skills — one "Start" button per skill

**AC:** AC1
**Type:** HTTP integration

```
Body includes: Start  (at least twice for 2 skills)
```

---

### T5 — Integration: GET /skills — form action correct per skill

**AC:** AC1, AC2
**Type:** HTTP integration

```
Body includes: action="/api/skills/discovery/sessions"
Body includes: action="/api/skills/test-plan/sessions"
```

---

### T6 — Integration: GET /skills — forms use method POST

**AC:** AC2
**Type:** HTTP integration

```
Body includes: method="POST"
```

---

### T7 — Integration: POST /api/skills/:name/sessions → 303 to session URL

**AC:** AC2
**Type:** HTTP integration

```
POST /api/skills/discovery/sessions (authenticated)

Expected:
  Status: 303
  Location: /skills/discovery/sessions/sess-abc123
```

---

### T8 — Integration: POST /api/skills/:name/sessions non-2xx → HTML error page

**AC:** AC3
**Type:** HTTP integration (createSession throws/returns error)

```
Expected:
  Status: 4xx or 5xx
  Content-Type: text/html; charset=utf-8
  Body includes: <nav aria-label="Main navigation">  (renderShell used)
  Body does NOT include: {"error":  (no raw JSON in response)
```

---

### T9 — Integration: GET /skills — XSS in description escaped

**AC:** AC4
**Type:** HTTP integration (description: '<img onerror=alert(1)>')

```
Body does NOT include: <img onerror=
Body includes: &lt;img onerror=
```

---

### T10 — Integration: GET /skills — XSS in skill name escaped

**AC:** AC4
**Type:** HTTP integration (name: '<b>hack</b>')

```
Body does NOT include: <b>hack</b>
Body includes: &lt;b&gt;hack&lt;/b&gt;
```

---

### T11 — Integration: GET /skills unauthenticated → 302

**AC:** AC5
**Type:** HTTP integration (no session)

```
Expected:
  Status: 302
  Location: /auth/github
```

---

### T12 — Integration: POST /api/skills/:name/sessions unauthenticated → 302

**AC:** AC5
**Type:** HTTP integration (no session)

```
Expected:
  Status: 302
```

---

### T13 — Integration: GET /dashboard nav "Run a Skill" points to /skills

**AC:** AC6
**Type:** HTTP integration

```
GET /dashboard Accept: text/html (authenticated)

Expected:
  Body includes: href="/skills"
```

---

### T14 — Integration: GET /skills — form requires no JavaScript

**AC:** AC2 / NFR
**Type:** HTTP integration — structural

```
Body does NOT include: onclick=
Body does NOT include: addEventListener
Body does NOT include: <script  inside form elements
Form action/method attributes present on <form> element
```

---

### T15 — Integration: GET /skills audit log written

**AC:** NFR audit
**Type:** HTTP integration

```
Audit log called with { userId, route: '/skills', timestamp }
```

---

### T16 — Integration: handleGetSkillsHtml is separate handler from JSON handler (ADR-009)

**AC:** NFR / ADR-009
**Type:** Static analysis / grep

```
grep "handleGetSkillsHtml" src/web-ui/routes/skills.js returns one export
JSON handler and HTML handler are distinct exported functions
```

---

## Gap table

| Gap | AC | Severity | Reason | Mitigation |
|-----|----|----------|--------|------------|
| No E2E needed | — | — | No CSS/layout dependencies | None |

---

## Test coverage map

| AC | Tests |
|----|-------|
| AC1 | T1, T2, T3, T4 |
| AC2 | T5, T6, T7, T14 |
| AC3 | T8 |
| AC4 | T9, T10 |
| AC5 | T11, T12 |
| AC6 | T13 |
