# Test Output Format Standards

**Status:** Active
**Owned by:** Platform team

All test files added to `tests/` MUST emit output in one of the recognised formats below. Non-conforming output is **silently skipped** by the CI gate — no error is raised, and the story's AC coverage section in the PR audit comment will appear empty.

---

## Canonical Format (preferred for new stories)

```
[suite-name] Results: N passed, M failed
```

**Rules:**
- `[suite-name]` is a short lowercase identifier matching the pattern `[a-z][a-z0-9]*` (optionally followed by a hyphen suffix e.g. `[gpa-sc04]`)
- `N` and `M` are integer counts
- The word `Results:` is case-insensitive as parsed but should be written as shown for readability

**Example — conforming ✓:**
```
[gpa-sc04] Results: 8 passed, 0 failed
```

**Example — non-conforming ✗:**
```
Test gpa-sc04: 8 passed, 0 failed
```
*Why it fails:* Missing bracket-prefix format. The gate parser looks for `[key]` followed by `Results:`. Without the bracket prefix, the line does not match and the result is silently skipped — the PR audit comment will show no test coverage for this story.

---

## Alternate Formats (legacy — accepted but not recommended for new files)

The CI parser also accepts these two formats:

```
=== suite-name results: N passed, M failed ===
[suite-name-suffix] N run, N passed, M failed
```

**Constraint for the `===` format:** The key must match `[a-z][a-z0-9]*` — a lowercase letter followed only by alphanumeric characters (no hyphens). A key like `check-trw1-trace-writer` will **not** be captured (see Historical Context below).

---

## CI Parsing Regex

The assurance-gate.yml uses the following regex to parse test output. Any test file output that does not match one of the formats above will not be captured:

```
\[([a-z][a-z0-9]*)(?:-[^\]]+)?\]\s+(?:results?:?\s*|\d+\s+run,\s*)?(\d+)\s+passed,\s*(\d+)\s+failed
```

*(Quoted verbatim from `.github/workflows/assurance-gate.yml`. If the regex drifts from what is in the YAML, `tests/check-gpa-sc04-test-output-format.js` NFR-T1 will fail.)*

The alternate `===` format uses a second regex (also in assurance-gate.yml):

```
===\s+([a-z][a-z0-9]*)\s+results?:?\s*(\d+)\s+passed,\s*(\d+)\s+failed
```

---

## Historical Context: trw.1 Prefix Fix

The `trw.1` story (trace-writer fix, `2026-05-16-trace-writer-fix`) uncovered the silent-skip behaviour. The test file `tests/check-trw1-trace-writer.js` was originally emitting:

```
=== check-trw1-trace-writer results: N passed, M failed ===
```

This did **not** match the `===` format regex because the key `check-trw1-trace-writer` contains hyphens — the pattern `[a-z][a-z0-9]*` only accepts a lowercase letter followed by alphanumeric characters. The parser silently skipped the result, causing the story's AC coverage to appear missing in all PR audit comments.

The fix was to change the output prefix to the bracket format:

```
[trw1] results: N passed, M failed
```

The key `trw1` is short and hyphen-free, matching `[a-z][a-z0-9]*`. No change was made to the parser — the fix was entirely in the test file output line.

This incident established the requirement to document the format explicitly. New story authors should check this document before writing their first `console.log` summary line in a test file.

---

## Checklist for New Test Files

- [ ] Output prefix matches `[suite-name] Results: N passed, M failed`
- [ ] `suite-name` starts with a lowercase letter and contains only `[a-z0-9-]` (hyphens allowed as a suffix after the base key)
- [ ] Test file is registered in `package.json` test script
- [ ] PR audit comment shows the correct test coverage row after first CI run

---

## Test Strategy: Anti-Pattern Test for Consolidation/Extraction Stories (A2)

**Context:** A story that consolidates, extracts, or unifies logic from an inline implementation into a shared module (e.g. moving inline verdict logic into `governance-package.evaluateGate`).

**Problem:** A positive-path integration test (all checks pass → result is pass) does not verify that the verdict derives from the new module rather than the old inline path. Both the old and new paths can produce the same passing result, making the test blind to the consolidation actually having occurred.

**Pattern: Include a test that proves the old path is dead.**

The test injects a hook that returns a known result, while arranging all direct check inputs to produce the *opposite* result. If the verdict matches the hook's return — not the direct inputs — then the verdict is genuinely derived from the module, not the old inline logic.

**Template (injectable evaluator hook):**

```javascript
// IT3: verdict derived from evaluateGateRunner return, not inline checks
{
  // All checks fail individually
  const checks = [
    { name: 'check-a', passed: false, reason: 'deliberate failure' },
    { name: 'check-b', passed: false, reason: 'deliberate failure' },
  ];
  // But the injected runner returns pass
  const result = evaluateGate({
    gate: 'structural',
    context: {
      checks,
      evaluateGateRunner: (_ctx) => ({ passed: true, findings: [] }),
    },
  });
  // Verdict must be pass — derived from the runner, not the checks
  assert(result.passed === true, 'IT3: verdict derived from evaluateGateRunner return, not inline checks');
}
```

**When to use this pattern:**
- Any story whose AC includes "replaces inline verdict logic" or "delegates to shared module"
- Any story that extracts a function from a workflow action into a `scripts/` module
- Any story that consolidates two or more independent implementations behind a single interface

**When not to use this pattern:**
- Stories that add new behaviour (no old path to prove dead)
- Stories that only add tests, documentation, or standards files

**Source:** SC-02 IT3 (gpa-sc-02-unified-gate-evaluator). Established during GPA feature /improve 2026-05-25.
