# DoR Contract Proposal: Wire standardsList to read from the git-backed cache, with promote/opt-out proven unaffected

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s3.3.md

## What will be built

`standardsList` changed to read from `prc-s3.2`'s cache. Existing `standardsPromote`/`optoutPost`/`optoutDelete` test suites re-run unmodified as a regression proof. A round-trip integration test proving `prc-s3.1`'s write path and this story's read path agree.

## What will NOT be built

`standardsPost`/`standardsPut`'s write-through behaviour — that's `prc-s3.1`'s scope (deliberately, per this story's own corrected boundary — see `decisions.md`, "SCOPE | /review run 1 — prc-s3.3 HIGH finding resolved," 2026-07-14).

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `standardsList` test suite updated to seed via cache, assert unchanged response shape | Integration |
| AC2 | Existing promote/opt-out test suites run unmodified | Integration |
| AC3 | POST then immediately `standardsList`, assert exact content match | Integration |

## Assumptions

None new — this story's scope was already narrowed once (post-`/review`) specifically to avoid assumption overlap with `prc-s3.1`.

## Estimated touch points

Files: `src/web-ui/routes/standards.js` (`standardsList` only)
Services: `prc-s3.2`'s cache
APIs: None new
