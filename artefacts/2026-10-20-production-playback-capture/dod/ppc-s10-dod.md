# Definition of Done: ppc-s10 — Repo-freshness wiring for capture serving + Playback Evidence nav link

**PR:** https://github.com/heymishy/skills-repo/pull/1029 | **Merged:** 2026-10-27
**Story:** N/A (short-track) — see `test-plans/ppc-s10-test-plan.md` (bug reproduction + scope)
**Test plan:** `artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s10-test-plan.md`
**DoR artefact:** `artefacts/2026-10-20-production-playback-capture/dor/ppc-s10-dor.md`
**Assessed by:** Claude (session)
**Date:** 2026-10-27

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `handleGetPlaybackEvidence` calls `ensureRepoFresh` before reading committed capture evidence | ⚠️ | `check-ppc-s10-repo-freshness-wiring.js` T1-T3 (call-order + failure-swallowing assertions against the real handler + journey-store) and T10 (a real `git init`/clone/push/pull reproducing the exact commit-to-serve handoff that 404d in production, using the real, unmocked `ensureRepoFresh`) | `integration-real-code` | The actual claim ("committed evidence becomes visible without an app redeploy") is about production behaviour on the Fly deployment. This PR has not yet been deployed to production as of this DoD — the underlying `ensureRepoFresh` mechanism is already proven live (it is the same adapter `journey.js` has used in production for months), but these two new call sites have not themselves been exercised against a real deployed instance yet. See Follow-up Actions. |
| AC2 — `handleGetCaptureScreenshot`/`handleGetCaptureVideo` call `ensureRepoFresh` before `fs.existsSync` | ⚠️ | `check-ppc-s10-repo-freshness-wiring.js` T4-T6, T10 (same real git-clone/pull integration evidence as AC1) | `integration-real-code` | Same evidence-class gap as AC1 — not yet confirmed via a real production trigger post-deploy. See Follow-up Actions. |
| AC3 — Playback evidence link rendered when a product is connected, on the DoD stage view | ✅ | `check-ppc-s10-playback-link.js` T7 (real router-dispatch, asserts the exact `href` string in the response HTML) and T11 (asserts the rendered path matches `server.js`'s own real route registration) | `integration-real-code`, UI-evidence gate satisfied via RISK-ACCEPT (`decisions.md`, 2026-10-27 — plain unstyled link, no CSS-layout dependency, confirmed N/A at DoR's own H-E2E check) | None |
| AC4 — No link rendered when `journey.productId` is unset | ✅ | `check-ppc-s10-playback-link.js` T9 (real router-dispatch, asserts no `/playback-evidence/` substring in the response HTML) | `integration-real-code`, same RISK-ACCEPT as AC3 | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. Reviewed the 3 commits on `feature/ppc-s10` against the 4 ACs and the DoR contract's "What will NOT be built" section — no out-of-scope work found (did not touch `ensureRepoFresh`'s own internals, did not fix `/playback/:featureSlug`'s matching gap, did not redesign the capture-target/capture-evidence two-button flow).

---

## Test Plan Coverage

