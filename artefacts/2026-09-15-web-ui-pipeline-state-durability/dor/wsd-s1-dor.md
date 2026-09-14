# Definition of Ready Checklist

## Definition of Ready: Extract cli-advance.js's mutation core into a reusable, state-object-based function

**Story reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/stories/wsd-s1.md
**Test plan reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/test-plans/wsd-s1-test-plan.md
**Review reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/review/wsd-s1-review-1.md (PASS)
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-15

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona is a system consumer (wsd-s2), acknowledged as LOW finding in review — legitimate for a pure-refactor prerequisite story |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs |
| H3 | Every AC has at least one test/verification method | ✅ | T1-T9 map onto AC1-AC3 |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | "Pipeline-state accuracy for web-UI-originated features" |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ | 0 HIGH; 1 MEDIUM resolved in-pass (see review) |
| H8 | Test plan has no uncovered ACs | ✅ | All 3 ACs covered, several by 2+ tests |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated with exact line-number references; Category E scored 5 |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | Not a UI/layout change |
| H-NFR | NFR profile or explicit "None" field | ✅ | Backward compatibility, Performance addressed |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ | Hamish King — Operator — 2026-09-15 |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapter — pure function extraction, no `setX()`/`getX()` seam introduced |
| H-INF | Infra-plan gate | ✅ N/A | Pure application code refactor |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Test plan follows established mocking/fixture conventions already used elsewhere in this repo | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ N/A | No gap table — all ACs directly covered | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Extract cli-advance.js's mutation core into a reusable,
       state-object-based function
       -- artefacts/2026-09-15-web-ui-pipeline-state-durability/stories/wsd-s1.md
Test plan: artefacts/2026-09-15-web-ui-pipeline-state-durability/test-plans/wsd-s1-test-plan.md

Goal:
Extract src/enforcement/cli-advance.js's field-parsing/validation and
state-mutation logic (currently lines 53-117 and 128-222) into a new
exported function applyAdvance(state, featureSlug, storyId, rawFields)
that operates on an in-memory state object, returning
{ exitCode, stdout, stderr, state, storyWasCreated }. The existing
advance(featureSlug, storyId, rawFields, repoRoot) becomes a thin
wrapper: keep its existing repoRoot resolution + traversal guard +
file read (lines 112-126) and file write (lines 224-232) exactly as
they are today, but call applyAdvance() for everything in between
instead of duplicating that logic inline.

Constraints:
- Zero behavioural change to advance()'s external signature, return
  shape, or observable behaviour for any existing caller (bin/skills,
  pipeline-state-writer.js's own local-fs path).
- storyWasCreated must be a real field on applyAdvance()'s return
  object, not only embedded in the human-readable stderr string (AC3).
- Do not change any validation RULE (ENUM_FIELDS, BOOLEAN_FIELDS,
  STRING_FIELDS, prototype-pollution guard) -- pure structural
  extraction only.
- New test file tests/check-wsd-s1-advance-core-extraction.js per the
  test plan. Re-run tests/check-pcr-s1-pipeline-state-scope.js and
  tests/check-shr1-schema-harness.js -- both must pass unchanged.
- This is a governed src/ change (CLAUDE.md Artefact-first rule) --
  route through the normal worktree -> PR -> merge path, open a draft
  PR, then mark it ready immediately per established practice.
- wsd-s2 depends on this story's applyAdvance() export -- merge this
  story before starting wsd-s2's implementation.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No further sign-off — the operator explicitly requested this feature go through the full standard-track outer loop directly in conversation on 2026-09-15, following a live-verified root-cause investigation.
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-15 — operator approval: heymishy, 2026-09-15 (in-conversation)

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
