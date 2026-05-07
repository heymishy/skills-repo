# DoR Contract — wsm.2: Collaborative sessions

**Story:** wsm.2
**DoR reference:** artefacts/2026-05-07-web-ui-session-management/dor/wsm.2-dor.md
**Date:** 2026-05-08

---

## Required Touchpoints

| File | Change type | Notes |
|------|-------------|-------|
| `src/web-ui/routes/journey.js` | Modify | Add auth check on GET; ownership check on POST turn; viewer sync endpoint; user count tracking; concurrent turn guard; idle detection. |
| `src/web-ui/server.js` | Modify | Wire viewer sync endpoint (`GET /api/journey/:id/events` or `/poll`). |

## Schema Dependencies

`schemaDepends: []` — no pipeline-state.schema.json fields touched.

## Key architecture constraints

- **ownerId from session:** `journey.ownerId` is set at creation from `req.session.login`. Never accepted from request body. T8 asserts a spoofed body ownerId is ignored.
- **Auth check:** All journey endpoints require `req.session.login` to be set. No exceptions.
- **Concurrency guard:** `journey.turnInProgress` boolean. Set to `true` at start of turn handler, cleared in a `finally` block. 409 if already `true` when request arrives.
- **Dependency gate:** wsm.1 must be merged. If `src/web-ui/adapters/session-store.js` does not exist, the agent must add a PR comment and stop.

## Out of Scope (MUST NOT touch)

- Per-user turn history
- Access control lists or invitation mechanisms
- Any HTML template or frontend files
- Any test files
- Any files under `artefacts/`

## Commit message convention

```
feat(wsm.2): collaborative sessions — ownership check, viewer sync, concurrency guard, idle
```

## PR checklist

- [ ] `node tests/check-wsm2-collaborative-sessions.js` → all tests pass
- [ ] `npm test` → 0 failures
- [ ] `src/web-ui/adapters/session-store.js` exists (wsm.1 dependency)
- [ ] Draft PR opened — not marked ready for review
