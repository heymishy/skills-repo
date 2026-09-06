# Test Plan: Opening any single document resolves through the canonical trace, not independent logic

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s5-artefact-fetch-integration.md
**Epic reference:** artefacts/2026-09-06-canonical-artefact-trace/epics/canonical-artefact-trace.md
**Test plan author:** Copilot (Claude)
**Date:** 2026-09-06

**Target module:** `src/web-ui/adapters/artefact-fetcher.js` (`fetchArtefact`'s internal resolution logic, currently `ARTEFACT_SUBDIRS`-based, rewired to consume `buildArtefactTrace`/`classifyDivergence` for path resolution) and `src/web-ui/routes/artefact.js` (`/artefact/:slug/:type` route handler)
**Test runner:** `node scripts/run-all-tests.js`
**Test file:** `tests/check-cat-s5-artefact-fetch-integration.js`

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Correctly-generated link resolves identically to adlr-s1's existing direct-path resolution | 1 | 1 | — | — | — | 🟢 |
| AC2 | Inference-only-locatable link resolves to the real file, not a 404 | 2 | — | — | — | — | 🟢 |
| AC3 | `orphaned-registration` link returns a distinct 404 message from adlr-s1's never-registered 404 | 2 | — | — | — | — | 🟢 |
| AC4 | Existing `ArtefactNotFoundError`/`ArtefactFetchError` contract unchanged | 1 | 1 | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Mixed
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A URL-encoded relative path already known to resolve correctly today (e.g. `dor%2Fpsh-s1-dor`) | Real, on-disk `psh` (`2026-07-05-product-stds-hierarchy`) fixture, already used by `adlr-s1`'s own existing regression suite | None | Reuses `adlr-s1`'s own existing fixture rather than constructing a new one — direct regression continuity |
| AC2 | A `phase4` document locatable only via `cat-s3`'s inference | Real `phase4` fixture, one document with a successful inferred grouping (same fixture as `cat-s1`/`cat-s3`/`cat-s4`) | None | |
| AC3 | An `orphaned-registration` classified slug/type combination | Synthetic, same fixture technique as `cat-s3`'s AC2 | None | |
| AC4 | The existing `ArtefactNotFoundError`/`ArtefactFetchError` classes and their current call sites in `artefact.js` | Real, on-disk source, no fixture construction needed | None | Source-level contract check, not runtime data |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### correctly-encoded existing link resolves to the same document as before this story's change (AC1)

- **Verifies:** AC1
- **Precondition:** Real `psh` fixture, a known-good encoded path (`dor%2Fpsh-s1-dor`)
- **Action:** Call the updated `fetchArtefact` resolution logic with this input, compare against the pre-change (`adlr-s1`) resolution result captured as a golden fixture at test-authorship time
- **Expected result:** `assert.strictEqual(newResolvedPath, goldenResolvedPath)` — no behavioural change for the already-working case
- **Edge case:** No

### phase4 document locatable only via inference resolves to the real file, not a 404 (AC2)

- **Verifies:** AC2
- **Precondition:** Real `phase4` fixture, a document that `artefact-fetcher.js`'s old `ARTEFACT_SUBDIRS`-based bare-name probe cannot locate (confirmed via the original audit as one of the 93.5%-of-artefacts-404 cases `adlr-s1` partially fixed) but that `cat-s3`'s inference successfully groups
- **Action:** Call the updated resolution logic
- **Expected result:** Returns the real file path/content, not a 404 — this is the specific regression class this whole epic exists to close
- **Edge case:** No

### inference-based resolution uses the trace's resolved path, not the old independent subdirectory probe (AC2, structural check)

- **Verifies:** AC2
- **Precondition:** Same phase4 fixture, source-level instrumentation of which code path executes
- **Action:** Confirm via a spy/flag that `artefact-trace.js`'s output is consulted, and that `ARTEFACT_SUBDIRS`'s bare-name probe function is not called for this input
- **Expected result:** The trace-based path is used; the old probe function's call count is zero for this input — verifying the AC's own "using the trace's own resolved path rather than artefact-fetcher.js's independent bare-name subdirectory probe" language
- **Edge case:** Yes — this is a structural/wiring assertion, not just an outcome assertion

### orphaned-registration link returns a real 404 with a distinguishing message (AC3)

- **Verifies:** AC3
- **Precondition:** Synthetic `orphaned-registration`-classified slug/type combination (registered but no matching file)
- **Action:** Call the resolution logic
- **Expected result:** Returns a 404-equivalent result whose message text is distinct from `adlr-s1`'s existing "artefact not found" message for a never-registered path (e.g. explicitly mentions the registration exists but the file doesn't)
- **Edge case:** No

