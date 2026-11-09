# Contract Proposal: Handoff to short-track pipeline + post-fix confirmation

**Story reference:** artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s4-handoff-and-post-fix-confirmation.md
**Date:** 2026-11-09

## What will be built

A handoff function that links an incident record to a newly-created short-track story slug, carrying the triage summary's known-context and suggested-next-step content into the handoff payload. A post-fix check module that, once a linked story reaches `dodStatus: complete` (read from `pipeline-state.json`), selects one of two explicit, named branches: `confirmationMethod: 'automated'` (if initiative 2's detection registry has a check for this incident's original trigger) or `confirmationMethod: 'manual'` (prompts for manual confirm otherwise). The result of either path updates the incident record's `confirmationStatus` to `'confirmed'` or `'not-confirmed'`. On `'not-confirmed'`, the record's top-level `status` stays `'open'`/`'flagged'` (never `'closed'`) and a tried-but-unsuccessful fix-attempt entry is appended.

## What will NOT be built

Any new automated detection mechanism for the re-check itself — reuses whatever initiative 2 eventually ships. Posting confirmation results to Teams or any chat channel — not yet wired (forward-looking constraint only). Long-term/delayed re-measurement of whether a confirmed fix continues to hold weeks later — initiative 5's territory.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit tests on the handoff function — linked-story-slug set on the record, triage context included in the handoff payload | unit |
| AC2 | Unit tests on both named branches (automated-path-selected, manual-path-selected); integration test running the full flow against a fixture `pipeline-state.json` story at `dodStatus: complete` | unit + integration |
| AC3 | Unit tests on both outcomes (`confirmed`, `not-confirmed`); integration test asserting the record's status changed away from pre-fix | unit + integration |
| AC4 | Unit test asserting a `not-confirmed` result keeps the record open/flagged and logs a tried-but-unsuccessful attempt | unit |

## Assumptions

The automated-detection-registry lookup is a simple existence check (does a callable check function exist for this incident's trigger) — no new detection logic is built by this story. `dodStatus: complete` is read directly from `pipeline-state.json` (confirmed field: `dodStatus`, enum `["not-started", "complete"]` in `pipeline-state.schema.json`). The Teams-credential forward-looking constraint (`product/constraints.md` #12) is not yet active since no Teams-posting path exists in this story's own MVP scope.

## Estimated touch points

Files: new handoff/post-fix-check module (e.g. `scripts/lib/incident-handoff.js`), `scripts/lib/incident-store.js` (status/confirmation updates).
Services: none new.
APIs: none new.

## Cross-story schema dependency (H8-ext)

**schemaDepends:** `[id, status, triageSummary]` (from itar-s1/itar-s2's `INCIDENT` record schema — same reasoning as itar-s2/itar-s3's own H8-ext entries: this is `workspace/incidents.json`'s schema, not `pipeline-state.json`'s). Separately, AC2/AC3 genuinely do depend on a `pipeline-state.json` field — `dodStatus` — but that field belongs to whichever short-track story gets linked at handoff time (a story outside this feature's own Dependencies block, determined at runtime), not to itar-s1/itar-s2 themselves. `dodStatus` is confirmed present in `pipeline-state.schema.json` (`"dodStatus": { "type": "string", "enum": ["not-started", "complete"] }`), so this runtime dependency is schema-valid.
