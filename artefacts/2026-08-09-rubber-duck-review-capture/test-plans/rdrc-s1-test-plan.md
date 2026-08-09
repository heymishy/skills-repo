## Test Plan: Validate findings-extraction signal quality on a real human-narrated recording

**Story reference:** artefacts/2026-08-09-rubber-duck-review-capture/stories/rdrc-s1-validate-extraction-signal-quality.md
**Epic reference:** artefacts/2026-08-09-rubber-duck-review-capture/epics/epic-1-rubber-duck-review-capture-mvp.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Recording + speech-to-text API produces a readable transcript | — | 1 test (mocked API response, once vendor selected) | — | 1 scenario (real recording, real API call) | External-dependency | 🟡 |
| AC2 | Transcript → LLM extraction produces ready-to-append findings | 2 tests | 1 test | — | — | — | 🟢 |
| AC3 | ≥40% of findings confirmed real/actionable (Meta Metric 1 minimum signal) | — | — | — | 1 scenario | Untestable-by-nature | 🔴 |
| AC4 | Finding is traceable to a specific transcript point, not hallucinated | 1 test | — | — | 1 scenario | Untestable-by-nature | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in an automated test | Handling |
|-----|----|----------|--------------------------|---------|
| Real speech-to-text vendor round-trip | AC1 | External-dependency | No speech-to-text vendor is selected yet (per decisions.md D1, selection happens during this story's own implementation) — a specific HTTP contract to mock doesn't exist until then | Automated integration test for the request/response plumbing written once the vendor is chosen during implementation, mocked at the HTTP layer following this repo's `mock-llm-gateway`/staging-fixture conventions; a real-API manual scenario covers the actual round-trip |
| Extraction quality judgment | AC3 | Untestable-by-nature | "Real and actionable" is a human editorial judgment about content quality, not a mechanically-checkable property | Manual scenario — operator runs the pipeline against ≥5 findings and records N actionable / N total, per AC3's own wording |
| Hallucination / fabrication judgment | AC4 | Untestable-by-nature | Confirming a finding's description genuinely reflects what's in the transcript (vs. plausible-sounding fabrication) requires a human reading both side by side; a purely mechanical "does substring X appear near substring Y" check would pass fabricated-but-topically-adjacent content | A unit test covers the mechanical floor (each finding object carries a transcript-offset/quote reference field, not just free text); the actual truthfulness judgment is a manual scenario |

---

## Test Data Strategy

**Source:** Mixed — synthetic transcript fixtures for AC2/AC4's mechanical shape checks; a real recording + real (once-selected) speech-to-text API + real LLM extraction for AC1/AC3's manual scenarios.
**PCI/sensitivity in scope:** No — this repo's own screen content is not payments/PII-bearing; per `product/constraints.md` #12, no credential is ever handled in the agent's own context (the speech-to-text API key follows the existing secrets-store pattern).
**Availability:** AC2/AC4 unit-test fixtures available now (hand-authored synthetic transcripts). AC1's real API integration test is a dependency on the vendor-selection decision this story's own implementation makes — not blocking test-plan authorship, but blocking that one test's actual write-up until then.
**Owner:** Self-contained — no platform-team dependency.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A real screen+voice recording; a selected speech-to-text API's real response shape | Real (recorded during implementation) + vendor docs | None | Vendor TBD during implementation per decisions.md D1 |
| AC2 | A synthetic sample transcript with 2-3 identifiable "moments" (a bug mention, a spec-gap mention) | Hand-authored fixture | None | Deterministic input for shape assertions |
| AC3 | ≥5 real findings from ≥1 real recording | Real (produced by AC1/AC2's real pipeline) | None | Operator-judged, not fixture-based |
| AC4 | A synthetic transcript + a deliberately fabricated finding vs. a genuine one, for the mechanical-floor unit test | Hand-authored fixture | None | Proves the offset/quote-reference field exists and is populated, not that it's truthful |

### PCI / sensitivity constraints

None.

### Gaps

None beyond the AC1 vendor-selection dependency already noted in the Coverage gaps table above.

---

## Unit Tests

### extractionPipeline_producesReadyToAppendFindingShape_fromSampleTranscript

- **Verifies:** AC2
- **Precondition:** A synthetic sample transcript fixture containing one clear bug-mention moment and one clear spec-gap moment
- **Action:** Run the extraction function against the fixture transcript
- **Expected result:** Returns one or more finding objects, each with the 5 fields `capture-log.md` requires (`date`, `session-phase`, `signal-type`, `signal-text`, `source`) populated with real values derived from the transcript — not a raw restatement of the whole transcript, and not a placeholder object
- **Edge case:** No

### extractionPipeline_doesNotJustEchoTranscriptVerbatim_producesStructuredSummary

- **Verifies:** AC2
- **Precondition:** Same fixture as above
- **Action:** Compare each finding's `signal-text` field against the full raw transcript string
- **Expected result:** No finding's `signal-text` is byte-identical to (or a near-full-length excerpt of) the raw transcript — confirms genuine extraction happened, not pass-through
- **Edge case:** Yes — guards against the cheapest possible "fake" implementation (returning the transcript verbatim)

### finding_carriesTranscriptReferenceField_notJustFreeText

- **Verifies:** AC4 (mechanical floor only — not the truthfulness judgment itself, see Coverage gaps)
- **Precondition:** Synthetic transcript + extraction run
- **Action:** Inspect each returned finding object's shape
- **Expected result:** Each finding carries a reference back to its transcript origin (e.g. an offset, a verbatim quote fragment, or a timestamp) as a distinct field — not folded silently into free-text `signal-text` with no way to programmatically locate the source
- **Edge case:** No

---

## Integration Tests

### transcriptionApiCall_sendsRecordingAndReceivesText_onceVendorSelected

- **Verifies:** AC1
- **Components involved:** The recording-capture step (reused OS/browser tooling, out of this test's scope) → the speech-to-text API client (new, this story) → the transcript-consuming extraction step (AC2)
- **Precondition:** A real (or fixture) audio file; the vendor's API mocked at the HTTP layer with a representative real response shape, following this repo's `mock-llm-gateway`/staging-fixture conventions
- **Action:** Call the speech-to-text client with the audio input
- **Expected result:** Returns a text transcript string; the client handles the vendor's real response shape correctly (not a shape assumed without checking the real API, per this repo's `CLAUDE.md` mock-shape-verification rule)
- **Note:** Cannot be fully written until the vendor is selected during implementation (see Coverage gaps) — this entry specifies the shape of the test to write then, not a currently-runnable test

### extractionPipeline_endToEnd_transcriptToCaptureLogReadyEntry

- **Verifies:** AC2
- **Components involved:** Extraction function → `capture-log.md`'s own 5-field schema
- **Precondition:** Synthetic transcript fixture
- **Action:** Run the full extraction pipeline and format the output as it would actually be appended
- **Expected result:** Output is a syntactically valid `capture-log.md` entry block (matches the existing 5-field YAML-ish format used throughout this repo) — ready to append, not requiring a translation step

---

## NFR Tests

### noRawRecordingOrTranscriptPersistedBeyondImmediateRun

- **NFR addressed:** Security (transient handling of recording/transcript content, per discovery's Constraints)
- **Measurement method:** After running the pipeline against a fixture, scan the working directory / any configured temp/output paths for the raw audio file or the full raw transcript string
- **Pass threshold:** Neither the raw recording nor the raw transcript is found written to any persistent location — only the extracted findings are offered for the operator to append
- **Tool:** File-existence assertions (Node `fs`), same convention as this repo's other transient-data tests

---

## Out of Scope for This Test Plan

- Validating the chosen speech-to-text vendor's own transcription accuracy — that is the vendor's own quality, not this repo's code; this plan tests that the plumbing calls it correctly and handles its response
- The human-narrated tool's UI/invocation surface (Story 2, `rdrc-s2`) — this story is a standalone validation script only
- The agent-driven mode entirely (Stories 3-4)

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC1's real vendor integration test cannot be fully specified before vendor selection | Vendor choice happens during this story's own implementation (decisions.md D1) | Test shape specified above; actual mock fixture written once vendor is chosen, before AC1 is marked verified at DoD |
| AC3's quality judgment is fundamentally manual, not automatable | "Real and actionable" is an editorial judgment call, not a mechanical property | Manual scenario in the verification script; the count itself becomes the audit record per the story's own NFR-Audit note |
