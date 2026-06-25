# Test Plan — sri.3: Add measurement-ready gate to DoD Step 6 for infrastructure stories

**Story:** artefacts/2026-05-18-skill-robustness-improvements/stories/sri.3.md
**Review:** artefacts/2026-05-18-skill-robustness-improvements/review/sri.3-review-1.md — PASS (Run 1, 2026-06-25)
**Date:** 2026-06-25
**Test runner:** `node tests/check-sri3-dod-step6-gate.js` (file to be created by coding agent)
**Framework:** Plain Node.js — content assertions on `skills/definition-of-done/SKILL.md` read from disk

---

## Test Data Strategy

**Strategy:** Synthetic — tests read `skills/definition-of-done/SKILL.md` from disk and assert text patterns within the Step 6 section. No external data, no runtime session.

**Data owner:** Self-contained.

**PCI/sensitivity:** None.

---

## AC Coverage Table

| AC | Test(s) | Type | Gap |
|----|---------|------|-----|
| AC1 — measurement-ready gate question appears first in Step 6 | T1, T2 | Unit (content) | None |
| AC2 — "not yet" path records not-yet-measured + evidence note, moves on | T3, T4, T5 | Unit (content) | None |
| AC3 — "yes" path preserves normal signal-capture flow | T6 | Unit (content) | None |
| AC4 — DoD artefact records not-yet-measured with evidence note | T7 | Unit (content) | None |
| AC5 — mixed stories processed independently | T8 | Unit (content) | None |
| NFR-PERF — Step 6 completes in <30s on not-yet-measured path | Manual (Scenario 5) | Manual | Partial — runtime duration; structural proxy in T3–T5 |
| NFR-AUDIT — not-yet-measured outcome with evidence note in artefact | T7 | Unit (content) | None |

---

## Unit Tests

Test file: `tests/check-sri3-dod-step6-gate.js`

The Step 6 section in `skills/definition-of-done/SKILL.md` is identified by the heading `## Step 6` (currently at line 157 in the existing file). Tests operate on the text within that section.

**T1 — `dod-step6-contains-measurement-ready-gate-question`** (AC1)
- Precondition: `skills/definition-of-done/SKILL.md` exists
- Action: read file; extract the Step 6 section (text from `## Step 6` to the next `##` heading); assert presence of a measurement-ready gate question — pattern: `/measurement.*possible/i` OR `/possible.*yet/i` OR `/can.*measure/i` OR `/is.*measurement.*ready/i`
- Expected: pattern found in Step 6 section
- Currently: FAIL — Step 6 section contains no measurement-ready gate question

**T2 — `dod-step6-gate-question-precedes-signal-prompt`** (AC1)
- Action: read file; in the Step 6 section, find the character index of the gate question pattern (`/measurement.*possible/i` OR `/possible.*yet/i`) and the character index of the signal prompt (`/Signal:/i` OR `/on-track.*at-risk/i` OR `/signal.*quality/i`); assert gate question index < signal prompt index
- Expected: gate question appears before the signal prompt
- Currently: FAIL — no gate question exists; signal prompt appears first

**T3 — `dod-step6-not-yet-path-records-not-yet-measured`** (AC2)
- Action: read file; in the Step 6 section, assert presence of `not-yet-measured` label on the "no / not yet" answer path — pattern: `/not.yet.measured/i` within the Step 6 section
- Expected: pattern found
- Currently: FAIL — `not-yet-measured` value is mentioned at line 174 but not as a gate path with a "not yet" answer — it is a general signal option, not tied to a gate question

**T4 — `dod-step6-not-yet-path-requests-evidence-note`** (AC2)
- Action: read file; in the Step 6 section, assert that the "not yet" path instruction includes a prompt for an evidence note — pattern: `/evidence.*note/i` OR `/brief.*note/i` OR `/note.*why/i` OR `/describe.*why.*not/i`
- Expected: pattern found in Step 6
- Currently: FAIL

**T5 — `dod-step6-not-yet-path-moves-on-without-signal-prompts`** (AC2)
- Action: read file; in the Step 6 section, find the "not yet" / "not-yet-measured" path description; assert it contains language indicating the skill proceeds to the next story without requesting a metric value, trend, or rating — pattern: `/move.*on/i` OR `/next story/i` OR `/skip.*signal/i` OR `/no further/i` within a bounded window after the `not-yet-measured` label
- Expected: pattern found near the not-yet-measured label
- Currently: FAIL

**T6 — `dod-step6-yes-path-preserves-normal-signal-flow`** (AC3)
- Action: read file; in the Step 6 section, assert the normal signal-capture flow is still present — pattern: `/on-track/i` AND `/at-risk/i` AND `/off-track/i` within the Step 6 section
- Expected: patterns found (normal signal options unchanged)
- Currently: PASS (regression guard — normal signal values already exist in Step 6; assert they remain after the gate is added)
- Note: comment in test file: `// regression guard — normal Step 6 signal path must be preserved after gate insertion`

**T7 — `dod-step6-artefact-instruction-records-evidence-note`** (AC4, NFR-AUDIT)
- Action: read file; find the section describing what is written to the DoD artefact for Step 6 (pattern: `/artefact/i` OR `/State write/i` within or near Step 6); assert instruction specifies recording `not-yet-measured` with an evidence note — pattern: `/not.yet.measured.*evidence/i` OR `/evidence.*note.*artefact/i` OR `/record.*not.yet.measured/i`
- Expected: pattern found
- Currently: FAIL — state write instruction at line 178 does not include the evidence-note requirement for the not-yet-measured path

**T8 — `dod-step6-stories-processed-independently`** (AC5)
- Action: read file; in the Step 6 section, assert language indicating per-story processing — pattern: `/for each story/i` OR `/each story.*independently/i` OR `/next story/i` OR `/per story/i`
- Expected: pattern found
- Currently: PASS (Step 6 already processes stories in a loop — this is a regression guard confirming the gate addition does not break the per-story loop structure)
- Note: comment: `// regression guard — per-story loop structure must survive gate insertion`

---

## NFR Tests

**NFR-PERF — Step 6 completes in under 30 seconds on not-yet-measured path**

This NFR is partially covered by T3–T5 (structural proxy: the "not yet" path is short — gate question + evidence note + move on = maximum 3 interaction steps). The 30-second target is a runtime duration and cannot be fully asserted from content alone.

Gap: runtime duration not verifiable from SKILL.md content. Covered by manual Scenario 5 in the verification script. No additional test added here.

**NFR-AUDIT — evidence note in artefact** — covered by T7.

---

## Gap Table

| Gap | AC | Type | Handling |
|-----|-----|------|----------|
| NFR-PERF runtime duration (<30s) | sri.3 NFR | Manual | Scenario 5 in verification script; T3–T5 provide structural proxy (3-step not-yet path) |

---

## Integration Tests

None — single file change, no cross-component handoff.

---

## Test count summary

| Type | Count |
|------|-------|
| Unit (content assertion — must fail before impl) | 5 |
| Unit (regression guard — pass before and after) | 3 |
| NFR | 0 (runtime NFR covered by manual Scenario 5) |
| **Total** | **8** |
| Integration | 0 |
