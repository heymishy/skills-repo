# AC Verification Script: Automatically reflect a CLI-side gate advance on the corresponding web-UI journey

**Story reference:** artefacts/2026-08-07-cross-surface-state-sync/stories/css-s1-cli-advance-reflects-on-web-ui-journey.md
**Technical test plan:** artefacts/2026-08-07-cross-surface-state-sync/test-plans/css-s1-test-plan.md
**Script version:** 1
**Verified by:** Claude (session), with Hamish King | **Date:** 2026-10-24 | **Context:** [ ] Pre-code  [x] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a feature in `.github/pipeline-state.json` that has not yet reached the `discovery-approved` gate.
2. Have that same feature's slug set up as a web-UI journey (a test/staging journey is fine — this does not require a real customer journey).
3. Run `npm test` first to confirm the automated suite passes before doing manual verification.

**Reset between scenarios:** Re-run `node bin/skills init [a fresh test feature slug]` between scenarios so each scenario starts from a feature with no gates advanced yet.

---

## Scenarios

---

### Scenario 1: Advancing a gate on the CLI updates the connected journey automatically

**Covers:** AC1

**Steps:**
1. Run `node bin/skills gate-advance [feature-slug] [story-id] discovery-approved artefacts/[feature-slug]/discovery.md`
2. Open the connected web-UI journey for that same feature slug (no manual "Sync" click)

**Expected outcome:**
> The web-UI journey already shows the Discovery stage as complete — you did not need to click any "Sync" button on the dashboard to see it.

**Result:** [x] Pass  [ ] Fail
**Notes:** Live-verified post-merge on `wuce-staging` (2026-10-24): generated a throwaway `INTERNAL_SYNC_SECRET`, had the operator set it via `flyctl secrets set` directly (never entered by the agent). Called `gateAdvance()` directly (not via `bin/skills`, which hardcodes its own repo root and rejects an external `repoRoot` via its path-traversal guard) against a real throwaway feature/journey pair. Confirmed a real HTTP round-trip to the deployed internal endpoint — timing (337ms resolve + 50ms update) matched real network latency, explicitly distinguishing this from a stale/cached false-positive. Also visually confirmed in Chrome. This directly exercises the AC1 synchronous-update mechanism end-to-end against real staging infrastructure (all 17 automated tests use a mocked HTTP client/Postgres — this was the first real-network proof).

**Covers:** AC2

**Steps:**
1. Pick a feature slug that exists in `pipeline-state.json` but has never been started as a web-UI journey.
2. Run `node bin/skills gate-advance [feature-slug] [story-id] discovery-approved artefacts/[feature-slug]/discovery.md`

**Expected outcome:**
> The command finishes normally with no error message — there is no journey to update, and nothing complains about that.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A journey belonging to a different repo than this CLI's own is flagged, not silently ignored

**Covers:** AC3

**Note:** this scenario was revised from the original DoR wording ("journey resolves to a repo with no matching feature slug") to match what was actually implemented at build time — see `css-s1-plan.md`'s own flagged design note. The mechanism is a repo-identity comparison (this CLI's own `GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME` vs. the journey's connected repo), not a live check of the journey's repo's `pipeline-state.json` content.

**Steps:**
1. Set up a web-UI journey whose connected repo's owner/name does not match this CLI's own `GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME` environment variables.
2. Trigger a gate advance from the CLI side for the same feature slug that would normally try to sync to that journey.
3. Check the sync/mismatch log (a `journey-sync-mismatch` warning naming the feature slug and journey ID).

**Expected outcome:**
> The journey's own record is untouched, and a log entry exists naming the mismatched feature slug — it is visible, not silently dropped.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The internal sync endpoint refuses requests without the right credential

**Covers:** AC5

**Steps:**
1. (Requires access to the deployed web-UI's internal endpoint URL and a deliberately wrong or missing credential value — a platform-maintainer-only check, not a customer-facing scenario.)
2. Attempt to call the internal sync endpoint without the correct service credential.

**Expected outcome:**
> The request is refused — the endpoint does not process it or return any journey data.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Solo CLI-only usage with no web-UI product connected works exactly as before

**Covers:** AC6

**Steps:**
1. In an environment with no `INTERNAL_SYNC_URL`/`INTERNAL_SYNC_SECRET` set (the normal case if you've never connected this repo to the hosted web UI), run `node bin/skills gate-advance [feature-slug] [story-id] discovery-approved artefacts/[feature-slug]/discovery.md`.

**Expected outcome:**
> The command works exactly as it always has — no error, no mention of sync, no behaviour change at all.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Advancing a different gate type does not trigger this story's sync

**Covers:** AC4

**Steps:**
1. Advance a gate other than `discovery-approved` (e.g. `test-plan-complete`) for a feature with a connected journey.
2. Check the connected journey immediately afterward.

**Expected outcome:**
> The journey is unchanged — this story only syncs the `discovery-approved` gate; other gate types are covered by a later story (css-s4).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | Pass | Live-verified post-merge on staging, real HTTP round-trip, 2026-10-24 |
| Scenario 2 | Not manually run | Covered by 2 automated tests (unit + integration, mocked HTTP client) |
| Scenario 3 | Not manually run | Covered by 1 automated test (unit, mocked) |
| Scenario 4 | Not manually run | Covered by 2 automated tests (unit, mocked); not separately exercised live against the deployed endpoint with a wrong credential |
| Scenario 5 | Not manually run | Covered by 1 automated test (unit, mocked) |
| Edge case | Not manually run | Covered by 1 automated test (unit, mocked) |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

**Note:** "All pass" reflects Scenario 1's live verification plus all 17 automated tests (covering AC1-AC6, including Scenarios 2-5 and the edge case) passing in CI pre-merge. Scenarios 2-5 and the edge case were not independently re-run manually post-merge — their only evidence is `unit`/`integration-real-code` (mocked HTTP/Postgres), not `live-verified`. This is recorded explicitly in the DoD artefact's AC Coverage table rather than overclaimed here.

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
