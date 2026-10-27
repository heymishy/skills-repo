# Definition of Ready: ppc-s10 — Repo-freshness wiring for capture serving + Playback Evidence nav link

**Track:** Short-track (bounded bug fix, found during live production validation of `ppc-s9` — see `decisions.md`, 2026-10-27 entries)
**Story reference:** N/A (short-track) — see `test-plans/ppc-s10-test-plan.md` for the bug reproduction + scope, same shape as this repo's own `sob-s4-dor.md` precedent.
**Test plan:** `artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s10-test-plan.md` (11 tests covering 4 ACs)
**Verification script:** `artefacts/2026-10-20-production-playback-capture/verification-scripts/ppc-s10-verification.md` (4 scenarios)
**Contract:** `artefacts/2026-10-20-production-playback-capture/dor/ppc-s10-dor-contract.md`
**Complexity:** 1 (well understood, clear path — AC1/AC2 reuse `ensureRepoFresh` exactly as `journey.js` already calls it, with 8 existing unit tests already covering the adapter itself; AC3/AC4 are a plain conditional anchor-tag addition to an existing, already-read-through render function)
**Human oversight:** Low (same solo-operator repo, matches `sob-s4`/`ppc-s7` precedent)

## Hard blocks

| # | Check | Result |
|---|-------|--------|
| H1 | As/Want/So + named persona | N/A — short-track story; bug repro + fix criteria stand in, per `/workflow`'s own short-track convention |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS — 4 ACs, all Given/When/Then, in `test-plans/ppc-s10-test-plan.md` Scope section |
| H3 | Every AC has ≥1 test | ✅ PASS — AC1→T1-T3,T10; AC2→T4-T6,T10; AC3→T7,T11; AC4→T9 |
| H4 | Out-of-scope populated | ✅ PASS — test plan's "Out of Scope" section names 4 explicit exclusions |
| H5 | Benefit linkage references a named metric | N/A — short-track bug fix, no new benefit-metric target; closes a real production defect in already-shipped `ppc-s9` functionality |
| H6 | Complexity rated | ✅ PASS — Complexity 1, above |
| H7 | No unresolved HIGH review findings | N/A — short-track skips `/review`, per `/workflow`'s own routing |
| H8 | Test plan has no uncovered ACs | ✅ PASS — all 4 ACs covered, no gaps (Gap table: "No gaps") |
| H8-ext | Cross-story schema dependency check | ✅ PASS — Dependencies: None (reuses existing `ensureRepoFresh`/`handleGetJourneyStageView`, no upstream story dependency) — schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ PASS — reuses `rclr-s1`'s own already-reviewed `ensureRepoFresh` adapter as-is (no new architecture surface); `journey.js` link addition follows the same stage-view rendering pattern already used throughout that file |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | N/A — no CSS-layout-dependent AC (test plan's Step 3a check: no drag-drop, `getBoundingClientRect`, CSS-position, or pointer-coordinate behaviour in scope) |
| H-NFR | NFR profile or explicit "None" | ✅ PASS — test plan states "NFR tests: None — confirmed," no new NFR surface |
| H-NFR2 | Compliance NFR regulatory sign-off | N/A — no compliance NFR in scope |
| H-NFR3 | Data classification not blank | N/A — no NFR profile entry introduced |
| H-GOV | Discovery `## Approved By` populated | N/A — short-track skips discovery; feature-level discovery (`discovery.md`, this folder) already has an `## Approved By` entry from the original feature's own DoR runs |
| H-ADAPTER | Injectable adapter wiring check (D37) | N/A — this story introduces NO new injectable adapter. `ensureRepoFresh` is an EXISTING adapter from `rclr-s1`, already fully wired/tested (`check-rclr-s1-repo-freshness.js`); this story only adds two more call sites to it, the same as `journey.js` already has — not a new `setX()`/stub-default pattern |
| H-INF | Infra-plan gate | N/A — `hasInfraTrack` not set on `ppc-s10` |
| H-MIG | Migration-review gate | N/A — `hasMigrationTrack` not set on `ppc-s10` |
| H-DESIGN | Design-token compliance gate | ✅ PASS — `hasDesignSystemTrack: true` set on `ppc-s10` (touches `src/web-ui/`). The only new rendered element is a plain `<a>` tag with no inline styling and no hardcoded color values — `scripts/check-design-tokens.js` will find nothing to flag. Confirmed no `DESIGN.md` link-specific token exists to reference (checked directly — no `link`/anchor section in `DESIGN.md`), so default inherited shell styling is correct, not a gap. |

