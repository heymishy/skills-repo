---
name: test-plan
description: >
  Writes a failing test plan for a story that has passed /review. Produces TWO outputs:
  (1) a technical test plan conforming to templates/test-plan.md — for the coding agent 
  and CI; (2) a plain-language AC verification script conforming to 
  templates/ac-verification-script.md — for human review before coding and smoke 
  testing after merge. Use when someone says "write tests for", "create the test plan", 
  "what tests do we need", or moves past a passed review. Requires a story artefact 
  and a passed review report. Tests are written to fail — TDD discipline.
triggers:
  - "write tests for"
  - "create the test plan"
  - "what tests do we need"
  - "test plan for"
  - "TDD"
  - "write failing tests"
  - "verification script"
---

# Test Plan Skill

## Entry condition check

**Before proceeding**, verify:

1. Story artefact exists at `.github/artefacts/[feature]/stories/[story-slug].md`
2. Review report exists for this story showing PASS (no HIGH findings)
3. Story has at least 3 ACs in Given/When/Then format

If any condition is not met, output:

> ❌ **Entry condition not met**
> [Specific issue]
> Run `/workflow` to see the current pipeline state.

---

## Two outputs, two audiences

This skill always produces two files:

| Output | Audience | When used |
|--------|----------|-----------|
| Technical test plan | Coding agent, CI, developers | Coding agent implements against it; CI runs it |
| AC verification script | Anyone — BA, QA, PM, domain expert | Pre-code sign-off; post-merge smoke test; demo script |

Both files cover the same ACs. The technical plan specifies *how* to test. 
The verification script describes *what to check* in plain language.

Produce the technical test plan first, then derive the verification script from it.

---

## Output 1: Technical test plan

Conforms to `.github/templates/test-plan.md`.
Save to `.github/artefacts/[feature]/test-plans/[story-slug]-test-plan.md`.

### Discipline: tests are written to fail

Tests are written before implementation exists. Every test in this plan should 
fail if run right now. A test that passes before implementation is either testing 
the wrong thing or validating pre-existing behaviour — note this explicitly.

### AC coverage mapping

For every AC in the story, identify what tests are needed.
Populate the AC coverage table first — this is the contract.
Every AC must have at least one test. If you cannot write a test for an AC, flag:

> ⚠️ **UNTESTABLE AC:** AC[n] cannot be automatically tested because [reason].
> Options: (a) manual step in verification script, (b) rewrite AC to be testable,
> (c) accept the gap. Human decision required — add to /decisions as RISK-ACCEPT.

### Unit tests

For each AC: test name (verb + what + condition), which AC it verifies,
precondition, action, expected result, whether it's an edge case.

### Integration tests

Identify the seams — where one component or layer hands off to another.
Write integration tests for those handoffs.

### NFR tests

One test per NFR from the story. If NFRs section says "None — confirmed", 
write no NFR tests and note this explicitly.

### Gap assessment

Honest assessment of what cannot be tested automatically and why.
Every gap must be represented in the verification script as a manual step.

---

## Output 2: AC verification script

Conforms to `.github/templates/ac-verification-script.md`.
Save to `.github/artefacts/[feature]/verification-scripts/[story-slug]-verification.md`.

### Derivation rules

Translate each AC and its corresponding tests into plain-language steps:

**From technical:** `expect(getExportFilename('csv')).toBe('canvas-export-2026-03-10.csv')`
**To human:** "Click 'Export CSV'. A file should download. Check the filename — 
it should be `canvas-export-` followed by today's date, ending in `.csv`."

**Language rules:**
- Use "click", "type", "press" — not "navigate to" or "interact with"
- Name UI elements exactly as they appear on screen
- Quote expected messages verbatim
- Describe file contents concretely — not "the file should be correct" 
  but "the file should have a header row with these columns: title, x-axis..."
- One scenario per AC, plus a scenario for each acknowledged test gap
- Each scenario should be completable in under 2 minutes

### What goes in the verification script that isn't in the test plan

- Any test gaps acknowledged in the technical plan → become manual scenarios
- Any NFR that was marked as needing manual verification
- The "reset state" instructions between scenarios — these aren't in unit tests 
  but are essential for a human running scenarios sequentially
- Edge cases worth a human eye even if covered by automated tests — 
  particularly accessibility (does it feel right?) and error messages 
  (does the wording make sense to a real user?)

### Verification script serves three moments

Write the setup section with all three in mind:

1. **Pre-code sign-off** — human expert confirms the described behaviour is 
   correct before the coding agent implements it. Reviewer is checking the 
   *specification*, not the implementation.
2. **Post-merge smoke test** — human confirms shipped behaviour matches.
   Reviewer is checking the *implementation* against the specification.
3. **Sprint demo** — structured walkthrough for stakeholders.
   Presenter follows the script as a demo flow.

The script should work equally well for all three without modification.

---

## After producing both outputs

State:

> "Two outputs produced for [story title]:
>
> **Technical test plan:** `.github/artefacts/[feature]/test-plans/[story-slug]-test-plan.md`
> [n] unit tests, [n] integration tests, [n] NFR tests covering all [n] ACs.
> [If gaps:] [n] gaps noted — represented as manual scenarios in the verification script.
>
> **Verification script:** `.github/artefacts/[feature]/verification-scripts/[story-slug]-verification.md`
> [n] scenarios covering all ACs + [n] edge cases + [n] manual gap scenarios.
>
> **Recommended next step:** Share the verification script with a domain expert 
> to confirm the described behaviour is correct before running /definition-of-ready.
> This is the human gate before the coding agent begins.
>
> Then run `/definition-of-ready` for this story."

---

## Quality checks before outputting

**Technical test plan:**
- Every AC has at least one test — no AC is uncovered
- Every test has a specific expected result — not "works correctly"
- NFR tests exist for every NFR (or explicitly "None — confirmed")
- Gap table is populated or explicitly states "No gaps identified"

**Verification script:**
- Every AC has a scenario — no AC is untranslated
- Every test gap has a manual scenario
- Steps use plain language — no technical jargon
- Expected outcomes quote exact messages and describe exact file contents
- Setup section is clear enough for someone unfamiliar with the system
- Reset instructions exist if scenarios affect shared state

## What this skill does NOT do

- Does not implement tests — writes specifications for them
- Does not run tests — implementation doesn't exist yet
- Does not replace a full QA test strategy
- Does not generate E2E test plans — separate concern
