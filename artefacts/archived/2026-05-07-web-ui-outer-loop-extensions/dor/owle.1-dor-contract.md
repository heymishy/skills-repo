# DoR Contract — owle.1: Clarify side-trip

**Story:** owle.1
**DoR reference:** artefacts/2026-05-07-web-ui-outer-loop-extensions/dor/owle.1-dor.md
**Date:** 2026-05-08

---

## Required Touchpoints

| File | Change type | Notes |
|------|-------------|-------|
| `src/web-ui/routes/journey.js` | Modify | Add `handlePostClarifySideTrip`, `handleDeleteSideTrip` handlers and `clarifyAvailable` logic in stage-controls. |
| `src/web-ui/server.js` | Modify | Wire `POST /api/journey/:id/side-trip/clarify` and `DELETE /api/journey/:id/side-trip`. |

## Schema Dependencies

`schemaDepends: []` — no pipeline-state.schema.json fields touched. Upstream ougl.1–7 are code dependencies only.

## Key architecture constraints

- `parentJourneyId` is set on the side-trip session server-side only. Never returned to the client or derived from client input.
- Feature slug used to locate discovery.md comes from `req.journeySession.featureSlug` — not from the request URL or body.
- Path traversal guard: `path.resolve(repoRoot, slug, 'discovery.md').startsWith(repoRoot)` before any `fs.readFileSync`.
- Stage-controls flag `clarifyAvailable` is derived from `journey.currentStage === 'discovery'` — not sent to the client as a trust signal.

## Out of Scope (MUST NOT touch)

- `src/web-ui/routes/skills.js` — read for reference only, do not modify
- Any files under `artefacts/`
- `.github/skills/clarify/SKILL.md`
- Any test files

## Commit message convention

```
feat(owle.1): clarify side-trip — stage-controls flag, session link, path guard
```

## PR checklist

- [ ] `node tests/check-owle1-clarify-side-trip.js` → all tests pass
- [ ] `npm test` → 0 failures
- [ ] Draft PR opened — not marked ready for review
