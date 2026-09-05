## Test Plan: Fix artefact detail links so nested and archived artefacts resolve instead of 404ing

**Story reference:** artefacts/2026-09-06-artefact-detail-link-resolution-fix/stories/adlr-s1-fix-artefact-detail-link-resolution.md
**Test plan author:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-06

**Test runner confirmed from `package.json`:** `npm test` → `node scripts/run-all-tests.js`.

**E2E detection (Step 3a):** No AC involves CSS layout or visual rendering — pure URL-construction and fetch-resolution logic. Not applicable.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Link generation encodes full relative path, not bare filename | 3 tests | — | — | — | — | 🟢 |
| AC2 | Direct decoded-path resolution, no guessing for correct links | 2 tests | — | — | — | — | 🟢 |
| AC3 | Archived-prefix fallback | 2 tests | — | — | — | — | 🟢 |
| AC4 (regression guard) | Existing root-level, non-archived artefacts unchanged | 1 test | — | — | — | — | 🟢 |
| AC5 (defensive) | Bare-name legacy fallback probes known subdirectories | 2 tests | — | — | — | — | 🟢 |
| AC6 | Live production confirmation | — | — | — | 1 scenario | Untestable-by-nature (requires deployed environment) | 🔴 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in the current suite | Handling |
|-----|----|----------|------------------------------------------|---------|
| Whether the fix actually renders correctly on real, already-affected production pages | AC6 | Untestable-by-nature | Requires the fix deployed against real GitHub-hosted repo content — cannot be simulated meaningfully beyond what AC1-5's unit tests already prove | Manual verification scenario 🔴 — direct post-merge browser check against `2026-07-05-product-stds-hierarchy` and one other previously-confirmed-broken feature, matching this session's established live-verification convention |

---

## Test Data Strategy

**Source:** Synthetic — a mock/injectable GitHub Contents API responder (matching the existing `fetchGithubContentsResponse` injectable pattern) that returns 200 for specific configured paths and 404 for everything else, so tests assert exactly which paths were attempted and in what order without a real network call.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A fixture artefact list with a nested-path entry (e.g. `artefacts/f/dor/x-dor.md`) | Synthetic | None | |
| AC2 | Same fixture, asserting exactly one fetch attempt for a correctly-encoded nested path | Synthetic (mock fetch) | None | |
| AC3 | A mock responder that 404s the non-archived path and 200s the `archived/` path | Synthetic (mock fetch) | None | |
| AC4 | A fixture with a root-level, non-archived artefact | Synthetic | None | |
| AC5 | A mock responder that 404s every path except one nested candidate, given a bare (no-slash) input | Synthetic (mock fetch) | None | |
| AC6 | The real, already-affected `2026-07-05-product-stds-hierarchy` feature | Real production data (read-only browser check) | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### `_renderArtefactListByType` (or its extracted helper) encodes the full relative path for a nested artefact (AC1)

