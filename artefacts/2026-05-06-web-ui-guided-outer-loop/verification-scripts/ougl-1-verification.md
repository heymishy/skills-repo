# AC Verification Script — ougl.1: buildSystemPrompt handoff extension

**Story:** ougl.1 — buildSystemPrompt prior-artefact handoff parameter
**Verified by:** Developer / tech lead (code review + unit test output)
**When to run:** After implementation, before opening PR. Run again after merge.

---

## Pre-conditions

- Node.js v22+ installed
- Working directory: repo root
- No server startup required — these are unit tests

---

## Run command

```powershell
node tests/check-ougl1-buildsystemprompt-handoff.js
```

**Expected output before implementation:** Tests T1.2–T1.6 fail (FAIL lines in output). T1.1, T1.7, T1.8 pass.

**Expected output after implementation:** All 8 tests pass. `Failed: 0`.

---

## AC Scenario Walkthroughs

### AC1 — No 4th arg → no HANDOFF block
1. In `tests/check-ougl1-buildsystemprompt-handoff.js`, test T1.1 calls `buildSystemPrompt('discovery', '/tmp/x', tmpdir)` without a 4th argument.
2. Assert the returned string does NOT contain `--- HANDOFF CONTEXT ---`.
3. PASS if the string is absent. FAIL if the block appears when no prior artefacts are supplied.

### AC2 — With priorArtefacts → handoff block present
1. Test T1.2 calls `buildSystemPrompt('benefit-metric', '/tmp/x', tmpdir, [{ path: 'artefacts/test/discovery.md', content: 'Content.' }])`.
2. Assert the returned string contains `--- HANDOFF CONTEXT ---`.
3. PASS if block is present. FAIL if the 4th argument is ignored.

### AC3 — Prior artefact path in header
1. Test T1.3 checks the returned string contains `--- PRIOR ARTEFACT: artefacts/test/discovery.md ---`.
2. PASS if the path appears in the header marker. FAIL if path is absent or malformed.

### AC4 — Content between header and END marker
1. Test T1.4 finds the header index and END marker index. Checks the content is in the slice between them.
2. PASS if content appears inside the markers. FAIL if content is outside or absent.

### AC5 — HANDOFF block before WEB UI PROTOCOL
1. Test T1.5 compares `indexOf('--- HANDOFF CONTEXT ---')` with `indexOf('--- WEB UI PROTOCOL ---')`.
2. PASS if handoff index is lower (earlier in the string). FAIL if handoff appears after WEB UI PROTOCOL.

### AC6 — Two prior artefacts → two distinct blocks
1. Test T1.6 counts occurrences of `--- PRIOR ARTEFACT:` and `--- END PRIOR ARTEFACT ---`. Asserts both equal 2.
2. PASS if both counts are 2. FAIL if only one block is rendered.

### AC7 — Empty array → no HANDOFF block
1. Test T1.7 calls with `priorArtefacts: []`. Asserts no HANDOFF block.
2. PASS if string has no HANDOFF. FAIL if empty array triggers the block.

### AC8 — Existing callers not broken
1. Test T1.8 verifies `--- WEB UI PROTOCOL ---` is still present in a 3-arg call.
2. PASS if WEB UI PROTOCOL section exists. FAIL if the 4th-arg extension broke the existing prompt.

---

## Post-implementation smoke check

After wiring in the full server, open a skill session via the web UI, complete the session (get an artefact), then trigger gate-confirm to advance to the next skill. In the browser devtools, check the network call to the second session. The second session's first assistant message should reference context from the prior skill — confirming the handoff block reached the model.
