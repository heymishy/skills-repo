# Definition of Ready Checklist

## Definition of Ready: Fix web-UI-to-CLI artefact splitter parity bugs (definition + review)

**Story reference:** artefacts/2026-09-15-artefact-splitter-fidelity/stories/asf-s1-fix-splitter-parity-bugs.md
**Test plan reference:** artefacts/2026-09-15-artefact-splitter-fidelity/test-plans/asf-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-15

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "an operator moving a feature between the web UI and Claude Code CLI on the same repo" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test/verification method | ✅ | T1-T10 map onto AC1-AC6 (see test plan) |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track correctness fix — directly follows from investigating a real feature's corrupted split artefacts |
| H6 | Complexity is rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips `/review` |
| H8 | Test plan has no uncovered ACs | ✅ | All 6 ACs covered |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — exact file/line grounding for both splitters, plus the real-world edge case (both special-prose regions sharing one gap) discovered and fixed during implementation |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | Not a UI/layout change |
| H-NFR | NFR profile or explicit "None" field | ✅ | Correctness, Safety, Performance addressed |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapter — both functions remain pure, called the same way from `skills.js` |
| H-INF | Infra-plan gate | ✅ N/A | Pure application code change, no infra/deploy-config change |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | Real-world edge case discovered mid-implementation | ✅ | The initial fix design assumed the AC block and So-that sentence always sit in separate gaps; the real `af17f555` fixture showed they can share one gap, which the first implementation attempt got wrong (caught by the fixture-based test itself, not review). Documents the value of testing against real, unmodified production content rather than synthetic-only fixtures. | Claude Sonnet 5 (orchestrating agent) |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Test plan follows this repo's own established regression-fixture pattern (real, unmodified content, not synthetic-only) | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ N/A | No gap table — all ACs directly covered | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Fix web-UI-to-CLI artefact splitter parity bugs (definition + review)
       -- artefacts/2026-09-15-artefact-splitter-fidelity/stories/asf-s1-fix-splitter-parity-bugs.md
Test plan: artefacts/2026-09-15-artefact-splitter-fidelity/test-plans/asf-s1-test-plan.md

Goal:
Fix definition-artefact-splitter.js's broken User Story template and
AC-block-absorption bug, and review-artefact-splitter.js's silent
default-to-PASS bug on an unparseable verdict.

Constraints:
- src/web-ui/utils/definition-artefact-splitter.js:
  - Add a findSpecialRegions() step that locates both the AC
    Given/When/Then block and the "So that [goal], I need [need]."
    sentence BEFORE computing any field's section via sectionFor() --
    pass their start indices as sectionFor()'s new excludeStarts
    parameter so neither region can be absorbed into an adjacent
    labeled field.
  - Handle the real-world case where both special regions share the
    SAME gap between two recognised fields (confirmed in
    artefacts/new-feature-af17f555/definition.md) -- split the gap at
    its own "Given" marker rather than regex-matching the whole gap
    for each pattern independently.
  - The User Story template gets a genuine third line: "I want
    **[need]**," sourced from the extracted sentence, never from the
    Benefit Linkage field.
  - Do NOT change the module's existing graceful-degradation contract
    for a completely unrecognised artefact shape (still returns
    { epics: [], stories: [] }).
- src/web-ui/utils/review-artefact-splitter.js:
  - Verdict extraction must recognise both the instructed flat
    "**Verdict:** PASS|FAIL" form and a heading-prefixed/decorated
    form ("### Verdict: **FAIL** (Category C)").
  - NEVER default an unparseable verdict to 'PASS' (or anything else)
    -- when verdict cannot be confidently resolved to exactly PASS or
    FAIL, skip writing that story's split file entirely and log a
    warning identifying the story slug.
  - When a verdict IS resolved but the instructed
    "### HIGH findings" heading structure is absent, the findings
    sections must state plainly that per-severity findings could not
    be reliably extracted -- never a bare "None." that would read as
    an exhaustive empty list.
- New test file tests/check-asf-s1-splitter-parity-bugs.js, using the
  real artefacts/new-feature-2b74a292/definition.md and review.md as
  regression fixtures (both real, unmodified production content that
  originally exposed these bugs) -- matching this repo's own
  established real-fixture testing pattern.
- Re-run tests/check-defs-s1-definition-artefact-splitter.js,
  tests/check-revs-s1-review-artefact-splitter.js, and
  tests/check-defs-revs-s1-wiring-into-turn-completion.js -- all must
  still pass unchanged.
- This is a governed src/ change (CLAUDE.md Artefact-first rule) --
  route through the normal worktree -> PR -> merge path, open a draft
  PR, then mark it ready immediately per this session's established
  practice.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No further sign-off — the operator explicitly asked to fix both splitters directly in conversation on 2026-09-15, after independently confirming the root cause via direct investigation of the affected production files and the relevant source code.
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-15 — operator approval: heymishy, 2026-09-15 (in-conversation)

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
