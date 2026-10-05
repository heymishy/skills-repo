## Test Plan: Create the target directory before writing strategy-metrics and file-backed ideas data

**Story reference:** artefacts/2026-10-06-write-site-workspace-dir-audit/stories/wswda-s1-mkdir-before-write-strategy-metrics-and-ideas.md
**Epic reference:** None — short-track
**Test plan author:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-06

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`.

**Design decision — shared helper, confirmed necessary for real testability (not just DRY):** `strategy-metrics.js`'s `recordMetrics(workspaceDir, payload)` already takes its target directory as a parameter, so it can be tested directly against a real missing-directory temp path (same technique as `dswf-s1`'s own AC1 test). `features.js`'s `IDEAS_PATH`, by contrast, is a hardcoded module-level `const` derived from `__dirname` — it cannot be redirected to a temp path without either (a) unsafely manipulating the real `workspace/` directory in this checkout (which holds real session state — `capture-log.md`, `learnings.md`, `state.json` — and must never be deleted/renamed by a test), or (b) adding a test-only path-override seam disproportionate to a one-line fix. Both findings are fixed by routing their writes through one new shared helper, `src/web-ui/utils/fs-safe-write.js`'s `writeFileEnsuringDir(filePath, content, encoding)`, which IS directly unit-testable against any real temp path. This is the 4th/5th occurrence of the identical two-line `mkdirSync`-then-`writeFileSync` pattern in this codebase (`server.js:2750`, `reference-validator.js:54`, `dismissed-signals-store.js:88`, now these two) — extracting it is justified at this repetition count, not a premature abstraction. The 3 existing precedent call sites are NOT touched (out of scope — already shipped, already tested, no story reason to touch them).

**Real architecture grounding (confirmed by direct code read, 2026-10-06, per `artefacts/2026-10-06-write-site-workspace-dir-audit/stories/wswda-s1-...md`'s own Benefit Linkage section):**
- `strategy-metrics.js`'s `initMetricsFile`/`recordMetrics` write via raw `fs.writeFileSync`, no directory guard — called from `routes/journey.js:2630` and `routes/skills.js:5504` on every real `/ideate`/`/discovery` completion, both call sites silently swallowing the resulting `ENOENT` via try/catch + `console.error`.
- `features.js`'s `_writeIdeasFile` writes via raw `fs.writeFileSync` to the hardcoded `IDEAS_PATH`, no directory guard — currently dead code in production (Postgres adapter wired instead whenever `DATABASE_URL` is set), but would throw an unhandled, un-caught exception (neither `handlePostIdea` nor `handleDeleteIdea` wraps this call) in any environment without `DATABASE_URL`.

**E2E/browser-layout detection (Step 3a):** N/A — pure Node module fix, no rendered UI change.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | strategy-metrics write succeeds when its directory doesn't exist | 1 test (direct) + 1 test (via shared helper) | — | — | — | — | 🟢 |
| AC2 | features.js ideas write succeeds when its directory doesn't exist | — | 1 test (via shared helper, see Design decision above) | — | — | 🟡 documented | 🟢 |
| AC3 | Write behaviour unchanged when the directory already exists | 1 test (shared helper) | — | — | — | — | 🟢 |
| AC4 | All pre-existing strategy-metrics/features tests still pass | — | — | — | — | — | 🟢 (regression) |

---

## Coverage gaps

**AC2** cannot be verified by directly exercising `features.js`'s own hardcoded `IDEAS_PATH` with a missing directory, for the safety reason stated in the Design decision above (doing so would require deleting/relocating the real `workspace/` directory in this checkout). Mitigation: `_writeIdeasFile` is changed to delegate to `writeFileEnsuringDir`, which IS directly tested with a real missing nested temp directory (AC1's shared-helper test covers the identical code path `_writeIdeasFile` now calls); a second test confirms `features.js`'s `_writeIdeasFile` function body actually calls `writeFileEnsuringDir` (source-level call-site assertion) rather than its own raw `fs.writeFileSync`, closing the gap between "the helper works" and "this call site uses the helper." This is a RISK-ACCEPT, logged in `decisions.md`.

---

## Test Data Strategy

**Source:** Real temp files/directories under `os.tmpdir()` — no mocking of `fs`.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A path under a nested, not-yet-existing temp subdirectory | Real temp dir | None | Mirrors `dswf-s1`'s own AC1 test construction |
| AC2 | Same shared-helper temp-dir test, plus a source-level call-site check | Real temp dir + source read | None | See Coverage gaps |
| AC3 | A path under `os.tmpdir()` directly (already exists) | Real temp dir | None | Confirms no regression |
| AC4 | `tests/check-sdg6-metrics-recording.js`'s own existing fixtures; `features.js`'s existing ideas-adjacent tests | Synthetic | None | Regression only |

### Gaps

See Coverage gaps above (AC2).

---

## Unit Tests

### writeFileEnsuringDir creates a missing nested directory and writes the file (AC1, AC2's shared code path)

- **Verifies:** AC1, AC2 (shared code path)
- **Precondition:** A path under a nested, not-yet-existing temp subdirectory, e.g. `os.tmpdir()/wswda-s1-<random>/nested/out.txt`
- **Action:** Call `writeFileEnsuringDir(thatPath, 'hello', 'utf8')`
- **Expected result:** No exception; `fs.existsSync(thatPath)` is `true`; `fs.readFileSync(thatPath, 'utf8') === 'hello'`
- **Edge case:** Yes — the exact failure mode this story fixes

### writeFileEnsuringDir behaves identically when the directory already exists (AC3)

- **Verifies:** AC3
- **Precondition:** A path directly under `os.tmpdir()` (already exists)
- **Action:** Call `writeFileEnsuringDir(thatPath, 'hello', 'utf8')`
- **Expected result:** Identical behaviour — no exception, content written correctly
- **Edge case:** No — common-case regression guard

### recordMetrics succeeds when workspaceDir does not exist yet (AC1, direct)

- **Verifies:** AC1
- **Precondition:** A nested, not-yet-existing temp directory passed as `workspaceDir`
- **Action:** Call `recordMetrics(thatDir, {featureSlug:'f', stage:'ideate', hasReferenceFiles:false, referenceFileCount:0, referenceFileNames:[], calloutCount:0, totalSections:3})`
- **Expected result:** No exception; `strategy-metrics.json` exists under `thatDir` with the one recorded entry
- **Edge case:** Yes — reproduces the real production failure mode directly on the actual public function, not just the shared helper

### features.js's _writeIdeasFile delegates to writeFileEnsuringDir, not raw fs.writeFileSync (AC2, call-site assertion)

- **Verifies:** AC2
- **Precondition:** None
- **Action:** Read `src/web-ui/routes/features.js`'s source; locate the `_writeIdeasFile` function body
- **Expected result:** The function body calls `writeFileEnsuringDir(...)` and does NOT call `fs.writeFileSync` directly
- **Edge case:** No — this is the call-site-wiring half of AC2's coverage gap mitigation (see Coverage gaps)

---

## Integration Tests

None — pure module-level fix, no new route/handler behaviour. AC4's regression coverage is the full pre-existing `tests/check-sdg6-metrics-recording.js` suite (10 tests) plus `tests/check-idp-s1-persist-ideas-in-postgres.js`'s existing ideas-route tests, re-run unchanged.

---

## NFR Tests

### Performance — mkdirSync adds no measurable overhead

- **NFR addressed:** Performance
- **Measurement method:** No dedicated test — same rationale as `dswf-s1`: a fast no-op syscall on an already-existing directory.
- **Pass threshold:** N/A
- **Tool:** N/A

---

## Out of Scope for This Test Plan

- Modifying the 3 existing precedent call sites (`server.js`, `reference-validator.js`, `dismissed-signals-store.js`) to also use the new shared helper — they are already correct and already tested; touching them has no story justification.
- Any Dockerfile-level change or test — rejected per the story's own Architecture Constraints.
- `skills.js:2907`'s canvas-edit write and the approval-channel/CLI-tooling write sites — audited and confirmed out of scope, per the story's own Out of Scope section.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC2 has no test that exercises `features.js`'s real hardcoded `IDEAS_PATH` with a genuinely missing directory | Doing so would require manipulating the real `workspace/` directory in this checkout, which holds real session state and must not be touched by a test | Covered via the shared helper's own direct test (identical code path) plus a call-site assertion that `_writeIdeasFile` actually uses that helper — logged as a RISK-ACCEPT in `decisions.md` |
