# Definition of Done: ppc-s6 — Dashboard-shell UX/CX parity and scope/benefit summary

**PR:** https://github.com/heymishy/skills-repo/pull/1030 | **Merged:** 2026-10-27
**Story:** `artefacts/2026-10-20-production-playback-capture/stories/ppc-s6-dashboard-shell-parity.md`
**Test plan:** `artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s6-test-plan.md`
**DoR artefact:** `artefacts/2026-10-20-production-playback-capture/dor/ppc-s6-dor.md`
**Assessed by:** Claude (session)
**Date:** 2026-10-27

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — page wrapped via `renderShellWithNav` (nav, product context, Products sidebar) | ✅ | `check-ppc-s6-dashboard-shell-parity.js` T1 (asserts `sw-app`/`sw-sidebar` markup present); **re-verified 2026-10-27 against real `wuce-staging` deployment** (commit `992ea3f`/PR #1030) via a screenshot of `/products/<id>/playback-evidence/2026-05-24-governance-platform-architecture` (a different, fully DoD-complete feature, used to exercise this story's shared shell/summary code since `ppc-s6`'s own feature can't auto-provision a journey until `ppc-s7` also completes — see Note below) — nav sidebar, top nav, product context all visible | `live-verified` (real staging deployment, not just local) | None on the AC itself. The source-level regression guard (`handleGetPlaybackEvidence_doesNotCallRenderShellDirectly`) was never implemented — see `decisions.md` 2026-10-27 RISK-ACCEPT. |
| AC2 — Scope/Benefit sections render tenant-scoped `discovery.md`/`benefit-metric.md` via `fetchArtefact`, `escHtml()`-escaped | ✅ | T3 (asserts fetched content renders and is escaped — `<see>` → `&lt;see&gt;`); **re-verified 2026-10-27 on real `wuce-staging`** — screenshot shows real GitHub-sourced Scope/Benefit content (actual discovery text and M1-M5 metric targets fetched live from `heymishy/skills-repo`) | `live-verified` (real staging, real GitHub content, not a mock) | The ADR-025 regression guard (`fs.readFileSync` spy) was never implemented — confirmed instead by direct source inspection. See `decisions.md` RISK-ACCEPT. |
| AC3 — at-a-glance coverage line, reusing `renderCoverageSummaryHtml`/`computeAcCoverageSummary` as-is | ✅ | T5 (full coverage case), T6 (0-of-N case); **re-verified 2026-10-27 on real `wuce-staging`** — screenshot shows "0 of 5 ACs have captured evidence yet." above the AC list | `live-verified` (real staging) | None. |
| AC4 — missing `discovery.md`/`benefit-metric.md` shows a named "not found" state, rest of page unaffected | ✅ | T4 (discovery.md-missing case); **re-verified 2026-10-27 locally** (correct test harness, `DATABASE_URL` unset) — both `discovery.md` and `benefit-metric.md` independently showed their own named "not found in the connected repo" message, confirming the symmetric code path works for both files, not just the tested one | `live-verified` | None remaining — the untested `benefit-metric.md` sub-case flagged in the original DoD pass is now empirically confirmed working, not just inferred from source. |
| AC5 — existing capture forms still submit correctly, no client-side JS required, after the shell wrap | ✅ | T2 (form markup + `method="POST"` present); **re-verified 2026-10-27 on real `wuce-staging`** — 6 forms present on the live page | `integration-real-code` + `live-verified` (presence confirmed live; submission behaviour itself is a mechanical, non-visual check, consistent with `ppc-s1`'s own DoD precedent) | None. |
| AC6 — Scope/Benefit cards stack to a single column at ≤768px | ✅ | T7 (asserts the `@media (max-width: 768px)` rule and the desktop `grid-template-columns:1fr 1fr` are both present); **re-verified 2026-10-27 on real `wuce-staging`** — confirmed desktop state is a real two-column render (`grid-template-columns: 510.5px 510.5px` at 1368px viewport, via a real screenshot) and that the browser's own parsed CSSOM contains `@media (max-width: 768px) { .ppc-summary-grid { grid-template-columns: 1fr; } }`, correctly scoped to the same selector | `live-verified` (real staging; `resize_window` confirmed again not to change the actual rendering viewport — `innerWidth` stayed at 1368 regardless — so CSSOM inspection was used instead of a literal narrow screenshot) | The two Playwright E2E tests named in the test plan were never written. AC6 still has no automated regression protection going forward — only manual checks (now two, including one on real staging). See `decisions.md` RISK-ACCEPT. |

**Note on the 2026-10-27 re-verification:** the original "live-verified" tags above (as first written) were carried over from the session's own summary without independently re-confirming them — on review this was an unjustified inference, not a verified fact. Redone from scratch: a local check first (found and root-caused an unrelated `.env`/`DATABASE_URL` environment issue, not a ppc-s6 regression — confirmed via an identical failure on `/api/pods`, an unrelated pre-existing route), then a real check against `wuce-staging.fly.dev`. `ppc-s6`'s own feature slug 404s there until `ppc-s7` also reaches DoD (`_resolveViaPipelineState`'s `allComplete` gate correctly requires every story in the feature, not just this one) — expected, not a bug — so a different, fully-complete feature (`2026-05-24-governance-platform-architecture`) was used to exercise the same shared shell/summary/coverage rendering code this story added.

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. Reviewed the merged diff against the story's Out of Scope section — no richer video/screenshot gallery redesign, no per-epic/per-story AC grouping, no change to `/playback`'s own page (only imports from it for function reuse), and the coverage line reflects page-load-time state only (no real-time update mechanism added).

---

## Test Plan Coverage

**Tests from plan implemented:** 7 of 14 named test cases (T1-T7 in `check-ppc-s6-dashboard-shell-parity.js`), covering all 6 ACs at least once.
**Tests passing in CI:** 7/7 implemented, plus 806/806 full suite (0 new failures) on PR #1030 at merge.

| Test plan item | Implemented | Notes |
|---|---|---|
| `renderScopeBenefitSummary_escapesXssInjection...` (AC2) | ✅ (as T3, integration-level rather than isolated unit) | Covered |
| `renderScopeBenefitSummary_emptyOrNullContent...` (AC2/AC4) | ⚠️ partial | Overlaps with T4's missing-artefact case; no isolated null/empty-content unit test |
| `handleGetPlaybackEvidence_wrapsPageInRenderShellWithNav...` (AC1) | ✅ (T1) | Covered |
| `handleGetPlaybackEvidence_doesNotCallRenderShellDirectly` (AC1 regression guard) | ❌ | Gap — see `decisions.md` RISK-ACCEPT |
| `handleGetPlaybackEvidence_rendersScopeAndBenefitFromFetchArtefact...` (AC2) | ✅ (T3) | Covered |
| `handleGetPlaybackEvidence_summaryContent_neverReadFromLocalDisk` (AC2 regression guard) | ❌ | Gap — see `decisions.md` RISK-ACCEPT |
| `handleGetPlaybackEvidence_coverageLine_rendersAboveAcSections` (AC3) | ✅ (T5/T6, content only — document-order not explicitly asserted) | Covered |
| `handleGetPlaybackEvidence_missingDiscoveryMd...` (AC4) | ✅ (T4) | Covered |
| `handleGetPlaybackEvidence_missingBenefitMetricMd...` (AC4, other file) | ❌ | Gap — see `decisions.md` RISK-ACCEPT |
| `existingCaptureForms_stillSubmitCorrectly...` (AC5) | ✅ (T2 + re-run pre-existing tests) | Covered |
| `scopeBenefitCards_desktopWidth_renderSideBySide` (AC6, E2E) | ❌ | Replaced by manual live check — see `decisions.md` RISK-ACCEPT |
| `scopeBenefitCards_narrowViewport_stackToSingleColumn...` (AC6, E2E) | ❌ | Replaced by manual live check — see `decisions.md` RISK-ACCEPT |
| `summaryFetch_boundedOverhead...` (NFR, call-count spy) | ⚠️ partial | Not isolated; implicitly consistent — `_fetchSummaryContent` calls `_fetchArtefact` exactly twice per load, confirmed by source read |
| `summaryContent_tenantScoped_noNewCrossTenantExposure` (NFR) | ⚠️ partial | Same evidence as AC2's tests — no dedicated cross-tenant-mismatch negative test |

**Gaps (tests not implemented):** 4 full gaps + 3 partial gaps, all logged in `decisions.md` (2026-10-27 RISK-ACCEPT) with a fast-follow test-hardening pass as the named remediation. None of the gaps correspond to a currently-failing AC.

**Coverage gap audit (CSS-layout-dependent):** AC6 is the one CSS-layout-dependent AC in this story's test plan. It was **not** RISK-ACCEPTed in `/decisions` before coding started — the test plan specified automated Playwright E2E coverage, and the swap to a manual-only check was discovered only at this DoD run, not decided deliberately beforehand. Per Step 4's instruction, this is flagged as a deviation (not a failure — the AC itself passed a genuine live-verified check) and the retroactive RISK-ACCEPT is now logged in `decisions.md`.

**CI evidence (PR #1030, all 8 required/configured checks passed on final run):** Run assurance gate, Cross-Tenant Isolation Repeat Gate (20x repeat, zero-tolerance), Playwright E2E smoke tests, Lint/typecheck/test/build, Trace Validation, Watermark Gate, Scenario A E2E (staging), Scenario B E2E (staging). Note: the first CI run's Scenario A E2E (staging) job timed out at the 10-minute runner limit during `apt-get` dependency install against a slow package mirror — confirmed transient infra flakiness, not a code regression, by (a) the identical job passing cleanly on `ppc-s10`'s PR #1029 the day before, and (b) a re-run of the failed job passing cleanly with no code changes.

---

## NFR Status

Four `ppc-s6`-relevant rows in `artefacts/2026-10-20-production-playback-capture/nfr-profile.md`, all addressed:

| NFR | Status | Evidence |
|---|---|---|
| Performance — summary fetch overhead bounded to 2 `fetchArtefact` calls per page load | ✅ Met | `integration-real-code` — `_fetchSummaryContent` calls `_fetchArtefact` exactly twice (discovery, benefit-metric), each independently try/caught; confirmed by source read and by T3/T4 exercising both branches |
| Security — audit logging | ✅ N/A (pre-existing, feature-wide) | `nfr-profile.md` already records this as "not identified as a blocking gap" across `ppc-s1`–`ppc-s6`; no new gap introduced |
| Design-token compliance (`hasDesignSystemTrack: true`) | ✅ Met | `node scripts/check-design-tokens.js` run directly against the touched files — clean, no non-token colors |
| Accessibility — shell wrap preserves keyboard-operable, no-client-JS interaction model | ✅ Met | `integration-real-code` — T2 confirms existing `<form>` markup unchanged; no new client-side JS added by this story |

Feature-wide `nfr-profile.md` status is **not** flipped to "Verified" — `ppc-s5`/`ppc-s7` rows remain pending their own DoD.

---

## Metric Signal

No entry in this feature's `metrics` array (`m1`, `m2`, `m3`) lists `ppc-s6` in its `contributingStories`. Consistent with the same pattern already noted in `ppc-s10`'s own DoD — a UX/shell-parity story was not itself expected to move an adoption metric; recorded here for completeness rather than silently skipped.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. Fast-follow test-hardening pass for `check-ppc-s6-dashboard-shell-parity.js`: add the 2 missing structural regression guards (no direct `renderShell()` call; no local-disk read for summary content), the independent `benefit-metric.md`-missing test case, and either the 2 planned Playwright E2E tests for AC6 or an explicit, deliberate RISK-ACCEPT decision to rely on manual checks only going forward. Owner: next available session touching `playback-evidence.js`, or standalone if prioritised sooner. See `decisions.md` 2026-10-27 RISK-ACCEPT for full rationale.
2. `ppc-s7` depends structurally on this story's dashboard-shell page (same rendered page, per its own Dependencies section) — now unblocked on `master` since this PR is merged. Ready to start.

---

## DoD Observations

1. **A CI job timeout on the first run turned out to be transient infra flakiness, not a regression — confirmed by cross-referencing the identical job on the immediately-prior PR.** `/definition-of-done` doesn't currently instruct checking a sibling PR's own CI history as a fast way to distinguish "flaky infra" from "real regression" before spending time re-running or debugging. `/improve` candidate: add this as a suggested first step in `/verify-completion` or `/branch-complete` when a staging-E2E job fails with a runner-timeout rather than a test-assertion failure.
2. **A test plan with the right AC-level coverage philosophy (unit + integration + E2E + NFR, named per-test) can still silently ship with less than half its named tests actually implemented, while every AC still "passes."** This happened because each AC had at least one test and a live-verification pass, so nothing failed — the gap only surfaced at this DoD run when the actual test file was diff'd against the plan test-case-by-test-case, not when `/verify-completion` ran (which checks AC-level pass/fail, not test-plan-item-by-item completeness). `/improve` candidate: `/verify-completion` or `/branch-complete` could add a lightweight check — test-plan test-case count vs. actual test file test count — as a cheap early warning, rather than leaving this discovery to DoD time after merge.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for ppc-s6 (Dashboard-shell UX/CX
parity and scope/benefit summary, feature 2026-10-20-production-playback-
capture).
Check:
1. Do the AC Coverage verdicts (all ✅, with deviations noted) match the cited
   test evidence in tests/check-ppc-s6-dashboard-shell-parity.js and the
   live-browser verification described in /verify-completion?
2. Is the retroactive RISK-ACCEPT for the 4 test-plan gaps (decisions.md,
   2026-10-27) the right call, or should any of the four be fixed now rather
   than deferred to a fast-follow?
3. Is Follow-up Action #2 (ppc-s7 now unblocked) accurate given ppc-s6's own
   Dependencies section?
```
