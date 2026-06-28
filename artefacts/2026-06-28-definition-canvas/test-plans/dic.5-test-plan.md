## Test Plan: Canvas-edit dispatch and audit trail parity

**Story reference:** artefacts/2026-06-28-definition-canvas/stories/dic.5.md
**Discovery reference:** artefacts/2026-06-28-definition-canvas/discovery.md
**Test plan author:** Copilot
**Date:** 2026-06-28

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Apply-changes click → POST with correct schema; button disabled during flight | 3 tests | 1 test | — | — | — | 🟢 |
| AC2 | Success response → button re-enables, count resets, canvas refreshes, operator cards become model-origin | 4 tests | — | — | — | — | 🟢 |
| AC3 | 409 when model turn in flight → error shown, pending preserved, button re-enables | 3 tests | 1 test | — | — | — | 🟢 |
| AC4 | 400 non-current phase target → no write, no audit entry | 2 tests | — | — | — | — | 🟢 |
| AC5 | 400 malformed body → 400 with descriptive error | 3 tests | — | — | — | — | 🟢 |
| AC6 | Audit trail: per-change entries; schema identity with conversational-turn entries (M1 CI test) | 3 tests | 1 test | — | — | — | 🟢 |
| AC7 | Path traversal guard → 400 + no file written | 2 tests | — | — | — | — | 🟢 |
| AC8 | applyCanvasEdits stub-throw default + production wiring | 2 tests | — | — | — | — | 🟢 |
| AC9 | Write-then-read disk canonicity sequence | 2 tests | — | — | — | — | 🟢 |
| NFR-SEC | req.session.accessToken used (not req.session.token); no raw path in logs | 2 tests | — | — | — | — | 🟢 |
| NFR-PERF | M3 round-trip ≤3s P90 | — | — | — | 1 scenario | Manual | 🟡 |
| NFR-AUDIT | M1 CI test (check-dic5-audit-trail.js) passes | CI | — | — | — | CI gate | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Node.js | Handling |
|-----|----|----------|------------------------------|---------|
| M3 round-trip P90 ≤3s | NFR-PERF | Runtime perf | Requires real HTTP server + real definition.md rewrite | Manual smoke test: time 10 sequential apply-changes actions; record P50/P90 🟡 |
| Real filesystem atomicity of definition.md write | AC9 | Runtime I/O | Full fs behaviour requires integration environment | Integration test with tmp directory fixture verifies write-then-read sequence 🟢 |

---

## Test Data Strategy

**Source:** Mixed — synthetic request bodies and mock session fixtures; real-filesystem integration fixture for AC9; conversational-turn audit entry reference fixture for AC6 (M1).

**PCI/sensitivity in scope:** No.
**Availability:** Available now.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | pendingReorder and pendingAdds arrays; mock POST request | Synthetic | None | |
| AC2 | Success response `{ ok: true, artefactPath, updatedAt }`; updated canvasCards | Synthetic | None | |
| AC3 | session with streamActive: true; POST request | Synthetic | None | |
| AC4 | POST body with phaseId targeting a non-current phase | Synthetic | None | |
| AC5 | POST bodies: missing pendingReorder, extra field, wrong type | Synthetic | None | 3 separate malformed cases |
| AC6 | Audit entry produced by canvas-edit; reference audit entry from conversational-turn | Synthetic + fixture | None | Reference fixture is the M1 schema anchor |
| AC7 | Session with artefactPath containing `../../etc/passwd`; POST request | Synthetic | None | Path traversal probe |
| AC8 | Route handler with unwired adapter; route handler with production-wired adapter | Synthetic | None | |
| AC9 | Writable tmp directory; definition.md write fixture | Real filesystem | None | |
| NFR-SEC | Route handler call; inspect session field access; inspect log output | Synthetic | None | |

### PCI / sensitivity constraints

None.

### M1 audit trail reference fixture

The conversational-turn audit entry reference schema (used in AC6 / check-dic5-audit-trail.js) is:
```json
{
  "type": "canvas-edit",
  "action": "reorder",
  "subject": { "epicId": "string", "storyId": "string" },
  "value": { "newIndex": "number" },
  "origin": "conversational-turn",
  "sessionId": "string",
  "timestamp": "ISO8601 string"
}
```
The canvas-edit audit entry must match this schema with `"origin": "canvas"` substituted. The CI test (`check-dic5-audit-trail.js`) asserts field-by-field structural identity.

