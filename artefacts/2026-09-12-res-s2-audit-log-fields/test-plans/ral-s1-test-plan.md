# Test Plan: Add journeyId and timestamp fields to audit log events (ral-s1)

**Story:** artefacts/2026-09-12-res-s2-audit-log-fields/stories/ral-s1-audit-log-journey-id-and-timestamp.md
**Track:** Short-track

---

## Test Cases

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Unit/integration | A revision turn (overwrite) on a session with a journeyId logs `artefact_auto_amended` with `journeyId` matching the session and a valid ISO-8601 `timestamp` |
| T2 | AC2 | Unit/integration | A first-time save on a session with a journeyId logs `artefact_auto_saved` with `journeyId` and `timestamp` fields |
| T3 | AC3 | Unit/integration | An auto-save on a session with no journeyId logs `journeyId: null`, does not throw |
| T4 | AC4 | Unit/integration | A materiality-check hook that throws logs `materiality_check_hook_failed` with `journeyId` and `timestamp` fields |

## Regression coverage

- `tests/check-res-s2-overwrite-artefact-in-place-on-revision.js` (the sibling story's own suite) re-run unmodified — all tests must still pass.

## Out of Scope (per story)

- `artefact_path_traversal_rejected` and `artefact_disk_save_failed` events.
- Splitting the bundled `NFR-audit-logging-reopen-flow` guardrail ID.
- `journey.js`'s own reopen-flow audit event.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
