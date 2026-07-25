## Test Plan: Drift signal — as-designed vs as-built comparison

**Story reference:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s6-drift-signal.md
**Epic reference:** artefacts/2026-07-25-code-shape-diagrams/epics/csd-e1-code-shape-diagrams.md
**Test plan author:** Copilot (Claude Sonnet 5)
**Date:** 2026-07-25

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Data Model drift rule flags add/remove/rename AND non-optimal-design duplicates | 4 tests | — | — | — | — | 🟢 |
| AC2 | Program Design drift rule flags structural changes only, not renames | 3 tests | — | — | — | — | 🟢 |
| AC3 | System Architecture drift rule flags new/removed service calls | 2 tests | — | — | — | — | 🟢 |
| AC4 | No drift shows explicit "Matches" signal, not silence | 2 tests | 1 test | — | — | — | 🟢 |
| AC5 | Diverged signal names the specific difference | 3 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — pairs of as-designed/as-built diagram fixtures, constructed to exercise each drift rule precisely
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Pairs: (a) identical diagrams, (b) table added, (c) table removed, (d) new/duplicate entity where an existing one covers it | Hand-authored fixture pairs | None | The duplicate-entity case needs two entities with clearly overlapping purpose to be meaningful |
| AC2 | Pairs: (a) identical file structure, (b) genuinely restructured call stack, (c) same structure with only a local variable renamed | Hand-authored fixture pairs | None | Case (c) is the specific negative case — must NOT flag |
| AC3 | Pairs: (a) identical service calls, (b) new service-to-service call added, (c) a call removed | Hand-authored fixture pairs | None | |
| AC4 | A pair with zero drift across all three types | Hand-authored fixture pair | None | |
| AC5 | Pairs from AC1/AC2/AC3's "diverged" cases, inspected for message content | Reuse AC1-AC3 fixtures | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### identicalDataModelDiagramsProduceNoDrift
- **Verifies:** AC1
- **Precondition:** Identical as-designed and as-built Data Model diagram fixtures
- **Action:** Run the drift comparison
- **Expected result:** No "diverged" flag for Data Model
- **Edge case:** No

### addedTableFlagsDataModelDrift
- **Verifies:** AC1
- **Precondition:** As-built has one additional table not present in as-designed
- **Action:** Run the drift comparison
- **Expected result:** "Diverged" flagged for Data Model
- **Edge case:** No

### removedTableFlagsDataModelDrift
- **Verifies:** AC1
- **Precondition:** As-built is missing a table present in as-designed
- **Action:** Run the drift comparison
- **Expected result:** "Diverged" flagged for Data Model
- **Edge case:** No

### duplicateEntityWhereExistingOneAlreadyCoversItFlagsNonOptimalDesign
- **Verifies:** AC1
- **Precondition:** As-built introduces a new entity whose purpose clearly overlaps with an existing entity already present in as-designed (e.g. a second "user_roles"-shaped table alongside an existing `team_memberships` table)
- **Action:** Run the drift comparison
- **Expected result:** "Diverged" flagged for Data Model, specifically naming the non-optimal-design pattern (new/duplicate object where an existing one already served the purpose) — not just a generic "table added" message
- **Edge case:** Yes — this is the specific ADR-026-inspired case discovery called out as the highest priority

### identicalProgramDesignProducesNoDrift
- **Verifies:** AC2
- **Precondition:** Identical file-structure/call-stack fixtures
- **Action:** Run the drift comparison
- **Expected result:** No "diverged" flag for Program Design
- **Edge case:** No

### restructuredCallStackFlagsProgramDesignDrift
- **Verifies:** AC2
- **Precondition:** As-built has a genuinely different call-stack structure (e.g. a function call moved to a different module)
- **Action:** Run the drift comparison
- **Expected result:** "Diverged" flagged for Program Design
- **Edge case:** No

### renamedLocalVariableDoesNotFlagProgramDesignDrift
- **Verifies:** AC2
- **Precondition:** As-built has the identical file/call structure as as-designed, but one local variable name differs
- **Action:** Run the drift comparison
- **Expected result:** No "diverged" flag — a pure local rename with unchanged structure is explicitly not drift
- **Edge case:** Yes — the specific negative case this AC exists to guarantee

