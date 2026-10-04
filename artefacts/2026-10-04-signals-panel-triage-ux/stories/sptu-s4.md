## Story: Dismiss / mark-reviewed for the signals panel
**Epic reference:** artefacts/2026-10-04-signals-panel-triage-ux/epics/signals-panel-triage-controls.md
**Discovery reference:** artefacts/2026-10-04-signals-panel-triage-ux/discovery.md
**Benefit-metric reference:** artefacts/2026-10-04-signals-panel-triage-ux/benefit-metric.md
**Domain:** [web-ui]
## User Story
As a **Solo operator (you, today)**,
I want **a per-signal "Dismiss" action that removes a signal from the default `/signals` view, reversibly, with a "show dismissed" toggle to bring it back**,
So that **the list stops re-surfacing signals I've already handled, delivering Metric 3 (Dismiss retention) and closing the third failure mode named in discovery.md**.
## Benefit Linkage
Metric 3 — Dismiss retention (benefit-metric.md): baseline 0% (no mechanism exists today), target 100% of dismissed signals stay dismissed across reloads and new sessions. This story is the sole mechanism that moves this metric.
## Architecture Constraints
**Stable dismiss-key (decisions.md, 2026-10-04):** dismiss by a derived stable key — a hash of `source` + `type` + `text` — never `signal.id` (confirmed non-deterministic for `parse-error` signals, using `Math.random()` + a fresh `new Date().toISOString()` per request; `ep1-s2-dod.md`'s own AC5 deviation). Use Node's built-in `crypto` module (e.g. `crypto.createHash('sha256')`) — no new npm dependency (discovery.md Constraints). Compute identically at dismiss-time and at every subsequent filter-time render.
**Persistence (decisions.md, 2026-10-04):** a new dedicated file, `workspace/dismissed-signals.json` — not a database, not appended to an unrelated existing file.
**D37 injectable adapter rule applies** — this story introduces a new file-read/write seam for `workspace/dismissed-signals.json`, matching `signals-aggregator.js`'s own existing `_fileReadAdapter` precedent:
  1. The stub default MUST throw (`'Adapter not wired: dismissed-signals-store. Call setDismissedSignalsStore() with a real implementation before use.'`), never return an empty/default list.
  2. AC5 below is the explicit DoR wiring AC.
  3. The implementation plan must list "wire the real fs-backed adapter in `server.js`" as a separate task from "write the dismiss/undismiss handler + injectable setter."
  4. The wiring test must assert behavioural correctness (dismiss key A dismissed, key B not dismissed → the filtered-view output differs correctly for A vs B), not merely that a setter was called.
**Extends the filter mechanism from `sptu-s2`:** dismissed-by-default is implemented as another hide-filter applied before `paginateSignals()`, reusing the same "filter full list before pagination" integration point `sptu-s2` establishes — not a second, parallel filtering code path.
**No new npm runtime dependency.**
## Dependencies
`sptu-s2` (type/source filter) — reuses its pre-pagination filtering integration point; dismiss-state should be composed with, not duplicate, that mechanism. `ep2-s1`/`ep2-s3` — merged, this story extends their output. `[External: ep2-s1/ep2-s3 are stories in the sibling feature artefacts/2026-09-28-weeb-ui-learnings-and-improvements, both merged and DoD-complete — confirmed by operator on 2026-10-04]`.
## Acceptance Criteria

**AC1 — Dismissing a signal removes it from the default view:**
Given the operator clicks "Dismiss" on a rendered signal,
When `/signals` re-renders (this request or a later one),
Then that signal no longer appears in the default (non-"show dismissed") view, identified by its derived stable key, not `signal.id`.

**AC2 — Dismissal survives a reload and a new session:**
Given a signal was dismissed in a prior request,
When the operator reloads `/signals` in the same browser session, or returns in a new session entirely,
Then the signal remains dismissed — read from `workspace/dismissed-signals.json`, not from any in-memory or per-session state.

**AC3 — Dismissal is reversible via a "show dismissed" toggle:**
Given at least one signal is dismissed,
When the operator enables "show dismissed,"
Then previously dismissed signals reappear, visibly marked as dismissed, with an "Undismiss" action that reverses AC1's effect for that signal.

**AC4 — Two distinct signals never collide on the derived key:**
Given two real signals with different `source`+`type`+`text` combinations,
When each is dismissed independently,
Then dismissing one does not dismiss the other — a dedicated test asserts two different inputs produce two different, individually-correct dismissed/not-dismissed outcomes (not just that a hash function was called).

**AC5 — The dismissed-signals adapter is wired to a real implementation, verified by a behavioural test (D37):**
Given `server.js` is the production wiring point for every other file-backed adapter in this app (`signals-aggregator.js`'s `_fileReadAdapter`, etc.),
Then the dismissed-signals store adapter is wired to a real `fs`-backed implementation there, and a test asserts two different dismiss-key inputs produce two different, correct persisted outcomes — not merely that `setDismissedSignalsStore` was called.

**AC6 — Dismiss/undismiss controls are keyboard-accessible:**
Given an operator navigating by keyboard only,
When they Tab to a signal's Dismiss/Undismiss control,
Then it is focusable and operable via keyboard, matching `product/constraints.md` #9 and this story's sibling stories' own Accessibility NFR.

**AC7 — A corrupt or missing `dismissed-signals.json` degrades gracefully:**
Given the file does not yet exist (first use) or contains invalid JSON,
When `/signals` loads,
Then it treats the dismissed-set as empty rather than throwing a 500 — first use must not require manually creating the file.
## Out of Scope
- Bulk dismiss / multi-select — per `discovery.md`'s own Out of Scope
- Multi-tenant or per-operator dismiss-state isolation — per `discovery.md`'s own Out of Scope (single shared file, solo-operator scope)
- Auto-expiring dismissals (e.g. "undismiss after 30 days") — not requested; dismissal is permanent until manually undismissed
- Migrating or backfilling dismiss-state from any prior mechanism — none exists; this is a net-new file
## NFRs
- Performance: dismissed-set lookup is an O(1) hash-set membership check per signal, applied in the same pre-pagination filter pass as `sptu-s2` — stays within the established <100ms render budget
- Security: `workspace/dismissed-signals.json` contains no credentials/PII — it stores only derived hashes, not raw signal content, avoiding any risk from the file being read outside the app
- Accessibility: dismiss/undismiss controls keyboard-operable (AC6)
- Resilience: graceful handling of a missing/corrupt state file (AC7)
## Complexity Rating
**Rating:** 2
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