---

## Unit Tests

### POST handler sends correct Content-Type and body schema

- **Verifies:** AC1
- **Precondition:** Client-side `applyChanges()` function is callable; mock `fetch` is wired
- **Action:** Call `applyChanges({ pendingReorder: [{cardId:'c1',epicId:'e1',phaseId:'p1',newIndex:1}], pendingAdds: [] })`
- **Expected result:** `fetch` was called with `POST /api/skills/definition/sessions/:id/canvas-edit`; body contains `{ pendingReorder, pendingAdds }` as JSON; `Content-Type: application/json`
- **Edge case:** No

### Apply button disabled during in-flight request

- **Verifies:** AC1
- **Precondition:** Mock fetch does not resolve immediately
- **Action:** Call `applyChanges(...)` and check button state before fetch resolves
- **Expected result:** Button element has `disabled` attribute; label shows "Applying…"
- **Edge case:** No

### Apply button re-enables after fetch resolves

- **Verifies:** AC1, AC2
- **Precondition:** Mock fetch resolves with success
- **Action:** Call and await
- **Expected result:** Button is no longer disabled
- **Edge case:** No

### Success response: pending count resets to 0

- **Verifies:** AC2
- **Precondition:** pendingReorder.length + pendingAdds.length = 3 before apply
- **Action:** Mock fetch returns `{ ok: true, ... }`; call applyChanges
- **Expected result:** Pending-changes count is 0; button label is "Apply changes (0 pending)"
- **Edge case:** No

### Success response: operator-added cards transition to model origin in canvasCards

- **Verifies:** AC2
- **Precondition:** `session.canvasCards` has an entry with `origin: 'operator'`
- **Action:** Apply succeeds; canvas refresh renders the updated artefact (mock `renderDefinitionMap` call)
- **Expected result:** The refreshed render is called with updated `canvasCards` where the formerly-operator card now has `origin: 'model'`
- **Edge case:** No

### Success response: pendingReorder and pendingAdds are cleared

- **Verifies:** AC2
- **Precondition:** Both arrays have entries
- **Action:** Apply succeeds
- **Expected result:** Both arrays are empty after success
- **Edge case:** No

### 409 response: error message shown inline

- **Verifies:** AC3
- **Precondition:** Mock fetch returns 409 with `{ error: 'A model turn is in progress…' }`
- **Action:** Call applyChanges
- **Expected result:** An error message element appears near the Apply button containing the error text
- **Edge case:** No

### 409 response: pending state not cleared

- **Verifies:** AC3
- **Precondition:** pendingReorder has 2 entries
- **Action:** Apply returns 409
- **Expected result:** `pendingReorder` still has 2 entries after the 409
- **Edge case:** No

### 409 response: button re-enables after error

- **Verifies:** AC3
- **Precondition:** Same
- **Action:** Same
- **Expected result:** Button is no longer disabled after 409 is handled
- **Edge case:** No

### Route handler returns 409 when session.streamActive is true

- **Verifies:** AC3 (server-side)
- **Precondition:** `req.session.streamActive = true`; valid POST body
- **Action:** Call the route handler directly
- **Expected result:** Response status is 409; body is `{ error: 'A model turn is in progress — apply changes after the turn completes.' }`; no adapter call made
- **Edge case:** No

### Route handler returns 400 for non-current phase target

- **Verifies:** AC4
- **Precondition:** POST body has `pendingReorder[0].phaseId` set to a non-current phase id; session phase model has that phase as non-current
- **Action:** Call the route handler
- **Expected result:** Response status 400; body `{ error: 'Canvas edit targets a non-current phase row.' }`; no `applyCanvasEdits` call
- **Edge case:** No

### Route handler returns 400 for non-current phase — no audit entry written

- **Verifies:** AC4
- **Precondition:** Same; audit writer mock is wired
- **Action:** Same call
- **Expected result:** Audit writer mock was not called (zero calls)
- **Edge case:** No