### newServiceCallFlagsSystemArchitectureDrift
- **Verifies:** AC3
- **Precondition:** As-built has a new service-to-service call not present in as-designed
- **Action:** Run the drift comparison
- **Expected result:** "Diverged" flagged for System Architecture
- **Edge case:** No

### removedServiceCallFlagsSystemArchitectureDrift
- **Verifies:** AC3
- **Precondition:** As-built is missing a service call present in as-designed
- **Action:** Run the drift comparison
- **Expected result:** "Diverged" flagged for System Architecture
- **Edge case:** No

### noDriftAcrossAllThreeTypesShowsExplicitMatchesSignal
- **Verifies:** AC4
- **Precondition:** A fixture pair with zero drift across all three diagram types
- **Action:** Run the drift comparison; inspect the canvas signal output
- **Expected result:** An explicit "Matches" label is shown for each diagram type — not an absent/silent state
- **Edge case:** No

### matchesSignalIsDistinctPerDiagramType
- **Verifies:** AC4
- **Precondition:** A fixture where Data Model matches but Program Design diverges
- **Action:** Run the drift comparison
- **Expected result:** Data Model shows "Matches", Program Design shows "Diverged" — signals are independent per type, not one combined status
- **Edge case:** Yes — confirms per-type independence

### divergedSignalNamesSpecificDifferenceForDataModel
- **Verifies:** AC5
- **Precondition:** The "added table" fixture from AC1
- **Action:** Run the drift comparison; inspect the diverged message content
- **Expected result:** The message names the specific table added (e.g. "New table `x` added, no matching entity in the as-designed diagram") — not a bare "diverged" label
- **Edge case:** No

### divergedSignalNamesSpecificDifferenceForProgramDesign
- **Verifies:** AC5
- **Precondition:** The "restructured call stack" fixture from AC2
- **Action:** Run the drift comparison; inspect the message content
- **Expected result:** The message names which part of the structure changed
- **Edge case:** No

### divergedSignalNamesSpecificDifferenceForSystemArchitecture
- **Verifies:** AC5
- **Precondition:** The "new service call" fixture from AC3
- **Action:** Run the drift comparison; inspect the message content
- **Expected result:** The message names the specific new/removed call
- **Edge case:** No

---

## Integration Tests

### driftComparisonRunsWithinVerifyCompletionAndSurfacesInCanvas
- **Verifies:** AC4
- **Components involved:** csd-s5's as-built generation, csd-s3/csd-s4's as-designed diagrams, canvas rendering (csd-s2)
- **Precondition:** A real feature with as-designed diagrams (csd-s3/s4) and freshly-generated as-built diagrams (csd-s5)
- **Action:** Run the full drift-comparison step and render the result in canvas
- **Expected result:** The match/diverged signal appears in canvas, correctly reflecting the comparison result for a real, end-to-end feature — not just isolated fixture pairs

---

## NFR Tests

### driftComparisonCompletesWithinNormalSessionTimeBudget
- **NFR addressed:** Performance
- **Measurement method:** Time the comparison step for a representative feature
- **Pass threshold:** Completes within the normal `/verify-completion` session budget, no numeric target set (no baseline exists)
- **Tool:** Manual timing observation

### matchDivergedSignalConveyedByMoreThanColourAlone
- **NFR addressed:** Accessibility
- **Measurement method:** Inspect the rendered signal for a text label or icon accompanying any colour coding
- **Pass threshold:** Signal is understandable without colour perception (e.g. a checkmark/cross icon or explicit text, not colour alone)
- **Tool:** Unit/DOM test asserting on rendered markup

### driftResultsAreLogged
- **NFR addressed:** Audit
- **Measurement method:** Run a drift comparison; check logs for matched/diverged result per diagram type, per feature
- **Pass threshold:** A log entry exists for every comparison run — this is the evidence P3 and M1 measurement depends on
- **Tool:** Log inspection

---

## Out of Scope for This Test Plan

- Fully automated semantic verdict ("this diff is safe/unsafe") — discovery's own out-of-scope item.
- Automatic remediation of detected drift — this story only surfaces the signal.

---

## Test Gaps and Risks

None identified.
