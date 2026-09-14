# Definition of Done: wsd-s2 — GitHub-API-backed pipeline-state writer for the production container

**Track:** Standard-track
**PR:** https://github.com/heymishy/skills-repo/pull/889 | **Merged:** 2026-09-14 (merge commit `336afdad`)
**Test plan:** artefacts/2026-09-15-web-ui-pipeline-state-durability/test-plans/wsd-s2-test-plan.md
**DoR artefact:** artefacts/2026-09-15-web-ui-pipeline-state-durability/dor/wsd-s2-dor.md
**Assessed by:** Claude Sonnet 5 (orchestrating session)
**Date:** 2026-09-15

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | T1/T2 — mocked Contents API GET returns a fixture state + `sha`; the writer's PUT body decodes to the correct feature/story-level field changes, and the captured `sha` matches the mocked GET's `sha`. | automated test (fetch mocked) | None |
| AC2 | ✅ | T3/T4 — `pipeline-state-writer-selector.js`'s `selectPipelineStateWriterFactory()` tested directly against two real temp directories (one with a `.git` dir, one without): the local-fs factory is invoked (not just referenced) when `.git` is present, and the GitHub-API factory is invoked when it is absent — satisfies D37 rule 4's behavioural-correctness bar, not only that a reference was assigned. | automated test (real filesystem, no mocking) | None |
| AC3 | ✅ | T5 (no false conflict — a second call's own fresh GET already reflects a concurrent write, no retry needed) and T6 (genuine 409 — the writer retries with a fresh GET and its retried PUT succeeds, carrying its own field change on top of the fresh state, not stale first-call data). | automated test (fetch mocked, sequenced) | None |
| AC4 | ✅ | T7 (all 3 PUT attempts return 409 — exactly 3 attempts made, PostHog `captureException` fires with `featureSlug`/`storyId`, the writer throws) and T8 (a non-409 GET failure — same capture-and-throw behaviour, confirming AC4 covers all unrecoverable failures, not only conflict exhaustion). `journey.js`'s existing `console.error` line is unchanged — confirmed by inspection, still present verbatim. | automated test (fetch mocked) | None |
| AC5 | ✅ | T9 — an invalid `dorStatus` enum value is rejected by `applyAdvance()` before any PUT is attempted (mocked PUT never invoked) and the same PostHog failure-visibility path fires. | automated test (fetch mocked) | None |

**Confirmed in CI, not just locally:** all 7 required PR #889 checks passed (Cross-tenant isolation spec, Lint/typecheck/test/build, Playwright E2E smoke, Run assurance gate, Scenario A/B E2E staging, Watermark gate) — checked via `gh pr checks 889 --watch`, not assumed from a self-report.

---

## Scope Deviations

1. **`journey.js`'s pipeline-state call site changes** (adds a 4th `context` argument, adds `await`) — a deliberate, documented deviation from the DoR's "call site unchanged" wording. The GitHub-API writer genuinely needs the operator's `req.session.accessToken` and the resolved owner/repo per call (available only at the request handler, not at factory-creation time), and is genuinely async; the local-fs writer ignores the extra argument and `await`ing its non-promise return value is a no-op. Full rationale logged in `decisions.md`. Verified safe via a regression sweep of 6 journey.js gate-confirm test files (68 assertions total) — all pass unchanged.
2. **`pipeline-state-writer-selector.js` added as a new, small extracted module**, not present in the original Architecture Constraints (which described the selection logic as inline server.js code). Extracted specifically to make AC2/D37-rule-4 testable as real behavioural correctness rather than static source inspection — a stronger verification bar than the DoR anticipated, not a scope reduction.

---

## Test Plan Coverage

**Tests from plan implemented:** T1-T9, all as behavioural assertions (24 total) in one new file
**Tests passing in CI:** all PR #889 checks green; locally, `check-wsd-s2-github-pipeline-state-writer.js` 24/24, plus the full named regression suite

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 — GET+PUT, sha match, correct content | ✅ | ✅ | |
| T2 — feature-level-only update, no phantom story | ✅ | ✅ | |
| T3 — `isRealCheckout=true` → local-fs factory invoked | ✅ | ✅ | real temp dir with `.git/` |
| T4 — `isRealCheckout=false` → GitHub-API factory invoked | ✅ | ✅ | real temp dir without `.git/` |
| T5 — second call's own fresh GET, no false conflict | ✅ | ✅ | |
| T6 — genuine 409, retry with fresh GET, retry succeeds | ✅ | ✅ | 2 GETs, 2 PUTs confirmed |
| T7 — exhausted retry (3× 409) → PostHog capture, throws | ✅ | ✅ | exactly 3 PUT attempts confirmed |
| T8 — non-409 GET failure → same capture-and-throw path | ✅ | ✅ | |
| T9 — invalid enum → no PUT attempted, capture fires | ✅ | ✅ | mocked PUT confirmed never called |

**Regression coverage executed:**
- `tests/check-pla-s2-posthog-wiring.js` — 28 passed
- `tests/check-defs-s1-definition-artefact-splitter.js` — 9 passed
- `tests/check-revs-s1-review-artefact-splitter.js` — 6 passed
- `tests/check-asf-s1-splitter-parity-bugs.js` — 10 passed
- `tests/check-wsd-s1-advance-core-extraction.js` — 20 passed
- Additional sweep for the `journey.js` call-site change (not in the original test plan, added because the deviation above touches shared code): `check-owle6-pipeline-state-auto-write.js` (20), `check-acdg-s1-commit-guard.js` (6), `check-acdg-s2-durability-signal.js` (8), `check-das-s1-commit-artefact-git-fallback.js` (11), `check-dcuf-s1-github-commit-real-completion-point.js` (13), `check-cdg4-gate-confirm-validation.js` (10) — all pass unchanged
- Full `npm test` (662 files) run post-merge: 2 pre-existing, unrelated failures — `tests/check-p3.5-validate-trace.js` (documented repeatedly this session as an unrelated `validate-trace.ps1` gap, e.g. `dmcb-s1`'s own DoD) and `tests/check-pcr-s1-test-runner.js` (a machine-load-sensitive wall-clock NFR test measuring the *first* 40 test files alphabetically — confirmed neither `wsd-s1`'s nor `wsd-s2`'s new test file is in that sampled set, and the margin was <1% over threshold on repeated runs, consistent with environmental timing noise rather than a real regression)

**Gaps:** None against this story's own scope.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|----------|
| Concurrency safety | ✅ | AC3 (T5/T6) — sha captured and used from a single GET, never re-fetched separately; retry re-GETs before re-applying |
| Observability | ✅ | AC4/AC5 (T7/T8/T9) — every unrecoverable failure path fires a PostHog `captureException`, in addition to the existing `console.error` |
| Performance | ✅ | Write stays off the user-visible response path — `journey.js`'s existing `try/catch` wrapping is unchanged in structure, only `await`ed |
| Security | ✅ | No new credential — `req.session.accessToken` reused, same identity `artefact-commit-writer.js` already uses; no server-level write token introduced |

---

## Metric Signal

Closes the actual gap for **Pipeline-state accuracy for web-UI-originated features** (Tier 1, Metric 1: baseline 0% confirmed absent for two independent features this session, target 100%) and **Silent-failure elimination** (Tier 2, Meta Metric 1: baseline 0 — today's failure is 100% invisible, target: an exhausted-retry failure is captured somewhere queryable). Both are now mechanically true per the automated test suite. **Live production confirmation is a follow-up action** (below), pending the next production deploy and an actual web-UI-driven stage completion — the same live-verification discipline this session already applied to `asf-s1` and `pao-s1`.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. After the next production deploy, verify live (per the benefit-metric's own Directional Success Indicators) that a fresh web-UI-created feature's stage completion actually lands in `.github/pipeline-state.json` on `origin/master` — the same live-verification discipline already applied to `asf-s1` this session. Not yet performed as of this DoD; requires an operator-approved production deploy first.
2. Decide the fate of `2026-09-14-test-asf-s1-live-verification-throwaway`, the earlier live-verification test feature still present in the `skills-framework` production product — still outstanding from earlier this session, unrelated to this story's own scope.

---

## DoD Observations

1. **The DoR's own "call site unchanged" constraint, written before implementation, turned out to be wrong once the actual mechanics were built** — the GitHub-API writer genuinely needs per-request data (the operator's session token) unavailable at server-startup factory-creation time, so the call site had to gain a 4th argument. Corrected in `decisions.md` rather than forcing an artificial workaround; a real example of the general principle that a DoR is a plan, not a contract immune to revision once real implementation surfaces a requirement the plan didn't anticipate.
2. **Extracting the factory-selection logic into its own tiny module (`pipeline-state-writer-selector.js`) turned a would-be static/structural AC2 check into a genuine behavioural test** (T3/T4 assert which factory is actually *invoked*, using real temp directories with/without `.git/`, not just that a reference was set) — directly satisfying CLAUDE.md's D37 rule 4 and the `tir-s1` lesson it cites, rather than settling for the weaker verification the original Architecture Constraints (inline server.js logic) would have made much harder to test properly.
3. **A destructured `require()` of `captureException` in the first draft of `pipeline-state-github-writer.js` would have silently defeated the test's own monkeypatch-based mocking** (`var { captureException } = require(...)` captures the function reference at require-time, so a test's later `posthogServer.captureException = mockFn` reassignment has no effect on the already-destructured local binding). Caught while writing T7 — the fix was switching to a held module-object reference (`var posthogServer = require(...)`, called as `posthogServer.captureException(...)`), consistent with this repo's own established `getXAdapter()`-style convention of always looking up the current value at call-time rather than capturing it once at load-time.
