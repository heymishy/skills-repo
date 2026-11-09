## Test Plan: Bottom-up programme-candidate detection script (epic-count primary signal)

**Story reference:** artefacts/2026-11-08-programme-entry-points/stories/pep-s3-bottom-up-detection-script.md
**Epic reference:** artefacts/2026-11-08-programme-entry-points/epics/pep-e1-validate-entry-points.md
**Test plan author:** Copilot (Claude Sonnet 5)
**Date:** 2026-11-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Script scans pipeline-state.json, computes epic count + decisions.md dependency-mention count per feature, never computes timeline span, flags ≥4 epics | 4 tests | 1 test | — | — | — | 🟢 |
| AC2 | Flags phase4 (5 epics) as true positive | 1 test | 1 test | — | — | — | 🟢 |
| AC3 | Does not flag team-identity-roles (1 epic) as false positive | 1 test | 1 test | — | — | — | 🟢 |
| AC4 | Produces a manual-review report listing candidates, epic count, dependency-density score, and a human-judgment disclaimer | 2 tests | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. All 4 ACs are fully automatable — this is a read-only CLI script against on-disk JSON/markdown files, with no browser or external-service dependency.

---

## Test Data Strategy

**Source:** Fixtures (real `.github/pipeline-state.json` entries for the two known historical cases, plus synthetic edge-case fixtures for boundary testing)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A `pipeline-state.json` fixture with features of varying epic counts (0, 1, 3, 4, 5, 10) and varying decisions.md dependency-mention counts | Synthetic fixture modeled on the real schema (confirmed via `bin/skills advance`/`check-pipeline-state-integrity.js` conventions) | None | Synthetic fixture needed specifically to cover boundary values (3 vs. 4 vs. 5) that the two real historical cases alone don't fully exercise |
| AC2 | phase4's real epic count (5) from its own structure | `artefacts/archived/2026-04-19-skills-platform-phase4/epics/` (confirmed: `e1`-`e5`, 5 epics) | None | Real fixture, not synthetic — this is the actual historical validation case the story's own Benefit Linkage depends on |
| AC3 | team-identity-roles' real epic count (1) and decisions.md "depend" mention count (4) | `artefacts/2026-07-09-team-identity-roles/` and its `decisions.md` | None | Real fixture — confirmed 4 "depend" mentions across 9 stories per this tranche's own earlier verification |
| AC4 | A pipeline-state.json fixture with 0 candidates and one with ≥1 candidate | Synthetic, to exercise both the empty-report and populated-report code paths | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### computes epic count per feature from pipeline-state.json's flat and epic-nested story shapes alike

- **Verifies:** AC1
- **Precondition:** Synthetic fixture with one feature using flat `stories[]` (per ADR-017, the current convention) and one legacy feature using nested `epics[].stories[]`
- **Action:** Run the epic-counting logic against both shapes
- **Expected result:** Both shapes produce a correct epic count — the script does not assume only the flat shape exists, consistent with ADR-017's confirmed 7 legacy features still using the nested shape
- **Edge case:** Yes — legacy nested-shape feature

### computes decisions.md dependency-mention count via a simple string match on "depend"/"dependency"

- **Verifies:** AC1
- **Precondition:** A feature's `decisions.md` fixture containing 4 "depend" mentions (matching team-identity-roles' real count)
- **Action:** Run the secondary-signal counting logic
- **Expected result:** Count = 4, confirming the counting method matches the number already independently confirmed elsewhere in this tranche's artefacts for this exact file
- **Edge case:** No

### never computes or references a timeline/calendar-span value anywhere in its signal set

- **Verifies:** AC1
- **Precondition:** A fixture where git commit timestamps span 39 days (team-identity-roles' real span) vs. one where they span 2 days (phase4's real span)
- **Action:** Inspect the script's computed signal object for any date-diff or span-derived field
- **Expected result:** No timeline/span field exists in the output at all — this is a negative assertion specifically because the AC calls out that timeline span is "explicitly excluded" and confirmed inverted in this repo's real data (the longer-running case being the normal one); a script that silently computed it anyway (even unused) would risk a future maintainer wiring it in as a signal by mistake
- **Edge case:** Yes — this test exists specifically to prevent a plausible-looking but wrong future addition

### flags a feature as a candidate exactly when epic count ≥ 4, not >4 and not >5

- **Verifies:** AC1
- **Precondition:** Synthetic fixture with epic counts 3, 4, 5
- **Action:** Run the flagging logic against each
- **Expected result:** 3 → not flagged; 4 → flagged; 5 → flagged — confirms the boundary is inclusive at exactly 4, matching the AC's literal "≥4" wording
- **Edge case:** Yes — the boundary value 4 itself is the critical case

