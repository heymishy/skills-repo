# Definition of Ready — ep1-s1

**Story:** Signals aggregator module: read all 12 sources and normalize to Signal shape
**Feature slug:** 2026-09-28-weeb-ui-learnings-and-improvements
**Status:** PROCEED — Signed off for inner loop

---

## Scope Contract

**What you are building:**

A server-side Node.js module (`src/web-ui/modules/signals-aggregator.js`) that reads from 12 workspace/framework signal sources (capture-log.md, learnings.md, proposals/, suite.json, results.tsv, traces/, decisions.md, dod/, estimation-norms.md, reference/, pipeline-state.json) and normalizes all into a unified `Signal` object array. On-demand parsing (no cache). Graceful error handling: parse failures surface as `signal-type: parse-error` entries, not exceptions.

**What you are NOT building:**

- Per-source parsing robustness (YAML validation, regex patterns) — deferred to Epic 2
- Caching or performance optimization beyond MVP <200ms target — deferred to Phase 5
- Multi-tenant isolation or signal filtering/display logic — deferred
- Automated signal generation or AI summarization — out of scope

**Acceptance Criteria — Full text:**

1. **AC1:** All 12 sources are parsed into Signal array, sorted by timestamp (most recent first), with required fields: id, source, type, text, timestamp, cta.label, cta.skill
2. **AC2:** Parse errors (malformed JSON, YAML, TSV) are surfaced as `signal-type: parse-error` entries, not exceptions
3. **AC3:** Missing source files do not block aggregation; remaining sources still parse
4. **AC4:** Signals are sorted in descending order by timestamp; entries without timestamp placed at end in stable order
5. **AC5:** Every parseable entry from every source appears in the returned array; no silent drops

**Files you will touch:**

- `src/web-ui/modules/signals-aggregator.js` (new, ~300–400 lines)
- `tests/signals-aggregator.test.js` (new, ~500–600 lines)
- `tests/fixtures/signal-workspace/` (optional: pre-committed fixture files for test stability)

**Files you must NOT touch:**

- `src/web-ui/routes/` (signals route handler is ep1-s2, separate story)
- `dashboards/` (launcher redesign is ep1-s3, separate story)
- `.github/context.yml`, `.github/pipeline-state.json`, `package.json` (reserved for root-level changes)

---

## Architecture Guardrails

**Mandatory constraints:**

- **No new npm runtime dependencies** (tech-stack.md) — use Node.js built-ins (`fs`, `path`) only
- **Injectable adapter pattern (D37)** — file-read logic must be injectable with a throwing stub; default adapter throws `new Error('Adapter not wired: file-read. Call setFileReadAdapter() with a real implementation before use.')`
- **Graceful error handling** — parse failures on individual sources must not block the entire aggregation or throw uncaught exceptions
- **Canonical builder pattern (ADR-028)** — this module is the sole source of truth for signal aggregation; no other code re-derives this logic from the 12 sources

**Architecture decisions referenced:**

- ADR-028 (canonical builder pattern) — this module owns signal aggregation logic; all consumers call it
- D37 (injectable adapter rule) — file-read adapter is wired via setter with throwing stub
- ADR-023 (handoff schema) — signals will be injected as `priorArtefacts` in Phase 2; ensure Signal shape is complete and self-descriptive

---

## Test Execution

**Required before opening PR:**

1. **Unit tests (1.1–1.6):** Run `npm test -- tests/signals-aggregator.test.js` — all unit tests must pass
2. **Integration tests (1.7–1.8):** Run with real file I/O on temporary workspace — verify all 12 sources parse correctly and performance <200ms
3. **Performance test (1.8):** 5 consecutive runs on 2MB workspace — all <200ms
4. **Canonical builder check (1.10):** `grep -r "workspace/capture-log.md" src/ tests/ | grep -v signals-aggregator | grep -v signals.test` — must return 0 results (no rival implementations)
5. **Manual AC review:** Read verification script section in test plan and sign off each AC

**Pass criteria:** All tests pass, no skipped tests, performance <200ms, no canonical-builder violations, manual AC review signed off.

---

## Implementation Notes

**Signal object shape (TypeScript reference):**

```typescript
interface Signal {
  id: string                    // unique key: `${source}-${index}` or UUID
  source: string                // 'capture-log' | 'learnings' | 'proposals' | 'suite' | 'results' | 'traces' | 'decisions' | 'dod-follow-up' | 'estimation' | 'archived-ref' | 'pipeline-state' | 'parse-error'
  type: string                  // 'gap' | 'assumption-invalidated' | 'decision' | 'pattern' | 'proposal' | 'follow-up' | 'error' | ...
  text: string                  // human-readable summary (1–2 sentences)
  timestamp: ISO8601            // when the signal was recorded (or when error occurred)
  cta: {
    label: string               // e.g., "Review proposal", "Address gap", "Seed discovery"
    skill: string               // skill to launch: 'improve' | 'definition' | 'decisions' | 'discovery' | ...
    seedContext?: string        // signal content to inject as priorArtefacts (Phase 2)
  }
  context?: {
    relatedStory?: string
    featureSlug?: string
    severity?: 'low' | 'medium' | 'high'
    metadata?: Record<string, any>
  }
}
```

**Parse strategy per source (examples):**

- `workspace/capture-log.md` — Parse YAML 5-field schema; extract `date`, `signal-type`, `signal-text` fields; create Signal per entry
- `workspace/suite.json` — JSON parse; extract array of suite entries; create Signal per entry (or one aggregated signal if desired)
- `workspace/proposals/` — Directory walk; for each `proposal-*/` subdirectory, read `rationale.md`; create Signal per proposal
- Invalid files — Catch exceptions, create Signal with `type: 'parse-error'` and error message in `text` field

**Performance target:** All 12 sources parsed in <200ms for solo operator scale (<2MB workspace). Measure with `performance.now()` in test suite.

---

## What happens after you merge

1. Your PR is merged to master
2. Server runs `npm test -- tests/signals-aggregator.test.js` in CI — all tests must pass
3. Server updates `.github/pipeline-state.json` to record `dorStatus: "signed-off"`, `stage: "definition-of-ready"`, `health: "green"` for ep1-s1
4. Next story (ep1-s2, Signals panel route handler) is ready for inner loop

---

## Questions or blockers?

If the test plan is unclear, the 12 sources need clarification, or the performance target seems unrealistic, add a comment to the PR and tag for `/clarify` before continuing.