### orphaned-registration 404 message differs from never-registered 404 message (AC3, non-conflation check)

- **Verifies:** AC3
- **Precondition:** Both the orphaned-registration fixture and a genuinely never-registered slug fixture
- **Action:** Compare the two error messages
- **Expected result:** `assert.notStrictEqual(orphanedMessage, neverRegisteredMessage)` — an operator must be able to tell these apart, per the AC's own explicit language
- **Edge case:** Yes

### ArtefactNotFoundError/ArtefactFetchError contract is unchanged after the resolution-logic swap (AC4)

- **Verifies:** AC4
- **Precondition:** Source read of `artefact.js`'s current error class definitions and their existing call sites (postgres-fallback, error-page rendering)
- **Action:** Compare the error class shape/API before and after this story's changes
- **Expected result:** No change to the error classes' constructor signature, properties, or existing call sites outside the resolution logic itself — this story swaps what feeds into the error handling, not the error handling
- **Edge case:** No

---

## Integration Tests

### full /artefact/:slug/:type route resolves a correctly-encoded link end-to-end unchanged (AC1 seam)

- **Verifies:** AC1
- **Components involved:** `artefact.js` route handler, updated `artefact-fetcher.js`, `artefact-trace.js`
- **Precondition:** Real `psh` fixture, mock Express `req`/`res`
- **Action:** Invoke the route handler directly
- **Expected result:** Response matches the pre-change golden response for the same input — no regression for the working case
- **Edge case:** No

### existing postgres-fallback and error-page rendering still trigger correctly off the new resolution logic (AC4 seam)

- **Verifies:** AC4
- **Components involved:** `artefact.js`'s existing fallback/error-rendering logic, new resolution logic feeding it
- **Precondition:** A fixture that triggers each existing error path (not-found, fetch-error)
- **Action:** Invoke the route handler for each
- **Expected result:** The same downstream error handling (postgres fallback attempt, error page render) fires exactly as it did before this story's changes — confirmed via existing test assertions in `artefact.js`'s current suite, re-run unchanged
- **Edge case:** No

---

## NFR Tests

### no regression vs. adlr-s1's existing bounded-probe performance for the common case

- **NFR addressed:** Performance
- **Measurement method:** `process.hrtime()` around resolution for the AC1 known-good fixture, before and after this story's change
- **Pass threshold:** Resolves in the same 1-2 request/lookup bound `adlr-s1` already established — no new latency introduced for the common case
- **Tool:** Node `process.hrtime()`, inline

### no new input surface introduced

- **NFR addressed:** Security
- **Measurement method:** Source read — confirm no new unvalidated user input reaches a filesystem or GitHub Contents API call that wasn't already validated upstream
- **Pass threshold:** Zero new unvalidated input paths
- **Tool:** Manual source review at test-authorship time

### existing artefact_read audit logging continues to fire identically

- **NFR addressed:** Audit
- **Measurement method:** Spy on the existing audit-logging call in `artefact.js`, compare call count/arguments before and after this story's change for the AC1 fixture
- **Pass threshold:** Identical call count and argument shape — unchanged per the story's own NFR text
- **Tool:** Manual spy/wrap-and-restore pattern (no mocking library configured), inline in the test file

---

## Out of Scope for This Test Plan

- `journey.js`'s and `export-data-source.js`'s own call sites — verified in `cat-s6`'s own test plan, not duplicated here, per the story's own Out of Scope section.
- Any change to GitHub Contents API auth/timeout/retry behaviour — unchanged from `adlr-s1`, no test needed since no change is made.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC1's golden-response fixture must be captured from the pre-change codebase, or the comparison is meaningless | Same TDD-ordering constraint as `cat-s4`'s AC4 | Capture the golden fixture as the first implementation step, before any resolution-logic changes land |