- **Verifies:** AC1
- **Precondition:** An artefact `{ path: 'artefacts/f/dor/x-dor.md', type: 'dor' }` for feature slug `f`.
- **Action:** Render the artefact list HTML.
- **Expected result:** The generated `href` decodes to `/artefact/f/dor/x-dor` (i.e. the URL segment, once `decodeURIComponent`'d, equals `dor/x-dor`).
- **Edge case:** No.

### Link generation correctly derives the relative path for an archived artefact (AC1)

- **Verifies:** AC1
- **Precondition:** An artefact `{ path: 'artefacts/archived/f/dod/x-dod.md', type: 'dod' }`.
- **Action:** Render the artefact list HTML.
- **Expected result:** The decoded URL segment equals `dod/x-dod` — the `archived/` prefix and feature slug are both stripped, only the within-feature relative path remains.
- **Edge case:** Yes — archived path prefix.

### Root-level artefact link is unchanged (AC1, AC4 overlap)

- **Verifies:** AC1, AC4
- **Precondition:** An artefact `{ path: 'artefacts/f/discovery.md', type: 'discovery' }`.
- **Action:** Render the artefact list HTML.
- **Expected result:** The decoded URL segment equals `discovery` — identical to today's existing behaviour.
- **Edge case:** No.

### `fetchArtefact` resolves a nested path directly, one request (AC2)

- **Verifies:** AC2
- **Precondition:** A mock GitHub responder that returns 200 only for `artefacts/f/dor/x-dor.md`.
- **Action:** Call `fetchArtefact('f', 'dor/x-dor', token)`.
- **Expected result:** Returns the decoded content; exactly 1 fetch call was made (no guessing).
- **Edge case:** No.

### `fetchArtefact` does not run the subdirectory-guessing fallback for an already-nested path that doesn't exist (AC2)

- **Verifies:** AC2
- **Precondition:** A mock responder that 404s every path.
- **Action:** Call `fetchArtefact('f', 'dor/does-not-exist', token)`.
- **Expected result:** Throws `ArtefactNotFoundError`; exactly 2 fetch calls were made (non-archived + archived direct attempts only — no subdirectory probing, since the input already contains a slash).
- **Edge case:** Yes — proves AC5's guessing loop is correctly gated off for slash-containing inputs.

### `fetchArtefact` falls back to the `archived/` prefix when the non-archived path 404s (AC3)

- **Verifies:** AC3
- **Precondition:** A mock responder that 404s `artefacts/f/dor/x-dor.md` and 200s `artefacts/archived/f/dor/x-dor.md`.
- **Action:** Call `fetchArtefact('f', 'dor/x-dor', token)`.
- **Expected result:** Returns the decoded content from the archived path.
- **Edge case:** Yes.

### `fetchArtefact` falls back to `archived/` for a root-level type too (AC3)

- **Verifies:** AC3
- **Precondition:** A mock responder that 404s `artefacts/f/discovery.md` and 200s `artefacts/archived/f/discovery.md`.
- **Action:** Call `fetchArtefact('f', 'discovery', token)`.
- **Expected result:** Returns the decoded content from the archived path.
- **Edge case:** No.

### `fetchArtefact` resolves an existing root-level, non-archived type unchanged (AC4, regression guard)

- **Verifies:** AC4
- **Precondition:** A mock responder that 200s `artefacts/f/discovery.md` immediately.
- **Action:** Call `fetchArtefact('f', 'discovery', token)`.
- **Expected result:** Returns the decoded content; exactly 1 fetch call was made.
- **Edge case:** No.

### `fetchArtefact` probes known subdirectories for a bare legacy input (AC5)

- **Verifies:** AC5
- **Precondition:** A mock responder that 404s everything except `artefacts/f/dor/x-dor.md`; call with the bare type `x-dor` (no slash).
- **Action:** Call `fetchArtefact('f', 'x-dor', token)`.
- **Expected result:** Returns the decoded content — the probing loop found it under `dor/`.
- **Edge case:** Yes — this is the exact "old bookmarked link" scenario.

### `fetchArtefact` exhausts all candidates and throws a real 404 for a genuinely missing bare artefact (AC5)

- **Verifies:** AC5
- **Precondition:** A mock responder that 404s every path, for every known subdirectory, both prefixes.
- **Action:** Call `fetchArtefact('f', 'does-not-exist-anywhere', token)`.
- **Expected result:** Throws `ArtefactNotFoundError` after exhausting all candidates (2 direct + up to 22 subdirectory probes = ≤24 total calls, bounded).
- **Edge case:** Yes — proves the loop terminates and doesn't hang or throw an unrelated error.

---

## Integration Tests

None — both the link-generation change and `fetchArtefact` are unit-testable in isolation via the existing injectable fetch pattern; the route dispatch's `decodeURIComponent` step is trivial and covered implicitly by the unit tests calling `fetchArtefact` with pre-decoded strings (matching what the route handler will pass after decoding).

---

## NFR Tests

| NFR | Test | Notes |
|-----|------|-------|
| Performance — bounded worst-case latency for a genuinely missing bare-name artefact | Covered by the "exhausts all candidates" unit test above, asserting the exact call count ceiling (≤24) | The reduced per-probe timeout (documented in the DoR contract) is not itself unit-tested (would require simulating real timeout behaviour) — accepted as an implementation detail verified by code review, not a new automated test |

---

## Out of Scope for This Test Plan

- The dead `/artefacts/:path` (plural) route — not fixed, not tested.
- `commit-view.js`'s unreachable "View artefact" link — not fixed, not tested (separate pre-existing defect).
- Full E2E Playwright coverage — AC1-5's unit tests directly exercise the URL-construction and fetch-resolution logic; AC6's manual scenario confirms the real rendered outcome once deployed.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC6's live-production confirmation cannot run pre-merge | Requires the fix deployed to see real GitHub-hosted content resolve correctly | Manual verification scenario 🔴 in the AC verification script, performed post-merge |
