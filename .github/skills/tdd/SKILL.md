---
name: tdd
description: >
  Enforces RED-GREEN-REFACTOR for every implementation task. Write the failing
  test first. Watch it fail. Write minimal code. Watch it pass. Refactor without
  adding behaviour. The iron law applies without exception: no production code
  without a failing test first. Use when implementing any task, feature, or
  bugfix. Pairs with /systematic-debugging when stuck on a failing task.
triggers:
  - "implement this"
  - "write the code"
  - "TDD"
  - "red green refactor"
  - "make this test pass"
  - "write this task"
  - "coding loop"
---

# TDD Skill — Test-Driven Development

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? **Delete it. Start over.**

No exceptions:
- Don't keep it as "reference"
- Don't "adapt" it while writing tests
- Delete means delete

Implement fresh from the test. Period.

---

## RED — Write the failing test

Write one minimal test that describes a single behaviour.

**Good test:**

```typescript
test('rejects an empty email address', () => {
  const result = validateEmail('');
  expect(result.valid).toBe(false);
  expect(result.error).toBe('Email is required');
});
```

- Clear name that reads as a requirement
- Tests real behaviour, not implementation details
- One thing only — "and" in the test name? Split it.

**Bad test:**

```
test('email validation works') {
  mock = createMock().returns(true);
  expect(mock.call()).toBe(true);
}
```

*(Pseudocode — adapt to your test framework's mock API, e.g. `jest.fn()`, `vi.fn()`, `mocker.patch`, `allow(...).to receive`)*

- Vague name
- Tests a mock, not real code

**Requirements for the RED test:**

- One behaviour
- Name describes the requirement
- Uses real code — mocks only if unavoidable (external API, clock, RNG)

---

## Verify RED — Watch it fail

**MANDATORY. Never skip.**

```bash
[test command] [test file path]
```

Confirm:

- Test **fails** (not errors due to syntax or import issues)
- Failure message describes the missing feature
- Test did NOT pass (if it passes, you are testing existing behaviour — fix the test)

Test errors? Fix the error, re-run until it **fails for the right reason**.

---

## GREEN — Write minimal code

Write the **simplest code** that makes the test pass.

**Good:**

```typescript
function validateEmail(email: string): ValidationResult {
  if (!email.trim()) {
    return { valid: false, error: 'Email is required' };
  }
  return { valid: true };
}
```

Just enough to pass. Nothing more.

**Bad:**

```typescript
function validateEmail(
  email: string,
  options?: { allowEmpty?: boolean; checkDomain?: boolean; maxLength?: number }
): ValidationResult {
  // YAGNI
}
```

Over-engineered. Write this only when tests demand it.

Rules:

- Do not add features the current test doesn't demand
- Do not refactor other code while making this test pass
- Do not "improve" beyond what the test requires

---

## Verify GREEN — Watch it pass

**MANDATORY.**

```bash
[test command] [test file path]
```

Confirm:

- Test **passes**
- Other tests still pass (no regressions)
- No errors or warnings in output

Test fails? Fix the implementation — not the test.
Other tests fail? Fix now before continuing.

---

## REFACTOR — Clean up

After all tests are green:

- Remove duplication
- Improve names
- Extract helpers if they clarify intent

Keep all tests green throughout refactor.

**Do not add new behaviour during refactor.**

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` in the **project repository** as you progress through each TDD cycle.

**Before the first task:** ensure the story has a `tasks` array initialised with one entry per task. If `/implementation-plan` was run first it will already exist; if starting TDD directly, create it now:
```json
{
  "id": 1,
  "name": "<task name from implementation plan>",
  "tddState": "not-started",
  "file": "artefacts/[feature-slug]/plans/[story-slug]-plan.md"
}
```
All tasks in a story share the same plan `file` path. The visualiser renders each task name as a clickable link to that file.

Update `tddState` as the cycle progresses:
- Task begins, failing test written: `"tddState": "red"`
- Minimal implementation makes test pass: `"tddState": "green"`
- Refactor complete, all tests still pass: `"tddState": "refactor"`
- Task committed: `"tddState": "committed"`

Update `testPlan.passing` on the story after every test run where you can read the passing count from the output. The visualiser reads this field live — keep it current.

Also update `updatedAt` on the story after each state change.

If you can't write or run tests, set the story `health: "amber"` and record the reason in `blocker`.

**Parent propagation (apply to every inner loop state write):**
- Always update the feature-level `updatedAt: [now]` — the visualiser staleness timer reads this field; if only the story `updatedAt` is written the feature card shows "STALE PROC"
- Recompute the parent epic `status` from its stories: if every story in the epic is done (`dodStatus: "complete"`, `prStatus: "merged"`, or all tasks `tddState: "committed"`), set epic `status: "complete"`; if any story has an active inner loop stage, set `status: "in-progress"`; otherwise `"not-started"`

---

## Repeat

Move to the next failing test for the next behaviour.

If working from an implementation plan, check off each step in the task as you go.

---

## Common rationalisations

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll write tests after" | Tests written after code pass immediately and prove nothing. |
| "Already manually tested it" | Manual testing is ad-hoc and not repeatable. |
| "Deleting my work is wasteful" | Sunk cost. Unverified code is technical debt. |
| "TDD will slow me down" | TDD is faster than debugging. Systematic is faster than guessing. |
| "Tests after achieve the same goals" | Tests-after answer "what does this do?" Tests-first answer "what should this do?" |
| "Just this once" | There is no "just this once". |

---

## Red flags — stop and restart

Any of these mean: **delete the code, return to RED**:

- You wrote production code before a failing test
- The test passed immediately after writing it
- You can't explain why the test failed
- You added tests "to cover" code you already wrote
- You're "adapting" existing code rather than starting from the test
- You rationalised skipping the process "just this once"

---

## Verification checklist

Before marking any task complete:

- [ ] Every new function/method has a test that was written first
- [ ] Watched each test fail before implementing
- [ ] Each test failed for the expected reason (missing feature, not typo)
- [ ] Wrote minimal code to make each test pass
- [ ] All tests pass with no regressions
- [ ] Output is clean (no errors, warnings)
- [ ] Edge cases and error paths covered

Can't check all boxes? You skipped TDD. Start over.

---

## When stuck

| Problem | Solution |
|---------|----------|
| Don't know how to write the test | Write the assertion first. What would "working" look like? |
| Test is too complicated | The design is too complicated. Simplify the interface. |
| Must mock everything | Code too coupled. Consider dependency injection. |
| 3+ attempts haven't fixed it | Run /systematic-debugging |

---

## Integration

**Use during:** /subagent-execution (subagents follow TDD per task), and step-by-step execution of tasks from /implementation-plan
**When stuck:** run /systematic-debugging
**Before claiming done:** run /verify-completion

> **Capture signal:** Write design insights or patterns surfaced during RED→GREEN to `workspace/capture-log.md` (source: agent-auto).
