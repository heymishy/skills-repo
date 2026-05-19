# DoR Contract — ougl.5: Gate-confirm handler for feature stages

**Story:** ougl.5
**DoR reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/dor/ougl-5-dor.md
**Date:** 2026-05-14

---

## Required Touchpoints

| File | Change type | Notes |
|------|-------------|-------|
| `src/web-ui/routes/journey.js` | Modify | Add `handlePostGateConfirm` handler and `setRepoRoot` test-isolation export. |
| `src/web-ui/server.js` | Modify | Wire `POST /api/journey/:journeyId/gate-confirm` → `handlePostGateConfirm`. |

## Schema Dependencies

`schemaDepends: []` — no pipeline-state.schema.json fields. Upstream dependencies (ougl.1–4) are code dependencies only.

## Key architecture constraint — `_getRepoPath` is NOT exported

`_getRepoPath()` is defined at line 56 of `src/web-ui/routes/skills.js` but is NOT in `module.exports`. Importing it from `journey.js` will fail at runtime. The repo root MUST be derived as:
```js
const repoRoot = path.resolve(__dirname, '../../..');
```
This is architecturally equivalent and tested with the `os.tmpdir()` injection pattern in T5.x tests.

## Path traversal guard (mandatory)

```js
const resolvedPath = path.resolve(repoRoot, session.artefactPath);
if (!resolvedPath.startsWith(path.resolve(repoRoot))) {
  return res.status(400).json({ error: 'invalid artefact path' });
}
```
Must execute BEFORE any `fs.writeFileSync` call.

## Out of Scope (MUST NOT touch)

- `src/web-ui/routes/skills.js`
- GitHub API integration (no commit to GitHub)
- Content editing within the gate-confirm flow
- Per-story routing branches (ougl.6 handles `review → test-plan` and story-mode)
- Any test files
- Any artefact files under `artefacts/`

## Commit message convention

```
feat(ougl.5): gate-confirm handler — write artefact, handoff context, stage advance
```

## PR checklist

- [ ] `node tests/check-ougl5-gate-confirm-feature-stages.js` → 12/12 pass
- [ ] `npm test` → 0 failures
- [ ] Draft PR opened — not marked ready for review