**All applicable hard blocks: PASS. 0 failures.**

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated or "None — confirmed" | ✅ Satisfied — test plan states this explicitly |
| W2 | Scope stability declared | ✅ Stable — bounded to 3 named functions across 2 files, no ambiguity |
| W3 | MEDIUM review findings acknowledged | N/A — no `/review` run (short-track) |
| W4 | Verification script reviewed by a domain expert | ⚠️ Not yet independently reviewed — same standing RISK-ACCEPT pattern as every other `ppc-*` story in this feature (`decisions.md`, 2026-10-21/22/26 entries: no second reviewer available in this solo-operator repo). Acknowledged here rather than re-logged as a new decision — same standing acceptance applies. |
| W5 | No UNCERTAIN gap-table items | ✅ Satisfied — gap table states "No gaps," nothing UNCERTAIN |

## Oversight

**Low** — no sign-off required. Proceeding directly to coding agent assignment, per the solo-operator precedent already established for this entire epic.

## Coding Agent Instructions

1. **`src/web-ui/routes/playback-evidence.js`**: add `const { ensureRepoFresh } = require('../adapters/repo-freshness');` near the existing `getRepoRoot` import (line 16). At the top of `handleGetPlaybackEvidence` (line 546, right after `_resolveJourney`/the 404 check, before `_getDodAcList`/`_finaliseInProgressCaptures` at line 550-555), call `ensureRepoFresh(getRepoRoot(req))` — wrap in try/catch (or rely on the adapter's own never-throws contract, confirmed in `repo-freshness.js`) so a refresh failure never blocks the page render, mirroring `journey.js:5253-5258`'s own `_readPipelineFeatures` pattern exactly (try/catch around the call, comment: "refresh must never block the read path below"). Repeat the same call at the top of `handleGetCaptureScreenshot` (line 610, before the `fs.existsSync`/`fs.readFileSync` block starting line 621) and `handleGetCaptureVideo` (line 636, before line 647's equivalent block).
2. **`src/web-ui/routes/journey.js`**: in `handleGetJourneyStageView` (starts line 873), after `journey`/`stageName` are resolved and before (or alongside) the final HTML assembly, add: when `stageName === 'definition-of-done' && journey.productId`, render `<p><a href="/products/' + encodeURIComponent(journey.productId) + '/playback-evidence/' + encodeURIComponent(journey.featureSlug) + '">Playback evidence</a></p>` (escape/encode exactly as the rest of this function already does — see `escHtml`/`encodeURIComponent` usage throughout, e.g. line 1017-1018) into the artefact-pane content, near the top, before the rendered `artefactContent`. Find the actual final HTML-assembly point downstream in this same function (search for where `artefactContent`/`stageLabel`/`_stepsHtml` are combined into the response body) and insert there — the exact line is not pre-specified by this DoR; use judgment consistent with the surrounding code's existing structure.
3. **Tests**: new file(s) named `check-ppc-s10-*.js` (e.g. `check-ppc-s10-repo-freshness-wiring.js` for T1-T6,T10 and `check-ppc-s10-playback-link.js` for T7-T9,T11), following `check-rclr-s1-repo-freshness.js`'s own `require.cache`-substitution mocking convention exactly for `ensureRepoFresh` (see that file's T7/T8 for the pattern). T10 (integration) seeds a real temp dir with a `.git` init, a bare "remote," and a file added to the remote after the local clone — asserting a real `git pull --ff-only` (via the real `exec`, not mocked) brings the file into the local working tree and the screenshot route then returns 200 where it previously returned 404.
4. Run the full suite (`node scripts/run-all-tests.js`) and confirm no regressions beyond this repo's already-documented pre-existing flakes (`check-pcr-s1-test-runner.js` under CPU contention, `check-p3.5-validate-trace.js` transient).

## Sign-off

**Proceed:** Yes — signed off directly (short-track, complexity 1, low oversight, closing a real production defect found and reproduced live this session). Hamish King (Platform Owner), 2026-10-27.
