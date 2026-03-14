---
name: test-plan
description: >
  Writes a failing test plan for a story that has passed /review. Produces TWO outputs:
  (1) a technical test plan for the coding agent and CI; (2) a plain-language AC
  verification script for human review before coding and smoke testing after merge.
  Includes a test data strategy section â€” critical for payments and regulated systems.
  Use when someone says "write tests for", "create the test plan", "what tests do we
  need", or moves past a passed review. Requires a story artefact and passed review.
  Tests are written to fail â€” TDD discipline enforced.
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

Before asking anything, verify:

1. Story artefact exists at `.github/artefacts/[feature]/stories/[story-slug].md`
2. Review report exists showing PASS (no unresolved HIGH findings)
3. Story has at least 3 ACs in Given/When/Then format

If any condition is not met:

> âŒ **Entry condition not met**
> [Specific issue â€” e.g. "Review report not found. Run /review first."]
>
> Run /workflow to see the current pipeline state.

---

## Step 1 â€” Confirm the story

State what was found before asking anything:

> **Story loaded:** [story title]
> **ACs found:** [n]
> **Review status:** PASS (run [N], [date])
>
> Ready to write the test plan for this story?
> Reply: yes â€” or name a different story

---

## Step 2 â€” Confirm test context

> **What environment and framework applies?**
>
> 1. Use what's specified in copilot-instructions.md (standard â€” no need to ask)
> 2. Different stack for this story â€” I'll specify
>
> Reply: 1 or 2

If 2 â€” ask:

> **Specify the test framework and environment:**
> (e.g. Jest + React Testing Library, pytest + FastAPI TestClient, JUnit + Mockito)
>
> Reply: describe the stack

---

## Step 3 â€” Test data strategy

Ask this before writing any tests. Test data strategy shapes what tests are
possible â€” and surfaces PCI/sensitivity constraints early.

> **Where will test data come from for this story?**
>
> 1. Synthetic â€” generated in test setup, no real data involved
> 2. Fixtures â€” static files committed to the test repo
> 3. De-identified production data â€” scrubbed extract from real data
> 4. Seeded database â€” test environment with known state
> 5. Mocked external services â€” no real downstream calls
> 6. Mixed â€” I'll describe which ACs need what
>
> Reply: 1, 2, 3, 4, 5, or 6

After answer, ask one follow-up if relevant:

**If 3 (de-identified production data):**
> **Is this data in PCI scope, or does it contain other sensitive fields?**
> (e.g. PANs, CVVs, account numbers, NHI numbers, IRD numbers)
>
> 1. Yes â€” PCI or sensitivity constraints apply
> 2. No â€” standard test data handling is fine
>
> Reply: 1 or 2

**If 1 is selected:**
> **Who is responsible for providing the test data?**
> 1. Self-contained â€” tests generate their own data in setup/teardown
> 2. Platform team owns a shared test data set
> 3. I need to create this â€” not yet available
>
> Reply: 1, 2, or 3

Record the test data strategy in the plan. If test data is not yet available (3),
flag it:

> âš ï¸ **TEST DATA GAP:** Test data for [AC or test] is not yet available.
> This is a dependency before the coding agent can run the tests.
> Add to /decisions as RISK-ACCEPT or resolve before running /definition-of-ready.

---

## Step 4 â€” AC coverage confirmation

Display the AC list before writing tests. Confirm coverage expectations:

> **ACs to cover:**
> - AC1: [Given/When/Then summary]
> - AC2: [Given/When/Then summary]
> - AC3: [Given/When/Then summary]
> [+ any additional ACs]
>
> Any ACs you want to flag as potentially untestable before I start?
> Reply: none â€” or flag specific ACs

If an untestable AC is flagged:

> **AC[n] flagged as potentially untestable.**
>
> How do you want to handle it?
> 1. Manual step in the verification script only
> 2. Rewrite the AC to be testable (return to the story artefact)
> 3. Accept the gap and log in /decisions as RISK-ACCEPT
>
> Reply: 1, 2, or 3

---

## Two outputs, two audiences

This skill always produces two files:

| Output | Audience | Purpose |
|--------|----------|---------|
| Technical test plan | Coding agent, CI, developers | Agent implements against it; CI runs it |
| AC verification script | BA, QA, PM, domain expert | Pre-code sign-off; post-merge smoke test; demo |

Both cover the same ACs. The technical plan specifies *how* to test.
The verification script describes *what to check* in plain language.

Produce the technical plan first, then derive the verification script from it.

---

## Output 1: Technical test plan

Conforms to `.github/templates/test-plan.md`.
Save to `.github/artefacts/[feature]/test-plans/[story-slug]-test-plan.md`.

### TDD discipline

Tests are written before implementation. Every test must fail right now.
A test that would pass before implementation is testing the wrong thing â€”
note it explicitly if found.

### Test data section (include in every plan)

The Test Data Strategy section is defined in `.github/templates/test-plan.md`.
Populate it with the answers from Step 3 before writing the individual test entries.

### AC coverage table

| AC | Unit tests | Integration tests | NFR tests | Manual (script only) |
|----|-----------|------------------|-----------|---------------------|
| AC1 | [n] | [n] | â€” | â€” |

Every AC must have at least one test. Untestable ACs must have a manual scenario
in the verification script.

### Unit tests

For each test: name (verb + what + condition), which AC it covers, precondition,
action, expected result, edge case flag.

### Integration tests

Identify seams â€” where one component or layer hands off to another.
Write integration tests for those handoffs specifically.

### NFR tests

One test per NFR from the story. If NFRs says "None â€” confirmed", write no
NFR tests and state this explicitly.

### Gap table

| Gap | Reason | Handling |
|-----|--------|---------|
| [description] | [why untestable] | Manual scenario in verification script |

---

## Output 2: AC verification script

Conforms to `.github/templates/ac-verification-script.md`.
Save to `.github/artefacts/[feature]/verification-scripts/[story-slug]-verification.md`.

### Translation rules

**From technical:** `expect(getExportFilename('csv')).toBe('canvas-export-2026-03-10.csv')`
**To human:** "Click Export CSV. A file should download. Check the filename â€” it should
be `canvas-export-` followed by today's date, ending in `.csv`."

- Use "click", "type", "press" â€” not "navigate to" or "interact with"
- Name UI elements exactly as they appear on screen
- Quote expected messages verbatim
- Describe file contents concretely â€” not "the file should be correct"
- One scenario per AC, plus one for each acknowledged test gap
- Each scenario completable in under 2 minutes
- Reset instructions between scenarios if they share state

### The script serves three moments

Write it so it works equally well for all three without modification:

1. **Pre-code sign-off** â€” domain expert confirms the described behaviour is correct
   before the coding agent implements. Reviewing the *specification*, not the code.
2. **Post-merge smoke test** â€” confirms shipped behaviour matches the script.
   Reviewing the *implementation* against the specification.
3. **Sprint demo** â€” structured walkthrough for stakeholders.

---

## Completion output

> **Test plan complete for [story title] âœ…**
>
> Technical test plan: `.github/artefacts/[feature]/test-plans/[story-slug]-test-plan.md`
> [n] unit | [n] integration | [n] NFR tests | [n] ACs covered
> [If gaps:] âš ï¸ [n] gap(s) â€” represented as manual scenarios
>
> Verification script: `.github/artefacts/[feature]/verification-scripts/[story-slug]-verification.md`
> [n] scenarios | [n] edge cases | [n] manual gap scenarios
>
> Test data: [Synthetic / ready / âš ï¸ gap â€” see plan]
>
> **Recommended next step:**
> Share the verification script with a domain expert to confirm the described
> behaviour is correct â€” this is the human gate before coding begins.
>
> Ready to run /definition-of-ready for this story?
> Reply: yes â€” or review the plan first

---

## Quality checks before outputting

**Technical test plan:**
- Every AC has at least one test
- Every test has a specific expected result â€” not "works correctly"
- Test data strategy section is populated â€” not blank
- PCI/sensitivity constraints stated if applicable
- Test data gaps flagged with owner and action
- NFR tests exist for every NFR (or "None â€” confirmed" stated)
- Gap table populated or states "No gaps"

**Verification script:**
- Every AC has a scenario
- Every test gap has a manual scenario
- Plain language throughout â€” no technical terms
- Expected outcomes quote exact messages and describe exact contents
- Reset instructions present if scenarios share state
- Setup section clear enough for someone unfamiliar with the system

---

## What this skill does NOT do

- Does not implement tests â€” writes specifications for the coding agent
- Does not run tests â€” implementation does not exist yet
- Does not source test data â€” identifies what is needed and flags gaps
- Does not replace a full QA test strategy
- Does not generate E2E test plans â€” separate concern

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

When the test plan is saved, for each story update `.github/pipeline-state.json` in the **project repository**:

- Set `stage: "test-plan"`, `updatedAt: [now]`
- Set `testPlan: { status: "written", totalTests: [count], passing: 0 }`
- Set `acTotal: [count of ACs in the story]`, `acVerified: 0`
- Set `health: "green"`
