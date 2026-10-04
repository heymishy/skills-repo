# Decision Log: signals-panel-triage-ux

**Feature:** Signals Panel Triage UX
**Discovery reference:** artefacts/2026-10-04-signals-panel-triage-ux/discovery.md
**Last updated:** 2026-10-04

---

## Dismiss-state keying: derived stable hash, not signal.id (2026-10-04)

**Context:** `/clarify` surfaced a real, already-known risk: `ep1-s1`'s own `signal.id` generation is non-deterministic for `parse-error` signals (`Math.random()` + a fresh `new Date().toISOString()` per request, confirmed directly in code and documented in `ep1-s2-dod.md`'s own AC5 deviation). A naive "dismiss by id" mechanism would silently fail to stay dismissed for exactly the noisiest, highest-value-to-dismiss signal type.
**Decision:** Dismiss by a derived stable key computed from `source` + `type` + `text` (e.g. a hash of their concatenation), not the existing `signal.id` field. Computed identically at dismiss-time and at filter-time on every subsequent render.
**Rationale:** Avoids touching `ep1-s1`'s own already-shipped, already-reviewed `signal.id` generation (a deliberately deferred fix at the time, per that story's own Out of Scope) while still delivering a genuinely stable dismiss mechanism. `source`+`type`+`text` is already the full real content of a signal (confirmed via `_makeSignal`'s own real shape, `src/web-ui/modules/signals-aggregator.js`), so collisions would only occur for two genuinely identical signals — an acceptable, low-risk trade-off for a reversible, UI-only dismiss action.
**Made by:** Hamish King (operator decision via `/clarify`, 2026-10-04), recorded by Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A).

## Dismiss-state persistence: new workspace/dismissed-signals.json file (2026-10-04)

**Context:** This repo has no database — signals are computed fresh from workspace files on every `getSignals()` call, never stored. Dismiss state needs somewhere real to live.
**Decision:** A new, dedicated file at `workspace/dismissed-signals.json`, not an append to an existing unrelated file (e.g. `capture-log.md`) and not a database.
**Rationale:** Matches this repo's own established file-based governance-artefact convention (`capture-log.md`, `decisions.md`, `learnings.md`, etc. — each a dedicated, purpose-specific file). A dedicated file keeps dismiss-state reads/writes simple (one small JSON array/object) and avoids coupling its own read/write lifecycle to an unrelated file's own conventions (e.g. `capture-log.md`'s append-only, never-truncate rule, which doesn't fit a "remove an entry when un-dismissed" operation).
**Made by:** Hamish King (operator decision via `/clarify`, 2026-10-04), recorded by Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A).

## RISK-ACCEPT: unmeasured operator-usage assumption (2026-10-04)

**Context:** `/clarify` surfaced that "operators will use filter/sort/dismiss regularly enough to justify the build" is based only on one operator's (this session's) own direct experience, not measured usage data.
**Decision:** Accept as a reasonable, low-cost bet rather than building a separate validation step first. Proceed to `/benefit-metric` and the rest of the pipeline without further usage validation.
**Rationale:** The MVP itself is small — filter/sort/dismiss added to an already-shipped page, with no new infrastructure beyond one small JSON file. The cost of being wrong (low operator usage) is proportionally low; the cost of a separate validation phase (a whole extra discovery/build cycle before building the real thing) is disproportionate to the risk being managed.
**Made by:** Hamish King (operator decision via `/clarify`, 2026-10-04), recorded by Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A).