### manual-review report entry includes a plain-text disclaimer that this is a directional signal, not a verdict

- **Verifies:** AC4
- **Precondition:** A fixture with at least 1 flagged candidate
- **Action:** Inspect the generated report's text for each candidate entry
- **Expected result:** Each candidate entry includes the literal disclaimer text (or equivalent) stating this requires human judgment — the report does not present the flag as an automated decision
- **Edge case:** No

### manual-review report handles zero candidates gracefully

- **Verifies:** AC4
- **Precondition:** A fixture where no feature meets the ≥4-epic threshold
- **Action:** Run the script
- **Expected result:** Report states explicitly "0 candidates found" rather than producing an empty or malformed report, confirming AC4's "zero or more candidates" language is handled, not just the populated case
- **Edge case:** Yes — the zero-candidate path

---

## Integration Tests

### Script run end-to-end against the real .github/pipeline-state.json flags skills-platform-phase4 as a true positive

- **Verifies:** AC2
- **Components involved:** Detection script ↔ `artefacts/archived/2026-04-19-skills-platform-phase4/` real fixture ↔ (if phase4 has a corresponding entry in the real `pipeline-state.json`; if archived and removed from the live file, the test instead runs against a fixture file constructed by copying phase4's real epic/story counts into a standalone JSON matching the real schema, since the script's job is to read *this shape of data*, not specifically today's live file)
- **Precondition:** phase4 profile: 5 epics
- **Action:** Run the full script
- **Expected result:** phase4 (or its fixture-equivalent) appears in the candidates list with epic count = 5

### Script run end-to-end against team-identity-roles' real data does not flag it

- **Verifies:** AC3
- **Components involved:** Detection script ↔ `artefacts/2026-07-09-team-identity-roles/` real fixture (confirmed live in `.github/pipeline-state.json` today, per the `node -e` query already run this session showing no such feature slug is in the 2026-11-08 tranche — team-identity-roles is a separate, real, already-delivered feature, independently queryable from the same file)
- **Precondition:** team-identity-roles profile: 1 epic, 4 "depend" mentions
- **Action:** Run the full script
- **Expected result:** team-identity-roles does NOT appear in the candidates list — confirms no false positive on the one known normal-complexity comparison case, end-to-end against real data, not just the unit-level boundary check

### Manual-review report format is artefact-source-agnostic (per the story's own Out-of-Scope note about feeding initiative 1's surface later)

- **Verifies:** AC4
- **Components involved:** Report generator ↔ a plain-text/markdown output sink (not a database or web-UI-specific format)
- **Precondition:** Any fixture with ≥1 candidate
- **Action:** Inspect the report's output format
- **Expected result:** Output is a flat, parseable structure (e.g. markdown table or JSON) with no web-UI-specific fields — confirming the story's stated design intent that this can feed initiative 1's visibility surface later without a redesign, without actually building that integration now (which remains correctly out of scope)

---

## NFR Tests

### Script completes within a reasonable time against the current pipeline-state.json's real size

- **NFR addressed:** Performance
- **Measurement method:** Wall-clock timing of a full script run against the real, current `.github/pipeline-state.json` (confirmed non-trivial size — tens of thousands of lines based on this session's own diff output)
- **Pass threshold:** Completes in under 5 seconds — consistent with the story's own NFR framing ("not expected to be a performance concern at this repo's current scale"); this is a sanity bound, not a tuned SLA
- **Tool:** Node's own `process.hrtime` or equivalent, invoked from the test runner (`node scripts/run-all-tests.js`)

---

## Out of Scope for This Test Plan

- Testing against any feature other than the two known historical cases plus synthetic boundary fixtures — per the story's own Out of Scope, establishing a real-world false-positive rate on future features is explicitly `[UNKNOWN BASELINE]` and deferred to a future `/decisions` revisit.
- Any web UI rendering of the report — per the story's own Out of Scope.
- Any automated escalation into a `programme.md` artefact — per the story's own Out of Scope; this script only ever produces a manual-review report.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Only 2 real historical data points exist to validate the ≥4 threshold against | This repo has only run 2 features through enough history to classify as "known programme-shaped" vs. "known normal" | Explicitly logged in the story's own Out of Scope as the trigger for a future `/decisions` revisit once real future data exists; this test plan does not claim statistical validation, only confirms no regression against the 2 known cases |
