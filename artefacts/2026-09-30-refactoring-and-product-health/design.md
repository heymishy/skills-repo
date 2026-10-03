# Design: Refactoring as a First-Class Inner Loop Practice

**Feature slug:** 2026-09-30-refactoring-and-product-health
**Status:** Draft — pending operator review
**Design date:** 1 October 2026
**Linked artefacts:** discovery.md, clarify.md, benefit-metric.md

---

## Solution architecture

### Overview

This feature adds three bounded, additive changes to the existing skills framework. No new skill files, services, or storage mechanisms are introduced. All changes are modifications to existing SKILL.md instruction files and a co-evolution of `pipeline-state.schema.json`.

The three changes are:
1. **Refactor receipts in `/tdd`** — a mandatory structured record (or explicit skip) written per task after the refactor step
2. **Stage 3 design lens in `/implementation-review`** — a third review stage reading receipts and batch diffs to surface cross-task design findings
3. **Design health dimension** — a fifth dimension in the health roll-up, computed from receipt signals, advisory-only in v0

---CANVAS-JSON: {"type":"system-architecture","title":"As designed: Refactor receipt and design health signal flow","content":{"mermaid":"flowchart TD\n    TDD[\"/tdd SKILL.md\\n(refactorReceipt step)\"] --> ADVANCE[\"bin/skills advance\\n(JSON object write)\"]\n    ADVANCE --> PSJ[\"pipeline-state.json\\n(refactorReceipt per task)\"]\n    IR[\"/implementation-review SKILL.md\\n(Stage 3 — design lens)\"] --> PSJ\n    DOD[\"/definition-of-done SKILL.md\\n(design dimension gate)\"] --> PSJ\n    IMPROVE[\"/improve SKILL.md\\n(rolling Metrics 1–4)\"] --> PSJ\n    WF[\"/workflow SKILL.md\\n(silent-skip warnings)\"] --> PSJ\n    PSJ --> SCHEMA[\"pipeline-state.schema.json\\n(ADR-003: co-evolved)\"]"}}---

### Integration points

| System | Change type | Direction |
|---|---|---|
| `.github/skills/tdd/SKILL.md` | Extend REFACTOR step — add receipt protocol | Behavioural: adds mandatory evidence requirement |
| `.github/skills/implementation-review/SKILL.md` | Add Stage 3 — design lens | Behavioural: adds new review stage |
| `.github/skills/verify-completion/SKILL.md` | Add refactor carve-out | Behavioural: exempts structural-only rewrites from scope-creep check |
| `.github/skills/improve/SKILL.md` | Add receipt reading and Metrics 1–4 computation | Behavioural: adds new reporting dimension |
| `.github/skills/workflow/SKILL.md` | Add silent-skip warning signal | Behavioural: surfaces new pipeline health warning |
| `.github/skills/definition-of-done/SKILL.md` | Add design dimension gate check | Behavioural: adds advisory gate at DoD |
| `.github/pipeline-state.schema.json` | Add `refactorReceipt`, `designHealth` fields | Schema: co-evolved per ADR-003 |

No new services. No new npm dependencies. No new skill files in this epic.

### Data model

#### Per-task: `refactorReceipt` on `tddState`

Two valid shapes:

**Completed receipt:**
```json
{
  "status": "completed",
  "changes": ["Extracted authentication logic to shared module", "Removed 3 duplicate validation blocks"],
  "testResult": "pass",
  "diffScope": "internal",
  "notes": ""
}
```

**Explicit skip:**
```json
{
  "status": "skipped",
  "reason": "No structural improvement identified — task is a single focused function"
}
```

Field constraints:
- `status`: required; enum `completed | skipped`
- `changes`: required when `status: completed`; array of strings; minimum one entry
- `testResult`: required when `status: completed`; enum `pass | fail`
- `diffScope`: required when `status: completed`; enum `internal | interface-adjacent | external`
- `notes`: optional string
- `reason`: required when `status: skipped`

A silent skip — `tddState` present with no `refactorReceipt` field — is a protocol violation. `/workflow` surfaces this as a warning. The task is not considered complete.

**`testResult: "fail"` handling:** A failed-refactor receipt is recorded as evidence. The agent must revert the refactor and re-record with `status: skipped`, `reason: "refactor caused test failure — reverted"`. The `fail` value is preserved in `pipeline-state.json` for Metric 4 tracking. It is not overwritten — it is the evidence record.

#### Per-feature: `designHealth` (computed at DoD and `/improve` run)

```json
{
  "dimension": "design",
  "status": "green | amber | not-computed",
  "receiptCoverageRate": 0.85,
  "silentSkipRate": 0.0,
  "refactorCausedFailures": 0,
  "designLensFindingsCount": 2,
  "computedAt": "2026-10-01T00:00:00Z"
}
```

**Status computation (v0, provisional — calibrated after first five features):**
- `green`: `receiptCoverageRate ≥ 0.8` AND `silentSkipRate = 0` AND `refactorCausedFailures = 0`
- `amber`: any of: `receiptCoverageRate < 0.8`, `silentSkipRate > 0`, `refactorCausedFailures > 0` — but advisory only; cannot exceed `amber` in v0
- `not-computed`: no tasks have any `refactorReceipt` field (first feature under protocol, or incomplete implementation)

### Write mechanism

