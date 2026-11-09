# Contract Proposal: Incident record mechanism

**Story reference:** artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s1-incident-record-mechanism.md
**Date:** 2026-11-09

## What will be built

A new `scripts/lib/incident-store.js` module exporting `createIncidentRecord(input)` and an append/persist function, plus the new data file `workspace/incidents.json`. `createIncidentRecord` validates and normalizes the `tags` field (trim whitespace, lowercase) before storage, enforces a bounded tag/summary length via a named exported constant (e.g. `MAX_TAG_FIELD_LENGTH`) and throws a specific `IncidentTagFieldTooLongError` if exceeded, generates a unique `id`, and defaults `status: 'open'`, `priorIncidentLinks: []`, with `createdAt`/`updatedAt` timestamps set equal at creation. The append function writes to `workspace/incidents.json` without truncating existing records, and creates the file on first write if it does not yet exist.

## What will NOT be built

Any UI for creating a record — this story is harness/Claude-Code-only; itar-s3 only renders existing records and does not add a creation form. Automated alert-to-record creation is also not built here — that is initiative 2's future integration point; records are created manually for this MVP.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit tests on `createIncidentRecord` asserting unique id, default status/priorIncidentLinks, verbatim trigger text, and bounded-length rejection | unit |
| AC2 | Integration tests appending to a fixture `incidents.json` — steady-state append without truncation, and first-write file creation | integration |
| AC3 | Unit test asserting tags are trimmed and lowercased at capture time | unit |
| AC4 | Integration test migrating the real `tenant_admin_bootstrap_failed` fixture (transcribed from `capture-log.md`) through `createIncidentRecord` + the store | integration |

## Assumptions

`workspace/incidents.json` is committed directly to master as a non-governed data file per CLAUDE.md's existing `workspace/` convention. No concurrent-write locking is built — this is a single-operator, low-frequency write path, consistent with how `capture-log.md`/`state.json` are already handled without locking.

## Estimated touch points

Files: `scripts/lib/incident-store.js` (new), `workspace/incidents.json` (new data file).
Services: none.
APIs: none.
