# Make the coha-s7 structural tests pass in a Windows checkout with CRLF line endings - Implementation Plan

> Single task; executed in this session with /tdd (test-only change, no subagent needed).

**Goal:** Normalise CRLF to LF where `tests/check-coha-s7-error-issue-incident.js` reads the workflow, and add UT1 and UT2.
**Branch:** `feature/cwt-s1-make-the-coha-s7-test-line-ending-safe`
**Worktree:** `.worktrees/cwt-s1-make-the-coha-s7-test-line-ending-safe`
**Test command:** `node tests/check-coha-s7-error-issue-incident.js`

## File map
```
Modify:
  tests/check-coha-s7-error-issue-incident.js - line 732 normalised read; two tests added after the topText declaration (line ~750)
```

## Task 1: Normalised read plus UT1 and UT2 (AC1, AC2, AC3)

- [ ] Step 1 (RED): append UT1 (`assert.strictEqual(wf.indexOf('\r'), -1)`) and UT2 (normalise a CRLF copy of `wf` with the same helper, apply the W3 pattern to the text before `jobs:`; a copy with `cancel-in-progress: true` must not match) as tests; run: this CRLF worktree gives W3, W5 and UT1 failing (44 existing: 42 pass, plus UT2 passing).
- [ ] Step 2 (GREEN): change line 732 to `const wf = (fs.existsSync(WORKFLOW) ? fs.readFileSync(WORKFLOW, 'utf8') : '').replace(/\r\n/g, '\n');`
- [ ] Step 3: run: `Results: 46 passed, 0 failed`; check non-ASCII count is 0; confirm nothing else changed with `git diff --stat`.
- [ ] Step 4: commit `fix: normalise line endings when the coha-s7 test reads the workflow`.