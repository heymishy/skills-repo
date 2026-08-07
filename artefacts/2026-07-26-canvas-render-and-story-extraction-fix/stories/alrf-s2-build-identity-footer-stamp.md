# Retrospective Story: Build-identity footer stamp (commit SHA + PR #)

**Story ID:** alrf-s2
**Retrospective audit date:** 2026-07-26
**Risk classification:** LOW (additive read-only UI/route; no change to any existing request path)

**Epic reference:** `artefacts/2026-07-25-code-shape-diagrams/epics/csd-e1-code-shape-diagrams.md`
**Parent retrospective:** `r-canvas-render-and-story-extraction-fix.md` / `alrf-s1-artefact-list-repo-root-fallback.md` (same directory) — found in direct response to testing alrf-s1 on staging

## What was delivered

After PR #614 (alrf-s1) merged, the operator tested the Resume-a-feature flow on staging and reported no change in behaviour. Investigation found the `Staging Deploy` workflow's `deploy-staging` job had in fact succeeded (confirmed via `gh run view --json jobs`) — the overall workflow only showed red because of a separate `smoke-test` job with pre-existing, unrelated failures (billing/auth/multi-tenant journeys) that block prod-promotion, not the staging deploy itself. There was no way to confirm from the running app itself which commit/PR was actually live.

**Fix:** a build-identity stamp, generated once per deploy and surfaced two ways:
- `scripts/write-version-file.js` — writes `version.json` (commit SHA, short SHA, originating PR number parsed from the squash-merge commit subject's `(#123)` suffix, deploy timestamp) at the repo root. Run as a new `Write version stamp` step in `staging-deploy.yml`, immediately before `flyctl deploy`.
- `Dockerfile` — optionally copies `version.json` into the image via a bracket-glob (`version.jso[n]`), so a local `docker build` without the script having run first is a no-op, not a failure.
- `src/web-ui/utils/version-info.js` — reads `version.json` at runtime; falls back to a clearly-labelled `{shortSha: 'dev'}` identity when absent (local dev).
- `GET /version` (`src/web-ui/routes/version.js`) — unauthenticated JSON endpoint, same trust level as the existing `/health`.
- Sidebar footer stamp (`html-shell.js`'s `renderSidebar`/`renderVersionStamp`) — short SHA (linked to the commit on GitHub) plus `· #PR` when available, on every page.

## Benefit Linkage

**Metric moved:** none of csd-e1's own metrics directly — this is delivery-confidence tooling, closing the exact "did my fix actually deploy?" gap this session's own alrf-s1 fix ran into.
**How:** any future staging test can now confirm build identity by glancing at the sidebar or hitting `/version`, without needing to cross-reference GitHub Actions run history.

## Acceptance Criteria

**AC1 — `buildVersionInfo()` correctly parses the originating PR number from a squash-merge commit subject**
Status: MET — `tests/check-alrf-s2-version-stamp.js` AC1, verified against this repo's own real commit `777e1603` ("... (#614)").

**AC2 — a commit with no PR pattern (direct bookkeeping commit) yields `prNumber: null`, not a throw**
Status: MET — same test file, AC2.

**AC3 — `getVersionInfo()` falls back to a clearly-labelled dev identity when `version.json` is absent**
Status: MET — AC3, plus Dockerfile's optional-copy glob covers the equivalent case in a built image.

**AC4 — `getVersionInfo()` reads real `version.json` content when present**
Status: MET — AC4.

**AC5 — `GET /version` returns 200 JSON matching the current version info**
Status: MET — AC5.

**AC6 — sidebar footer renders a working GitHub commit link with short SHA + PR # when available**
Status: MET — AC6, all 4 sub-assertions passing (element present, SHA visible, PR number visible, real commit URL).

**AC7 — no regression to existing shell/sidebar rendering**
Status: MET — `check-wuce18-html-shell.js` (44/44), `check-b2-account-nav.js` (8/8), `check-d2-banner-exit-permission-visibility.js` (24/24), `check-d4-nfr-security-review-and-hardening.js` (23/23), `check-kfd1-...` (42/42), `check-wuce20-...` (40/40), `check-wuce23-...` (35/35), `check-acps-s1-...` (3/3), `check-wuce25-...` (52/52) all still pass unchanged. Two pre-existing, unrelated failures (`check-ougl3-journey-entry-and-start.js`, `check-wuce24-guided-question-form.js`) were independently confirmed present with and without this change via `git stash` (same failure count both ways).

## Out of Scope

- Wiring `/version` or the footer into the production (`skills-framework`) deploy workflow specifically — the same `version.json` mechanism works there too if `promote-to-prod`'s job is later given its own stamp step, but that wasn't requested and this story only touches `staging-deploy.yml`.
- A UI affordance to diff "what's live" vs "what's on master" — `/version` + the footer answer "what's live," which was the actual gap; a diff view is a separate, larger feature.

## Traceability Linkage

**DoR artefact:** not written — retrospective story, same convention as its sibling stories in this directory
**Test plan:** `tests/check-alrf-s2-version-stamp.js` (16 ACs, all passing)
**DoD artefact:** not yet written
