# Test Plan: Signals aggregator module — read all 12 sources and normalize to Signal shape

**Feature slug:** 2026-09-28-weeb-ui-learnings-and-improvements
**Story ID:** ep1-s1
**Story title:** Signals aggregator module: read all 12 sources and normalize to Signal shape
**Test plan created:** 2026-09-28
**Skill:** /test-plan

---

## Test data strategy

**Data source selection:** Synthetic — all test signals are generated in test setup within `tests/signals-aggregator.test.js`. No real workspace files or production data are used in unit/integration tests. Real-file E2E tests (if applicable) will use a fixture workspace committed to `tests/fixtures/signal-workspace/`.

**Approach:** 
1. Unit tests use in-memory mock file-read adapter
2. Integration tests use real files in a temporary test workspace
3. Performance tests use a 2MB synthetic workspace fixture
4. All test data is generated fresh per test run; no persistent state

**No PCI or sensitivity constraints** — test signals contain no personal data, credentials, or regulated content.

---

## Test data sources and preparation

| Test class | Data approach | Preparation |
|---|---|---|
| Unit tests (1.1–1.7) | Mock file-read adapter returns JSON/YAML strings | Test setup generates mock responses in-memory |
| Integration tests (1.2–1.6) | Real files in temporary directory | `beforeEach()` creates `tests/fixtures/signal-workspace/` with all 12 sources; `afterEach()` cleans up |
| Performance test (1.7) | Fixture workspace with 2MB of signal files | Pre-committed fixture; test measures parsing time only |
| E2E tests (via /definition-of-ready handoff) | Real operator workspace | Operator confirms signals are visible in dashboard after merge |

---

## AC coverage table

