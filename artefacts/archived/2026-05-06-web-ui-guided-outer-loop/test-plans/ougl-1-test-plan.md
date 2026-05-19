# Test Plan — ougl.1: buildSystemPrompt handoff extension

**Story:** ougl.1 — buildSystemPrompt prior-artefact handoff parameter
**Feature:** 2026-05-06-web-ui-guided-outer-loop
**Test file:** `tests/check-ougl1-buildsystemprompt-handoff.js`
**Date:** 2026-05-06
**Total ACs:** 8

---

## Test Data Strategy

**Type:** Synthetic — no real artefact files on disk are needed. All tests pass `os.tmpdir()` as `repoRoot` so no product/SKILL.md files exist, isolating the handoff block logic. Handoff content is constructed inline in each test.

**External dependencies:** None (function is synchronous and CPU-only per NFRs).

**Setup/teardown:** `freshRequire` clears the module cache before each test group. No `afterEach` cleanup needed (no state mutation between calls).

---

## AC Coverage Table

| AC  | Description | Test IDs | Gap type | Risk |
|-----|-------------|----------|----------|------|
| AC1 | No 4th arg → result does NOT contain `--- HANDOFF CONTEXT ---` | T1.1 | None | Low |
| AC2 | With `priorArtefacts` array → result contains `--- HANDOFF CONTEXT ---` | T1.2 | None | Medium |
| AC3 | `priorArtefacts[0].path` appears as `--- PRIOR ARTEFACT: [path] ---` header | T1.3 | None | Medium |
| AC4 | `priorArtefacts[0].content` appears between header and `--- END PRIOR ARTEFACT ---` | T1.4 | None | Medium |
| AC5 | Handoff block appears BEFORE `--- WEB UI PROTOCOL ---` section | T1.5 | None | Medium |
| AC6 | Two items → two distinct blocks, both within handoff section | T1.6 | None | Medium |
| AC7 | `priorArtefacts: []` → does NOT contain `--- HANDOFF CONTEXT ---` | T1.7 | None | Low |
| AC8 | Existing callers without 4th arg → all existing tests still pass | T1.8 | None | Low |

**Coverage gaps:** None. All ACs are testable via unit assertions on the string output of `buildSystemPrompt`.

---

## Unit Tests

### T1.1 (AC1) — No 4th arg → no HANDOFF block
**Preconditions:** `buildSystemPrompt` exported from `skills.js`.
**Call:** `buildSystemPrompt('discovery', '/tmp/test-session', os.tmpdir())` — 3 args only.
**Expected:** result string does NOT include `--- HANDOFF CONTEXT ---`.

### T1.2 (AC2) — With priorArtefacts → contains HANDOFF block
**Preconditions:** Same module.
**Call:** `buildSystemPrompt('benefit-metric', '/tmp/test', os.tmpdir(), [{ path: 'artefacts/test/discovery.md', content: 'Content.' }])`
**Expected:** result includes `--- HANDOFF CONTEXT ---`.

### T1.3 (AC3) — Prior artefact path appears in header
**Call:** `buildSystemPrompt('benefit-metric', '/tmp/test', os.tmpdir(), [{ path: 'artefacts/test/discovery.md', content: 'X' }])`
**Expected:** result includes `--- PRIOR ARTEFACT: artefacts/test/discovery.md ---`.

### T1.4 (AC4) — Content between header and END marker
**Call:** same as T1.3 with unique content string `'Discovery content — 7x3y.'`
**Expected:** result includes content between `--- PRIOR ARTEFACT: [path] ---` and `--- END PRIOR ARTEFACT ---`. Assert by finding header index, end index, and checking content is in the slice.

### T1.5 (AC5) — HANDOFF block appears before WEB UI PROTOCOL
**Call:** same setup with one prior artefact.
**Expected:** `indexOf('--- HANDOFF CONTEXT ---') < indexOf('--- WEB UI PROTOCOL ---')`.

### T1.6 (AC6) — Two prior artefacts → two distinct PRIOR ARTEFACT blocks
**Call:** `priorArtefacts` has two entries with different paths and content.
**Expected:** result contains exactly 2 `--- PRIOR ARTEFACT:` headers and 2 `--- END PRIOR ARTEFACT ---` markers. Both contents appear in result.

### T1.7 (AC7) — Empty array → no HANDOFF block
**Call:** `buildSystemPrompt('discovery', '/tmp/test', os.tmpdir(), [])`
**Expected:** result does NOT include `--- HANDOFF CONTEXT ---`.

### T1.8 (AC8) — Existing 3-arg signature still produces WEB UI PROTOCOL
**Call:** `buildSystemPrompt('discovery', '/tmp/test', os.tmpdir())` (no 4th arg).
**Expected:** result includes `--- WEB UI PROTOCOL ---` (WEB UI PROTOCOL section intact).

---

## Integration Tests

No integration tests required. `buildSystemPrompt` is synchronous, CPU-only, and has no I/O when `repoRoot` points to an empty directory (per NFR). All callers that pass existing sessions via `registerHtmlSession` are covered by regression in AC8 / full `npm test` chain.

---

## NFR Tests

**NFR-1 (Synchronous, no I/O):** Implicitly covered — tests call the function synchronously; if it required async or I/O beyond filesystem reads, the test runner would hang. The test passes `os.tmpdir()` as repoRoot so no real files are read, keeping tests deterministic.

**NFR-2 (Path traversal is caller's responsibility):** Not tested here — this is a documentation NFR, not a runtime enforcement point in `buildSystemPrompt`.

---

## Pre-implementation Expectation

T1.1, T1.7, T1.8 will PASS before implementation (existing code does not inject any handoff block). T1.2–T1.6 will FAIL before implementation (existing code ignores the 4th argument). This is the correct TDD baseline.
