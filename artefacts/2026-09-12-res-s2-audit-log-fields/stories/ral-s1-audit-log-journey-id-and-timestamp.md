## Story: Add journeyId and timestamp fields to the artefact-save/materiality-check audit log events

**Epic reference:** None — short-track follow-up (closes `res-s2`'s own Follow-up Action #1, found during 2026-09-12 pipeline-state audit)
**Discovery reference:** None — short-track
**Benefit-metric reference:** None — short-track

## User Story

As **an operator auditing artefact-revision activity in production logs**,
I want the `artefact_auto_amended`, `artefact_auto_saved`, and `materiality_check_hook_failed` log events to carry an explicit `journeyId` field and an explicit ISO-8601 `timestamp` field,
So that I can trace a specific overwrite or hook failure back to its journey and its exact time without cross-referencing the surrounding log stream's own timestamps or session lookups.

## Benefit Linkage

**Metric moved:** Closes `res-s2`'s own DoD-recorded NFR gap: "Security — audit logging (artefact-overwrite portion)" (⚠️, `artefact_auto_amended`/`artefact_auto_saved` omit `journeyId`, carry no explicit timestamp field, and have no dedicated test for the overwrite sub-flow's event shape).
**How:** `res-s2`'s own DoD named this gap explicitly and recommended exactly this fix: "Tighten `artefact_auto_amended`/`artefact_auto_saved` (and the sibling `materiality_check_hook_failed` log) to emit `journeyId` and an explicit ISO timestamp field directly." This story does it.

## Architecture Constraints

- `src/web-ui/routes/skills.js` only — the three log call sites already exist (`artefact_auto_amended`/`artefact_auto_saved` at the auto-save block, `materiality_check_hook_failed` at the materiality-check hook's catch block); this story adds fields to their existing `JSON.stringify({...})` payloads, it does not introduce new events or change the events' console method (`console.info`/`console.warn` stay as-is).
- `journeyId` must be `session.journeyId || null` — a session with no journey (standalone `/skills` or CLI usage) is a valid, existing case and must not throw.
- `timestamp` must be a real `new Date().toISOString()` call at the point the event fires, not a value threaded in from elsewhere.
- No change to `artefact_path_traversal_rejected` or `artefact_disk_save_failed` (out of scope — not named in the DoD gap).

## Dependencies

- **Upstream:** `res-s2` (merged, DoD-complete) — this story adds fields to logging code `res-s2` already shipped; no new behaviour.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a revision turn overwrites an existing artefact on a session with a `journeyId` set, When the auto-save completes, Then the `artefact_auto_amended` log event includes `journeyId` matching the session's journeyId and an explicit ISO-8601 `timestamp` field.

**AC2:** Given a first-time artefact save on a session with a `journeyId` set, When the auto-save completes, Then the `artefact_auto_saved` log event also includes `journeyId` and `timestamp` fields (symmetry with AC1 — not just the amend path).

**AC3:** Given a session with no `journeyId` (standalone/CLI usage), When an auto-save fires, Then the log event's `journeyId` field is `null` rather than throwing or omitting the field.

**AC4:** Given the materiality-check hook throws during a revision turn, When the failure is logged, Then the `materiality_check_hook_failed` event includes `journeyId` and `timestamp` fields.

## Out of Scope

- `artefact_path_traversal_rejected` and `artefact_disk_save_failed` events — not named in `res-s2`'s DoD gap, no change.
- Splitting the bundled `NFR-audit-logging-reopen-flow` guardrail ID into per-sub-flow entries — that is `res-s2`'s own separately-recorded Follow-up Action #2, a candidate for `/improve`, not this story.
- Any change to `journey.js`'s own reopen-flow audit event (`journeyId` there is a separate, already-correct call site per `res-s1`'s corrected DoD).

## NFRs

- **Security/Audit:** Directly addressed — this story's entire purpose is closing an audit-logging NFR gap.
- **Performance:** N/A — one extra object field and one `Date.toISOString()` call per event, no measurable overhead.
- **Accessibility:** N/A.

## Complexity Rating

**Rating:** 1 — three log-call-site edits reusing an already-established test harness (`_setHtmlSession`, `handlePostTurnStreamHtml`, console-capture pattern from `check-res-s2-overwrite-artefact-in-place-on-revision.js`).
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic
