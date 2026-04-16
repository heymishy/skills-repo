---
name: systematic-debugging
description: >
  Four-phase root cause debugging process. Random fixes waste time and create
  new bugs. The iron law: no fixes without root cause investigation first.
  Use when encountering any bug, test failure, unexpected behaviour, or build
  failure — before proposing any fix. Use especially when under time pressure,
  when a "quick fix" seems obvious, or when a previous fix didn't work.
triggers:
  - "debug this"
  - "fix this bug"
  - "tests are failing"
  - "something is broken"
  - "unexpected behaviour"
  - "I'm stuck on this"
  - "why is this failing"
---

# Systematic Debugging Skill

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose a fix.

---

## When to use

**Always:**
- Test failures
- Bugs in production code
- Unexpected behaviour
- Performance problems
- Build failures

**Use especially when:**
- Under time pressure (emergencies make guessing tempting)
- "Just one quick fix" seems obvious
- You've already tried several fixes
- A previous fix didn't work
- You don't fully understand the issue

---

## The four phases

Complete each phase before proceeding to the next. Do not skip ahead.

---

### Phase 1 — Root cause investigation

**Before attempting any fix:**

#### 1. Read error messages carefully

- Don't skip past errors or warnings
- Read stack traces completely
- Note line numbers, file paths, error codes
- Error messages often contain the exact solution

#### 2. Reproduce consistently

- Can you trigger it reliably?
- What are the exact steps to reproduce?
- Does it happen every time?
- If not reproducible → gather more data, don't guess

#### 3. Check recent changes

- What changed that could cause this? (`git diff`, recent commits)
- New dependencies, config changes
- Environmental differences

#### 4. Gather evidence in multi-component systems

When the system has multiple components (e.g. API → service → database, CI → build → signing):

**Before proposing fixes, add diagnostic instrumentation:**

For each component boundary:
- Log what data enters the component
- Log what data exits the component
- Check state at each layer

Run once to gather evidence showing **where** it breaks.
Then analyse evidence to identify the failing component.
Then investigate **that specific component**.

---

### Phase 2 — Pattern analysis

#### 1. Find working examples

- Locate similar working code in the same codebase
- What works that is similar to what is broken?

#### 2. Compare against references

- If implementing a pattern, read the reference implementation completely — do not skim
- Understand the pattern fully before applying

#### 3. Identify differences

- What is different between the working example and the broken code?
- List every difference, however small
- Do not assume "that can't matter"

#### 4. Understand dependencies

- What does this component need?
- What config, environment, or assumptions does it make?

---

### Phase 3 — Hypothesis and testing

#### 1. Form a single hypothesis

"I think **X** is the root cause because **Y**"

Write it down. Be specific.

#### 2. Test minimally

- Make the **smallest possible change** to test the hypothesis
- One variable at a time
- Don't bundle multiple changes

#### 3. Verify before continuing

- Worked? → Phase 4
- Didn't work? → Form a NEW hypothesis (do not add more fixes on top)

#### 4. When you don't know

- Say "I don't understand X"
- Don't pretend to know
- Ask for clarification or research more before proceeding

---

### Phase 4 — Implementation

#### 1. Create a failing test first (required before any fix)

Write the simplest possible test that reproduces the bug.
Use /tdd — write the failing test, watch it fail for the right reason, then fix.

```
The test must fail before the fix.
After the fix, the test must pass.
Never fix without a test.
```

#### 2. Implement a single fix

- Address the root cause identified in Phase 3
- ONE change at a time
- No "while I'm here" improvements
- No bundled refactoring

#### 3. Verify the fix

- The new test passes
- No other tests are broken
- The original symptom is resolved

#### 4. If the fix doesn't work — STOP

Count: how many fixes have you tried?

- Less than 3: return to Phase 1. Re-analyse with the new information.
- **3 or more: move to Phase 5 — question the architecture**

Do not attempt Fix #4 without first questioning the architecture.

---

### Phase 5 — Architectural review (after 3 failed fixes)

Patterns indicating an architectural problem:

- Each fix reveals new shared state, coupling, or a problem in a different place
- Fixes require "massive refactoring" to implement properly
- Each fix creates new symptoms elsewhere

**Stop. Ask these questions before continuing:**

- Is this design pattern fundamentally sound?
- Are we "sticking with it through inertia"?
- Should we refactor the architecture rather than continue fixing symptoms?

**Discuss with your human partner before attempting more fixes.**

This is not a failed hypothesis — this is a wrong architecture. Log the finding in /decisions.

---

## Common rationalisations

| Excuse | Reality |
|--------|---------|
| "Issue is simple, don't need the process" | Simple bugs have root causes too. The process is fast for simple bugs. |
| "Emergency, no time for the process" | Systematic debugging is faster than guess-and-check thrashing. |
| "Just try this first, then investigate" | The first fix sets the pattern. Do it right from the start. |
| "I'll write the test after confirming the fix works" | Fix without a test will recur. Test first proves it. |
| "Multiple fixes at once saves time" | Can't isolate what worked. Causes new bugs. |
| "One more fix attempt" (after 2+ failures) | 3+ failures = architectural problem. Question the pattern first. |

---

## Red flags — stop and return to Phase 1

If you catch yourself thinking:

- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- "One more fix attempt" (when you've already tried 2+)
- Each fix reveals a new problem in a different place

**All of these mean: STOP. Return to Phase 1.**

---

## Quick reference

| Phase | Key activities | Success criteria |
|-------|---------------|-----------------|
| 1. Root cause | Read errors, reproduce, check changes, gather evidence | Understand WHAT and WHY |
| 2. Pattern analysis | Find working examples, compare | Identify differences |
| 3. Hypothesis | Form theory, test minimally | Hypothesis confirmed or new one formed |
| 4. Implementation | Create failing test, fix, verify | Bug resolved, tests pass |

---

## Coupled-change workflow (use when a fix crosses contract layers)

When debugging a failure and the fix chain crosses `script → schema → state data → CI` (or any equivalent multi-layer contract boundary), classify it early as a coupled-change workflow and switch to stricter verification:

1. **Baseline snapshot first:** Before any edits, capture the current failing check logs, schema validation result, and a short map of touched contracts (state shape, schema, validator script, CI check name)
2. **Single-axis fix loops:** Change one contract layer at a time, then re-run only the closest validator before moving to the next layer — do not bundle changes across layers
3. **Dual-path hypothesis logging:** Explicitly track two hypotheses: (A) model/execution variability, (B) code/data coupling. Only promote one to root cause after gathering evidence from both
4. **Guard against shape drift:** When one phase stores object arrays and another stores slug arrays (or similar schema divergence), prefer compatibility patterns that preserve existing test navigation paths over normalising shapes mid-fix
5. **CI parity check early:** Run local checks with the same assumptions as CI (including schema toolchain) before final push — do not rely on `npm test` alone if CI runs additional validators (e.g. `validate-trace.sh --ci`)

This pattern applies whenever: a fix for check A reveals a problem in check B, or when fixing a script requires also fixing a schema which requires also fixing state data.

---

## Integration

**Use when:** any task fails during /tdd, /subagent-execution, or ad-hoc debugging
**Phase 4 uses:** /tdd (create failing test first)
**After fixing:** run /verify-completion before claiming the bug is resolved
**Architectural findings:** log in /decisions

---

## State update — mandatory final step

This skill does not advance the pipeline stage. It supports debugging within the inner loop and does not write to `pipeline-state.json` directly.

After the bug is resolved:
- Run `/verify-completion` — that skill handles the state write
- If an architectural finding was logged in `/decisions`, that skill handles its own write
