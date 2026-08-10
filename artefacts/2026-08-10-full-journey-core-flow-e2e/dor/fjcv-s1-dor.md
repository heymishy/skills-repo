## Definition of Ready: fjcv-s1 — E2E coverage confirming both journey entry points reach definition-of-ready complete and every major stage resumes correctly

**Story:** artefacts/2026-08-10-full-journey-core-flow-e2e/stories/fjcv-s1-full-journey-core-flow-and-resume.md
**Test plan:** artefacts/2026-08-10-full-journey-core-flow-e2e/test-plans/fjcv-s1-test-plan.md
**Date:** 2026-08-10

---

### Scope contract

**Files in scope (exact touchpoints):**
- New: `tests/e2e/fjcv-s1-full-journey-core-flow-and-resume.spec.js`.

**Files explicitly out of scope (must not be touched):**
- Any production code (`journey.js`, `skills.js`, `server.js`, `mock-llm-gateway.js`, `skill-turn-executor.js`) — this story is pure test-coverage addition, no fix needed.
- `bri-s3.2-signup-onboarding-journey.spec.js` — read for its proven pattern, not modified.
- `tests/e2e/fixtures/llm-gateway/ideate.success.json` — already correct (isc-s1/isc-s2), not touched here.

### Architecture Constraints

No new architectural decision — reuses `bri-s3.2`'s already-proven journey-driving pattern, extended with an ideate-driving helper. No ADR required.

### Human oversight

**Medium** — a new E2E spec covering two full pipeline traversals; no production code touched, but the JSON-path/streaming-path turnIndex asymmetry discovered while building it (see story's Architecture Constraints) was a genuine, non-obvious finding worth a second look before merge.

### Coding Agent Instructions

1. `tests/e2e/fjcv-s1-full-journey-core-flow-and-resume.spec.js` — already written per the test plan's two E2E scenarios.
2. Run it standalone at least 2x to confirm no flakiness (already done: 3/3 passing both runs, ~4-9s total).
3. Run `bri-s3.2-signup-onboarding-journey.spec.js` unmodified afterward — zero regression required (already confirmed: 4/4 passing).
4. Clean up any local `artefacts/<date>-<feature-name>/` directories and `workspace/strategy-metrics.json` the test runs themselves create on disk (a real, expected side effect of driving real journeys against the local harness) before committing — already done.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Medium)
- [x] No CSS-layout-dependent AC left unclassified (none — content-presence assertions via plain HTTP GET only)

**PROCEED: Yes**
