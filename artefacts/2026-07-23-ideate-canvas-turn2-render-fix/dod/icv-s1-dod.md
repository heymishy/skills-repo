# Definition of Done: Stop /ideate's chat client from auto-firing an unbounded "continue" chain that duplicates canvas blocks and freezes the second user turn

**PR:** #570 (merge commit `4f8ca051`) | **Merged:** 2026-07-23 (per `git show -s --format=%ci 4f8ca051`: 2026-07-23 22:43:14 +1200)
**Story:** `artefacts/2026-07-23-ideate-canvas-turn2-render-fix/stories/icv-s1.md`
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1 (single executor call + exactly 1 `.canvas-block` for a no-"?"/no-artefact-marker ideate turn) | Yes | `check-icv-s1-ideate-canvas-turn2-render-fix.js` T1, part of the freshly re-run 3 passed / 0 failed result (2026-08-17) | Behavioural jsdom test against the real generated inline client script | None |
| AC2 (submit button re-enabled after stream finishes) | Yes | Same test file, T2 assertion (submit `disabled === false` after settle) | Behavioural jsdom test | None |
| AC3 (genuine second turn fires exactly one more executor call, canvas grows to 2) | Yes | Same test file, T3 assertion (2 total executor calls, canvas block count grows to 2) | Behavioural jsdom test | None |
| AC4 (non-ideate `discovery`-shaped turn still auto-fires the `a10b32a3` hidden continuation; fix is `IS_IDEATE`-scoped, not a blanket regression) | Yes | Same test file, T4 contrast case; per `decisions.md` and the test plan, T4 also passed pre-fix, confirming this path was never broken and remains correct post-fix | Behavioural jsdom contrast-case test | None |
| AC5 (full `npm test`, no new regressions vs. `tests/known-baseline-failures.json`) | Partially -- accepted at merge time, not independently re-run this session | Pipeline-state note recorded at merge: "Full npm test: zero new regressions." No fresh full-suite run was provided for this DoD pass (only the 3 targeted icv-s1 tests were re-run) | Full suite (reported at merge time only) | Not independently re-confirmed this session; relying on the merge-time record |
| AC6 (real `wuce-staging` re-run of `a3-product-feature-ideate-canvas.spec.js` AC3 passes) | **Partially closed 2026-09-11, see DoD Observation #2** (was: No -- open gap) | `decisions.md`'s own "VERIFICATION" section was left as "pending / to be appended after deploy" and was never appended to. `.github/pipeline-state.json` recorded `"acTotal":6,"acVerified":5"` -- one AC never marked verified, and by elimination (AC1-AC4 have direct test evidence, AC5 has a merge-time record) it was AC6. Live-verified 2026-09-11: one real, operator-authorized `/ideate` turn against real `wuce-staging` confirmed AC1's core regression guard (exactly one real turn produced exactly one canvas-block increment, with no runaway auto-continuation chain — network capture showed only the session's own expected auto-`__init__` call plus the one real turn, never a 3rd/4th/Nth call) and AC2 (submit control re-enabled after the stream settled). **AC3 specifically (a genuine SECOND turn firing exactly one more executor call, canvas growing from 2 to 3) was NOT verified in this pass** — the operator authorized exactly one real, cost-incurring turn, and a second turn would have required separate authorization. Not fabricated as passing; recorded as still open below. | Live browser verification (network-request + DOM inspection) for AC1/AC2's real-turn behaviour; AC3 remains untested live | AC3 (second-turn growth) is the one sub-case of this AC not yet live-confirmed — see Follow-up actions |

## Scope Deviations

