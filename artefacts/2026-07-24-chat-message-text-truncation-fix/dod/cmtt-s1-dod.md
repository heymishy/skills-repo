# Definition of Done: Fix sanitiseAnswer() silently eating hyphenated user-message text before a colon

**PR:** #571 (commit `961a517e`) | **Merged:** 2026-07-24
**Story:** artefacts/2026-07-24-chat-message-text-truncation-fix/stories/cmtt-s1.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1 -- hyphenated compound word/identifier followed by a colon preserved unmodified | Yes | UT1/UT2/UT3 (`check-cmtt-s1-chat-message-text-truncation-fix.js`): "AC1a -- hyphenated compound word immediately followed by a colon survives sanitisation", "AC1b -- a shorter hyphenated identifier mid-sentence...survives", "AC1c -- hyphenated word at the very start...survives" -- all 3 passing in the fresh run (8/8 passed) | Unit test against real `sanitiseAnswer()` | None |
| AC2 -- real CLI-flag-like token at a genuine word boundary still stripped (no regression) | Yes | UT4/UT5 (`AC2a`, `AC2b`): `--allow-all`, `rm -rf`, `--delete-all` all still stripped | Unit test | None |
| AC3 -- full shell-metacharacter set still stripped (no regression) | Yes | UT6/UT7 (`AC2c`, `AC2d`): full NFR3 metacharacter set (`; & | \` $ ! > < \`) and `<script>` HTML-injection stripping both confirmed unaffected | Unit test | None |
| AC4 -- real `htmlSubmitTurn()` write path stores the distinctive-detail string uncorrupted | Yes | UT8 (`AC3` in test file's own internal numbering -- maps to story AC4): "htmlSubmitTurn() persists the exact a4 E2E distinctive-detail string uncorrupted in session.turns", driven through the real write path via `_setHtmlSession`/`_listHtmlSessions` test seams | Unit/integration test against real route handler | None |
| AC5 -- full `npm test` regression, no new baseline failures | Yes | Not re-run this session (per task scope). Evidence is the merge-time record: `.github/pipeline-state.json` notes field states "full npm test run shows zero new regressions vs tests/known-baseline-failures.json (the one delta...independently reproduced as failing identically on origin/master before this fix -- a pre-existing baseline-file drift, not a regression)"; test plan's IT1 is counted in the `testPlan.totalTests: 9 / passing: 9` figure recorded at merge time | Integration test (IT1), historical record | Not independently re-verified this session -- relying on the merge-time record rather than a fresh full-suite run, per this backlog pass's scope (only the story's own dedicated check script was fresh-run) |
| AC6 -- real staging re-run of `a4-ideate-session-resume.spec.js` AC2/AC3 now passes | No | `decisions.md` documents that PR #571's CI staging E2E job could not genuinely re-exercise this fix: the real Anthropic account backing `wuce-staging` had exhausted its billing credit (external, time-correlated, unrelated to this fix) starting ~18:12 UTC on 2026-07-23, before this PR's CI run; `a4`'s AC2/AC3 test self-skipped rather than passing. `.github/pipeline-state.json` records `acTotal: 6, acVerified: 5` -- AC6 is the one unverified AC. No later artefact in this repo shows AC6 subsequently confirmed against real staging. | E2E (not completed) | **Gap, but explicitly anticipated and accepted, not newly discovered.** The story's own AC6 text requires only that the outcome be "reported honestly as observed, including if deploy could not be completed this session" -- it does not require AC6 to pass before the story is considered done. The DoR's W5 warning already carries an explicit RISK-ACCEPT for exactly this scenario ("AC6...is deploy-dependent...UT1-UT8 + IT1...fully verify AC1-AC5 independent of deploy outcome"). |

---

## Scope Deviations

None beyond the AC6 gap above, which is itself an explicitly accepted (not deferred-silently) item per the story's own AC6 wording and the DoR's W5 RISK-ACCEPT -- not a new defect. The story's stated Out of Scope items (no change to `lightMd`, `lightMarkdown`, or `mergeRedisSessionData()`; no retroactive repair of already-corrupted historical session data) were honoured -- `decisions.md` confirms both candidate rendering functions were directly isolated and ruled out before the real root cause (`sanitiseAnswer()`'s `CLI_FLAG` regex) was identified and fixed.

---

## Test Plan Coverage

Fresh re-run this session (2026-08-17): `check-cmtt-s1-chat-message-text-truncation-fix.js` -- **8 passed, 0 failed** (covers UT1-UT8, i.e. AC1, AC2, AC3, AC4 in full). This matches the test plan's own AC coverage table (AC1: 3 unit tests, AC2: 2, AC3: 2, AC4: 1 = 8 unit tests total). IT1 (full-suite regression, AC5) is recorded at merge time in `.github/pipeline-state.json` as `testPlan.totalTests: 9, passing: 9` (UT1-8 + IT1) but was not re-run in this session. E2E1 (AC6) is recorded as not completed, per `acTotal: 6, acVerified: 5`.

---

## NFR Status

| NFR | Status | Notes |
|-----|--------|-------|
| Performance | Met | Single additional negative-lookbehind assertion on an existing regex; negligible per-answer-submission cost, per story text |
| Security | Met | This fix touches the security-relevant surface directly (shell-injection/CLI-flag defence) -- AC2/AC3 (UT4-UT7) lock in that the existing `T4.3`/`T4.5`/`NFR3` coverage in `tests/skill-launcher.test.js` is unnarrowed |
| Accessibility | N/A | No UI/DOM change, per story text |
| Audit | N/A | No change to any audited/logged code path (`T4.6`: answer content is never logged), per story text |

---

## Metric Signal

No dedicated benefit-metric artefact for this story (short-track skips `/benefit-metric`). The story ties its benefit linkage directly to `2026-07-23-e2e-core-journey-coverage`'s own metric m1 (real, staging-verified E2E coverage replacing untested confidence) -- this fix closed a genuine, previously-undetected production defect (silent, permanent corruption of any user's own chat message matching the reported shape) that m1's own E2E test surfaced. No separate metric-movement evidence beyond that linkage exists in this artefact chain.

---

## Outcome

**COMPLETE WITH DEVIATIONS**
**Follow-up actions:** Re-run `tests/e2e/a4-ideate-session-resume.spec.js`'s AC2/AC3 test against real `wuce-staging` once the account's billing/credit blocker (documented in `decisions.md`, unrelated to this fix) is confirmed resolved, to close AC6. This is the same gap already flagged and RISK-ACCEPTed at DoR time -- not a new action.

## DoD Observations

The fix itself (AC1-AC4, the code-level correctness of the regex boundary fix) is fully verified and has been live in production since PR #571 merged on 2026-07-24 with no reported regression. The only open item, AC6's live-staging re-confirmation, is an environmental/billing blocker external to this code change, already transparently reported at DoR and merge time rather than silently dropped.
