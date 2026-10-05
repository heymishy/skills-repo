# Definition of Done: Signals panel dismiss-race fix and Metric 1 timing spec (spdr-s1 + spdr-s2)

**PR:** https://github.com/heymishy/skills-repo/pull/945 | **Merged:** 2026-10-05
**Stories:**
- artefacts/2026-10-06-signals-panel-dismiss-race-and-metric1-spec/stories/spdr-s1-disable-dismiss-button-on-submit.md
- artefacts/2026-10-06-signals-panel-dismiss-race-and-metric1-spec/stories/spdr-s2-metric1-playwright-timing-spec.md
**Test plans:**
- artefacts/2026-10-06-signals-panel-dismiss-race-and-metric1-spec/test-plans/spdr-s1-test-plan.md
- artefacts/2026-10-06-signals-panel-dismiss-race-and-metric1-spec/test-plans/spdr-s2-test-plan.md
**DoR artefacts:**
- artefacts/2026-10-06-signals-panel-dismiss-race-and-metric1-spec/dor/spdr-s1-dor.md
- artefacts/2026-10-06-signals-panel-dismiss-race-and-metric1-spec/dor/spdr-s2-dor.md
**Assessed by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-06

---

## spdr-s1 — AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — second click before navigation completes has no effect | ✅ | Markup assertion confirms the `<form>`'s `onsubmit` attribute disables its own submit button; real timing behaviour verified by construction (not a flaky automated timing test), matching `dswf-s1`'s own AC4 precedent for this class of gap | `integration-real-code` (markup) + reasoning | None |
| AC2 — single-click path unchanged | ✅ | Pre-existing "Real route dispatch: POST /signals/dismiss removes the signal from the next GET /signals" test passes unchanged — the `onsubmit` attribute has no effect on server-side route dispatch | `integration-real-code` (regression) | None |
| AC3 — all pre-existing tests still pass | ✅ | `tests/check-sptu-s4-signals-dismiss.js`: 17/17 (16 pre-existing + 1 new) | `integration-real-code` (regression) | None |
| AC4 — keyboard operability unchanged | ✅ | No change to tabindex/focus order; disabling happens only after a legitimate submit has already fired — confirmed by direct reasoning against `sptu-s4`'s own AC6 text, no re-test needed since the markup change doesn't touch any focus-related attribute | `integration-real-code` (reasoning + unchanged markup) | None |

---

## spdr-s2 — AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Hide parse-error filter removes parse-error signals from DOM | ✅ | Playwright spec asserts `.signal-item[data-signal-type="parse-error"]` count is 0 after the filter click, against a seeded 3-parse-error fixture | `integration-real-code` (real Playwright click + DOM assertion) | None |
| AC2 — 10 real dismisses persisted, verified via showDismissed | ✅ | Spec dismisses 10 sequentially, then confirms exactly 10 `[data-signal-dismissed="true"][data-signal-id^="e2e-spdr-s2-dated-"]` elements under `?showDismissed=true` — same verification method as the real DoD measurement | `integration-real-code` | None |
| AC3 — full sequence completes under 15s, value printed | ✅ | Measured 10,872ms (10.9s), printed via `console.log`, asserted `< 15000ms` | `integration-real-code` | None |
| AC4 — existing seed-signals callers unaffected | ✅ | `ep2-s1-signals-panel.spec.js` and `ep2-s3-signals-pagination.spec.js` both re-run individually and pass unchanged | `integration-real-code` (regression) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None for either story. `spdr-s2`'s own spec result is deliberately NOT written into `sptu-s3-dod.md`'s Metric Signal row as a replacement number (see `decisions.md`'s "Scope note" entry) — both measurements are kept, clearly distinguished by purpose.

---

## Test Plan Coverage

**Tests from plan implemented:** spdr-s1: 1/1 new (plus regression). spdr-s2: 1/1 new spec (plus 2 regression re-runs).
**Tests passing in CI:** All green on PR #945's first CI run (8/8 required checks).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| spdr-s1: Dismiss form disables its own submit button on submit (AC1) | ✅ | ✅ | |
| spdr-s2: Metric 1 filter→sort→dismiss×10 E2E spec (AC1-AC3) | ✅ | ✅ | 10.9s measured |
| spdr-s2: ep2-s1/ep2-s3 regression (AC4) | ✅ | ✅ | Individually; see DoD Observations for a found-but-out-of-scope parallel-worker race |

**Gaps (tests not implemented):** None.

**Coverage gap audit (Step 4):** Neither story has a CSS-layout-dependent AC. `spdr-s1`'s AC1 is explicitly a "verified by construction" gap, planned and logged, not silently skipped.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| spdr-s1 Performance/Security/Accessibility | ✅ | "None identified"/"None" per the story's own NFR section — confirmed, no new surface |
| spdr-s2 Performance (the spec IS the NFR check) | ✅ | 10.9s measured, under the 15s ceiling |

---

## Metric Signal

No formal benefit-metric moved by either story. `spdr-s2` produces a complementary, repeatable regression-guard reading for Metric 1 — Time-to-triage (`artefacts/2026-10-04-signals-panel-triage-ux/benefit-metric.md`), explicitly NOT a replacement for `sptu-s3-dod.md`'s own real-backlog measurement (210.5s, Claude-in-Chrome, real repo data, 2026-10-06). Cross-reference: `spdr-s2`'s own automated, no-overhead measurement is 10.9s against a bounded 15-signal fixture — the difference between the two numbers reflects fixture size and automation overhead, not a contradiction; see `decisions.md`'s "Scope note" entry for why both are kept distinct.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None blocking. A real, pre-existing, out-of-scope finding was logged during `spdr-s2`'s own AC4 verification — see DoD Observations below.

---

## DoD Observations

1. **A real, pre-existing worker-parallel race was found incidentally** between `ep2-s1-signals-panel.spec.js` and `ep2-s3-signals-pagination.spec.js` (both share one module-level `setSignalsSource` override in the single shared Playwright `webServer` process) — reproduced when run together with Playwright's default 2-worker parallelism, not present when either runs alone, and not caused by this story's own changes (neither spec file nor the shared override/reset logic was touched). Logged as a RISK-ACCEPT in `decisions.md`, named as a real `/improve` candidate: the full `npm run test:e2e` CI job runs the whole `tests/e2e/` directory with non-1 worker parallelism, so this race is latent in real CI today, not merely a local artifact.
2. This story corrected a process gap from its own immediately-prior sibling (`wswda-s1`): that story's pipeline-state registration was missed until CI caught it. This time, the registration was bundled into the same PR branch/commit from the start (per `CLAUDE.md`'s own bundle-first rule), and PR #945's CI passed cleanly on the first run with no retrigger needed.
3. A Bash heredoc append to `decisions.md` (containing markdown backticks) silently failed outright (exit 127, shell tried to execute backtick-quoted content as commands) — matching this session's own standing memory on this exact failure class. Caught immediately by checking the file's actual content rather than trusting the command's apparent success, and redone via the `Edit` tool instead.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Signals panel dismiss-race fix and Metric 1 timing spec" (spdr-s1 + spdr-s2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
