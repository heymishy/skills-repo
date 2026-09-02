# Definition of Done: acdg-s2 — Add a Distinguishable Durability Signal for Stage-Completion Commits

**PR:** https://github.com/heymishy/skills-repo/pull/814 | **Merged:** 2026-09-02
**Story:** artefacts/2026-09-01-artefact-commit-durability-gap/stories/acdg-s2.md
**Test plan:** artefacts/2026-09-01-artefact-commit-durability-gap/test-plans/acdg-s2-test-plan.md
**DoR artefact:** artefacts/2026-09-01-artefact-commit-durability-gap/dor/acdg-s2-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-02

---

## AC Coverage

AC1 (succeeded event), AC2 (failed event, both real exit points), AC3 (skipped event), AC4 (structured-JSON format) — see `stories/acdg-s2.md` for full text.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Test passing, confirms `artefact_commit_succeeded` fires with base fields on a successful commit | `tests/check-acdg-s2-durability-signal.js` | None |
| AC2 | ✅ | 2 tests passing, confirming `artefact_commit_failed` fires with `reason` at BOTH real failure exit points in the shipped code (the original `commitArtefact`-throw path, and `acdg-s1`'s own resolution-failure path) — a genuine implementation finding, not assumed from the story text alone | `tests/check-acdg-s2-durability-signal.js` | None |
| AC3 | ✅ | Test passing, confirms `artefact_commit_skipped` fires with `reason: "no connected repo"` for the genuinely-unlinked case | `tests/check-acdg-s2-durability-signal.js` | None |
| AC4 | ✅ | Test passing, confirms all 3 event types parse as valid JSON immediately after the `[cross-channel] ` prefix | `tests/check-acdg-s2-durability-signal.js` | None |

---

## Scope Deviations

**No story-level scope deviation** — unlike `acdg-s1`, this story's ACs held up cleanly against the real shipped code from `/definition` through implementation, with no return-to-definition cycle needed.

**One implementation-time clarification, disclosed rather than silently assumed:** the real `journey.js` code (as merged in `acdg-s1`) has two distinct exit points that both represent a commit "failure" — the pre-existing `commitArtefact`-throw path and `acdg-s1`'s own new resolution-failure-with-`productId`-set path. Both are wired to `artefact_commit_failed` and both are separately tested, since they are different code branches even though they map to the same conceptual outcome AC2 describes. The test plan was updated in the same PR to reflect this (AC2: 1 unit test → 2).

**Two test-harness bugs of my own found and fixed before trusting the test results, disclosed in the PR:**
1. An async race in the `withCapturedLogs` helper — its `finally` block (restoring `console.log`) ran immediately after an async function call returned its pending promise, not after the promise resolved, so captured logs were empty. Fixed by properly `await`-ing inside the `try` block.
2. An over-broad PostHog monkey-patch in the NFR test — making `posthogServer.capture` throw unconditionally also broke a pre-existing, unrelated `stage_completed` capture call elsewhere in the same handler (not wrapped in try/catch, out of this story's own scope to fix). Narrowed the monkey-patch to only intercept this story's own `artefact_commit_*` event types.

Neither bug reflects an implementation defect — both were caught and fixed in the test file itself before any test result was trusted, following this session's own "verify, don't assume" discipline.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 (test plan Revision reflecting the real 2-exit-point AC2 shape: 5 unit + 1 integration + 2 NFR)
**Tests passing in CI:** 8/8 local + full local suite (594 files, 1 pre-existing known flake — `check-p3.5-validate-trace.js`, confirmed unrelated) + sibling regression (`das-s1`'s own 11 tests, `acdg-s1`'s own 6 tests, `ep1-s1`–`ep1-s6`'s own 63 tests, all re-run unmodified — 80 total) + CI's assurance gate, traceability validation, watermark gate, cross-tenant isolation, lint/typecheck/test/build, Playwright smoke, and both staging E2E scenarios — all passing, no re-run needed

| Test area | Implemented | Passing | Notes |
|-----------|-------------|---------|-------|
| AC1 — succeeded event | ✅ | ✅ | |
| AC2 — failed event, commit-failure exit point | ✅ | ✅ | |
| AC2 — failed event, resolution-failure exit point | ✅ | ✅ | Added beyond original 1-test plan — a real second code branch |
| AC3 — skipped event | ✅ | ✅ | |
| AC4 — structured JSON | ✅ | ✅ | |
| Integration — exactly one durability event per completion | ✅ | ✅ | |
| NFR — PostHog failure doesn't block | ✅ | ✅ | Narrowly scoped to this story's own event types after the harness-bug fix |
| NFR — no credentials/full content in logs | ✅ | ✅ | Asserts an explicit allowed-keys list, not just absence of specific strings |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Fire-and-forget — no blocking/latency | ✅ | NFR test confirms a PostHog throw for this story's own event types does not propagate or block the response |
| No credentials or full artefact content in logs | ✅ | NFR test asserts an explicit allowed-keys list on the captured log line's JSON |
| All events include featureSlug/stage/eventType/timestamp | ✅ | Every AC1–AC4 test asserts base fields present |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 2 — Distinguishable Signal Coverage | ✅ (mechanism now shipped) | Not yet measured in production — infrastructure now exists; first real signal requires a production stage completion of each of the 3 outcome types | Signal: not-yet-measured |
| Metric 3 — Manual-Audit Elimination | ✅ (mechanism now shipped) | Not yet measured — requires a real post-deploy case cross-checked manually against GitHub once, per the benefit-metric's own minimum validation signal | Signal: not-yet-measured |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. Run `/metric-review` (or equivalent) once real production traffic exercises all 3 outcome types, to move Metrics 2 and 3 off `not-yet-measured`. Per the benefit-metric's own minimum validation signal, at least one real post-deploy case should be manually cross-checked against GitHub once to establish trust in the signal.
2. This is the last story in `2026-09-01-artefact-commit-durability-gap` — the epic's own status (`artefacts/.../epics/stage-completion-artefact-durability.md`, `pipeline-state.json`'s `epics[0].status`) should be moved to `complete` now that both stories have `dodStatus: complete`.
3. Consider whether the deferred journeys-table/journeyStore sync investigation (flagged in `acdg-s1`'s own DoD, follow-up 3) warrants its own dedicated discovery.

---

## DoD Observations

1. This story is a clean counter-example to `acdg-s1`'s own mid-implementation revision — confirms that not every story in a fast-moving feature needs a scope correction, even when a sibling story in the same feature did (twice).
2. The two test-harness bugs found here are worth a general pattern note: async log-capture helpers copied between test files (this one was adapted from `ep1-s6`'s own synchronous-looking pattern) need explicit verification that `finally`/cleanup actually runs after — not just triggered by — the async work under test. A silent empty-capture failure mode (all assertions fail with no line found) is a weak signal that could be mistaken for "the feature doesn't work" rather than "the test harness is broken," if not investigated carefully.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for acdg-s2 — Add a Distinguishable
Durability Signal for Stage-Completion Commits, the LAST story in the
2026-09-01-artefact-commit-durability-gap feature.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is the AC2 two-exit-point clarification (found during implementation, not assumed at /definition) clearly distinguished from a scope deviation?
3. Are the two test-harness bugs disclosed clearly enough to distinguish "my test was broken" from "the implementation was broken"?
4. Does the metric signal section correctly reflect that measurement INFRASTRUCTURE now exists, without falsely claiming real signal has been collected yet?
5. Is the outcome verdict (COMPLETE) correct given zero disclosed AC gaps?
6. Should the epic's own status field be moved to complete as part of this DoD's own state-write, or held for a separate explicit operator decision?
Report findings as HIGH / MEDIUM / LOW.
```
