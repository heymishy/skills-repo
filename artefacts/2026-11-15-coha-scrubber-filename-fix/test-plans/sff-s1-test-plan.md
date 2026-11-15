## Test Plan: Keep a placeholder filename on every scrubbed stack frame so PostHog accepts the error events

**Story reference:** artefacts/2026-11-15-coha-scrubber-filename-fix/stories/sff-s1-keep-a-filename-on-every-scrubbed-frame.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-15
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; each file is a plain Node assert-based script. Existing file extended: `tests/check-coha-s5-error-capture.js`. New fixture: `tests/fixtures/sff-s1-posthog-frames.json`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Every scrubbed frame has a string `filename` (repo path or `[redacted]`) | 3 (UT1, UT2, UT3) | - | - | - | - | 🟢 |
| AC2 | No canary text reaches the placeholder; existing canary tests pass; one assertion deliberately changed | 2 (UT4, UT5) | - | - | - | - | 🟢 |
| AC3 | Real captured frame shapes: schema check true after, false before | 1 (UT6) | - | - | - | - | 🟢 |
| AC4 | End to end through real `createApp()` in a child process | - | 1 (IT1) | - | - | - | 🟢 |
| AC5 | Live: staging events accepted by PostHog, issue id present, no cymbal errors | - | - | - | 1 (manual/live) | Live-only | 🟡 |
| AC6 | If PostHog returns a different message, story recorded INCOMPLETE | - | - | - | 1 (same live scenario) | Live-only | 🟡 |

---

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs a deployed staging app and real PostHog | AC5, AC6 | Live-only (not CSS-layout) | Verification script scenarios 5 and 6, run after merge and staging deploy; recorded as `live-verified` in the DoD. Not a RISK-ACCEPT: it is a required step, and the story is not complete without it. |

No layout-dependent ACs. No E2E browser tooling needed.

---

## Test Data Strategy

**Source:** Fixtures plus synthetic. The fixture is `tests/fixtures/sff-s1-posthog-frames.json`, built from the real `$exception_list` shapes read back from PostHog project 10908 on 2026-11-15 (the readback was truncated by the tool, so the fixture holds the four frames actually seen plus frames written to the same shape: repository frames with `filename`, `in_app: true`; the Node internal frame `process.processTicksAndRejections` with NO `filename`, `in_app: false`, `lineno: 95`). Canary strings are generated in test setup (existing helper `seed`/`hex()`).
**Mock-shape verification (CLAUDE.md rule):** the fixture's frame shapes come from the real captured events, not invented to suit the fix. Its header comment records the capture date and that the capture was truncated.
**PCI/sensitivity in scope:** No. Frames hold code paths only; canaries are synthetic.
**Availability:** Fixture does not exist yet (RED state).
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1, AC2 | Raw SDK-shaped events with mixed frames | Fixture plus `sdkEvent()` helper in the existing test | None (synthetic canaries) | |
| AC3 | The captured shapes | `tests/fixtures/sff-s1-posthog-frames.json` | None | Includes the no-filename Node internal frame |
| AC4 | Throwing route in a child process | Existing `tests/helpers/error-capture-child.js` and sink helper | None | |

### Gaps

None for the automated tests. AC5 and AC6 need staging (see gap table).

---

## Unit Tests

All in `tests/check-coha-s5-error-capture.js` (appended; its existing tests stay).

### UT1 - repository frames keep their repo-relative filename

- **Verifies:** AC1
- **Action:** scrub a frame with filename `/app/src/web-ui/server.js` and one with `/app/src/x/node_modules/pkg/i.js`
- **Expected result:** `src/web-ui/server.js` and `node_modules/pkg/i.js` (unchanged behaviour)
- **Edge case:** No

### UT2 - a frame with no filename gets exactly `[redacted]`

- **Verifies:** AC1
- **Action:** scrub `{ function: 'process.processTicksAndRejections', in_app: false, lineno: 95, platform: 'node:javascript' }`
- **Expected result:** frame has `filename === '[redacted]'`; function, lineno, in_app, platform kept as today. Fails now (filename is absent).
- **Edge case:** Yes (the actual live defect)

