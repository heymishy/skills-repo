# DoR Contract — wsm.3: Non-happy path navigation

**Story:** wsm.3
**DoR reference:** artefacts/2026-05-07-web-ui-session-management/dor/wsm.3-dor.md
**Date:** 2026-05-08

---

## Required Touchpoints

| File | Change type | Notes |
|------|-------------|-------|
| `src/web-ui/routes/journey.js` | Modify | Extend GET response with breadcrumb; add GET `/stages/:stageName`; add POST `/stages/:stageName/recommit`. |
| `src/web-ui/server.js` | Modify | Wire new endpoints. Inject session-boundary marker in startup restore loop. |

## Schema Dependencies

`schemaDepends: []` — no pipeline-state.schema.json fields touched.

## Key architecture constraints

- **Session-boundary marker is transient.** It is injected into the in-memory active stage's turns array at startup restore time. It is NOT written to the session file. If the server restarts again, it is injected again.
- **needs-review is persistent.** Written to disk via `_sessionStore.write()` as part of the recommit response cycle.
- **Recommit confirmation guard:** `{ confirmed: true }` required in request body. Return 400 if absent — no state change.
- **needs-review clearing:** only the re-committed stage's own needs-review is cleared when it advances. Downstream stages remain flagged until they are individually re-committed and advanced.
- **Dependency gate:** wsm.1 must be merged. If `src/web-ui/adapters/session-store.js` does not exist, the agent must add a PR comment and stop.

## Out of Scope (MUST NOT touch)

- Any HTML template or frontend files
- Bulk clearing of needs-review flags
- Turn content editing
- Stage deletion
- Any test files
- Any files under `artefacts/`

## Commit message convention

```
feat(wsm.3): non-happy path — breadcrumb, stage view, recommit, needs-review, session boundary
```

## PR checklist

- [ ] `node tests/check-wsm3-non-happy-path.js` → all tests pass
- [ ] `npm test` → 0 failures
- [ ] `src/web-ui/adapters/session-store.js` exists (wsm.1 dependency)
- [ ] Draft PR opened — not marked ready for review
