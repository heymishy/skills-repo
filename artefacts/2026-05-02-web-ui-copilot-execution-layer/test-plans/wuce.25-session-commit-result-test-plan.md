# Test Plan: Session commit result

**Story:** wuce.25 — Session commit result
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Test file:** `tests/check-wuce25-session-commit-result.js`
**Total tests:** 20
**Passing at plan-write time:** 0 (tests written to fail — TDD)
**Review artefact:** review/wuce.25-session-commit-result-review-1.md

---

## Test data strategy

Mock `getCommitPreview(skillName, sessionId, token)` returns:
```js
{
  artefactContent: '# Discovery\n\nThis is the generated artefact content.\n',
  artefactPath: 'artefacts/2026-05-03-my-feature/discovery.md',
  featureSlug: '2026-05-03-my-feature',
  artefactType: 'discovery'
}
```

Mock `commitSession(skillName, sessionId, token)`:
- Standard path: returns `{ artefactPath: 'artefacts/2026-05-03-my-feature/discovery.md', featureSlug: '2026-05-03-my-feature', artefactType: 'discovery' }`
- Double-commit (409): throws with status 409

Mock `getCommitResult(skillName, sessionId, token)` returns same shape as commitSession success.

All HTTP tests use `NODE_ENV=test` auth bypass. Session ID `sess-abc123`.

---

## Tests

### T1 — Integration: GET /skills/:name/sessions/:id/commit-preview → 200 HTML

**AC:** AC1
**Type:** HTTP integration

```
GET /skills/discovery/sessions/sess-abc123/commit-preview (authenticated)

Expected:
  Status: 200
  Content-Type: text/html; charset=utf-8
  Body includes: <!doctype html
  Body includes: <nav aria-label="Main navigation">
```

---

### T2 — Integration: commit-preview — artefact content in <pre>

**AC:** AC1
**Type:** HTTP integration

```
Body includes: <pre
Body includes: This is the generated artefact content.
```

---

### T3 — Integration: commit-preview — <pre> has role="region" and aria-label

**AC:** AC1 / WCAG
**Type:** HTTP integration

```
Body includes: role="region"
Body includes: aria-label=  (on or near the pre element)
```

---

### T4 — Integration: commit-preview — commit form present

**AC:** AC2
**Type:** HTTP integration

```
Body includes: <form
Body includes: action="/api/skills/discovery/sessions/sess-abc123/commit"
Body includes: method="POST"
Body includes: <button type="submit"
```

---

### T5 — Integration: POST /api/skills/:name/sessions/:id/commit → 303 to result URL

**AC:** AC2
**Type:** HTTP integration

```
POST /api/skills/discovery/sessions/sess-abc123/commit (authenticated)

Expected:
  Status: 303
  Location: /skills/discovery/sessions/sess-abc123/result
```

---

### T6 — Integration: GET /skills/:name/sessions/:id/result → 200 result page

**AC:** AC3
**Type:** HTTP integration

```
GET /skills/discovery/sessions/sess-abc123/result (authenticated)

Expected:
  Status: 200
  Content-Type: text/html; charset=utf-8
```

---

### T7 — Integration: result page — success message displayed

**AC:** AC3
**Type:** HTTP integration

```
Body includes: success (or "committed", "complete", "done" — success-conveying text)
```

---

### T8 — Integration: result page — artefact path displayed

**AC:** AC3
**Type:** HTTP integration

```
Body includes: artefacts/2026-05-03-my-feature/discovery.md
```

---

### T9 — Integration: result page — link to /artefact/:slug/:type

**AC:** AC3
**Type:** HTTP integration

```
Body includes: href="/artefact/2026-05-03-my-feature/discovery"
```

---

### T10 — Integration: result page — link back to /features

**AC:** AC3
**Type:** HTTP integration

```
Body includes: href="/features"
```

---

### T11 — Integration: POST commit double-commit (409) → HTML informative page

**AC:** AC4
**Type:** HTTP integration (commitSession throws 409)

```
POST /api/skills/discovery/sessions/sess-abc123/commit

Expected:
  Status: 409
  Content-Type: text/html; charset=utf-8
  Body includes: <nav aria-label="Main navigation">
  Body includes informative message (e.g. "already committed" or "session already complete")
  Body does NOT include: {"error":
```

---

### T12 — Integration: GET commit-preview with unknown session → 404 HTML

**AC:** AC7
**Type:** HTTP integration (getCommitPreview throws 404)

```
GET /skills/discovery/sessions/unknown-sess/commit-preview

Expected:
  Status: 404
  Content-Type: text/html; charset=utf-8
  Body includes: <nav aria-label="Main navigation">
  Body does NOT include: {"error":
```

---

### T13 — Integration: GET result with unknown session → 404 HTML

**AC:** AC7
**Type:** HTTP integration

```
GET /skills/discovery/sessions/unknown-sess/result

Expected:
  Status: 404
  Content-Type: text/html; charset=utf-8
  Body does NOT include: {"error":
```

---

### T14 — Integration: POST commit with unknown session → 404 HTML

**AC:** AC7
**Type:** HTTP integration

```
POST /api/skills/discovery/sessions/unknown-sess/commit

Expected:
  Status: 404
  Content-Type: text/html; charset=utf-8
  Body does NOT include: {"error":
```

---

### T15 — Integration: XSS in artefact content escaped in <pre>

**AC:** AC5
**Type:** HTTP integration (artefactContent: '<script>alert(1)</script>')

```
Body does NOT include: <script>alert(1)</script> (unescaped in pre)
Body includes: &lt;script&gt;
```

---

### T16 — Integration: XSS in artefact path escaped

**AC:** AC5
**Type:** HTTP integration (artefactPath: 'artefacts/<b>hack</b>/discovery.md')

```
Body does NOT include: <b>hack</b>
Body includes: &lt;b&gt;hack&lt;/b&gt;
```

---

### T17 — Integration: GET commit-preview unauthenticated → 302

**AC:** AC6 / authGuard
**Type:** HTTP integration (no session)

```
Expected:
  Status: 302
  Location: /auth/github
```

---

### T18 — Integration: POST commit unauthenticated → 302

**AC:** AC6 / authGuard
**Type:** HTTP integration (no session)

```
Expected:
  Status: 302
```

---

### T19 — Integration: handleGetCommitPreviewHtml and handlePostCommitHtml are named exports

**AC:** NFR / ADR-009
**Type:** Static analysis

```
grep "handleGetCommitPreviewHtml\|handlePostCommitHtml" src/web-ui/routes/skills.js
Returns two distinct export declarations
```

---

### T20 — Integration: audit log written on POST commit

**AC:** NFR audit
**Type:** HTTP integration

```
Audit log called with { userId, route: '/api/skills/:name/sessions/:id/commit', skillName: 'discovery', sessionId: 'sess-abc123', artefactPath, timestamp }
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
| AC1 | T1, T2, T3 |
| AC2 | T4, T5 |
| AC3 | T6, T7, T8, T9, T10 |
| AC4 | T11 |
| AC5 | T15, T16 |
| AC6 | T17, T18 |
| AC7 | T12, T13, T14 |
