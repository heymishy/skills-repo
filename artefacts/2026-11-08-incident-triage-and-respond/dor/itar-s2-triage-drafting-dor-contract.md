# Contract Proposal: Triage drafting via structured-field Jaccard matching

**Story reference:** artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s2-triage-drafting.md
**Date:** 2026-11-09

## What will be built

A new triage-drafting module (e.g. `scripts/lib/triage-drafter.js`) that: (1) exports `_jaccard` from `src/modules/drift-comparator.js` under a public name (preferred: `jaccardSimilarity`, per the story's own stated preference for option (a)); (2) defines a named, exported domain threshold constant (e.g. `INCIDENT_JACCARD_THRESHOLD`) left unpinned at a specific value per the acknowledged open MEDIUM finding — determined empirically during implementation; (3) a `draftTriageSummary(record, store)` function that scores a new record's normalized tags against every existing record's tags via the exported Jaccard function, attaches matches at/above threshold (ranked descending by score) as `priorIncidentLinks`, and writes a narrative `triageSummary` (known context, tried-before, suggested next step) back onto the record in the store; (4) explicit, distinct result states for "no match above threshold" (AC3) vs. "cannot score — malformed/empty tags" (AC4) — never collapsed into one generic shape.

## What will NOT be built

Any matching against `decisions.md` free text — structured-field matching only, confirmed out of scope by the discovery (no tokenization/stopword tooling exists in this repo). Auto-prioritization, severity scoring, or auto-escalation based on the triage summary — this story only drafts for human review.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit tests on the exported Jaccard function and threshold boundary behaviour (at/above/below, multiple matches, ranking); integration test persisting the result to a fixture store | unit + integration |
| AC2 | Unit + integration tests asserting the triage summary contains known-context, tried-before, and next-step narrative content | unit + integration |
| AC3 | Unit test asserting an explicit "no relevant prior incident found" summary is written, never silently skipped | unit |
| AC4 | Unit tests on empty (`tags: []`) and malformed (`tags: null` / non-array) inputs, asserting a distinct "cannot-score" result, and a test asserting this is distinguishable from AC3's genuine no-match result | unit |

## Assumptions

`_jaccard` is exported with no change to its internal behaviour (case-sensitive, no normalization — normalization already happens at itar-s1's capture time). The domain threshold is a named constant the implementation plan tunes empirically; no specific numeric value is assumed by this contract. Matching runs against the full `workspace/incidents.json` history in memory — acceptable at this repo's current (low) incident volume per the story's own NFR section.

## Estimated touch points

Files: `src/modules/drift-comparator.js` (add export only, no behavioural change), new triage-drafting module under `scripts/lib/`, `scripts/lib/incident-store.js` (read/update calls).
Services: none.
APIs: none.

## Cross-story schema dependency (H8-ext)

**schemaDepends:** `[id, tags, status, priorIncidentLinks]` — these are fields on the `INCIDENT` record entity itar-s1 defines (its own `data-model` canvas marker in `itar-e1-triage-and-respond.md`'s program-design, and itar-s1's AC1/AC3), not fields in `pipeline-state.schema.json`. This story's upstream dependency on itar-s1 flows through the new `workspace/incidents.json` record schema, a separate schema from `pipeline-state.json` entirely. All four fields are confirmed present in itar-s1's own data-model definition. H8-ext's literal check (fields present in `pipeline-state.schema.json`) does not apply to this dependency shape, since the dependency was never on pipeline-state.json in the first place — recorded here for traceability rather than silently skipped.
