# Decisions — ep1-s1: Signals aggregator module

**Story:** Signals aggregator module: read all 12 sources and normalize to Signal shape
**Feature slug:** 2026-09-28-weeb-ui-learnings-and-improvements
**Recorded:** 2026-09-28
**Status:** Active (guiding implementation)

---

## Decision 1: Signal object shape — required vs. optional fields

**Date:** 2026-09-28
**Context:** The aggregator normalizes signals from 12 different sources into a unified `Signal` object. The design specifies required and optional fields. Without formalization, code may inconsistently omit optional fields or add new ones without consensus.

**Options considered:**
- **Option A:** Enforce Signal shape via TypeScript interface at compile time (requires TS migration)
- **Option B:** Document Signal shape as a JSDoc typedef + runtime validation in test suite only
- **Option C:** Enforce via runtime validation (Schema.js or similar); throw if required fields missing

**Decision:** **Option B — JSDoc typedef + test-suite validation**

**Rationale:**
- No TypeScript migration in Phase 5 (tech-stack.md constraint: Node.js CommonJS, no transpilation)
- JSDoc typedef provides IDE autocomplete and documentation without build step
- Test suite validates all signals have required fields; invalid signals are caught at test time, not runtime
- Optional fields (`context`, `seedContext`) are documented as optional; their absence is valid
- Keeps the module lightweight and maintainable

**Consequences:**
- Signal objects without required fields will fail unit/integration tests before merge
- IDE will highlight missing required fields via JSDoc hover
- No runtime validation (production code assumes caller/test suite ensures correctness)

**Implementation guidance:**
```javascript
/**
 * @typedef {Object} Signal
 * @property {string} id - unique key: `${source}-${index}` or UUID
 * @property {string} source - 'capture-log' | 'learnings' | 'proposals' | 'suite' | 'results' | 'traces' | 'decisions' | 'dod-follow-up' | 'estimation' | 'archived-ref' | 'pipeline-state' | 'parse-error'
 * @property {string} type - 'gap' | 'assumption-invalidated' | 'decision' | 'pattern' | 'proposal' | 'follow-up' | 'error' | ...
 * @property {string} text - human-readable summary (1–2 sentences)
 * @property {string} timestamp - ISO8601 format
 * @property {Object} cta
 * @property {string} cta.label - e.g., "Review proposal", "Address gap"
 * @property {string} cta.skill - skill to launch: 'improve' | 'definition' | 'decisions' | ...
 * @property {Object} [context] - optional
 * @property {string} [context.relatedStory] - optional
 * @property {string} [context.featureSlug] - optional
 * @property {string} [context.severity] - optional: 'low' | 'medium' | 'high'
 * @property {Object} [context.metadata] - optional
 * @property {string} [seedContext] - optional: signal content to inject as priorArtefacts
 */
```

Test suite validates: `expect(signal).toHaveProperty('id'); expect(signal).toHaveProperty('cta.label');` etc.

---

## Decision 2: Error handling — parse-error Signal vs. exception logging

**Date:** 2026-09-28
**Context:** When a signal source fails to parse (malformed JSON, bad YAML, missing file), the aggregator must decide: surface as a Signal entry, log to file, or both. The design specifies parse errors surface as Signal entries. This decision clarifies scope and logging strategy.

**Options considered:**
- **Option A:** Surface parse-error Signal only; no file logging (keeps Signal array as complete status report)
- **Option B:** Surface parse-error Signal + log to file (dual output; auditable error history)
- **Option C:** Log to file only, no Signal entry (errors invisible in aggregation result)

**Decision:** **Option A — parse-error Signal only; no file logging**

**Rationale:**
- Design specifies parse errors surface as Signal entries (not exceptions)
- Signal array is the complete status report of aggregation — operator sees all errors at once
- No new dependencies needed for file logging (no file I/O outside of reading sources)
- Test plan validates parse-error signals appear in the array; no separate log file to verify
- Keeps the module stateless (no side effects beyond returning the Signal array)
- File logging can be added in Phase 5 (performance story) if audit trail is needed

**Consequences:**
- Parse errors are ephemeral (live only in the returned array, not persisted to disk)
- If the aggregator is called multiple times, parse errors must be re-discovered each time
- No permanent audit trail of which sources failed on which runs

**Implementation guidance:**
- When a parse exception occurs, catch it and create a Signal with `type: 'parse-error'`
- Signal text should include the exception message and source file path
- Example: `{ id: 'parse-error-001', source: 'parse-error', type: 'parse-error', text: 'workspace/suite.json: JSON parse error: Unexpected token < at line 1', timestamp: <now>, cta: { label: 'Review workspace/suite.json', skill: 'decisions' } }`

---

## Decision 3: Timestamp format — ISO8601 vs. Unix timestamp

**Date:** 2026-09-28
**Context:** The design specifies ISO8601 format for Signal timestamps (e.g., `"2026-09-28T15:30:00Z"`). This decision formalizes the choice and normalization strategy.

**Options considered:**
- **Option A:** ISO8601 only (human-readable, standard, no timezone ambiguity if stored as Z)
- **Option B:** Unix timestamp only (numeric, sortable, compact)
- **Option C:** Both (dual representation; adds complexity)

**Decision:** **Option A — ISO8601 only, with Z (UTC) timezone enforcement**

**Rationale:**
- Design specifies ISO8601 (human-readable, standard for web APIs)
- UTC timezone (Z suffix) eliminates ambiguity; all timestamps are comparable globally
- All signal sources (capture-log.md YAML dates, file modification times, trace JSONL timestamps) can be normalized to ISO8601-Z
- JSON serialization/deserialization is native (no custom handlers needed)
- Test suite validates all timestamps match ISO8601 pattern: `/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/`
- Sorting by ISO8601 strings is lexicographic (same order as chronological for this format)

