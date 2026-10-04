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

## RISK-ACCEPT: pre-existing baseline test failure, unrelated to this feature (2026-10-04, sptu-s1 branch-setup)

**Context:** `/branch-setup`'s clean-baseline run for `sptu-s1` (`.worktrees/sptu-s1`) found 1 failing file out of 712: `tests/check-p3.5-validate-trace.js`'s `ps1-exits-0-on-valid-repo-with-ci-flag` test. Confirmed the identical failure exists on `master` itself — pre-existing, not introduced by this worktree or any change in this feature. The test concerns a PowerShell trace-validation script, entirely unrelated to `src/web-ui/` or the signals panel.
**Decision:** Acknowledge as pre-existing and proceed with the inner coding loop for `sptu-s1` (and, by the same reasoning, the rest of this feature's stories) without attempting to fix it as part of this story's scope.
**Rationale:** Per `/branch-setup`'s own protocol, a failing baseline must be investigated or explicitly acknowledged before proceeding — never silently ignored. This failure is outside this feature's own touch points; fixing it is out of scope for a signals-panel UX feature.
**Made by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A), found during `/branch-setup`, 2026-10-04.

**Correction (2026-10-04, prompted by the operator's "Trace validation still failing" follow-up):** the original entry above guessed the cause was "likely environment-specific (e.g. a local PowerShell/path difference)" — that guess was never actually verified and turned out to be wrong. Running `pwsh -NonInteractive -File scripts/validate-trace.ps1 --ci` directly (the Node test harness only captures `stderr`, which is empty, hiding the real failure — the script writes its findings to `stdout`) found two distinct, real, pre-existing issues:
1. **A real parity bug in `scripts/validate-trace.ps1`'s `Check-DiscoveryApproved` function**: it flags a feature as "still Draft" whenever its discovery.md content matches `status.*draft` anywhere in the file, with no corresponding check for a `status.*approved` match to suppress the false positive. The sibling `scripts/validate-trace.sh` (Python/Bash, lines 268-269 and 474-480) already has this suppression (`approved_flag` short-circuits the Draft check). `.ps1` is missing it. Confirmed via direct PowerShell regex testing: this produces false positives on 2 already-`Approved` features (`new-feature-2b74a292`, `new-feature-af17f555`) whose discovery.md contains a retrospective note like `"status corrected from stale \"Draft\""` — the naive regex matches "status" and "Draft" co-occurring in that one sentence.
2. **A real, separate, genuine governance gap**, unrelated to the bug above: 3 features' discovery.md artefacts genuinely still have `**Status:** Draft` (confirmed by reading the real Status line directly, not via the buggy regex): `2026-09-13-analytics-observability-gaps`, `2026-09-14-discovery-session-file-attachments`, `2026-09-30-refactoring-and-product-health`.

Both findings are real, both are pre-existing on `master`, both are confirmed unrelated to this feature's own diff — the RISK-ACCEPT decision above (proceed without fixing as part of `sptu-s1`'s scope) still stands, now on accurate grounds rather than an unverified guess. Logged in full to `workspace/capture-log.md` as a /improve candidate (fix `.ps1`'s missing suppression logic) and a standing governance gap (the 3 real Draft discoveries) for the operator to decide how to handle — not force-approved unilaterally, consistent with the operator's own earlier standing instruction on this exact class of gap.
**Made by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A), investigated and corrected after the operator's direct follow-up, 2026-10-04.

## Fix: sptu-s2's own AC3 test fixture had a CSRF-token-identity bug (2026-10-05)

**Context:** During Task 3 (`/subagent-execution`), the implementer found `sptu-s2-test-plan.md`'s AC3 test ("applied filters are visible on the page and survive a reload of the same URL") failed unconditionally, regardless of whether the route/view wiring was correct. Root cause: `tests/check-sptu-s2-signals-filter.js`'s own `fakeReqRes()` helper (written in Task 1) builds a brand-new `{ session: {...} }` object literal per call — `middleware/csrf.js`'s `generateCsrfToken` caches a token per session object, so two independent `fakeReqRes()` calls each mint their own random CSRF token, making the two response bodies differ by construction (confirmed via direct byte-diff: the first divergence was exactly the `_csrf` hidden-field value, nothing else). In a real browser, reloading the same URL reuses the same session/cookie, so this bug was invisible to the real feature — purely a test-fixture gap.
**Decision:** Fixed the test (not the route/view) by sharing one session object across both dispatches in the AC3 test, correctly simulating "the same browser tab, reloaded" rather than two unrelated visitors. Confirmed fix via the real `csrf_token_generate` log event: the second dispatch now shows `wasNew:false` for the same token prefix the first dispatch generated.
**Rationale:** The implementer correctly diagnosed this as a test-fixture bug outside its own permitted scope (route/view files only) and declined to work around it there — flagged it back to the orchestrator instead of silently masking it. Fixing the fixture (not the implementation) is correct: the real feature behaviour was never wrong.
**Made by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A), diagnosed by the Task 3 subagent, fixed by the orchestrating session, 2026-10-05.