### Route handler returns 400 for missing pendingReorder field

- **Verifies:** AC5
- **Precondition:** POST body `{ pendingAdds: [] }` (no pendingReorder)
- **Action:** Call handler
- **Expected result:** Response status 400 with descriptive error; no write
- **Edge case:** Yes — missing required field

### Route handler returns 400 for unrecognised field

- **Verifies:** AC5
- **Precondition:** POST body contains extra field `maliciousField: 'value'`
- **Action:** Call handler
- **Expected result:** Response status 400; no write
- **Edge case:** Yes — extra field

### Route handler returns 400 for wrong type (pendingReorder is not array)

- **Verifies:** AC5
- **Precondition:** POST body `{ pendingReorder: "not-an-array", pendingAdds: [] }`
- **Action:** Call handler
- **Expected result:** Response status 400; no write
- **Edge case:** Yes — type error

### Audit entry for reorder has correct schema

- **Verifies:** AC6 (unit: schema structure)
- **Precondition:** `buildCanvasAuditEntry({ action: 'reorder', epicId: 'e1', storyId: 's1', newIndex: 2, sessionId: 'sess1' })` is callable
- **Action:** Call and inspect result
- **Expected result:** Returns `{ type: 'canvas-edit', action: 'reorder', subject: { epicId: 'e1', storyId: 's1' }, value: { newIndex: 2 }, origin: 'canvas', sessionId: 'sess1', timestamp: <ISO8601> }`
- **Edge case:** No

### Audit entry for add has correct schema

- **Verifies:** AC6
- **Precondition:** Same function called with `{ action: 'add', epicId, title, sessionId }`
- **Action:** Call and inspect
- **Expected result:** Returns correct schema with `action: 'add'` and `value: { title }`
- **Edge case:** No

### Batch of 3 changes produces 3 audit entries

- **Verifies:** AC6 (one entry per change, not one per batch)
- **Precondition:** POST body with `pendingReorder: [e1, e2]` and `pendingAdds: [a1]`; audit writer mock is wired
- **Action:** Call handler with successful execution
- **Expected result:** Audit writer mock called exactly 3 times with distinct entries
- **Edge case:** No

### Path traversal guard blocks `../../` path

- **Verifies:** AC7
- **Precondition:** Session artefactPath resolves to `/etc/passwd` (or equivalent outside repoRoot)
- **Action:** Call handler
- **Expected result:** Response status 400; no file write attempted
- **Edge case:** Yes — path traversal probe

### Path traversal guard: no file written after rejection

- **Verifies:** AC7 (belt-and-braces check)
- **Precondition:** Same; fs.writeFile mock tracks calls
- **Action:** Same call
- **Expected result:** `fs.writeFile` was not called
- **Edge case:** Yes

### applyCanvasEdits stub-throw fires if adapter not wired

- **Verifies:** AC8
- **Precondition:** `_applyCanvasEdits` set to stub default (not wired)
- **Action:** Call the route handler
- **Expected result:** Throws `Error('Adapter not wired: applyCanvasEdits. Call setApplyCanvasEdits() with a real implementation before use.')`
- **Edge case:** Yes — misconfiguration guard

### applyCanvasEdits production wiring returns without throwing

- **Verifies:** AC8 (production wiring)
- **Precondition:** `setApplyCanvasEdits(realImplementation)` called; real implementation is called with a minimal valid session and changes
- **Action:** Call via route handler with a minimal reorder request
- **Expected result:** No exception thrown; function returns (or resolves) without error
- **Edge case:** No

### write-then-read: handoff uses readFileSync content not in-memory content

- **Verifies:** AC9
- **Precondition:** `applyCanvasEdits` is instrumented to track what content is passed to handoff; `fs.writeFileSync` and `fs.readFileSync` are both wired to a tmp fixture
- **Action:** Apply a reorder change that modifies the definition.md content
- **Expected result:** The handoff content equals the value returned by `fs.readFileSync` after the write — not the pre-write `session.artefactContent`
- **Edge case:** No

### write-then-read: stage does not advance if disk write fails

