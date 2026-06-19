# [Story Title] — Implementation Plan

<!--
  USAGE: Produced by /implementation-plan. Consumed by /subagent-execution or /tdd.
  Every task has exact file paths, complete code, TDD steps, run commands
  with expected output, and a commit message.
  The implementing agent has zero codebase context — be explicit about everything.
  
  Save to: artefacts/[feature]/plans/[story-slug]-plan.md
  
  To evolve: update templates/implementation-plan.md and open a PR.
-->

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** [One sentence from DoR instructions block]
**Branch:** `feature/[story-slug]`
**Worktree:** `[path — e.g. .worktrees/[story-slug]]`
**Test command:** `[e.g. npm test / pytest / go test ./...]`

---

## File map

```
Create:
  [src/path/to/file.ts]         — [one-line responsibility]
  [tests/path/to/file.test.ts]  — [what it tests]

Modify:
  [src/path/to/existing.ts]     — [what changes and why]
```

---

## Task 1: [What this builds — one clear noun phrase]

**Files:**
- Create: `exact/path/to/file.ts`
- Test: `tests/exact/path/to/file.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
test('[AC description in plain language]', () => {
  // arrange
  const input = ...;
  // act
  const result = functionUnderTest(input);
  // assert
  expect(result).toBe(expected);
});
```

- [ ] **Step 2: Run test — must fail**

```bash
[test command] tests/path/to/file.test.ts
```

Expected output: `FAIL — [function name] is not defined` (or equivalent)

- [ ] **Step 3: Write minimal implementation**

```typescript
// Complete implementation — not a stub or reference
export function functionUnderTest(input: Type): ReturnType {
  return ...;
}
```

- [ ] **Step 4: Run test — must pass**

```bash
[test command] tests/path/to/file.test.ts
```

Expected output: `PASS`

- [ ] **Step 5: Run full suite — no regressions**

```bash
[test command]
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add exact/path/to/file.ts tests/exact/path/to/file.test.ts
git commit -m "feat: [what was implemented in imperative mood]"
```

---

<!-- Add Task 2, Task 3 etc. using the same Task N block structure above.
     One task per AC (or one logical behaviour if an AC is broad).
     Each task = 2–5 minutes of focused work. -->
