# Contract Proposal: Dismiss / mark-reviewed for the signals panel

**Story:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s4.md
**Date:** 2026-10-04

---

## What will be built

- New module `src/web-ui/modules/dismissed-signals-store.js`: `isDismissed(key)`, `dismiss(key)`, `undismiss(key)`, `setDismissedSignalsStore(adapter)`, `_resetDismissedSignalsStoreForTesting()`. D37 injectable adapter pattern matching `signals-aggregator.js`'s `_fileReadAdapter`/`createFsFileReadAdapter` exactly — stub default throws `'Adapter not wired: dismissed-signals-store. Call setDismissedSignalsStore() with a real implementation before use.'`.
- A stable-key hash function (`crypto.createHash('sha256')` over `source`+`type`+`text`) — Node built-in, no new npm dependency.
- Two new routes: `POST /signals/dismiss` and `POST /signals/undismiss`, both requiring the existing `_csrf` middleware (`generateCsrfToken`/`csrfField`, the same convention every other POST route in this app uses — closes review finding 1-M1). Each reads `source`/`type`/`text` from the submitted form, recomputes the key server-side (never trusts a client-submitted hash directly), and calls the store.
- `handleGetSignalsPanelHtml` extended to compose a dismissed-set filter with `sptu-s2`'s own `filterSignals` pre-pagination filter pass, plus a `showDismissed` query flag.
- `signals-panel-view.js` extended with Dismiss/Undismiss form buttons per item and a "show dismissed" toggle link.
- Production wiring of `setDismissedSignalsStore` in `server.js`, alongside the existing `signals-aggregator.js` adapter wiring.
- New test file `tests/check-sptu-s4-signals-dismiss.js` (14 tests per the test plan).

## What will NOT be built

- Bulk dismiss / multi-select — per `discovery.md`'s own Out of Scope.
- Multi-tenant or per-operator dismiss-state isolation — single shared file, solo-operator scope.
- Auto-expiring dismissals or any migration/backfill mechanism — none exists; this is a net-new file.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — dismiss removes from default view | `dismiss`/`isDismissed` unit test + real route-dispatch test (POST dismiss, then GET) | unit, integration |
| AC2 — survives reload/new session | Real-file persistence test with two independent adapter instances | integration |
| AC3 — reversible via show-dismissed/Undismiss | `undismiss` unit test (isolation) + real route-dispatch test | unit, integration |
| AC4 — no key collision | Unit test: two distinct signals, two distinct, individually-correct outcomes | unit |
| AC5 — D37 real wiring, behavioural | Real route-dispatch test through the actual production wiring, not a test override | integration |
| AC6 — keyboard-accessible controls | Unit test confirming plain `<button>`/`<a>`, no `tabindex` override | unit |
| AC7 — graceful degradation on corrupt/missing file | Unit test (adapter level) + integration test (route level) | unit, integration |
| CSRF (closes 1-M1) | Real route-dispatch tests: missing/invalid token rejected, valid token succeeds | integration |

## Assumptions

- `source`+`type`+`text` is the full real content of a signal (confirmed via `_makeSignal`'s real shape in `signals-aggregator.js`) — sufficient to derive a stable key with acceptably low collision risk for this reversible, UI-only action.
- The dismiss/undismiss forms submit `source`/`type`/`text` as hidden fields (matching the existing CTA form convention in `_signalItem`), and the server recomputes the hash rather than trusting a client-submitted key — closes a latent integrity gap a naive "submit the key directly" design would have.
- `workspace/dismissed-signals.json` stores only derived hash strings, never raw signal content (NFR, Security).

## Estimated touch points

**Files:** `src/web-ui/modules/dismissed-signals-store.js` (new), `src/web-ui/utils/filter-signals.js` (reused, not modified — composition happens in the route handler), `src/web-ui/routes/signals-panel.js` (modified — two new routes + composition), `src/web-ui/views/signals-panel-view.js` (modified), `src/web-ui/server.js` (modified — route registration + D37 wiring), `tests/check-sptu-s4-signals-dismiss.js` (new)
**Services:** none external — new local file `workspace/dismissed-signals.json`
**APIs:** `POST /signals/dismiss`, `POST /signals/undismiss` (both new); `GET /signals` extended with `?showDismissed=`

---

## Contract Review

Cross-checked against the story's own 7 ACs plus the CSRF requirement from review finding 1-M1 — every item maps to a specific, named test approach matching the test plan exactly. The D37 adapter pattern is applied completely (stub throws, wiring AC present as AC5, wiring task will be named separately at `/implementation-plan`). No mismatch found.

**Verdict:** ✅ PASSED — proposed implementation aligns with all ACs.
