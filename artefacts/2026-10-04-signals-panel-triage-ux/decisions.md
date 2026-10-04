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

## Recency sort scope: make existing order visible, don't build new sort logic (2026-10-04)

**Context:** During `/definition`, direct execution of `getSignals()` (`src/web-ui/modules/signals-aggregator.js`) against this repo's real 5,340 signals found it already applies `_sortSignals()` — a stable descending sort by `timestamp` — and has done so since `ep1-s1`'s first commit (`e396e67b`, #932). This contradicts `discovery.md`'s own Problem Statement #2 ("fixed, non-chronological order") and MVP Scope item 2 ("current insertion order remains the default"). The real picture: 693 of 5,340 signals (13%) carry a timestamp and are already sorted newest-first; the remaining 4,647 (87%, mostly `learnings`-sourced `note` signals) have no timestamp and fall back to plain aggregation order.
**Decision:** Scope `sptu-s3` as "make the existing sort order visible and explicit" (a label stating the real behaviour, plus a visible "no date" marker on undated signals) — not as new sort logic, and not as extending `signals-aggregator.js`'s parsers to produce more timestamps (a separate, larger change to `ep1-s1`'s own territory).
**Rationale:** Operator selected this option directly when presented with 3 choices (make existing order visible / extend timestamp extraction to more sources / drop the story and correct discovery instead). Smallest, most honest slice given the real data shape — avoids both silently shipping a misleading "sorted by recency" claim and over-scoping into `ep1-s1`'s own parser logic.
**Made by:** Hamish King (operator decision during `/definition`, 2026-10-04), recorded by Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A).

## Nav gap fix: add /signals to NAV_ITEMS as this feature's Story 1 (2026-10-04)

**Context:** The operator asked mid-`/definition`, "checking through UI, I can't see a UI path to the feature — what's the nav flow?" Direct investigation of `src/web-ui/utils/html-shell.js` confirmed `NAV_ITEMS` has never had a `/signals` entry across `ep2-s1`/`ep2-s2`/`ep2-s3` — `signals-panel.js`'s own `handleGetSignalsPanelHtml` already passes `active: 'signals'` to `renderShell`, anticipating a nav row that was never added. Same "API shipped, UI never wired" gap this repo fixed twice before (`pod-manager`/pmnv-s1, `admin-mock-gateway`/alrf-s7).
**Decision:** Add the nav entry as `sptu-s1`, the first story in this feature's own epic (`signals-panel-triage-controls`), rather than as an untracked side-fix to the already-DoD-complete parent epic.
**Rationale:** Operator selected this option directly over the alternative (a separate standalone retrospective chore). Keeps the fix traceable through this feature's own discovery/benefit-metric/DoR chain, and sequences it first since the other three stories' UX improvements are moot if the page can't be found.
**Made by:** Hamish King (operator decision during `/definition`, 2026-10-04), recorded by Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A).

## RISK-ACCEPT: unmeasured operator-usage assumption (2026-10-04)

**Context:** `/clarify` surfaced that "operators will use filter/sort/dismiss regularly enough to justify the build" is based only on one operator's (this session's) own direct experience, not measured usage data.
**Decision:** Accept as a reasonable, low-cost bet rather than building a separate validation step first. Proceed to `/benefit-metric` and the rest of the pipeline without further usage validation.
**Rationale:** The MVP itself is small — filter/sort/dismiss added to an already-shipped page, with no new infrastructure beyond one small JSON file. The cost of being wrong (low operator usage) is proportionally low; the cost of a separate validation phase (a whole extra discovery/build cycle before building the real thing) is disproportionate to the risk being managed.
**Made by:** Hamish King (operator decision via `/clarify`, 2026-10-04), recorded by Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A).

## RISK-ACCEPT: W4 verification scripts not reviewed by a domain expert before DoR sign-off (2026-10-04)

**Context:** `/definition-of-ready`'s W4 warning flags that each story's AC verification script (`sptu-s1` through `sptu-s4`) has not been reviewed by a separate domain expert before sign-off. This is the same standing item every prior story in the parent feature family (`ep1-s1`, `ep1-s2`, `ep2-s1`, `ep2-s2`, `ep2-s3`) carried through DoR, consistent with this being a solo-operator repo with no separate domain-expert role available.
**Decision:** Acknowledge and proceed for all 4 stories (`sptu-s1`–`sptu-s4`) rather than block sign-off. The verification scripts remain available for a post-merge smoke-test read, which is the next point a second pair of eyes (even the same operator, fresh) can meaningfully review them.
**Rationale:** Blocking on a reviewer role that doesn't exist in this delivery context would stall every story indefinitely — the same reasoning already applied and accepted across every prior story in this feature family.
**Made by:** Hamish King (operator decision via `/definition-of-ready`, 2026-10-04), recorded by Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A).

## Correction: filter query-param mechanism is comma-separated, not repeated keys (2026-10-04)

**Context:** `sptu-s2`'s own Architecture Constraints assumed `?hideType=parse-error&hideType=decision` (a repeated query key) would arrive as an array. At `/definition-of-ready`, direct code read of `server.js`'s `parseQuery` (`server.js:2030-2036`) found it does `result[key] = val` per entry — last-wins on a repeated key, never an array — and a repo-wide grep confirmed zero existing route anywhere treats any `req.query.*` field as array-shaped.
**Decision:** Corrected the mechanism to a single comma-separated value per param (`?hideType=parse-error,decision`), split server-side. Updated `sptu-s2.md`'s Architecture Constraints and added a dedicated integration test to `sptu-s2-test-plan.md` verifying the real comma-split behaviour.
**Rationale:** Caught before the DoR contract locked in a design built on a false assumption about this app's own query-parsing behaviour — matches this session's standing practice of verifying real system behaviour before committing a story/contract to it, rather than after implementation reveals the mismatch.
**Made by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A), found and corrected during `/definition-of-ready`, 2026-10-04.
