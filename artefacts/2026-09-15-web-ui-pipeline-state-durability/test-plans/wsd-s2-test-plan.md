# Test Plan: GitHub-API-backed pipeline-state writer, wired by environment, with failure visibility (wsd-s2)

**Story:** artefacts/2026-09-15-web-ui-pipeline-state-durability/stories/wsd-s2.md
**Track:** Standard-track

---

## Test Cases

New test file `tests/check-wsd-s2-github-pipeline-state-writer.js`, mocking `fetch` directly (matching `check-s6.1`/`check-pla-s2`'s established `https.request`-mocking convention, adapted for `fetch` since `artefact-commit-writer.js` — the pattern this module mirrors — uses `fetch`, not `https.request`, directly).

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Behavioural | Mocked GET returns a fixture state + `sha`; `pipelineStateWriter(featureSlug, storyId, stateUpdate)` is called with a realistic `stateUpdate`; captured PUT body's decoded content has the correct field changes, and the PUT's `sha` matches the mocked GET's `sha` |
| T2 | AC1 | Regression | Feature-level-only `stateUpdate` (no `storyId` fields) — only feature fields change, no phantom story record created, matching `pipeline-state-writer.js`'s existing local-fs behaviour for the same input shape |
| T3 | AC2 | Behavioural | `isRealCheckout` fixture set to `true` (simulated local `.git` present) — `server.js`'s wiring selects the EXISTING local-fs factory, not the new GitHub-API one; verified via a spy/mock on both factories confirming only the local-fs one was invoked |
| T4 | AC2 | Regression | `isRealCheckout` fixture set to `false` — the new GitHub-API factory is selected |
| T5 | AC3 | Behavioural | First call's mocked PUT succeeds (sha `abc`); second call's mocked GET returns sha `def` (simulating a concurrent write already landed) but the second call's own field update is applied against sha `def`'s content and its PUT succeeds directly — no false conflict when the writer's OWN GET already reflects the latest state |
| T6 | AC3 | Behavioural | Genuine conflict: second call's GET returns sha `def`, but its PUT is mocked to reject that exact sha with 409 (simulating a write landing between this call's GET and PUT) — the writer retries (re-GET, re-apply, re-PUT) and the retry succeeds, with the retried PUT's content reflecting a fresh GET, not stale data from the first attempt |
| T7 | AC4 | Behavioural | All 3 PUT attempts mocked to return 409 — a PostHog capture event fires identifying `featureSlug`/`storyId`/failure reason, and the existing `journey.js` `console.error` line still fires too (both present, not one replacing the other) |
| T8 | AC4 | Behavioural | Mocked GET fails with a network error (not 409) — same failure-visibility behaviour as T7 (PostHog capture fires), confirming AC4 covers non-409 failures too, not only conflict exhaustion |
| T9 | AC5 | Behavioural | `stateUpdate` contains an invalid enum value that `applyAdvance()` (wsd-s1) rejects — no PUT attempted at all (mocked `fetch` for PUT never called), and the same failure-visibility path as AC4 fires |

## Regression coverage

- `tests/check-pla-s2-posthog-wiring.js` re-run — confirms the new PostHog capture calls in this story don't disturb existing `$ai_generation`-focused assertions (different event name, same underlying capture mechanism).
- `tests/check-defs-s1-definition-artefact-splitter.js`, `tests/check-revs-s1-review-artefact-splitter.js`, `tests/check-asf-s1-splitter-parity-bugs.js` re-run — confirm this story's changes (a different adapter, `journey.js`'s existing call site untouched) don't disturb the unrelated `asf-s1` splitter fix from earlier this session.
- wsd-s1's own test suite (`check-wsd-s1-advance-core-extraction.js`) re-run — confirms `applyAdvance()`'s behaviour this story depends on is unaffected.

## Out of Scope (per story)

- Real-time alerting.
- File-size/splitting concerns.
- Any change to `journey.js`'s `stateUpdate` construction.
- Historical backfill.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
