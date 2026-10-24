# Definition of Done: Automatically reflect a CLI-side gate advance on the corresponding web-UI journey

**PR:** https://github.com/heymishy/skills-repo/pull/1016 | **Merged:** 2026-10-24
**Story:** artefacts/2026-08-07-cross-surface-state-sync/stories/css-s1-cli-advance-reflects-on-web-ui-journey.md
**Test plan:** artefacts/2026-08-07-cross-surface-state-sync/test-plans/css-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-07-cross-surface-state-sync/dor/css-s1-dor.md
**Assessed by:** Claude (session)
**Date:** 2026-10-24

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | 2 unit + 1 integration test (`tests/check-css-s1-*.js`), all passing in CI; additionally `live-verified` post-merge on `wuce-staging` — real `gateAdvance()` call against a real deployed internal endpoint produced a real HTTP round-trip (337ms resolve + 50ms update, matching real network latency, not a cached false-positive) and a visually-confirmed journey update in Chrome | `live-verified` | None |
| AC2 | ✅ | 1 unit + 1 integration test, passing in CI | `integration-real-code` | None — not independently re-run live post-merge; mocked-HTTP evidence only |
| AC3 | ✅ | 1 unit test, passing in CI. Implementation reinterprets the DoR's literal "no matching feature slug" wording as a repo-identity comparison — documented and accepted in `decisions.md` (2026-08-07) and reflected in the test plan's own AC3 description | `unit` | Documented scope reinterpretation (not a failure) — see `decisions.md` |
| AC4 | ✅ | 1 unit test, passing in CI | `unit` | None — not independently re-run live post-merge; mocked evidence only |
| AC5 | ✅ | 2 unit tests (accept/reject credential), passing in CI; indirectly corroborated live — the post-merge live verification above only succeeded once the correct `INTERNAL_SYNC_SECRET` was set via `flyctl secrets set`, confirming the credential gate is live and enforced in the deployed environment | `unit` (reject path), `live-verified` (accept path only, indirectly) | The negative case (wrong credential rejected) was not independently re-tested against the live deployed endpoint — unit evidence only for that half |
| AC6 | ✅ | 1 unit test, passing in CI | `unit` | None — not independently re-run live post-merge; mocked evidence only |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. One documented (AC3's scope reinterpretation, pre-accepted in `decisions.md` before merge — not a post-hoc gap).

---

## Scope Deviations

One, already pre-accepted before merge: AC3's acceptance criterion originally specified "the correlating feature slug does not exist in that repo's `pipeline-state.json` at all" — the actual implementation performs a repo-identity comparison (`journey.repoOwner`/`journey.repoName` vs. this CLI's own `GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME`) instead, since checking a live remote repo's `pipeline-state.json` content from within the sync call was not a reachable design within this story's architecture (no mechanism to fetch an arbitrary other repo's file mid-request). Logged in `decisions.md` at build time, and `css-s1-test-plan.md`/`css-s1-verification.md` were both corrected to describe the implemented mechanism rather than the stale DoR wording, before `/branch-complete`.

No out-of-scope item from the story (other gate types, reverse-direction sync, conflict detection) was implemented. Confirmed via `gh pr view 1016 --json files` (17 files, all within the story's named touchpoints: `src/sync/journey-sync-client.js`, `src/web-ui/routes/internal-sync.js`, `src/enforcement/cli-gate-advance.js`, `bin/skills`, test files, and artefacts).

---

## Test Plan Coverage

**Tests from plan implemented:** 17 / 17
**Tests passing in CI:** 17 / 17

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 unit + integration (3 tests) | ✅ | ✅ | |
| AC2 unit + integration (2 tests) | ✅ | ✅ | |
| AC3 unit (1 test) | ✅ | ✅ | Tests the implemented repo-identity mechanism, not the stale DoR wording |
| AC4 unit (1 test) | ✅ | ✅ | |
| AC5 unit (2 tests) | ✅ | ✅ | |
| AC6 unit (1 test) | ✅ | ✅ | |
| Remaining 7 tests (D37 wiring, error-handling, behavioural-correctness per CLAUDE.md's injectable adapter rule) | ✅ | ✅ | Added during build (Task 6/7 code-quality review) beyond the original test plan's 6 AC-mapped tests — missing NODE_ENV guard and missing error-handling/test-coverage for the core safety guarantee were both found and fixed before task completion |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance (bounded, small delay; must not turn sub-second `gate-advance` into multi-second) | ✅ | Live-verified: 337ms + 50ms round-trip, well within budget |
| Security (shared service-level credential, never hardcoded, no credential exposed in logs) | ✅ | `INTERNAL_SYNC_SECRET` generated as a throwaway test value and set via `flyctl secrets set` by the operator directly — never entered by the agent. `_secretMatches` uses constant-time comparison and fails closed on an unconfigured secret. Live-verified the credential gate is enforced (correct secret required for the real round-trip to succeed) |
| Accessibility (not applicable — no UI surface change) | ✅ N/A | |
| Audit (every sync attempt, success or mismatch, logged) | ✅ | Code review confirms `journey-sync-mismatch` logging path exists for AC3; not independently re-verified live post-merge (unit-test evidence only for the mismatch-logging path itself) |

---

## Metric Signal

**Measurement-ready gate:** Not yet — this is the first of 4 stories (css-s1-s4) in the `css-e1-cross-surface-state-sync` epic; css-s2/css-s3/css-s4 remain at `definition-of-ready`, not yet dispatched.

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| m1: Automatic cross-surface agreement rate | ✅ (baseline: 0%) | Not yet — meaningful measurement requires the full walking-skeleton to be exercised under real multi-surface usage over time, not a single story's merge | `signal: not-yet-measured`, consistent with this story being the walking-skeleton proof, not the full mechanism |
| m2: Conflict-resolution correctness | ✅ (baseline: N/A — no mechanism exists today) | Not yet — conflict detection is css-s3's scope, not built yet | `signal: not-yet-measured` |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

One deviation recorded (AC3's scope reinterpretation — pre-accepted in `decisions.md` before merge, not a gap discovered after the fact). No ACs unsatisfied, no test gaps, no unauthorized scope expansion.

**Follow-up actions:**
1. Owner: Hamish King — Dispatch css-s2, css-s3, css-s4 (all DoR-signed-off, epic-nested, currently blocking the epic's `status: "complete"` transition and the metrics' first real signal).
2. Owner: Hamish King — Consider a targeted live re-check of AC3's mismatch-logging path and AC5's credential-rejection path against the real deployed endpoint (currently unit-evidence only) — lower priority, since both are already covered by passing unit tests and this story's core mechanism (AC1) is the one that was live-verified.

---

## DoD Observations

1. This story's live verification also surfaced a genuine, separate, previously-undiscovered production bug (dashboard "Start →" button returning an unconditional 403 Forbidden) — root-caused via real `fly logs` and fixed as its own short-track story, `dssc-s1` (PR #1017, merged, DoD complete same day). Without attempting this live verification rather than trusting the automated-test-only signal, that bug would likely have remained live and undiscovered.
2. `css-s1` is epic-nested (`css-e1-cross-surface-state-sync`). Per CLAUDE.md's epic-nested story state bookkeeping rule, this DoD's state write was applied directly on `master` after confirming the real merge via `gh pr view`, not inferred from any branch-local `pipeline-state.json` state — the story's `prStatus` field was found stale (`"draft"`) at DoD time despite the PR having actually merged, consistent with the documented timing risk for epic-nested stories.
3. This story establishes the walking-skeleton mechanism only (one gate type, one direction). The epic's two metrics (m1, m2) cannot show a meaningful signal until css-s2/css-s3/css-s4 are also complete — `not-yet-measured` here is expected, not a gap.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Automatically reflect a CLI-side gate advance on the corresponding web-UI journey (css-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
