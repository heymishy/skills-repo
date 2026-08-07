## Story: Triage the pre-existing baseline test failures unmasked by the pcr-s1 test runner

**Track:** Short-track (`/test-plan -> /definition-of-ready -> coding agent`)
**Discovery/benefit-metric:** Not applicable — short-track story per CLAUDE.md's routing for bounded, non-architectural fixes.

## User Story

As an **operator relying on `npm test` / `node scripts/run-all-tests.js` as a real pass/fail signal**,
I want **every currently-failing test file in this repo's suite to be individually triaged — fixed where the fix is small and bounded, or explicitly documented as an accepted, tracked gap where it is not**,
So that **the pre-existing 69-file failure count (unmasked by pcr-s1's non-short-circuiting test runner, PR #455) stops being an undifferentiated wall of red that every future story's `branch-setup`/`verify-completion` step has to individually re-explain away, and any file that has silently become a genuinely new, undocumented regression is caught rather than assumed pre-existing**.

## Benefit Linkage

**Metric moved:** Operational efficiency / signal quality — every `bri-*` and `tir-*` story this session had to independently rediscover and RISK-ACCEPT the same ~69-73 pre-existing failures (see `artefacts/2026-07-09-beta-readiness-infra/decisions.md`'s repeated RISK-ACCEPT entries citing this exact baseline). Reducing the undifferentiated failure count, and making `tests/known-baseline-failures.json` accurate again, directly cuts that repeated overhead for every future story and restores `scripts/ci-test-regression-check.js`'s ability to catch a real new regression instead of it being lost in noise.
**How:** Short-track, no formal benefit-metric artefact — verified directly with the operator per the same precedent as `pcr-s1`.

## Current, freshly-verified state (2026-07-16, not the 2026-07-11/12 pcr-s1 snapshot)

A fresh `node scripts/run-all-tests.js` run on a clean `origin/master` worktree (no code changes) on 2026-07-16 found **69 failing files out of 337 run** (up from pcr-s1's original 68-73 estimate range, and down in absolute terms from the checked-in `tests/known-baseline-failures.json` snapshot's 73 entries). Diffing the fresh 69 against the checked-in snapshot:

- **5 files in the snapshot now pass** (already fixed by some story since 2026-07-12, snapshot never refreshed): `tests/check-bri-s3.5-nfr-stripe-keys.js`, `tests/check-gpa-sc06-source-path-guard.js`, `tests/check-lab-s3.2-stripe-checkout.js`, `tests/check-lab-s3.4-stripe-webhook.js`, `tests/run-gpa-tests.js`.
- **1 file fails now but is NOT in the snapshot**: `tests/check-md-3-adr.js`. This is either a genuinely new, undocumented regression that slipped past `scripts/ci-test-regression-check.js`'s gate, or a pre-existing gap that was simply never added to the snapshot. This must be investigated and categorized, not assumed either way.
- The remaining ~67 files match the snapshot (already-known, already-accepted-as-out-of-scope-elsewhere failures).

## Architecture Constraints

- No new adapters, no schema changes, no new production features. This is a triage/fix story against existing test files and, where a fix requires it, small, targeted production-code corrections (matching the pattern already established by `bri-s2.5`/`bri-s3.2`/`bri-s3.4`'s "found by actually running the flow" fixes).
- Do not touch any in-flight `bri-*`, `tir-*`, or other currently-open feature's branch or PR.
- Do not modify `scripts/run-all-tests.js`'s discovery/grandfather-list mechanism itself (pcr-s1's scope) — this story only fixes/categorizes the failures it surfaces.

## Dependencies

- **Upstream:** `pcr-s1` (PR #455, merged) — the test runner that unmasked this baseline.
- **Downstream:** None. `scripts/ci-test-regression-check.js` and `tests/known-baseline-failures.json` (both from pcr-s1's post-merge CI fix) are the consumers this story keeps accurate.

## Acceptance Criteria

**AC1:** Given a fresh `node scripts/run-all-tests.js` run against `origin/master`, When each of the 69 currently-failing files is individually investigated (read the failure output, read the file, determine root cause), Then every file is bucketed into exactly one category: **(a) Fixed** — a small, bounded, low-risk fix was made and the file now passes; **(b) Deferred** — the fix requires a larger architectural/product decision or is out of proportion to this story's bounded scope, logged as a RISK-ACCEPT in `decisions.md` with a one-sentence root cause and a named follow-up owner/trigger; **(c) Investigated-and-classified** — specifically for `tests/check-md-3-adr.js` (the one undocumented failure), a determination of "genuinely new regression" vs. "pre-existing gap never snapshotted" is recorded, with evidence (e.g. `git log` / `git bisect`-style reasoning, or reproduction against an earlier commit).

**AC2:** Given every file placed in category (a) Fixed, When `node <that file>` is re-run standalone, Then it passes with 0 failures, and When the full suite (`node scripts/run-all-tests.js`) is re-run, Then no file that was passing before this story's changes now fails (zero new regressions introduced by the fixes themselves).

**AC3:** Given `tests/check-md-3-adr.js` specifically, When investigated per AC1's category (c), Then if it is determined to be a genuine new regression, it is fixed (moved to category (a)); if it is determined to be a pre-existing, previously-unsnapshotted gap, it is documented and added to the refreshed baseline (category (b)) — either way, it is not left silently uncategorized.

**AC4:** Given `tests/known-baseline-failures.json`, When this story completes, Then it is refreshed to (i) remove the 5 files confirmed now-passing (`check-bri-s3.5-nfr-stripe-keys.js`, `check-gpa-sc06-source-path-guard.js`, `check-lab-s3.2-stripe-checkout.js`, `check-lab-s3.4-stripe-webhook.js`, `run-gpa-tests.js`), (ii) remove every file this story moved to category (a) Fixed, and (iii) accurately list every remaining category (b)/(c)-deferred file, so the file's own contents match the real, current suite state rather than the stale 2026-07-12 snapshot.

**AC5:** Given the refreshed `tests/known-baseline-failures.json`, When `node scripts/ci-test-regression-check.js` is run against a fresh full-suite log, Then it reports zero new (unaccounted-for) regressions — confirming the regression gate's signal is restored to accurate, not just that the file was edited.

## Out of Scope

- Fixing every one of the 69 files to fully green — this story fixes what is small and bounded (AC1 category (a)) and explicitly, transparently defers the rest (category (b)) rather than silently leaving them undifferentiated. A 100%-green suite is not this story's goal; an accurately triaged and minimized one is.
- Any change to `scripts/run-all-tests.js`'s own discovery mechanism, the grandfather-list, or `package.json`'s `scripts.test` entry — all pcr-s1 scope, unchanged here.
- Investigating flaky/order-dependent failures that only reproduce inside the full 337-file run and not standalone (if found, log as a category (b) RISK-ACCEPT naming this specifically, per the existing precedent for `tests/check-p3.5-validate-trace.js` in `bri-s2.6`'s decisions.md entry — not this story's to solve).

## NFRs

- **Performance:** No new NFR. This story should reduce, not increase, total suite runtime (fewer genuinely-broken files means less wasted CI time re-explaining known failures per story).
- **Security:** None of the known 69 failures are security-relevant per their existing categorization in pcr-s1's decisions.md and `known-baseline-failures.json`'s own note field — if triage surfaces one that IS security-relevant, treat it as a same-day priority fix (category (a)), not a deferred RISK-ACCEPT.
- **Accessibility:** Not applicable.
- **Audit:** None beyond standard CI logging.

## Complexity Rating

**Rating:** 3 — high ambiguity: the actual fixability of each of 69 individually-unread files is unknown until investigated; some will be one-line fixes, some may reveal real product gaps.
**Scope stability:** Unstable — the AC1 categorization itself may reshape scope mid-story once root causes are known; that is expected and acceptable for a triage story, not a defect in this story's own definition.