All receipt writes go through `bin/skills advance` using dot-notation. The receipt object is written as a JSON-encoded value in a single atomic advance call:

```
node bin/skills advance <feature-slug> <story-id> tddState.refactorReceipt='{"status":"completed","changes":["..."],"testResult":"pass","diffScope":"internal"}'
```

**Key assumption:** `cli-advance.js` supports JSON-object values (detects a JSON-string value and parses it before writing the nested object). This must be verified in the first implementation task for the `/tdd` story. If unsupported, the implementation story extends `cli-advance` to handle JSON-encoded object values, or documents an alternative write pattern (e.g. individual dot-notation scalar writes per field, with a receipt-complete sentinel field written last).

### Non-functional requirements

- **No regression:** all changes are additive; existing skill behaviour is preserved
- **Auditability:** every receipt write is via `bin/skills advance` — a named, reversible state transition, not a direct JSON edit
- **Hash verification integrity:** SKILL.md edits reset the hash at the next assurance gate run — expected and correct behaviour
- **Receipt gaming resistance:** Stage 3 design lens cross-checks receipts against diffs; `/improve` measures receipt rate against rework data over time

---

## UX / interaction design

### Agent running `/tdd` (primary flow)

After the GREEN step confirms all tests pass, the agent reaches the REFACTOR step:

1. Agent considers structural improvements: duplication, naming, abstraction, unnecessary complexity
2. **If improvements exist:** agent applies them, re-runs the full suite, confirms green, writes a completed receipt
3. **If no improvement identified:** agent writes an explicit skip receipt with a one-sentence reason
4. Agent writes the receipt via `bin/skills advance` (single atomic JSON-object call)
5. Task closes; receipt visible in `pipeline-state.json`

### Tech lead reviewing `/implementation-review` Stage 3

Stage 3 runs after Stage 1 (spec compliance) and Stage 2 (quality) are complete. Inputs: receipts from `pipeline-state.json` for the batch under review, plus the batch diff. The reviewer examines:

- **Cross-task duplication:** did two tasks solve the same structural problem independently?
- **Emerging abstractions:** do multiple receipts name similar improvements — is an abstraction emerging but not yet extracted?
- **Receipt coherence:** do the `changes[]` entries match the actual diff?
- **diffScope patterns:** is everything `internal`? Are any `interface-adjacent` changes that should have been flagged?

Stage 3 output: a finding list in the review artefact. Zero findings is acceptable if genuinely none exist — but the stage must run and record its conclusion either way. Findings are advisory; they do not block the review from proceeding.

### DoD gate — design dimension

`/definition-of-done` confirms the design dimension is present in the health roll-up. In v0, `amber` is acceptable; `not-computed` is a DoD finding (not a hard block, but must be acknowledged). The design dimension entry in the DoD artefact documents the current `receiptCoverageRate`, `silentSkipRate`, `refactorCausedFailures`, and `designLensFindingsCount`.

### Edge cases

| Scenario | Handling |
|---|---|
| `testResult: "fail"` in a receipt | Record as evidence; agent reverts refactor and writes a skip receipt; the fail record is preserved, not overwritten |
| Receipt written for a task with no prior `tddState` | `advance` creates the nested path; if not, the implementation task verifies and extends if needed |
| A task that is itself a refactor story | `diffScope: "external"` or `interface-adjacent` as appropriate; receipt still required |
| First feature under the new protocol (no prior receipts) | `designHealth.status: "not-computed"` at DoD; acknowledged, not blocked |

---

## Decisions log

| # | Title | Date | Decision | Rationale |
|---|---|---|---|---|
| D1 | Receipt granularity is per-task | 2026-10-01 | Per task, not per batch | Matches `/tdd`'s existing per-task model; a batch-level receipt obscures which tasks did and did not refactor |
| D2 | `changes[]` is a named list, not prose | 2026-10-01 | Structured named-changes array | Named changes enable Stage 3 design lens to detect patterns; prose receipts are ungradable |
| D3 | Design dimension is advisory only (amber at most) in v0 | 2026-10-01 | Advisory, no hard block | Calibration requires real data from at least five features; an uncalibrated hard block would immediately slow delivery |
| D4 | No `/refactor` skill in this epic | 2026-10-01 | Deferred to next epic | Discovery and clarify are explicit; this epic modifies existing skills only |
| D5 | Receipt write is a single atomic JSON-encoded advance call | 2026-10-01 | JSON-object value in single `advance` call | Partial receipts are worse than no receipt — atomicity is required; implementation story verifies `cli-advance` support |
| D6 | Stage 3 findings are not a DoD hard block | 2026-10-01 | Advisory signal | A finding prompts a conversation, not a stop; calibration precedes escalation |
| D7 | `diffScope` enum: `internal | interface-adjacent | external` | 2026-10-01 | Three-value provisional enum | Covers the main structural change categories; validated against real usage during first feature |

### Open questions (non-blocking)

- **Should `testResult: "fail"` trigger an automated pipeline state revert?** Current: manual revert required; fail is recorded as evidence only. A future story could add an automated trigger.
- **Should `changes[]` require a minimum length?** Current: at least one entry required by instruction, not by schema constraint. A future story could add schema-level validation.

---

## Attribution

**Design author:** Hamish King — operator / platform maintainer — 1 October 2026
**Reviewers:** Pending
**Status:** Draft — pending operator approval