### UT3 - frames with outside-repo, `node:` or non-string filenames, and non-object entries, all get `[redacted]`

- **Verifies:** AC1
- **Action:** scrub frames with filenames `node:internal/process/task_queues`, `/tenants/<hex>/a.js`, `/home/mysrc/a.js`, `123`, `null`, and frame entries `null`, `'str'`, `42`
- **Expected result:** every output frame is an object whose `filename` is a string; each of these is exactly `[redacted]`
- **Edge case:** Yes. The existing test asserts `undefined` for the tenant and `mysrc` cases; it is updated in the same PR to expect `[redacted]` (the one deliberate change).

### UT4 - canaries in every path-like field never reach the output

- **Verifies:** AC2
- **Action:** seed a canary into `filename`, `abs_path`, `module`, `function` (non-identifier), `context_line`, `pre_context` of frames that are NOT repo-relative; scrub; serialise the whole result
- **Expected result:** canary absent from the serialised output; placeholder is the constant `[redacted]`. Passes the existing `leakCheck` style.
- **Edge case:** Yes

### UT5 - existing canary and shape tests still pass

- **Verifies:** AC2
- **Action:** run the whole existing file
- **Expected result:** 77 existing tests pass, with only `scrubEvent_filename_keptOnlyWhenRepoRelative` changed as described. A regression elsewhere fails here.
- **Edge case:** No

### UT6 - real captured shapes: schema check true after the fix, false before

- **Verifies:** AC3
- **Precondition:** `tests/fixtures/sff-s1-posthog-frames.json` loaded; a local pure function `everyFrameHasFilename(event)` (the only consumer rule evidenced: string `filename` on every frame of every `$exception_list` entry)
- **Action:** (a) wrap the fixture frames in an SDK-shaped event, scrub it, apply the check; (b) apply the same check to a version of the output produced by the OLD frame logic, reproduced inside the test as a small function that omits non-repo filenames (the negative control)
- **Expected result:** (a) true; (b) false. If (b) were true the check would be vacuous.
- **Edge case:** Yes

---

## Integration Tests

### IT1 - end to end through the real createApp in a child process

- **Verifies:** AC4
- **Components involved:** real `createApp()` with the injected throwing router, real `error-capture.js`, local sink helper
- **Action:** make the existing catch-block test's thrown error pass through a real Node stack (it naturally includes `process.processTicksAndRejections`-style internal frames), receive the event at the sink
- **Expected result:** `everyFrameHasFilename(sinkEvent)` is true; the request still returns 500; exactly one event
- **Edge case:** No

---

## NFR Tests

### NFR-SEC1 - privacy guarantee unchanged

- **NFR addressed:** Security and privacy
- **Measurement method:** the UT4 canary scan across all fields of the serialised output
- **Pass threshold:** zero canary matches; the placeholder is the only new string
- **Tool:** same harness

### NFR-CORR1 - the schema check can fail

- **NFR addressed:** Correctness
- **Measurement method:** UT6 part (b), the negative control
- **Pass threshold:** check returns false for old-style output

Performance: none beyond one string assignment per frame; the existing 200 ms capture-bound tests (AC8 of coha-s5) cover it unchanged.

---

## Out of Scope for This Test Plan

- Proving the alert to bridge hop for a real error (production-only filter; coha-s6 AC9).
- Production deploy, event-volume reduction, rate limiting.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Fixture capture was truncated by the readback tool | Only 4 frames of one event were visible | Header comment states this; AC5 live check on real new events is the real proof |
| PostHog may reject events for a second reason once `filename` is present | The parser reports the first problem only | AC5 and AC6: live check; INCOMPLETE and follow-up if a new message appears |
| The consumer's full schema is unknown | Only `filename` is evidenced | The check asserts only that; no guessing |

**Total automated tests:** 6 unit + 1 integration + 2 NFR checks (NFR-SEC1 and NFR-CORR1 reuse UT4 and UT6, counted once) = 7 test entries.
