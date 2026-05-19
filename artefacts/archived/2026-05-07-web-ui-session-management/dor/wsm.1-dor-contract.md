# DoR Contract — wsm.1: Session persistence

**Story:** wsm.1
**DoR reference:** artefacts/2026-05-07-web-ui-session-management/dor/wsm.1-dor.md
**Date:** 2026-05-08

---

## Required Touchpoints

| File | Change type | Notes |
|------|-------------|-------|
| `src/web-ui/routes/journey.js` | Modify | Add `_sessionStore` injectable (default throws), `setSessionStore(fn)` export, mutation write hooks after every state-mutating operation. |
| `src/web-ui/routes/skills.js` | Modify | Add mutation write hooks after every session state-mutating operation (turn append, session done, etc.). |
| `src/web-ui/adapters/session-store.js` | Create | Real implementation: read/write/list operations, accessToken exclusion in serialiser, directory auto-create. |
| `src/web-ui/server.js` | Modify | Wire `setSessionStore(require('./adapters/session-store'))`. Add startup restore call. Add `NODE_ENV=test` in-memory stub. Add stale session cleanup. |

## Schema Dependencies

`schemaDepends: []` — no pipeline-state.schema.json fields touched.

## Key architecture constraints

- **accessToken exclusion MUST be in the adapter serialiser** (not in individual route handlers). The serialiser deletes `data.accessToken` before `JSON.stringify`. This is the security boundary.
- **D37 three conditions:** (1) stub throws; (2) AC6 scopes production wiring explicitly; (3) adapter wiring in server.js is a separate task from hook insertion.
- **Write failure is non-fatal:** `try/catch` in adapter `write()` method; logs ERROR, does not rethrow. The mutation in memory completes normally.
- **Startup restore runs before `server.listen()`.**
- **`lastUpdated` field** is written by the adapter on every write (used for stale cleanup).

## Out of Scope (MUST NOT touch)

- Any HTML template or frontend files
- Encrypting session data at rest
- Any test files
- Any files under `artefacts/`

## Commit message convention

```
feat(wsm.1): session persistence — injectable store, accessToken exclusion, startup restore
```

## PR checklist

- [ ] `node tests/check-wsm1-session-persistence.js` → all tests pass
- [ ] `npm test` → 0 failures
- [ ] Draft PR opened — not marked ready for review