- AC6 (real staging E2E re-verification) was not completed at merge time or the original 2026-08-17 DoD pass -- see AC Coverage above. Partially closed 2026-09-11 (AC1/AC2's real-turn behaviour); AC3's second-turn case remains open, tracked as a Follow-up action below rather than silently dropped.
- The story's "Out of Scope" section itself explicitly excludes: changes to `mock-llm-gateway.js`/`skill-turn-executor.js`/fixtures, changes to the `a10b32a3` nudge's non-ideate behaviour, `a4-ideate-session-resume.spec.js`'s own co-failure (independently owned), server-side turn routing/credits/SSE changes, and a structural `turnComplete`-event rework. All of these are accepted as designed, not defects.

## Test Plan Coverage

- Targeted unit/behavioural tests (`check-icv-s1-ideate-canvas-turn2-render-fix.js`): **3 passed, 0 failed** (freshly re-run 2026-08-17), covering T1-T4 (AC1-AC4) per the test plan's mapping -- the test plan describes 4 test cases (T1-T4) implemented in this one file; pipeline-state's `testPlan.totalTests`/`passing` both record 4, consistent with 3 passing assertions bundled across cases plus the contrast case.
- T5 (AC5, full `npm test`): reported at merge time only ("zero new regressions" per pipeline-state notes); not independently re-run for this DoD pass.
- T6 (AC6, real staging E2E): per test plan, "manual dispatch, reported in `decisions.md`" -- never completed at merge time. Partially closed 2026-09-11 via direct live verification (AC1/AC2's single-real-turn behaviour); AC3's second-turn case remains open. `decisions.md` should be updated with this partial closure as a follow-up.

## NFR Status

| NFR | Status |
|-----|--------|
| Performance | Net positive as designed -- removes an unbounded chain of extra round-trips per ideate turn. Not independently re-measured; consistent with the fix's mechanism (single conditional gate removing runaway iteration). |
| Security | None claimed, none found -- no new attack surface; gate is on an existing server-computed, non-attacker-controlled flag. |
| Cost | Net positive as designed -- removes unbounded turn-credit/token consumption per ideate turn. Not independently re-measured. |
| Accessibility | Net positive as designed -- input reliably re-enables after every turn (AC2 evidence above). |
| Audit | Not applicable, per story. |

## Metric Signal

No `benefit-metric` artefact is referenced by this story -- it is explicitly short-track (per the story header, "Discovery reference: None" and "Benefit-metric reference: None"), with benefit linkage stated directly in the story rather than a separate metric artefact. The stated benefit (closing the CI-blocking AC3 failure on PR #568's "Scenario A E2E (staging)" gate) is supported by the merged fix and the passing unit/behavioural tests, but the actual real-staging re-verification of that CI gate (AC6) was never completed or recorded, so the benefit claim remains unconfirmed against real staging.

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. ~~Complete AC6 -- deploy this fix... and re-run `tests/e2e/a3-product-feature-ideate-canvas.spec.js`'s AC3...~~ — partially done, 2026-09-11 (see DoD Observation #2). AC1/AC2's real-turn behaviour is now live-confirmed. **Still open:** AC3's specific second-turn-growth case (fire a genuine second real turn, confirm canvas grows from 2 to 3 with exactly one more executor call, no duplication) — needs one more operator-authorized real turn against the same or a fresh `/ideate` session. Recommended as a quick, low-effort follow-up given AC1/AC2's identical mechanism already passed.
2. Independently re-run full `npm test` to confirm AC5's merge-time "zero new regressions" claim still holds — not done in this pass either, still open.
3. Update `decisions.md`'s open "VERIFICATION" section with this partial closure — not yet done, tracked here rather than silently left inconsistent with this DoD.

---

## DoD Observations

1. Root cause and fix are well-evidenced and narrowly scoped (a single `!IS_IDEATE` conditional gate), with a genuine TDD RED/GREEN cycle and a correct contrast case proving no regression to the `a10b32a3` nudge for other skills. The one real gap is procedural, not technical: the story's own AC6 (real staging confirmation of the original CI-blocking failure) was left open at merge and was never closed out in `decisions.md` or pipeline-state, so the fix's real-world effect on the originating CI gate was still unconfirmed as of the original 2026-08-17 DoD pass.
2. **Backfilled 2026-09-11, following a repo-wide DoD-verification-method stocktake, as part of `csvg-s1`.** Investigating `csvg-s1` (created to close this exact gap plus `icrh-s1`'s equivalent one) surfaced a real, already-tracked blocker: the real chat UI's streaming endpoint never honours `MOCK_LLM_GATEWAY` (tracked as `srmw-s1`, unfixed), so any real browser-driven turn costs real API money regardless of the mock toggle. Surfaced to the operator rather than silently attempted or silently skipped; the operator authorized exactly one bounded real turn. That turn, driven through the real `/ideate` chat UI against real `wuce-staging`, produced real network evidence: exactly 2 `turn-stream` POSTs total — the session's own expected, cost-free automatic `__init__` call (confirmed via `src/web-ui/routes/skills.js:3246`, which only fires when the chat thread is empty) plus the one real, operator-authorized turn — with no 3rd/4th call, directly confirming AC1's core regression guard (no runaway auto-continue chain) live. The submit control re-enabled correctly after the stream settled (AC2). A genuine second turn (AC3's own specific scenario) was deliberately not attempted, to respect the one-turn authorization — recorded as still open above, not silently folded into this partial closure.
