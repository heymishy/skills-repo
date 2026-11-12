# Implementation Plan: Handoff to short-track pipeline + post-fix confirmation

**Story reference:** artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s4-handoff-and-post-fix-confirmation.md
**Test plan reference:** artefacts/2026-11-08-incident-triage-and-respond/test-plans/itar-s4-handoff-and-post-fix-confirmation-test-plan.md
**DoR reference:** artefacts/2026-11-08-incident-triage-and-respond/dor/itar-s4-handoff-and-post-fix-confirmation-dor.md

---

## File map

| File | Change |
|------|--------|
| `tests/check-itar-s4-handoff-and-post-fix-confirmation.js` (new) | 20 tests; the handoff and confirmation CLIs run as child processes against temp files; the real `workspace/incidents.json` is hashed before and after |
| `scripts/lib/incident-handoff.js` (new) | `linkIncidentToStory`, `postFixCheck`, `updateIncidentConfirmationStatus`, `confirmIncidentFix` and helpers |
| `scripts/lib/incident-detection-registry.js` (new) | `getCheckForTrigger`: existence lookup only; the built-in registry is empty until initiative 2 ships |
| `scripts/handoff-incident.js` (new) | Real entry point: `--incident --story [--file --artefacts-dir]` |
| `scripts/confirm-incident-fix.js` (new) | Real entry point: `--incident [--result --file --pipeline-state --registry]` |

`scripts/lib/incident-store.js` is not modified (the existing `loadIncidentRecords` and `saveIncidentRecords` are enough). No injectable adapter is introduced, so no wiring task is needed beyond the two CLIs being the callers.

## Task 1 - Failing tests (RED)

Write the test file first; confirm RED.

## Task 2 - Handoff (AC1)

Validate the slug, require an incident record (a deferred-item is refused) with a triage summary and no existing link, write `incident-handoff.md` under the story's artefact folder, then persist `linkedStory` and `handoffAt`.

## Task 3 - Post-fix check with two named branches (AC2)

Refuse unless the linked story (found by id or slug, flat or epic-nested) has `dodStatus: complete`. `postFixCheck` selects `confirmationMethod: 'automated'` when the registry holds a check for the trigger, otherwise `'manual'`. The manual branch with no `--result` prints a prompt, writes nothing and exits 2.

## Task 4 - Persist the outcome (AC3, AC4)

`pass` sets `confirmationStatus: confirmed` and `status: confirmed`. `fail` sets `confirmationStatus: not-confirmed`, `status: flagged` (never `closed`) and appends a `tried-but-unsuccessful` entry to `fixAttempts`. Both set `confirmedAt`.

## Task 5 - Verify

Run the story test, the related incident tests, then the full suite.
