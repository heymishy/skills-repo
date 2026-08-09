## Contract Proposal — Validate findings-extraction signal quality on a real human-narrated recording

**What will be built:**
A standalone validation script (`scripts/rubber-duck-review-validate.js` or equivalent, not wired into any skill/UI yet) that: (1) selects and wires up a speech-to-text API client (vendor chosen during implementation — candidates: a mainstream cloud STT API with a simple REST/SDK interface and a free/cheap tier suitable for a handful of manual runs), (2) accepts a local audio/video file path, calls the STT client, returns a transcript string, (3) runs an LLM extraction pass over the transcript (reusing this repo's existing LLM-invocation conventions, subject to `mgar-s1`'s mock-gateway safety net during automated tests), producing one or more finding objects shaped as ready-to-append `capture-log.md` entries, each carrying a transcript-offset/quote-reference field.

**What will NOT be built:**
No UI, no `/rubber-duck-review`-style skill invocation, no automatic logging to `capture-log.md` — this story is a one-off validation script, run manually by the operator. The production tool wrapping this pipeline is Story 2 (`rdrc-s2`).

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration test against the chosen vendor's mocked HTTP response, once selected; manual scenario with a real recording | Integration + Manual |
| AC2 | Unit tests against a synthetic transcript fixture, asserting finding shape and non-verbatim-echo | Unit |
| AC3 | Manual scenario — operator runs the real pipeline against ≥5 findings, records actionable/total count | Manual |
| AC4 | Unit test for the mechanical floor (transcript-reference field present); manual scenario for the truthfulness judgment | Unit + Manual |

**Assumptions:**
- The speech-to-text vendor selected during implementation exposes a synchronous or short-poll REST/SDK call sufficient for a single short (3-5 minute) recording — no need for a streaming/async job-polling API for this validation scope.
- The operator (not the coding agent) will actually record and narrate the walkthrough used for AC1/AC3's manual scenarios — the coding agent cannot produce this input itself.
- "Real and actionable" (AC3) is judged by the same operator running the validation, consistent with this being a self-contained validation exercise.

**Estimated touch points:**
Files: `scripts/rubber-duck-review-validate.js` (new), `tests/check-rdrc-s1-*.js` (new). Services: one speech-to-text vendor API (TBD), this repo's existing LLM-invocation path (`skill-turn-executor.js` or equivalent). APIs: the selected STT vendor's transcription endpoint.

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs. No mismatches found: AC1's "select and wire up a speech-to-text API" is explicitly this story's own scope per `decisions.md` D1, not a pre-existing dependency being assumed away; AC3's manual-judgment framing matches the story's own wording exactly ("recorded as a simple count... not just asserted as passing").
