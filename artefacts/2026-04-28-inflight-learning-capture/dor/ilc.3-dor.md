# Definition of Ready: Update `/checkpoint` to bridge `capture-log.md` entries to `workspace/learnings.md`

**Story reference:** artefacts/2026-04-28-inflight-learning-capture/stories/ilc.3.md
**Test plan reference:** artefacts/2026-04-28-inflight-learning-capture/test-plans/ilc.3-test-plan.md
**Verification script:** artefacts/2026-04-28-inflight-learning-capture/verification-scripts/ilc.3-verification.md
**Contract:** artefacts/2026-04-28-inflight-learning-capture/dor/ilc.3-dor-contract.md
**Assessed by:** Copilot / operator
**Date:** 2026-04-28

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a **platform operator**" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs, all GWT |
| H3 | Every AC has at least one test in the test plan | ✅ | 12 tests covering all 5 ACs, 0 gaps |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 explicit exclusions listed |
| H5 | Benefit linkage field references a named metric | ✅ | M1 (Signal loss rate) and MM2 (Learnings.md growth rate) |
| H6 | Complexity is rated | ✅ | Rating: 2 — Some ambiguity (session-boundary detection) |
| H7 | No unresolved HIGH findings from the review report | ✅ | 0 HIGH — review run 1 PASS |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream: ilc.1. No pipeline-state.schema.json fields declared — instruction-text story, schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-011 + ADR-004 referenced; no pipeline-state.json schema changes |
| H-E2E | CSS-layout-dependent AC check | ✅ | No CSS-layout-dependent ACs — not applicable |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-04-28-inflight-learning-capture/nfr-profile.md confirmed |
| H-NFR2 | Compliance NFRs with regulatory clauses have human sign-off | ✅ | No compliance frameworks in scope — not applicable |
| H-NFR3 | Data classification field not blank | ✅ | "Public" — specified in NFR profile |
| H-NFR-profile | Story NFRs populated and NFR profile present | ✅ | NFRs declared (non-blocking, idempotent, instruction conciseness); profile confirmed |

**Result: 13/13 hard blocks passed ✅**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ Stable | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | 0 MEDIUM in review | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Edge cases may be missed; agent verifies against slightly wrong criteria | Operator, 2026-04-28 |
| W5 | No UNCERTAIN gaps in test plan | ✅ | — | — |

**Standards injection:** No domain tags on story — standards injection not applicable.

---

## Oversight

**Level: Low** — instruction-text-only story, Complexity 2, no regulated data. No sign-off required beyond this DoR.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Update /checkpoint to bridge capture-log.md entries to workspace/learnings.md
Story artefact: artefacts/2026-04-28-inflight-learning-capture/stories/ilc.3.md
Test plan: artefacts/2026-04-28-inflight-learning-capture/test-plans/ilc.3-test-plan.md
Verification script: artefacts/2026-04-28-inflight-learning-capture/verification-scripts/ilc.3-verification.md
Contract: artefacts/2026-04-28-inflight-learning-capture/dor/ilc.3-dor-contract.md

Prerequisites: ilc.1 must be merged before this story is implemented (bridge reads
from workspace/capture-log.md using ilc.1's schema). ilc.2 should be complete but
this story can be implemented in parallel — the bridge logic is independent of how
entries got into the file.

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or structure
beyond what the tests and ACs specify.

What to build:
Add a capture-bridge step to the /checkpoint convention block in copilot-instructions.md
(≤80 words total addition). The step must instruct the agent to:

1. Check whether workspace/capture-log.md exists.
   - If absent: skip with "capture-log.md not found — skipping capture review" and
     continue to the normal state-write. Do not error.
2. If present: determine new entries by comparing each entry's date field against
   the lastUpdated value in workspace/state.json from the PRIOR checkpoint write
   (i.e. entries dated after the previous checkpoint's lastUpdated are "new").
3. Report the count of new entries found — e.g. "3 new captures found since last
   checkpoint." If zero: report "No new captures to promote" — do not silently skip.
4. Present each new entry showing its signal-type and signal-text, then ask the
   operator which entries to promote to workspace/learnings.md (all / specific
   numbers / skip).
5. For each promoted entry: append to workspace/learnings.md under a heading derived
   from signal-type (e.g. "## Decisions", "## Learnings"). Include the entry's
   original date and session-phase for traceability.
6. If the operator skips (replies "skip" or "none"): proceed to the normal
   state-write without modification. capture-log entries are NOT deleted or modified.
7. Idempotency: entries dated before the current checkpoint's lastUpdated must not
   be re-presented on the next checkpoint run.

Session boundary mechanism (resolved at DoR — do not change):
Use workspace/state.json lastUpdated from the prior checkpoint write as the boundary.
Entries with date > prior lastUpdated are "new". This is the authoritative mechanism.

NFR constraints (enforced by tests):
- Total addition to checkpoint convention block: ≤80 words
- Skip path must be non-blocking (checkpoint completes normally)
- Second checkpoint with no new entries must produce no duplicate promotions

Constraints:
- Touch only: copilot-instructions.md
- Do NOT touch: any SKILL.md file, any file under artefacts/, .gitignore, package.json,
  pipeline-state.json, or workspace/state.json itself
- No new npm dependencies
- Architecture standards: read .github/architecture-guardrails.md before implementing.
  ADR-004 governs: /checkpoint is in copilot-instructions.md (session conventions section),
  not a standalone SKILL.md. ADR-011 compliance is satisfied by this story artefact
  existing before you merge.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment
  describing the specific blocker and stop — do not improvise a workaround
```
