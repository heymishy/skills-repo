# Definition of Done: Make the default mock-gateway /ideate scenario actually cycle through lenses, assumptions, conditions, and completion

**PR:** #716 (isc-s1 original merge, 2026-08-10) — the story's own "Fix-forward addendum" (off-by-one turnIndex correction) landed separately as **isc-s2**, PR #717, merged 2026-08-11; the addendum text is embedded in the isc-s1 story file but the code fix itself shipped under a different story number. | **Merged:** 2026-08-10 (isc-s1, PR #716); 2026-08-11 (isc-s2 fix-forward, PR #717) — both confirmed via `git log`.
**Story:** artefacts/2026-08-10-ideate-success-lens-cycling/stories/isc-s1-ideate-success-lens-cycling.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

The story's AC1–AC5 text (turnIndex 0, 2, 4, 6, 8) reflects the *pre-fix-forward* sequence. Per the addendum, the actually-shipped and currently-tested sequence is 0, 1, 3, 5, 7 (odd-index real turns), with 2/4/6 as confirmed-unreachable padding. `check-isc-s1-ideate-success-lens-cycling.js` (6/6 passing, freshly re-run 2026-08-17) tests the corrected sequence and is treated here as the authoritative evidence.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (turnIndex 0 = Lens A, cluster-tree + assumption marker) | Yes | `AC1: turnIndex0_isLensA_withClusterTreeAndAssumptionMarker` — asserts `Lens A`, one `cluster-tree` canvas marker titled "Opportunity map", ≥1 assumption marker | Unit test | None — index unchanged by fix-forward |
| AC2 (Lens B, differs from turn 0, has assumption + condition markers) | Yes | `AC2: turnIndex1_isOperatorsFirstRealReply_mustBeLensB_notARepeatOfLensA` — asserts turnIndex 1 (not 2) is Lens B, distinct from turn 0, has both marker types | Unit test | Index corrected from turnIndex 2 → 1 by the fix-forward; test rewritten accordingly per the story's own addendum |
| AC3 (Lens C/D, each distinct from all prior turns) | Yes | `AC3: turnIndex3And5_areLensCAndD_eachDistinctFromAllPriorTurns` — asserts turnIndex 3 = Lens C, turnIndex 5 = Lens D, all 4 turns (0,1,3,5) distinct | Unit test | Indices corrected from 4/6 → 3/5 |
| AC4 (final artefact-completion turn, valid ARTEFACT-START/END block) | Yes | `AC4: turnIndex7_isFinalTurn_withValidArtefactStartEndBlock` — asserts valid artefact block, contains "# Ideation Artefact", summarises Lens A and Lens D | Unit test | Index corrected from 8 → 7 |
| AC5 (turnIndex beyond final clamps to last entry) | Yes | `AC5: turnIndexBeyondScriptedSequence_clampsToFinalEntry` — asserts turnIndex 100 returns identical content to turnIndex 7 | Unit test | Clamp boundary corrected from "beyond 8" → "beyond 7" |
| AC6 (5 named existing regression files — `check-a3-ideate-artefact-disk-match.js`, `check-a4-session-store-state.js`, `check-icv-s1-ideate-canvas-turn2-render-fix.js`, `check-mds-s1-diagram-showcase-fixtures.js`, `check-bri-s3.1-mock-llm-gateway.js` — all pass after the fixture change) | Not independently confirmed this session | No fresh run of these 5 files was provided or executed in this DoD pass — only `check-isc-s1-ideate-success-lens-cycling.js` (6/6) was supplied/re-run | Gap: no fresh evidence | Evidence gap, not a known failure — the test plan lists these as the declared regression suite and the PR merged, but this session did not re-execute them |

## Scope Deviations

- **Accepted, documented in-story:** the turnIndex sequence used by AC1–AC5 in the story's original text (0/2/4/6/8) was superseded by the "Fix-forward addendum" (0/1/3/5/7), which the story itself explains and which `check-isc-s1-ideate-success-lens-cycling.js` now tests directly. Not a new deviation — the story text names it explicitly.
- **Accepted, documented in-story:** the fix-forward code change itself shipped under a separate story, **isc-s2** (PR #717), not within isc-s1's own PR (#716). The addendum is textually embedded in the isc-s1 story file but the commit history shows it as a distinct story/PR. Noted for provenance accuracy; not a defect in isc-s1's own delivery.
- **Accepted, documented in-story:** the story's addendum ends with "Pending: re-verification live on staging after this fix deploys." This session found no evidence either confirming or contradicting that the live re-verification occurred after isc-s2 (PR #717) deployed. The story itself names this as pending, so it is recorded here as an accepted, already-flagged open item rather than a newly discovered gap.
- Three items explicitly out of scope per the story text (pip-indicator wiring, canvas-block-duplication rendering, `design.success.json`/`definition.success.json` lens cycling) — all accepted as-is, not evaluated here.

## Test Plan Coverage

- `check-isc-s1-ideate-success-lens-cycling.js`: **6 passed, 0 failed** (freshly re-run 2026-08-17, and independently re-confirmed by this DoD pass with an identical 6/0 result).
- Regression suite named in the test plan (`check-a3-ideate-artefact-disk-match.js`, `check-a4-session-store-state.js`, `check-icv-s1-ideate-canvas-turn2-render-fix.js`, `check-mds-s1-diagram-showcase-fixtures.js`, `check-bri-s3.1-mock-llm-gateway.js`, `check-mgtc-s1-turn-index-cycling.js`): not re-run in this session; no fresh pass/fail data available to cite.

## NFR Status

| NFR | Status |
|-----|--------|
| Correctness (markers parseable by existing, unmodified parsers) | Partially evidenced — `check-isc-s1` verifies marker *presence* via regex, not a full round-trip through `parseCanvasBlock`/`extractCanvasBlocksFromTurns`. No fresh evidence from the regression files that would exercise the real parsers. |
| Test isolation (other fixture files byte-identical, checksum-excluding `ideate.success.json`) | Not independently re-verified this session — relies on `check-mds-s1-diagram-showcase-fixtures.js`, which was not re-run. |

## Metric Signal

No formal benefit-metric artefact exists for this story — it is explicitly short-track ("Discovery reference: None", "Benefit-metric reference: None"). The story's own benefit linkage is a direct, code-derived test-infrastructure gap found via a live Chrome-driven staging review, not a tracked product metric.

## Outcome

**COMPLETE WITH DEVIATIONS**
**Follow-up actions:** Re-run the five (or six, per the test plan) named regression files to close the AC6 evidence gap and confirm the NFR "Correctness"/"Test isolation" claims with fresh data; if convenient, fold this into a future DoD/backlog pass rather than a new story, since no functional defect is suspected — only unconfirmed evidence.

## DoD Observations

The core lens-cycling fix (0/1/3/5/7 sequence) is well-evidenced and passing; the primary residual gap is evidentiary (unconfirmed regression-suite re-run in this session), not functional. Provenance note: the fix-forward addendum embedded in this story's text was actually delivered under a separate story (isc-s2, PR #717) one day after isc-s1's own merge (PR #716) — worth keeping in mind if `/trace` or future audits expect isc-s1's PR alone to contain the full fix.