| AC | Test method | Test ID | Coverage |
|---|---|---|---|
| AC1: All 12 sources parsed into Signal array | Unit + Integration | 1.1, 1.2, 1.3 | ✅ Complete |
| AC2: Parse errors surfaced as Signal entries, not exceptions | Integration | 1.3, 1.4 | ✅ Complete |
| AC3: Graceful degradation (missing sources don't block) | Integration | 1.2 | ✅ Complete |
| AC4: Signals sorted by timestamp, most recent first | Unit | 1.5 | ✅ Complete |
| AC5: No silent data loss; every parseable entry appears | Integration | 1.6 | ✅ Complete |
| NFR — Performance (<200ms solo operator scale) | Performance | 1.7 | ✅ Complete |
| NFR — Graceful error handling | Integration | 1.3, 1.4 | ✅ Complete |

---

## Gap table

| Gap | Category | Handler | Justification |
|---|---|---|---|
| Per-source parsing robustness (YAML schema, regex patterns) | Out-of-scope | Deferred to ep2-s1 | MVP uses basic string/JSON parsing; robustness per source is next epic |
| Multi-tenant workspace isolation | Out-of-scope | Deferred to Phase 5 | MVP assumes single workspace per deployment |
| Caching or memoization | Out-of-scope | Deferred to Phase 5 performance story | Acceptable <200ms for solo operator scale; caching deferred if scale inflection is hit |

No gaps represent untestable ACs or missing coverage. All AC requirements are testable via the test suite below.

---

## Unit tests

### Test 1.1: Aggregator returns Signal array with all 12 sources represented

**Which AC:** AC1

**Setup:**
- Mock the file-read adapter to return valid content for all 12 sources:
  - `workspace/capture-log.md` → YAML 5-field entries (signal-type: gap, decision, pattern, assumption-invalidated)
  - `workspace/learnings.md` → aggregated text entries
  - `workspace/proposals/` → directory with 2 proposal objects
  - `workspace/suite.json` → JSON eval suite array with 3 entries
  - `workspace/results.tsv` → TSV with 5 watermark rows
  - `workspace/traces/` → JSONL file with 2 trace entries
  - `artefacts/test-feature/decisions.md` → markdown ARCH entries
  - `artefacts/test-feature/dod/` → 2 DoD observation files
  - `workspace/estimation-norms.md` → table with 3 rows
  - `artefacts/test-feature/reference/` → 2 reference markdown files
  - `.github/pipeline-state.json` → 3 feature entries
  - All sources present and parseable

**Precondition:**
```javascript
setFileReadAdapter(mockAdapter);
const mockAdapter = {
  readFile: jest.fn((path) => {
    if (path.includes('capture-log.md')) return mockCaptureLogContent();
    if (path.includes('suite.json')) return mockSuiteJsonContent();
    // ... etc for all 12 sources
  })
};
```

**Action:**
```javascript
const signals = getSignals(testWorkspacePath);
```

**Expected result:**
- Return value is an array: `Array.isArray(signals) === true`
- Array length ≥ 15 (at least one signal per source, some sources have multiple)
- Array includes signals with `source` values: 'capture-log', 'learnings', 'proposals', 'suite', 'results', 'traces', 'decisions', 'dod-follow-up', 'estimation', 'archived-ref', 'pipeline-state'
- Every signal has required fields: `id`, `source`, `type`, `text`, `timestamp`, `cta` (with subfields `label` and `skill`)
- No exceptions thrown during aggregation

**Edge cases:**
- Empty source files (0 entries) are handled: source is included in array with 0 or 1 "no entries" signal
- Very large source files (100+ entries) are handled without performance degradation (measured in Test 1.7)

---

### Test 1.2: Missing source files do not block aggregation

**Which AC:** AC3 (graceful degradation)

**Setup:**
- Mock the file-read adapter to return "not found" or throw for 6 of 12 sources:
  - Present: capture-log.md, learnings.md, suite.json, decisions.md, estimation-norms.md, pipeline-state.json
  - Missing: proposals/, traces/, dod/, archived references, results.tsv
- All present sources contain valid, parseable content

**Precondition:**
```javascript
setFileReadAdapter(mockAdapterWithMissingFiles);
const mockAdapterWithMissingFiles = {
  readFile: jest.fn((path) => {
    if (path.includes('proposals') || path.includes('traces')) 
      throw new Error('ENOENT: no such file or directory');
    if (path.includes('capture-log.md')) return mockCaptureLogContent();
    // ... etc
  })
};
```

**Action:**
```javascript
const signals = getSignals(testWorkspacePath);
```

**Expected result:**
- No exception thrown from `getSignals()`
- Return value is an array (not null or undefined)
- Array length ≥ 6 (signals from present sources only)
- Array includes signals from present sources: capture-log, learnings, suite, decisions, estimation, pipeline-state
- Array does NOT include signals from missing sources (or includes a "source not found" signal for each missing source, implementation-dependent)
- Aggregation completes successfully despite missing sources

---

### Test 1.3: Parse errors are surfaced as Signal entries, not exceptions

**Which AC:** AC2 (error handling)

**Setup:**
- Mock the file-read adapter to return malformed content for 3 sources and valid content for others:
  - `workspace/suite.json` → invalid JSON: `{...},` (trailing comma)
  - `workspace/capture-log.md` → malformed YAML (bad indentation on 5-field schema)
  - `workspace/results.tsv` → corrupted TSV (missing columns on row 3)
  - All other sources valid

**Precondition:**
```javascript
setFileReadAdapter(mockAdapterWithErrors);
const mockAdapterWithErrors = {
  readFile: jest.fn((path) => {
    if (path.includes('suite.json')) return '{...},';  // invalid JSON
    if (path.includes('capture-log.md')) return 'badly:\nindented:\n yaml';
    if (path.includes('results.tsv')) return 'col1\tcol2\n1\t2\n3';  // missing col2 on row 2
    // ... valid content for others
  })
};
```

**Action:**
```javascript
const signals = getSignals(testWorkspacePath);
```

**Expected result:**
- No exception thrown from `getSignals()`
- Return value is an array
- Array includes ≥3 signals with `type: 'parse-error'`
- Each parse-error signal has:
  - `source: 'parse-error'`
  - `text: '<source description>: <error message>'` (e.g., `"suite.json: JSON parse error at line 1"`)
  - `timestamp` present (current time or error time)
- Signals from non-errored sources are present and correct in the array
- Aggregation completes and returns a complete array despite errors

---

### Test 1.4: Signals are sorted by timestamp, most recent first

**Which AC:** AC4

**Setup:**
- Mock the file-read adapter to return capture-log entries with explicit timestamps in non-chronological order:
  - Entry 1: timestamp 2026-09-26T10:00:00Z
  - Entry 2: timestamp 2026-09-28T15:30:00Z (most recent)
  - Entry 3: timestamp 2026-09-27T12:00:00Z
  - Include proposals and traces with timestamps
  - All timestamps valid ISO8601 format

**Precondition:**
```javascript
const mockCaptureLogContent = `
- date: 2026-09-26
  session-phase: discovery
  signal-type: gap
  signal-text: Gap A
  source: operator-manual

- date: 2026-09-28
  session-phase: definition
  signal-type: decision
  signal-text: Decision B
  source: operator-manual

- date: 2026-09-27
  session-phase: review
  signal-type: pattern
  signal-text: Pattern C
  source: agent-auto
`;
```

**Action:**
```javascript
const signals = getSignals(testWorkspacePath);
const timestamps = signals.map(s => s.timestamp);
```

**Expected result:**
- Array is sorted in descending order by timestamp (most recent first)
- First signal's timestamp is 2026-09-28T15:30:00Z
- Last signal in the timestamp-sorted range is 2026-09-26T10:00:00Z
- Entries without a timestamp (if any) are placed at the end in a stable order
- Sorting is deterministic: calling `getSignals()` twice returns signals in the same order

---

### Test 1.5: No silent data loss; every parseable entry appears

**Which AC:** AC5

**Setup:**
- Mock the file-read adapter with:
  - capture-log.md with 10 valid 5-field entries + 1 malformed entry
  - proposals/ directory with 3 valid proposals
  - suite.json with 5 valid entries + 1 invalid entry (missing required fields)

**Precondition:**
```javascript
const captureLogWithError = `
- date: 2026-09-28
  session-phase: discovery
  signal-type: gap
  signal-text: Gap 1
  source: operator-manual
[... repeated 9 more valid entries ...]
- date: 2026-09-28
  session-phase: bad
  signal-type: malformed
  THIS IS NOT YAML
`;
```

**Action:**
```javascript
const signals = getSignals(testWorkspacePath);
const captureLogSignals = signals.filter(s => s.source === 'capture-log');
const parseErrors = signals.filter(s => s.type === 'parse-error');
```

**Expected result:**
- `captureLogSignals.length` = 10 (valid entries only; malformed entry is not included as a valid signal)
- `parseErrors` includes 1 entry for the malformed capture-log entry
- `signals.filter(s => s.source === 'proposals').length` = 3 (all proposals)
- `signals.filter(s => s.source === 'suite').length` = 5 (valid suite entries; invalid entry is not included)
- `parseErrors` includes 1 entry for the invalid suite entry
- Total parse-error signals = 2 (one for malformed capture-log, one for invalid suite)
- No entries are silently dropped; all parseable entries appear in the array

---

### Test 1.6: Injectable adapter pattern works correctly

**Which AC:** Architecture constraint — D37 (injectable adapter)

**Setup:**
- Default (real file-read) adapter is wired with a throwing stub
- Mock adapter can be set via `setFileReadAdapter(mockAdapter)`
- Throwing adapter can be set to test error path

**Precondition:**
```javascript
// Default adapter (throwing stub)
const defaultAdapter = {
  readFile: () => {
    throw new Error('Adapter not wired: file-read. Call setFileReadAdapter() with a real implementation before use.');
  }
};

// Mock adapter
const mockAdapter = {
  readFile: jest.fn((path) => {
    if (path.includes('capture-log.md')) return mockCaptureLogContent();
    // ... etc
  })
};

// Throwing adapter
const throwingAdapter = {
  readFile: () => {
    throw new Error('Disk I/O error');
  }
};
```

**Action:**
```javascript
// Test 1: Default adapter throws
try {
  getSignals(testWorkspacePath);
} catch (e) {
  expect(e.message).toContain('Adapter not wired');
}

// Test 2: Mock adapter is used
setFileReadAdapter(mockAdapter);
const signals1 = getSignals(testWorkspacePath);
expect(mockAdapter.readFile).toHaveBeenCalled();

// Test 3: Throwing adapter does not crash aggregator
setFileReadAdapter(throwingAdapter);
const signals2 = getSignals(testWorkspacePath);
expect(signals2).toContainEqual(expect.objectContaining({ type: 'parse-error' }));
```

**Expected result:**
- Default adapter with throwing stub prevents accidental use (prevents test pollution)
- Mock adapter is called when set; signals are produced from mock data
- Throwing adapter does not propagate the exception; instead, parse-errors are surfaced
- Adapter is swappable without modifying aggregator code
- D37 injectable adapter pattern is correctly implemented

---

## Integration tests

### Test 1.7: All 12 sources parsed correctly with real files

**Which AC:** AC1

**Setup:**
- Create a temporary directory with all 12 sources present as real files:
  - `workspace/capture-log.md` with 5 valid 5-field YAML entries
  - `workspace/learnings.md` with markdown entries
  - `workspace/proposals/proposal-1/` with rationale.md, evidence/ directory
  - `workspace/proposals/proposal-2/` with same structure
  - `workspace/suite.json` with JSON array of 3 suite entries
  - `workspace/results.tsv` with TSV header and 5 data rows
  - `workspace/traces/trace-001.jsonl` with 2 JSONL entries
  - `workspace/traces/trace-002.jsonl` with 3 JSONL entries
  - `artefacts/test-feature/decisions.md` with 2 ARCH-formatted entries
  - `artefacts/test-feature/dod/obs-001.md` with DoD observation
  - `artefacts/test-feature/dod/obs-002.md` with DoD observation
  - `workspace/estimation-norms.md` with markdown table (3 rows)
  - `artefacts/test-feature/reference/spike-outcome.md` with markdown
  - `artefacts/test-feature/reference/vendor-assessment.md` with markdown
  - `.github/pipeline-state.json` with 3 feature objects

**Precondition:**
```javascript
beforeEach(() => {
  testWorkspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'signals-test-'));
  // Create all 12 source files in testWorkspaceDir
  // (helper function createTestWorkspace() does this)
  createTestWorkspace(testWorkspaceDir);
  
  // Reset adapter to real file-read
  setFileReadAdapter(null); // or setFileReadAdapter(realFileReadAdapter)
});

afterEach(() => {
  fs.rmSync(testWorkspaceDir, { recursive: true });
});
```

**Action:**
```javascript
const signals = getSignals(testWorkspaceDir);
```

**Expected result:**
- Return value is a non-empty array
- Array includes signals from all 12 sources:
  - 5 signals from capture-log.md (one per YAML entry)
  - 1 signal from learnings.md
  - 2 signals from proposals/ (one per proposal directory)
  - 3 signals from suite.json
  - 5 signals from results.tsv
  - 5 signals from traces/ (2 from trace-001 + 3 from trace-002)
  - 2 signals from decisions.md
  - 2 signals from dod/ observations
  - 3 signals from estimation-norms.md
  - 2 signals from reference/ files
  - 3 signals from pipeline-state.json (one per feature entry)
- All signals have required fields (id, source, type, text, timestamp, cta)
- No parse-error signals (all files are valid)
- Aggregation completes without exceptions

---

### Test 1.8: Performance is acceptable for solo operator scale

**Which AC:** NFR — Performance (<200ms)

**Setup:**
- Create a 2MB test workspace fixture (pre-committed or generated):
  - capture-log.md with 50 valid YAML entries
  - learnings.md with aggregated entries
  - 10 proposals in proposals/ (each with rationale.md + evidence/)
  - suite.json with 100 eval suite entries
  - results.tsv with 50 watermark rows
  - 5 trace JSONL files (20 entries each)
  - Remaining sources proportional to reach 2MB total
- All files are valid and parseable

**Precondition:**
```javascript
beforeEach(() => {
  testWorkspaceDir = createLargeTestWorkspace(2 * 1024 * 1024); // 2MB
  // Verify total size is approximately 2MB
  const dirSize = calculateDirSize(testWorkspaceDir);
  expect(dirSize).toBeLessThan(2.5 * 1024 * 1024);
});
```

**Action:**
```javascript
const startTime = performance.now();
const signals = getSignals(testWorkspaceDir);
const endTime = performance.now();
const duration = endTime - startTime;
```

**Expected result:**
- Duration < 200ms (aggregation completes in under 200 milliseconds)
- Array is populated with all signals (not counting time, but verifying correctness)
- No timeout or performance degradation

**Repeat 5 times to measure consistency:**
```javascript
const durations = [];
for (let i = 0; i < 5; i++) {
  const start = performance.now();
  getSignals(testWorkspaceDir);
  const end = performance.now();
  durations.push(end - start);
}
expect(Math.max(...durations)).toBeLessThan(200);
expect(durations.reduce((a, b) => a + b, 0) / durations.length).toBeLessThan(180);
```

**Expected result (5 runs):**
- All 5 invocations complete in <200ms
- Mean latency <180ms (5% buffer for CI variability)
- No memory leaks or growing latency on repeated calls (last run is not slower than first)

---

## NFR tests

### Test 1.9: Graceful error handling — exceptions are caught, not propagated

**Which AC:** NFR — Graceful degradation

**Setup:**
- Mock the file-read adapter to throw an exception on the first source file read
- All other source files would be valid, but the error occurs early

**Precondition:**
```javascript
let callCount = 0;
const mockAdapterWithError = {
  readFile: jest.fn((path) => {
    callCount++;
    if (callCount === 1) throw new Error('Disk error on first read');
    // subsequent reads return valid content
    return mockContent(path);
  })
};
setFileReadAdapter(mockAdapterWithError);
```

**Action:**
```javascript
const signals = getSignals(testWorkspacePath);
```

**Expected result:**
- No unhandled exception propagates to the caller
- `getSignals()` returns an array (not null or undefined)
- Array includes a parse-error signal for the disk error
- Aggregation continues after the error; subsequent sources are still processed
- Result is a complete (or as-complete-as-possible) array of signals

---

### Test 1.10: Canonical builder pattern — no other code re-derives aggregation logic

**Which AC:** Architecture constraint — ADR-028 (canonical builder)

**Setup:**
- Grep the entire `src/web-ui/` and `tests/` directories for any other file that reads from the 12 signal sources independently
- Identify any ad-hoc aggregation logic outside of `signals-aggregator.js`

**Precondition:**
```bash
# Bash grep to find rival implementations
grep -r "workspace/capture-log.md" src/ tests/ \
  | grep -v "signals-aggregator.js" \
  | grep -v "signals.test.js" \
  | wc -l
# Expected: 0 (no other files read capture-log)

grep -r "workspace/suite.json" src/ tests/ \
  | grep -v "signals-aggregator.js" \
  | grep -v "signals.test.js" \
  | wc -l
# Expected: 0
```

**Action:**
- Run the grep checks above for each of the 12 sources
- Confirm zero matches outside of the aggregator module and tests

**Expected result:**
- No other file in the codebase independently reads any of the 12 signal sources
- The aggregator is the sole, canonical builder for signal aggregation
- All consumers (e.g., the route handler in ep1-s2) call the aggregator; they do not re-derive the logic

---

## Verification script (manual AC confirmation and post-merge smoke test)

**Scenario setup:**

No local setup required for manual verification of this story. The aggregator module is server-side only and does not have a user-facing interface. Verification happens via:
1. **Pre-code sign-off (this script):** Operator confirms the AC descriptions and test plan are correct
2. **Post-merge smoke test:** Run the test suite and confirm all tests pass

---

### Manual AC Review

**AC1: All 12 sources parsed into Signal array**
- Review the 12 sources listed in the design doc and confirm they match the test setup
- Confirm the aggregator reads from: capture-log.md, learnings.md, proposals/, suite.json, results.tsv, traces/, decisions.md, dod/, estimation-norms.md, reference/, pipeline-state.json
- Sign-off: ✅ I confirm these 12 sources and the test approach are correct

**AC2: Parse errors surfaced as Signal entries, not exceptions**
- Confirm that when a parse error occurs (malformed JSON, bad YAML, missing columns), the aggregator returns a signal with `type: 'parse-error'` instead of throwing
- Confirm that a single parse error does not prevent other sources from being parsed
- Sign-off: ✅ I confirm error handling approach is correct

**AC3: Graceful degradation (missing sources don't block)**
- Confirm that if a source file is missing (ENOENT), the aggregator does not throw
- Confirm that the aggregation continues for remaining sources
- Sign-off: ✅ I confirm graceful degradation approach is correct

**AC4: Signals sorted by timestamp, most recent first**
- Confirm that signals are sorted in descending order by timestamp (newest first)
- Confirm that entries without a timestamp are placed at the end
- Sign-off: ✅ I confirm sorting approach is correct

**AC5: No silent data loss; every parseable entry appears**
- Confirm that every valid entry from every source appears in the returned array
- Confirm that invalid entries are logged as parse-errors, not silently dropped
- Sign-off: ✅ I confirm data integrity approach is correct

**NFR — Performance:**
- Confirm that <200ms is the acceptable threshold for solo operator scale (<2MB workspace)
- Confirm that the test setup uses a realistic 2MB workspace and measures end-to-end parsing time
- Sign-off: ✅ I confirm performance threshold is appropriate

---

### Post-merge smoke test (after implementation)

**Prerequisites:**
- Merge the ep1-s1 implementation to master
- Ensure `src/web-ui/modules/signals-aggregator.js` is present
- Ensure `tests/signals-aggregator.test.js` is present and configured

**Steps:**

1. **Run the unit and integration test suite:**
   ```bash
   npm test -- tests/signals-aggregator.test.js
   ```
   Expected: All tests pass. No failures, no timeouts.

2. **Verify test count and coverage:**
   ```bash
   npm test -- tests/signals-aggregator.test.js --verbose
   ```
   Expected: Output shows ≥10 tests (unit 1.1–1.6, integration 1.7–1.10, NFR 1.9–1.10). All pass.

3. **Run performance test standalone:**
   ```bash
   npm test -- tests/signals-aggregator.test.js --grep "performance"
   ```
   Expected: Performance test completes in <200ms (for solo operator scale). No performance regression.

4. **Verify injectable adapter is working:**
   ```bash
   npm test -- tests/signals-aggregator.test.js --grep "injectable|adapter"
   ```
   Expected: Adapter tests pass. Default adapter throws; mock adapter works; throwing adapter is caught.

5. **Manual verification — confirm aggregator can be imported and used:**
   ```javascript
   // In Node.js REPL or test file
   const { getSignals } = require('./src/web-ui/modules/signals-aggregator.js');
   console.log(typeof getSignals); // Should be 'function'
   ```
   Expected: Import succeeds, `getSignals` is a function.

---

## Test execution environment

- **Unit tests:** Node.js `assert` module + custom `test()` helper (existing pattern in `tests/`)
- **Integration tests:** Node.js `fs` + temporary directory creation (`fs.mkdtempSync`)
- **Performance tests:** Node.js `performance.now()` timing measurements
- **Fixture creation:** Helper function `createTestWorkspace()` generates all 12 sources in a temporary directory

---

## Test data files (to be created during test setup)

| File | Content type | Sample entry |
|---|---|---|
| `workspace/capture-log.md` | YAML 5-field | `- date: 2026-09-28` / `session-phase: discovery` / `signal-type: gap` / ... |
| `workspace/learnings.md` | Markdown | `## Discovery phase` / `- Entry 1: [description]` |
| `workspace/proposals/proposal-1/rationale.md` | Markdown | `# Rationale: [title]` / `[description]` |
| `workspace/suite.json` | JSON array | `[{ "id": "suite-001", "description": "...", "skill": "tdd" }]` |
| `workspace/results.tsv` | TSV | `timestamp\tskill-set-hash\tsurface-type\tsuite-pass-rate\tgate-verdict` |
| `workspace/traces/trace-001.jsonl` | JSONL | `{"traceId":"uuid","skill":"tdd","status":"completed"}` (one object per line) |
| `artefacts/test-feature/decisions.md` | Markdown with ARCH markers | `## ARCH: [title]` / `[description]` |
| `artefacts/test-feature/dod/obs-001.md` | Markdown | `# DoD Observation` / `[findings]` |
| `workspace/estimation-norms.md` | Markdown table | `\| Feature \| Actual \| Estimated \|` / `\| test-feature \| 8h \| 6h \|` |
| `artefacts/test-feature/reference/spike-outcome.md` | Markdown | `# Spike outcome` / `[findings]` |
| `.github/pipeline-state.json` | JSON | `{ "features": [ { "slug": "test-feature", "stage": "complete" } ] }` |

---

## Pass/fail criteria

**Pass:**
- All unit tests (1.1–1.6) pass without modification
- All integration tests (1.7–1.8) pass within performance thresholds
- All NFR tests (1.9–1.10) pass
- No tests are skipped
- Canonical builder check (Test 1.10) confirms no rival implementations exist
- Manual AC review is signed off

**Fail:**
- Any test fails or times out
- Performance test exceeds 200ms threshold
- Parse-error signals are not surfaced correctly
- Missing sources block aggregation (should not)
- Signals are not sorted by timestamp
- Any entry is silently dropped without a corresponding parse-error signal
- Canonical builder pattern is violated (other files re-derive aggregation logic)

---

**Instrumentation (EXP-010 phase 5 capture block)**

*Capture block omitted — `instrumentation.enabled: false` per context.yml*