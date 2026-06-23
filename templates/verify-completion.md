# Verify Completion: [Story Title]

<!--
  USAGE: Produced inline by /verify-completion during a session.
  Records test run results and AC-by-AC verification walk-through.
  
  The AC verification script (artefacts/[feature]/verification-scripts/
  [story-slug]-verification.md) contains the plain-language scenarios to walk through.
  
  This artefact is produced in-session — not typically saved as a separate file
  unless the team chooses to archive verification evidence.
  
  To evolve: update templates/verify-completion.md and open a PR.
-->

**Story:** [story title]
**Branch:** `[branch name]`
**Test run date:** [YYYY-MM-DD]
**Test command:** `[command used]`

---

## Test suite results

```
Tests:       [N passing] / [N total]
Test Suites: [N passed] / [N total]
Failures:    [None — or list test names]
```

---

## AC verification

| AC | Test(s) | Result | Evidence |
|----|---------|--------|---------|
| AC1: [title] | `[test name]` | ✅ Verified / ❌ Not verified | [quote from test output] |
| AC2: [title] | `[test name]` | ✅ / ❌ | |
| AC3: [title] | `[test name]` | ✅ / ❌ | |

---

## Scope check

Commits on branch not corresponding to an AC or task in the implementation plan:

[None — or list commit messages with /decisions reference logged]

---

## Outcome

> ✅ **Verification passed** — all [N] ACs verified, [N] tests passing, no scope outside DoR.
> Ready to run /branch-complete.

*or*

> ❌ **Verification failed** — [what failed]. Fix and re-run from Step 1.