**Tests from plan implemented:** 11/11
**Tests passing in CI:** 11/11 (confirmed via PR #1029's own passing CI run — see below)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1-T3 (AC1) | ✅ | ✅ | `check-ppc-s10-repo-freshness-wiring.js` |
| T4-T6 (AC2) | ✅ | ✅ | same file |
| T10 (AC1, AC2 integration) | ✅ | ✅ | real git clone/push/pull, same file |
| T7-T9 (AC3, AC4) | ✅ | ✅ | `check-ppc-s10-playback-link.js` |
| T11 (AC3 integration) | ✅ | ✅ | same file |

**Gaps (tests not implemented):** None.

**CI evidence (PR #1029, all 8 required/configured checks passed):** Lint/typecheck/test/build, Assurance Gate, Playwright E2E smoke tests, Scenario A E2E (staging), Scenario B E2E (staging), Cross-Tenant Isolation Repeat Gate (20x repeat, zero-tolerance), Trace Validation, Watermark Gate. Full local suite at merge time: 805/805 passing (0 new failures; 2 pre-existing e2e flakes — `ep3-s1-regression`, `rdac-s1-resume-...` — independently confirmed to reproduce identically on unmodified `master`, not a regression from this branch).

**Coverage gap audit (CSS-layout-dependent):** No `CSS-layout-dependent` gaps in this story's test plan (confirmed at `/test-plan`'s own Step 3a check and again at DoR's H-E2E check — both N/A). Not applicable.

---

## NFR Status

✅ **NFR check: No NFRs defined** — confirmed not applicable at 2026-10-27. The test plan explicitly states "None — confirmed": this story reuses `ensureRepoFresh`'s existing NFR characteristics unchanged (5s exec timeout, `--ff-only` safety, 2-minute TTL, never throws) and adds a plain server-rendered HTML link with no new NFR claim.

---

## Metric Signal

No entry in this feature's `metrics` array lists `ppc-s10` in its `contributingStories`. Consistent with the same gap already flagged as an Observation in `ppc-s9`'s own DoD (`ppc-s9-dod.md`) — a short-track bug-fix story was never expected to move an adoption/engagement metric, and this is not itself a new finding; recorded here for completeness rather than silently skipped.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. Once this PR is live on the production `skills-framework` deployment, trigger a real capture (same `/products/:productId/playback-evidence/:featureSlug` flow already exercised live during `ppc-s9`'s own production validation) and confirm the screenshot/video renders on page reload without needing a manual app restart — this closes AC1/AC2's remaining evidence-class gap. Owner: next session with production access.
2. `/playback/:featureSlug`'s matching gap (confirmed via the same grep method during this story's own investigation to also never call `ensureRepoFresh`) remains unfixed — logged in `decisions.md` (2026-10-27) as explicitly out of this story's scope. Owner: future story, if prioritised.
3. `ppc-s6`, `ppc-s7`, `ppc-s8` still show `dodStatus: "not-started"` in `pipeline-state.json` despite `ppc-s8` having visibly shipped (PRs #1023/#1024/#1027 per `decisions.md`'s own 2026-10-26 entries) and `ppc-s8`'s own architecture having been explicitly superseded by `ppc-s9`. Not fixed as part of this DoD (out of scope for a ppc-s10-specific run) — flagged here so a future `/trace` or feature-completion check doesn't silently misreport this epic's real status. Owner: a short `/definition-of-done` reconciliation pass for ppc-s6/s7/s8, or an explicit decision to mark ppc-s8 superseded/archived instead of DoD'd.

---

## DoD Observations

1. **A real merge-conflict + a silent CI-non-trigger both occurred on this PR, from the same root cause.** The `/branch-setup` state checkpoint (`ea8cd593`) was committed directly to `master` instead of onto `feature/ppc-s10`, even though a worktree/branch already existed at that point — a deviation from this repo's own "bundle first" convention (CLAUDE.md: "whenever practical, include state/artefact updates in the same commit and branch as the implementation they record"). This left `pipeline-state.json` git-ancestry-diverged (despite content staying correct via the fetch-merge protocol at every later write), which produced a real `CONFLICT (content)` merge conflict at PR time, and GitHub's `pull_request` check-suite never computed until that conflict was resolved and a fresh commit pushed. **`/improve` candidate:** the `/branch-setup` skill's own instructions should say explicitly to commit its state write ON the newly-created branch (once a worktree exists), not from the main checkout, mirroring the discipline `/implementation-plan` onward already follows — this was the one step in the whole inner loop that broke that pattern.
2. `gh pr create --draft` did not actually produce a draft PR (`draft: false` confirmed via both `gh pr view` and the raw GitHub API) despite the flag being passed correctly. Root cause not identified this session — flagged to the operator directly in chat, not independently investigated further since it didn't block the PR's own review/merge flow. Worth a `/improve` look if it recurs: possible `gh` CLI version quirk, or a repo-level "draft pull requests" feature toggle.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for ppc-s10 (Repo-freshness wiring for
capture serving + Playback Evidence nav link, feature 2026-10-20-production-
playback-capture).
Check:
1. Do the AC Coverage verdicts (⚠️ for AC1/AC2, ✅ for AC3/AC4) match the cited
   test evidence in tests/check-ppc-s10-repo-freshness-wiring.js and
   tests/check-ppc-s10-playback-link.js?
2. Is the AC1/AC2 ⚠️ classification (integration-real-code evidence for a
   production-behaviour claim) consistent with this repo's own verification-
   strength rule, or should it have been marked ✅ on the T10 integration
   test's strength alone?
3. Is Follow-up Action #3 (ppc-s6/s7/s8 dodStatus drift) a real, material gap,
   or already tracked/resolved elsewhere that this DoD run missed?
```