**Consequences:**
- All parsed dates must be normalized to ISO8601-Z format before Signal construction
- Parse errors: if a timestamp cannot be parsed, the Signal is either placed without timestamp (at end of array) or assigned current time
- Millisecond precision is optional; seconds are sufficient (e.g., `"2026-09-28T15:30:00Z"` vs. `"2026-09-28T15:30:00.123Z"`)

**Implementation guidance:**
- For capture-log.md YAML entries with `date: YYYY-MM-DD` field: parse as `new Date(dateString + 'T00:00:00Z').toISOString()`
- For file modification times (`fs.stat().mtime`): convert with `mtime.toISOString()`
- For trace JSONL entries with `timestamp` field: validate as ISO8601, or convert if Unix timestamp
- For entries without a timestamp: omit `timestamp` field or assign `null`; place such Signals at end of array in stable order

---

## Decision 4: Signal sorting — stable sort on timestamp with secondary sort key

**Date:** 2026-09-28
**Context:** The design specifies signals sorted descending by timestamp (most recent first), with entries without timestamp placed at end. This decision formalizes the secondary sort order for determinism.

**Options considered:**
- **Option A:** Primary sort by timestamp (desc); secondary sort by source name (asc) for ties
- **Option B:** Primary sort by timestamp (desc); secondary sort by parse order (stable, undefined order)
- **Option C:** Primary sort by timestamp (desc); entries without timestamp placed at end in parse order (no secondary sort)

**Decision:** **Option A — Primary sort by timestamp (desc); secondary sort by source name (asc) for determinism**

**Rationale:**
- Design specifies descending timestamp order (most recent first)
- Multiple signals may have the same timestamp (especially if parsing multiple entries from the same source, or if timestamps are rounded to seconds)
- A secondary sort ensures deterministic order across invocations (test suite validates no non-determinism)
- Secondary sort by source name is meaningful: signals from the same timestamp are grouped by source, improving readability
- Entries without timestamp are placed at the end (after all timestamped entries), then sorted by source name

**Consequences:**
- Sorting is two-pass: first by timestamp, then by source within same-timestamp group
- Test suite validates determinism: same input, same output order on repeated calls
- If source names change, sort order may shift (acceptable; sources are stable)

**Implementation guidance:**
```javascript
// Pseudocode
signals.sort((a, b) => {
  // Primary: timestamp descending (most recent first)
  if (a.timestamp && b.timestamp) {
    const timeCompare = b.timestamp.localeCompare(a.timestamp); // descending
    if (timeCompare !== 0) return timeCompare;
  }
  
  // Handle missing timestamps: no timestamp goes to end
  if (!a.timestamp && b.timestamp) return 1;
  if (a.timestamp && !b.timestamp) return -1;
  
  // Secondary: source name ascending (alphabetical)
  return a.source.localeCompare(b.source);
});
```

Test: `test('signals sorted deterministically: repeated calls return same order')`

---

## Decision 5: File read adapter — auto-selection vs. explicit wiring

**Date:** 2026-09-28
**Context:** The design specifies an injectable file-read adapter (D37 pattern) with a throwing stub as default. This decision clarifies when the real adapter is auto-selected vs. when explicit wiring is required.

**Options considered:**
- **Option A:** Auto-select based on `NODE_ENV`: real adapter if `NODE_ENV !== 'test'`, stub otherwise
- **Option B:** Always require explicit `setFileReadAdapter()` call; default is always throwing stub
- **Option C:** Auto-select in production, warn if not explicitly wired in development

**Decision:** **Option B — Always require explicit `setFileReadAdapter()` call; default is always throwing stub**

**Rationale:**
- D37 injectable adapter rule requires throwing stub by default (prevents accidental production use without wiring)
- Auto-selection based on `NODE_ENV` is a convention, not a structural guarantee (can be bypassed by changing env var)
- Explicit wiring makes it clear which adapter is in use (better for debugging and test isolation)
- Test suite is split: unit tests mock the adapter; integration tests explicitly call `setFileReadAdapter(realAdapter)`
- Production code must explicitly call `setFileReadAdapter(realFileReadAdapter)` at module load time
- If wiring is not done, the throwing stub provides immediate, clear feedback ("Adapter not wired") rather than silent failure

**Consequences:**
- Production code must have a wiring step (e.g., `src/web-ui/server.js` or similar initialization)
- Tests must use mocks or explicit `setFileReadAdapter(realAdapter)` (no implicit auto-wiring)
- Prevents accidental use of stub in production (guarantee by design, not by convention)

**Implementation guidance:**
```javascript
// Default: throwing stub
let _fileReadAdapter = {
  readFile: (path) => {
    throw new Error('Adapter not wired: file-read. Call setFileReadAdapter() with a real implementation before use.');
  }
};

// Public setter
function setFileReadAdapter(adapter) {
  _fileReadAdapter = adapter;
}

// Real adapter (exported separately)
const realFileReadAdapter = {
  readFile: (path) => {
    return fs.readFileSync(path, 'utf-8');
  }
};

// In src/web-ui/server.js (or equivalent initialization):
const { setFileReadAdapter, realFileReadAdapter } = require('./modules/signals-aggregator.js');
setFileReadAdapter(realFileReadAdapter);
```

Test: `test('default adapter throws until explicitly wired')` validates the error is thrown if wiring is missing.

---

## Follow-up actions

**None.** All decisions are implementation-level; no follow-up stories or phase gates are required.

**Next step:** Proceed to /definition-of-ready for ep1-s2 (Signals panel route handler), or dispatch ep1-s1 to the coding agent for inner loop implementation.

---