- **Verifies:** AC9 (write must precede completeStage)
- **Precondition:** `fs.writeFileSync` is mocked to throw an error
- **Action:** Call the handler
- **Expected result:** The handler returns an error response (5xx); `completeStage()` (or equivalent) is NOT called
- **Edge case:** Yes — write failure guard

---

## Integration Tests

### Full dispatch round-trip: POST → rewrite → success response

- **Verifies:** AC1, AC2, AC6 (end-to-end integration)
- **Components involved:** Route handler, `applyCanvasEdits` real implementation, tmp definition.md fixture, audit writer
- **Precondition:** A test definition.md fixture with 2 stories in 1 epic; POST body with a valid reorder
- **Action:** POST to handler; await response
- **Expected result:** Response is 200 `{ ok: true }`; definition.md fixture on disk has updated story order; audit log has 1 entry with correct schema

### Audit trail parity: canvas-edit entry schema matches conversational-turn reference

- **Verifies:** AC6 (M1 CI gate)
- **Script:** `tests/check-dic5-audit-trail.js`
- **Precondition:** A canvas-edit audit entry fixture and the conversational-turn reference fixture (schema above)
- **Action:** Assert field-by-field that every key present in the reference schema is present in the canvas-edit entry with the correct type
- **Expected result:** Zero schema divergences; only `origin` value differs (`'canvas'` vs `'conversational-turn'`)

### 409 guard: route handler rejects while session.streamActive is true

- **Verifies:** AC3 (server path)
- **Components involved:** Route handler, session mock with `streamActive: true`
- **Precondition:** Session configured with `streamActive: true`
- **Action:** POST with valid body
- **Expected result:** 409 response; `applyCanvasEdits` not called

---

## NFR Tests

### req.session.accessToken used — not req.session.token

- **NFR addressed:** Security (canonical token field)
- **Precondition:** Route handler reads GitHub token from session
- **Action:** Inspect handler source for `req.session.token` usage
- **Expected result:** `grep -n "req\.session\.token[^A]" src/web-ui/routes/skills.js` returns zero matches in the canvas-edit handler code path

### Path traversal: raw path not logged on guard failure

- **NFR addressed:** Security (no raw path in production logs)
- **Precondition:** Guard failure triggered with path `../../etc/passwd`
- **Action:** Capture log output during guard failure
- **Expected result:** Log output does not contain `../../etc/passwd` or the resolved absolute path of the traversal attempt

---

## M1 CI Test Specification

**File:** `tests/check-dic5-audit-trail.js`
**Run by:** CI on every PR touching `src/web-ui/routes/skills.js` or the audit-write path
**Pass threshold:** Zero schema divergences; failure blocks merge

The test:
1. Constructs a canvas-edit audit entry by calling `buildCanvasAuditEntry` for a reorder and an add action.
2. Loads the conversational-turn reference fixture (hardcoded schema object in the test file — see Data Requirements above).
3. For each field in the reference schema, asserts: (a) the field is present in the canvas-edit entry; (b) `typeof entry[field] === typeof reference[field]`; (c) for nested objects, the same check applies recursively.
4. Asserts that `entry.origin === 'canvas'` and `reference.origin === 'conversational-turn'` (the only permitted difference).

---

## Manual Smoke Test Scenarios

1. **M3 round-trip:** Time 10 sequential "Apply changes" actions on a definition session with 5 stories across 2 epics. Record P50 and P90 wall-clock times. Pass: P90 ≤ 3s. Document in DoR sign-off.
2. **End-to-end canvas flow:** Add 2 stories via canvas, reorder 1 story, apply changes. Verify refreshed canvas shows all changes; open definition.md and verify content matches canvas state.

---

## Out of Scope for This Test Plan

- Client-side drag / touch interaction — dic.1, dic.4
- Add-story canvas flow — dic.3
- Phase row rendering — dic.2

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| M3 P90 ≤3s | Requires real HTTP server + real file I/O | Manual smoke test; log P50/P90 in DoR sign-off |
| Conversational-turn reference fixture accuracy | Fixture is hardcoded in test — must match actual audit entry shape | The audit entry shape must be confirmed from an existing session log before the CI test is merged; flagged as a pre-merge verification step in DoR |
