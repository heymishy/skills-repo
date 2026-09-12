# Test Plan: Dedicated tests for ep1-s1's two code-review-only NFRs (enfr-s1)

**Story:** artefacts/2026-09-12-ep1-s1-nfr-coverage-backfill/stories/enfr-s1-dedicated-tests-for-ep1-s1-nfrs.md
**Track:** Short-track

---

## Test Cases

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Unit | A `stalled`-stage feature with no journey-store record is included in `_mergeStateFeaturesIntoJourneyList`'s output |
| T2 | AC2 | Performance | `_mergeStateFeaturesIntoJourneyList` against this repo's real, current `.github/pipeline-state.json` completes well within the 2-second budget |

## Regression coverage

- `tests/check-ep1-s1-journey-feature-merge.js` (the sibling story's own suite) re-run unmodified — all 8 tests must still pass.

## Out of Scope (per story)

- Any change to `src/web-ui/routes/journey.js`.
- Any other NFR/AC of `ep1-s1`.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
