# DoR Contract: Update `/checkpoint` to bridge `capture-log.md` entries to `workspace/learnings.md`

**Story reference:** artefacts/2026-04-28-inflight-learning-capture/stories/ilc.3.md
**Approved at:** 2026-04-28

---

## What will be built

A capture-bridge step added to the `/checkpoint` convention block in `copilot-instructions.md` (≤80 words total addition). The step instructs the agent to:
- Check for `workspace/capture-log.md`; if absent, skip with a note and continue normally
- Determine new entries by comparing each entry's `date` field against the `lastUpdated` value in `workspace/state.json` from the prior checkpoint write
- Report the count of new entries (or "No new captures to promote" if zero — not silent)
- Present each new entry's `signal-type` and `signal-text` and ask the operator which to promote
- Append promoted entries to `workspace/learnings.md` under a heading derived from `signal-type`, including `date` and `session-phase` for traceability
- If the operator skips: proceed to state-write without modification; capture-log entries are not deleted
- Handle idempotency: entries before the current checkpoint boundary are not re-presented

**Session-boundary mechanism (resolved at DoR):** New entries are those with `date` > `lastUpdated` from the prior checkpoint write in `workspace/state.json`. This is the authoritative mechanism and must not be changed without a new story artefact.

## What will NOT be built

- Automated promotion without operator review — curation is always a human action.
- Deletion or archiving of `workspace/capture-log.md` entries after promotion.
- Any change to the state-write step (`workspace/state.json`) or closing sequence.
- Promotion to any target other than `workspace/learnings.md`.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1: reports count of new entries | Unit test reads `copilot-instructions.md` checkpoint section, asserts count-reporting instruction present | Unit |
| AC2: presents signal-type + signal-text | Unit test reads instruction, asserts both field names specified in bridge step | Unit |
| AC3: promoted entries include date + session-phase | Unit test reads instruction, asserts `date` and `session-phase` named in promotion step | Unit |
| AC4: "No new captures" message | Unit test reads instruction, asserts zero-capture message path present | Unit |
| AC5: skip is non-blocking; capture-log unmodified | Unit test reads instruction (skip path non-blocking); synthetic fixture confirms capture-log not modified | Unit |

## Assumptions

- `workspace/learnings.md` already exists as a standing workspace file. If absent at promotion time, the promotion step creates it.
- `workspace/state.json` always contains a `lastUpdated` timestamp from the prior checkpoint. On the very first checkpoint run (no prior state), all entries in capture-log are treated as new.
- ilc.1 is merged; `workspace/capture-log.md` schema is defined.

## Estimated touch points

**Files:** `copilot-instructions.md`
**Services:** None
**APIs:** None
