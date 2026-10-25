# Definition of Done: Automatically reflect a web-UI journey stage completion in pipeline-state.json

**PR:** https://github.com/heymishy/skills-repo/pull/1018 | **Merged:** 2026-10-25
**Story:** artefacts/2026-08-07-cross-surface-state-sync/stories/css-s2-web-ui-journey-reflects-on-pipeline-state.md
**Test plan:** artefacts/2026-08-07-cross-surface-state-sync/test-plans/css-s2-test-plan.md
**DoR artefact:** artefacts/2026-08-07-cross-surface-state-sync/dor/css-s2-dor.md
**Assessed by:** Claude (session)
**Date:** 2026-10-25

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Already-shipped mechanism, confirmed at pre-code discovery (`decisions.md`, "css-s2, pre-code discovery"): `tests/check-wsd-s2-github-pipeline-state-writer.js` (T1-T10, asserts the authenticated user's own token is used as the `Authorization` header and the commit author/committer are resolved from `/user`) and `tests/check-wsd-s4-pipeline-state-owner-repo-resolution.js`, both passing in CI. The test plan itself names "real GitHub Contents API commit-author verification" as an explicit, never-closed gap (its own Coverage gaps table) — a manual post-merge staging scenario was the designated gap-closer, but `css-s2-verification.md` records this scenario as marked "Pass (automated)" on automated test evidence only, not a real live walkthrough | `integration-real-code` (mocked HTTP transport, real writer/token-selection code) | None in behaviour. Verification-strength gap: the real-world claim ("resulting commit's author in GitHub history is that authenticated user") has never been checked against a real GitHub commit — see Follow-up Actions |
| AC2 | ✅ | `tests/check-css-s2-pipeline-state-write-latency-nfr.js` (2 tests), passing in CI — simulated `das-s1` baseline latency (200ms) vs. this story's added write latency, asserting ≤2x bound | `unit` (simulated timing, not measured against real `das-s1` production latency) | None in behaviour. The test plan's own Gaps table flags `das-s1`'s real production latency as never independently measured — this NFR test's 2x bound is relative to a simulated baseline, not a live-measured one |
| AC3 | ✅ | `tests/check-css-s2-sync-log.js` (11 tests) + `tests/check-css-s2-gate-confirm-sync-log-integration.js` (1 test, `stageCompletionRequest_succeedsForOperator_andLogsGap_whenPipelineStateWriteFails`), all passing in CI. Reinforced by css-s4's later correctness fix: the gap record now also stores `storyId`/`stateUpdate` (not just `gateName`) so a subsequent reconciliation attempt replays the SAME failed write, not an unrelated one — see css-s4's own DoD | `integration-real-code` (real `sync-log.js` logic against a fake pool, real route-handler call path) | None |
| AC4 | ⚠️ (reinterpreted) | AC4 as literally written ("no matching feature slug → no write attempted, not an error") was **not implemented as specified** — `decisions.md`'s "css-s2, pre-code discovery" entry documents that this exact behaviour was already superseded by `pipeline-state-github-writer.js`'s own already-shipped, already-relied-upon auto-create behaviour (a feature slug with no existing entry gets a new story record created rather than silently skipped, with a loud `WARNING` log for visibility — see `acv-s1`). Implementing AC4 literally would have reintroduced a silent-skip behaviour this codebase deliberately moved away from. Pre-accepted as a documented scope reinterpretation at pre-code discovery, not a post-hoc gap found at DoD time | `integration-real-code` (existing writer tests covering the auto-create path) | **Deviation:** AC4's literal acceptance criterion is not what ships. The real, shipped behaviour (auto-create + loud warning) is arguably safer than the AC's own "silently do nothing" wording — documented in `decisions.md` before any code was written for this story |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. One recorded (AC4's scope reinterpretation, pre-accepted before merge).

---

## Scope Deviations

One, already pre-accepted before merge: AC4's "no matching feature slug → silently skip" was superseded by the already-shipped auto-create-with-warning behaviour in `pipeline-state-github-writer.js` (built by earlier, unrelated stories `wsd-s1`/`wsd-s2`/`wsd-s4`/`owle.6`/`dcuf-s1`/`acdg-s1`/`acdg-s2` before this story's own code was ever written). Logged in `decisions.md` at pre-code discovery, and `css-s2-test-plan.md` marks AC4 as "Superseded" rather than carrying a stale, never-implemented test.

No out-of-scope item from the story (background/queued retry beyond the request's lifetime, conflict detection, other gate types) was implemented. Confirmed via `git diff 683d245a811f2122912879d006d08c9f831cab2d..HEAD` scoping to this story's own named touchpoints across its build: `src/web-ui/adapters/sync-log.js`, `src/web-ui/server.js` (migration), `src/web-ui/routes/journey.js` (catch-block wiring only), and test/artefact files.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4 new tests (AC1/AC4 required no new tests — already covered or superseded, per the test plan's own revision)
**Tests passing in CI:** 14 / 14 (11 + 1 + 2 across this story's 3 dedicated test files)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (already covered, no new test) | ✅ | ✅ | `check-wsd-s2-github-pipeline-state-writer.js`, `check-wsd-s4-pipeline-state-owner-repo-resolution.js` — pre-existing |
| AC2 NFR latency test | ✅ | ✅ | 2 tests |
| AC3 unit (gap logging, no-credential-shape) | ✅ | ✅ | 11 tests (grew from the test plan's own originally-estimated 2, since css-s4's later correctness fix added `storyId`/`stateUpdate` coverage to the same file) |
| AC3 integration (gate-confirm wiring) | ✅ | ✅ | 1 test |
| AC4 (superseded, no new test) | — | — | See deviation above |

**Gaps (tests not implemented):** None against the revised test plan. The original, pre-revision test plan's AC4 tests were never written — correctly, since AC4 itself was superseded before coding started.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance (≤2x `das-s1`'s own latency) | ✅ | `check-css-s2-pipeline-state-write-latency-nfr.js`, simulated-baseline evidence (see AC2 verification-strength note above) |
| Security — ADR-020 authentication (authenticated user's own token, never a service account) | ✅ | Code path confirmed to use `req.session.accessToken` via the already-shipped `pipeline-state-github-writer.js`; not independently re-verified against a real GitHub commit in this story's own build (same gap as AC1) |
| Security — no credential storage for retry | ✅ | `sync-log.js`'s `logReconciliationGap` signature never accepts a token parameter (confirmed by reading the signature — the same structural proof pattern css-s1's own DoD used) |
| Security — tenant scoping (ADR-025) | ✅ N/A for this story's own write path | `sync_log` rows carry `tenant_id` as a column; no tenant-scoped read/write logic was added or changed by this story beyond that column's presence |
| Audit (every sync attempt logged) | ✅ | `sync_log` gap-entry logging confirmed by AC3's own tests; code review confirms the logging call site is correctly placed in `journey.js`'s existing `pipeline_state_write_failed` catch block |
| Accessibility | ✅ N/A | No new UI surface — confirmed, this story is a backend side-effect on an existing action |

---

## Metric Signal

**Measurement-ready gate:** Not yet — css-s3 and css-s4 (the remaining two stories in this epic) were not yet DoD-complete at the time css-s2's own code was written; real multi-surface usage data does not yet exist either way.

| Metric | Signal | Evidence | Date measured |
|--------|--------|----------|----------------|
| m1: Automatic cross-surface agreement rate | not-yet-measured | css-s2 completes the reverse-direction mechanism (the harder of the two directions, per the story's own Benefit Linkage) — contributing, but meaningful agreement-rate measurement still requires css-s3 (conflict handling) and css-s4 (full vocabulary) to also ship, plus real usage over time | null |
| m2: Conflict-resolution correctness | not-yet-measured | css-s2 does not implement conflict detection — that is css-s3's scope. Not a contributing story for m2 | null |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

One deviation recorded (AC4's scope reinterpretation, pre-accepted in `decisions.md` before coding started — not a gap discovered after the fact). No ACs unsatisfied, no test gaps against the revised plan, no unauthorized scope expansion. Two verification-strength gaps noted (AC1/AC2's real-world effects — a real GitHub commit's author, and real `das-s1` production latency — are unit/integration-evidenced only, never independently live-checked against production).

**Follow-up actions:**
1. Owner: Hamish King — Perform a live check of AC1's real-world claim: complete a stage via a real authenticated wuce-staging session for a repo-connected feature, then confirm the resulting `pipeline-state.json` commit's author in real GitHub history matches the authenticated user, not a service account. (Same class of gap css-s1's own DoD found and closed for its own AC1 — doing so there also surfaced a real, unrelated production bug.)
2. Owner: Hamish King — Re-measure AC2's 2x latency bound against `das-s1`'s own real production latency once available, rather than the simulated 200ms baseline used in the automated NFR test.

---

## DoD Observations

1. `css-s2` is epic-nested (`css-e1-cross-surface-state-sync`). Per CLAUDE.md's epic-nested story state bookkeeping rule, this DoD's state write is applied directly on `master` after confirming the real merge via `gh pr view` — not inferred from branch-local `pipeline-state.json` state, which was found stale (`prStatus: "draft"`) at merge time for all of css-s2/css-s3/css-s4 due to a squash-merge complication during the actual merge sequence (see `decisions.md` for the full account: PR #1019 was auto-closed when its base branch was deleted on #1018's squash-merge, and had to be replaced by #1021).
2. Significant pre-code discovery work found most of AC1's mechanism had already shipped under unrelated earlier stories (`wsd-s1`/`wsd-s2`/`wsd-s4`/`owle.6`/`dcuf-s1`/`acdg-s1`/`acdg-s2`) between this story's original August authoring and its October build — the test plan and DoR contract were both corrected before any new code was written, avoiding a duplicate/conflicting parallel write mechanism.
3. This story, together with css-s1, now gives the epic real bidirectional coverage for the first time — but per the Metric Signal section above, `not-yet-measured` remains correct until css-s3/css-s4 also ship and real usage accumulates.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Automatically reflect a web-UI journey stage completion in pipeline-state.json (css-s2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
