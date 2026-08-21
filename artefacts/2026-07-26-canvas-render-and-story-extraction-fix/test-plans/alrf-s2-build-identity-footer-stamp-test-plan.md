## Test Plan: Build-identity footer stamp (commit SHA + PR #)

**Story reference:** artefacts/2026-07-26-canvas-render-and-story-extraction-fix/stories/alrf-s2-build-identity-footer-stamp.md
**Epic reference:** csd-e1-code-shape-diagrams
**Test plan author:** Claude (agent) — retrospective backfill, 2026-08-21
**Date:** 2026-08-21

**Backfill note:** reconstructed after the fact — implementation and its test file (`tests/check-alrf-s2-version-stamp.js`) already existed and were merged (2026-07-26); documents existing coverage per `templates/retrospective-story.md`'s convention.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `buildVersionInfo()` correctly parses the originating PR number from a squash-merge commit subject | 1 test | — | — | — | — | 🟢 |
| AC2 | A commit with no PR pattern yields `prNumber: null`, not a throw | 1 test | — | — | — | — | 🟢 |
| AC3 | `getVersionInfo()` falls back to a clearly-labelled dev identity when `version.json` is absent | 1 test | — | — | — | — | 🟢 |
| AC4 | `getVersionInfo()` reads real `version.json` content when present | 1 test | — | — | — | — | 🟢 |
| AC5 | `GET /version` returns 200 JSON matching current version info | 1 test | — | — | — | — | 🟢 |
| AC6 | Sidebar footer renders a working GitHub commit link with short SHA + PR # | 4 sub-tests | — | — | — | — | 🟢 |
| AC7 | No regression to existing shell/sidebar rendering | — | 9 regression suites | — | — | — | 🟢 |

---

## Coverage gaps

None. All 7 ACs have direct test coverage.

---

## Test Data Strategy

**Source:** This repo's own real commit `777e1603` ("... (#614)") for AC1's PR-number-parsing assertion; synthetic commit-subject strings for AC2.
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained.

---

## Unit Tests

Tests live in `tests/check-alrf-s2-version-stamp.js` (16 assertions total):

- **AC1:** `buildVersionInfo()` parses `prNumber` from a real squash-merge commit subject.
- **AC2:** A direct bookkeeping commit (no `(#N)` suffix) yields `prNumber: null`.
- **AC3:** `getVersionInfo()` with no `version.json` present falls back to `{shortSha: 'dev'}`.
- **AC4:** `getVersionInfo()` with `version.json` present reads its real content.
- **AC5:** `GET /version` returns `200` with JSON matching current version info.
- **AC6 (4 sub-assertions):** sidebar footer element present, short SHA visible, PR number visible, link resolves to a real GitHub commit URL.

---

## Integration Tests

**AC7 (regression):** `check-wuce18-html-shell.js` (44/44), `check-b2-account-nav.js` (8/8), `check-d2-banner-exit-permission-visibility.js` (24/24), `check-d4-nfr-security-review-and-hardening.js` (23/23), `check-kfd1-...` (42/42), `check-wuce20-...` (40/40), `check-wuce23-...` (35/35), `check-acps-s1-...` (3/3), `check-wuce25-...` (52/52) — all pass unchanged. Two pre-existing, unrelated failures confirmed via `git stash` to predate this change.

---

## E2E Tests

None.

---

## NFR Tests

None named — delivery-confidence tooling, not a product NFR.

---

## Out of Scope for This Test Plan

- Wiring `/version`/footer into the production deploy workflow specifically (story's own Out of Scope — only `staging-deploy.yml` was touched).
- A "what's live vs what's on master" diff UI.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
