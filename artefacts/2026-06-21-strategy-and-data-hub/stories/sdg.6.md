# Story sdg.6 — Callout marker detection and metrics recording

**User story:**
As the skills pipeline,
I want to detect "Grounded in:" callout markers in completed artefacts,
So that I can track how often the model uses reference content and correlate with artefact quality.

## Acceptance criteria

**AC1 — Metrics file created and initialized**
Given the feature is initialized (discovery approved),
When the first skill session completes,
Then a metrics file is created at `workspace/strategy-metrics.json` (if not present) with an empty array: `{"metrics": []}`.

**AC2 — Artefact scanned for callout markers**
Given an artefact is saved to disk after /ideate or /discovery completes,
When a post-save metrics collection step runs,
Then the artefact content is scanned for all occurrences of the pattern `[Grounded in: <filename>]` (case-sensitive, literal match).

**AC3 — Metrics entry recorded**
Given callout markers are found (or not found),
When metrics are recorded,
Then a JSON object is appended to `workspace/strategy-metrics.json`:
```json
{
  "date": "2026-06-04T14:30:00Z",
  "featureSlug": "2026-06-04-strategy-data-grounding",
  "stage": "ideate|discovery",
  "hasReferenceFiles": true,
  "referenceFileCount": 2,
  "referenceFileNames": ["strategy.md", "data.md"],
  "calloutCount": 4,
  "totalSections": 8,
  "calloutRate": 0.50
}
```

**AC4 — Metrics visible in session completion summary**
Given metrics are recorded,
When the operator completes a session and views the completion summary,
Then a line appears: "Strategy content was cited in X/Y sections of your artefact (rate: X/Y)".
If no reference files were uploaded, the line reads: "No strategy grounding used in this session."

**AC5 — Sessions without reference files tracked**
Given an operator completes /ideate or /discovery WITHOUT uploading reference files,
When metrics are recorded,
Then `hasReferenceFiles: false`, `referenceFileCount: 0`, `referenceFileNames: []`, `calloutCount: 0`,
Allowing comparison of sessions with and without strategy content.

**AC6 — Per-artefact metrics (not aggregated)**
Given multiple artefacts are produced in a single feature (e.g., /ideate followed by /discovery followed by /benefit-metric),
When each artefact is saved,
Then a separate metrics entry is recorded for each artefact (no aggregation or rollup across stages in a single entry).

## Out of scope
- Automatic quality scoring based on callout frequency
- Real-time feedback to the operator about callout rate during a session
- Historical aggregation or trend analysis across multiple features
- Automated alerts or recommendations to re-upload strategy files if callout rate is low

## Dependencies
sdg.4 (callout markers must appear in /ideate artefacts), sdg.5 (callout markers must appear in /discovery artefacts)

## NFR / Constraints
- **Metrics file location:** `workspace/strategy-metrics.json` (sibling to `workspace/state.json`, not in artefacts/)
- **Metrics format:** Append-only JSON array; no deletion or mutation of prior entries
- **Pattern matching:** Literal string match `[Grounded in: <filename>]`; no regex or fuzzy matching
- **Timing:** Metrics recorded immediately after artefact is saved (post-completion, before next skill starts)
- **NFR-LITERAL:** Pattern is case-sensitive `/\[Grounded in: ([^\]]+)\]/g` — no `i` flag
