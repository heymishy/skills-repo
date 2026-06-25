# DoR Contract — sri.3: Add measurement-ready gate to DoD Step 6 for infrastructure stories

**Date:** 2026-06-25

## What will be built

Instruction text changes to the Step 6 section of `skills/definition-of-done/SKILL.md` — inserting a measurement-ready gate question as the first per-story question in Step 6, with a "not yet" path that records `not-yet-measured` + evidence note and moves on. The "yes" path and all existing signal-capture options are unchanged.

One new test file: `tests/check-sri3-dod-step6-gate.js` with 8 content-assertion tests.

## What will NOT be built

- Automated detection of infrastructure stories via slug patterns or name heuristics
- New `measurementReady` field in story artefacts or pipeline-state.json schema
- Changes to any Step other than Step 6
- A follow-up mechanism to revisit `not-yet-measured` stories in future DoD runs

## How each AC will be verified

| AC | Test approach | Type |
|----|--------------|------|
| AC1 — gate question first in Step 6 | T1 (gate question text present), T2 (character-index precedes signal prompt) | Unit — content assertion |
| AC2 — "not yet" path records not-yet-measured + evidence note, moves on | T3 (`not-yet-measured` label), T4 (evidence note), T5 (move-on instruction) | Unit — content assertion |
| AC3 — "yes" path normal flow unchanged | T6 — asserts on-track/at-risk/off-track options still present | Unit — regression guard |
| AC4 — artefact records not-yet-measured with evidence note | T7 — asserts artefact-write instruction includes evidence note | Unit — content assertion |
| AC5 — stories processed independently | T8 — asserts per-story loop structure intact | Unit — regression guard |
| NFR-PERF (<30 seconds) | Manual Scenario 5 🔴 in verification script | Manual — runtime |
| NFR-AUDIT — evidence note in artefact | T7 (same test as AC4) | Unit — content assertion |

## Assumptions

- Step 6 in `skills/definition-of-done/SKILL.md` processes stories in a per-story loop — the gate question is inserted at the top of that loop.
- The "not yet" path terminates the current story's Step 6 processing and advances to the next story — the existing signal-capture flow is the "yes" path only.
- The state-write / artefact-write instruction for Step 6 is either within the Step 6 section or in a nearby state-update section — it will need to be extended to include the evidence-note field for `not-yet-measured` stories.

## Estimated touch points

- Files: `skills/definition-of-done/SKILL.md`, `tests/check-sri3-dod-step6-gate.js`
- Services: None
- APIs: None
