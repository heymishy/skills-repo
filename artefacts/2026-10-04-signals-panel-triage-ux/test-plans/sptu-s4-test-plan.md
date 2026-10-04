## Test Plan: Dismiss / mark-reviewed for the signals panel

**Story reference:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s4.md
**Epic reference:** artefacts/2026-10-04-signals-panel-triage-ux/epics/signals-panel-triage-controls.md
**Test plan author:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-04

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`.

**Review finding closed in this plan (1-M1, sptu-s4-review-1.md):** the dismiss/undismiss POST action must use this app's own established CSRF convention (`_csrf.generateCsrfToken`/`csrfField`, already used by every other state-changing form in `signals-panel-view.js`). This plan adds a dedicated integration test asserting a missing/invalid CSRF token is rejected — not left as an unverified assumption.

**Real architecture grounding (confirmed by direct code read):**
- New pure module `src/web-ui/modules/dismissed-signals-store.js`, D37 adapter pattern matching `signals-aggregator.js`'s own `_fileReadAdapter`/`createFsFileReadAdapter` precedent exactly: `isDismissed(key)`, `dismiss(key)`, `undismiss(key)`, `setDismissedSignalsStore(adapter)`, `_resetDismissedSignalsStoreForTesting()`. Stub default throws (D37 rule 1).
- New routes `POST /signals/dismiss` and `POST /signals/undismiss`, each: read `_csrf` token via the same middleware every existing POST route in this app uses, recompute the stable key server-side from submitted `source`/`type`/`text` fields (never trust a client-submitted hash directly), call the store.
- Dismiss-filter composes with `sptu-s2`'s own `filterSignals` as another `hide` predicate, applied in the same pre-pagination pass.

**E2E/browser-layout detection (Step 3a):** No AC depends on CSS layout or pointer coordinates. AC6's keyboard-accessibility requirement is satisfied by the Dismiss/Undismiss controls being plain `<button>`/`<a>` form-submit elements — a DOM-structure assertion. No E2E test required.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Dismissing removes a signal from the default view | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Dismissal survives reload and a new session | — | 1 test | — | — | — | 🟢 |
| AC3 | Dismissal is reversible via "show dismissed" / Undismiss | 1 test | 1 test | — | — | — | 🟢 |
| AC4 | Two distinct signals never collide on the derived key | 1 test | — | — | — | — | 🟢 |
| AC5 | Adapter wired to a real implementation, behavioural test (D37) | — | 1 test | — | — | — | 🟢 |
| AC6 | Dismiss/undismiss controls are keyboard-accessible | 1 test | — | — | — | — | 🟢 |
| AC7 | Corrupt/missing file degrades gracefully | 1 test | 1 test | — | — | — | 🟢 |
| — | **CSRF protection on the new POST routes (closes 1-M1)** | — | 2 tests | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — fixture signals with distinct `source`+`type`+`text` combinations; a temp JSON file (or injected in-memory adapter) standing in for `workspace/dismissed-signals.json`, never the real repo file.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A fixture array, one signal dismissed via its derived key | Synthetic | None | |
| AC2 | The same, with the store adapter backed by a real temp file (not in-memory) across two separate calls simulating reload | Synthetic + real temp file | None | Proves persistence, not just in-process state |
| AC3 | A dismissed signal, then an undismiss call | Synthetic | None | |
| AC4 | Two signals with different `source`+`type`+`text` | Synthetic | None | |
| AC5 | Two distinct dismiss-key inputs dispatched through the real wired `server.js` adapter | Synthetic | None | Behavioural, not reference-equality |
| AC6 | Rendered dismiss/undismiss control markup | Synthetic | None | |
| AC7 | A temp file deleted, and separately a temp file containing invalid JSON | Real temp file | None | |
| CSRF | A real POST request with no `_csrf` field, and a separate one with a valid token | Synthetic + real CSRF middleware | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### dismiss(key) then isDismissed(key) returns true for that key only

- **Verifies:** AC1
- **Precondition:** A fresh in-memory adapter via `setDismissedSignalsStore`
- **Action:** Call `dismiss('keyA')`, then `isDismissed('keyA')` and `isDismissed('keyB')`
- **Expected result:** `isDismissed('keyA') === true`, `isDismissed('keyB') === false`
- **Edge case:** No

### undismiss(key) reverses a prior dismiss(key) and only that key

- **Verifies:** AC3
- **Precondition:** Both `'keyA'` and `'keyB'` dismissed
- **Action:** Call `undismiss('keyA')`
- **Expected result:** `isDismissed('keyA') === false`, `isDismissed('keyB') === true` (unaffected)
- **Edge case:** Yes — confirms isolation, not a blanket clear

### Two signals with different source+type+text produce two different, individually-correct dismiss outcomes

- **Verifies:** AC4
- **Precondition:** Signal A `{source:'capture-log', type:'gap', text:'x'}`, Signal B `{source:'decisions', type:'decision', text:'y'}` — their real derived keys computed via the real hash function
- **Action:** Dismiss only Signal A's key
- **Expected result:** `isDismissed(keyOf(A)) === true`, `isDismissed(keyOf(B)) === false` — not just "a hash function was called," a real differentiated outcome
- **Edge case:** Yes — this is the D37-style behavioural-correctness requirement from Architecture Constraints

### Dismiss/Undismiss controls render as plain, focusable elements with no tabindex override

- **Verifies:** AC6
- **Precondition:** A rendered signal item, once not dismissed (shows Dismiss) and once dismissed with `showDismissed=true` (shows Undismiss)
- **Action:** Inspect each control's tag/attributes
- **Expected result:** Each is a `<button>` inside a `<form>` (matching the existing CTA form convention) or a plain `<a>`, no `tabindex` override
- **Edge case:** No

### isDismissed returns false for every key when the backing file does not exist or contains invalid JSON

- **Verifies:** AC7
- **Precondition:** A real fs-backed adapter pointed at a path that does not exist; separately, a temp file containing `"{not valid json"`
- **Action:** Call `isDismissed('anyKey')` in both cases
- **Expected result:** Both return `false` — never throws, never crashes the caller
- **Edge case:** Yes — first-use and corruption are both covered

---

## Integration Tests

### Real route dispatch: POST /signals/dismiss removes the signal from the next GET /signals

- **Verifies:** AC1 (behavioural half)
- **Components involved:** New dismiss route, `dismissed-signals-store.js`, `filterSignals` composition, `handleGetSignalsPanelHtml`
- **Precondition:** `setSignalsSource` returns a fixture including a known signal; a real CSRF token obtained the same way `handleGetSignalsPanelHtml` obtains one
- **Action:** Dispatch `POST /signals/dismiss` with that signal's `source`/`type`/`text` and a valid CSRF field, then dispatch `GET /signals`
- **Expected result:** The `GET /signals` response no longer contains that signal's rendered text in the default view

### Real persistence: dismissal survives a fresh adapter instance reading the same real file (simulated reload/new session)

- **Verifies:** AC2
- **Components involved:** `dismissed-signals-store.js`'s real fs-backed adapter
- **Precondition:** A real temp file path (not the repo's real `workspace/dismissed-signals.json`)
- **Action:** Dismiss a key via one adapter instance pointed at the temp file; construct a SECOND, independent adapter instance pointed at the same temp file; call `isDismissed` on it
- **Expected result:** The second, independent instance also reports the key as dismissed — proves the state lives in the file, not in-process memory

### Real route dispatch: "show dismissed" reveals a dismissed signal with a working Undismiss action

- **Verifies:** AC3
- **Components involved:** Same as AC1's integration test, plus the undismiss route
- **Precondition:** One signal already dismissed via the dismiss route
- **Action:** Dispatch `GET /signals?showDismissed=true`, then `POST /signals/undismiss` for that same signal, then `GET /signals` (default view)
- **Expected result:** The `showDismissed=true` response shows the signal marked as dismissed; after undismiss, the default `GET /signals` shows it again, normally

### Real route dispatch: the wired production adapter correctly differentiates two real dismiss-key inputs (D37 AC5)

- **Verifies:** AC5
- **Components involved:** The real `server.js` wiring (not a test override) for `setDismissedSignalsStore`
- **Precondition:** Two distinct real signals, dispatched through the actual production wiring path (temp file substituted only at the fs-path level, not by overriding the adapter function itself — proving the real wiring, not a test seam)
- **Action:** Dismiss only the first signal via its real route
- **Expected result:** The first signal is excluded from `GET /signals`; the second is not — behavioural differentiation through the real wired path, matching D37 rule 4 exactly (not merely asserting `setDismissedSignalsStore` was called)

### Real route dispatch: POST /signals/dismiss without a valid CSRF token is rejected (closes review finding 1-M1)

- **Verifies:** CSRF NFR (1-M1)
- **Components involved:** New dismiss route, `middleware/csrf.js`
- **Precondition:** A real signal fixture
- **Action:** Dispatch `POST /signals/dismiss` with the signal's `source`/`type`/`text` but NO `_csrf` field (and separately, with an invalid/stale token)
- **Expected result:** Both requests are rejected (consistent with this app's existing CSRF-rejection response shape for other POST routes); the signal is NOT dismissed — confirmed by a follow-up `GET /signals` still showing it

### Real route dispatch: POST /signals/dismiss with a valid CSRF token succeeds

- **Verifies:** CSRF NFR (1-M1, positive case)
- **Components involved:** Same as above
- **Precondition:** A real signal fixture, a real token from `_csrf.generateCsrfToken(req)`
- **Action:** Dispatch `POST /signals/dismiss` with that valid token
- **Expected result:** `200`-class response; the signal is dismissed (confirmed by a follow-up `GET /signals`)

### Real route dispatch: a corrupt dismissed-signals.json degrades gracefully at the route level too

- **Verifies:** AC7 (behavioural half)
- **Components involved:** `handleGetSignalsPanelHtml`, the real fs-backed adapter
- **Precondition:** A temp file containing invalid JSON, wired as the real adapter's target path
- **Action:** Dispatch `GET /signals`
- **Expected result:** `200` response, normal rendering (not a 500), treating the dismissed-set as empty

---

## NFR Tests

### Dismissed-set lookup stays within the established <100ms render budget

- **NFR addressed:** Performance
- **Measurement method:** Wall-clock timing of `filterSignals` (now composed with the dismissed-set check) + `paginateSignals` on a 5,340-item synthetic array with a non-trivial dismissed set (e.g. 500 dismissed keys)
- **Pass threshold:** <100ms
- **Tool:** `node tests/check-sptu-s4-signals-dismiss.js` — a real, dedicated `test()` call, not merely named here

### Security — dismissed-signals.json contains no raw signal content

- **NFR addressed:** Security
- **Measurement method:** A dedicated unit test asserting the persisted file's own on-disk shape contains only derived hash strings, never the original `text`/`source`/`type` fields verbatim
- **Pass threshold:** 100% of persisted entries are hash strings, not objects containing raw signal fields
- **Tool:** `node tests/check-sptu-s4-signals-dismiss.js`

---

## Out of Scope for This Test Plan

- Bulk dismiss / multi-select — not in this story's scope
- Any test of `sptu-s2`'s own type/source filter logic beyond confirming composition — covered by `sptu-s2`'s own test plan

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Dismiss-file growth over time (stale keys for signals whose source content later changes) has no dedicated test | Low real-world impact at solo-operator scale; flagged as LOW in review (1-L2), not a functional defect | Noted for retrospective; revisit if real usage shows the file grows unmanageably |
