# DoR Contract Proposal: Resolve journey.js's local artefact writes to the product's own repo

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s2.4.md

## What will be built

`journey.js`'s artefact-write call sites converted from `fs.writeFileSync` to the same Contents/Git Data API mechanism `prc-s2.2`'s bootstrap uses — one commit per named artefact file. The existing Postgres backup write (`journey-store-pg.js`'s `saveArtefact`) stays unchanged, running alongside the new git write. Session initiation is blocked upfront if the product has no repo configured.

## What will NOT be built

`journey.js`'s read-side logic — write-side only. Migration of already-in-flight sessions at deploy time.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Skill-run fixture, assert Contents API commit, zero fs.writeFileSync for the artefact path | Integration |
| AC2 | Same fixture, assert saveArtefact still called alongside | Integration |
| AC3 | Product with no repo, assert session rejected before start | Integration |
| AC4 | Multi-stage fixture, assert one commit per named file (adopted interpretation) | Integration |

## Assumptions

AC4's commit-granularity interpretation (one commit per named artefact file, not per autosave) is RISK-ACCEPTed at this DoR run — see `decisions.md`. If implementation reveals genuine autosave-style intermediate writes that don't map cleanly to "one commit per file," escalate rather than silently picking a different granularity.

## Estimated touch points

Files: `src/web-ui/routes/journey.js` (many call sites — per the story's own Complexity 3 rationale), `src/web-ui/adapters/repo-root.js` (superseded for repo-backed products)
Services: GitHub Contents/Git Data API, Postgres (`journey-store-pg.js`, unchanged)
APIs: Same tree/blob/commit endpoints as `prc-s2.2`
