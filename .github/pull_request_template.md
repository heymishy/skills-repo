<!--
  SDLC Pipeline — Pull Request Template
  
  This template is automatically applied to every PR in this repository.
  If this PR was opened by the Copilot coding agent, most fields should 
  already be populated. Review each section before marking ready for review.
  
  If a field is not applicable, write "N/A — [reason]" rather than leaving blank.
-->

## What this PR does

<!-- One sentence. Scope only — what behaviour is added or changed.
     Good: "Adds CSV export for canvas cards including filename with date stamp."
     Bad:  "Implements the export feature and fixes some edge cases." -->

## Story

<!-- Link to the story artefact or issue this PR implements -->
**Story:** 

<!-- Is this the complete story, or a partial implementation? -->
**Scope:** [ ] Complete story  [ ] Partial — reason:

---

## Acceptance criteria

<!--
  Copy the ACs verbatim from the story artefact.
  Check each one: does the implementation satisfy it as written?
  If behaviour differs from the AC, note the deviation — do not silently rewrite.
-->

- [ ] **AC1:** 
- [ ] **AC2:** 
- [ ] **AC3:** 
<!-- Add rows for additional ACs -->

**AC deviations:** <!-- None / or describe what differs and why -->

---

## Chain references

<!--
  Links to the upstream artefacts this PR traces back through.
  Reviewer uses these to verify the implementation matches the intent.
-->

| Artefact | Link |
|----------|------|
| Discovery | |
| Benefit metric | |
| Epic | |
| Test plan | |
| Definition of ready | |
| Human sign-off | |

---

## Scope confirmation

<!--
  These are the most important checks for the reviewer.
  The coding agent should have respected these constraints — verify it did.
-->

- [ ] No changes outside the story's stated scope
- [ ] No files modified outside the constraints in the DoR artefact
- [ ] No new dependencies introduced without a decision log entry
- [ ] No TODOs or commented-out code left in the diff

**Unexpected changes:** <!-- None / or describe anything outside scope -->

---

## Test evidence

- [ ] All tests passing in CI
- [ ] No pre-existing tests broken
- [ ] New tests cover all ACs (confirm against test plan)
- [ ] No test gaps introduced beyond those acknowledged in the test plan

**Test gaps acknowledged:** <!-- None / or link to gap entry in test plan -->

---

## NFR confirmation

<!--
  Check each NFR from the story artefact.
  Performance and accessibility NFRs in particular need explicit confirmation.
-->

- [ ] Performance NFRs met — evidence: 
- [ ] Accessibility NFRs met — evidence: 
- [ ] Security NFRs met — evidence: 
- [ ] Audit/logging NFRs met — evidence: 

<!-- Delete any NFR rows that don't apply to this story -->

---

## Decisions made during implementation

<!--
  Any decisions made DURING implementation that weren't in the story or test plan.
  These must be added to the feature decision log before this PR is merged.
  
  Common examples:
  - A technical approach chosen between two valid options
  - An assumption made about undefined behaviour
  - An edge case handled in a way not specified in the ACs
  - A dependency version pinned for a specific reason
-->

- [ ] No implementation decisions to record
- [ ] Decision log updated with: <!-- describe what was added -->

---

## Reviewer checklist

<!--
  For the human reviewer — not the author.
  Work through this before approving.
-->

- [ ] ACs are satisfied as written (not as re-interpreted)
- [ ] Scope matches the story — nothing extra, nothing missing
- [ ] Tests are meaningful — not just coverage theatre
- [ ] Any AC deviations are understood and accepted
- [ ] Decision log entries are adequate for future readers
- [ ] Ready to merge — no outstanding questions

---

<!--
  Agent-opened PRs: do not mark as ready for review.
  The author (who assigned the story) must review before requesting team review.
  
  Merge only after: all ACs checked, reviewer checklist complete, CI green.
-->
