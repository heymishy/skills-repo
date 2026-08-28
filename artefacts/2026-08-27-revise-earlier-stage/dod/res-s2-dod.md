# Definition of Done: Overwrite a reopened stage's artefact in place on revision

**PR:** https://github.com/heymishy/skills-repo/pull/780 | **Merged:** 2026-08-28 (commit `e207b412`)
**Story:** `artefacts/2026-08-27-revise-earlier-stage/stories/res-s2-overwrite-artefact-in-place-on-revision.md`
**Test plan:** `artefacts/2026-08-27-revise-earlier-stage/test-plans/res-s2-test-plan.md`
**DoR artefact:** `artefacts/2026-08-27-revise-earlier-stage/dor/res-s2-dor.md`
**Assessed by:** Claude (agent)
**Date:** 2026-08-28

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Revision turn overwrites the file at the stage's existing artefact path; no new file or dated copy created | Automated tests (`AC1: the file is overwritten in place with the new content`, `AC1: no second/dated file was created`, `AC1: the artefact file was still overwritten with the revision`) | None |
| AC2 | ✅ | Any downstream read immediately after the turn returns the new content, not stale content — disk write completes before handoff (ADR-023 write-then-read sequence) | Automated tests (`AC2: downstream read immediately after the turn returns the new content`, `AC2: downstream read does not return the pre-revision content`) | None |
| AC3 | ✅ | A reopen with no revision turn leaves the artefact byte-identical (mtime unchanged, no write attempted); a revision does not push a duplicate `completedStages` entry | Automated tests (`AC3: artefact content byte-identical after a no-revision turn`, `AC3: file mtime unchanged`, `AC1/AC3: exactly one completedStages entry for discovery after a revision`) | None |
| AC4 | ✅ | A write failure surfaces an explicit SSE error to the operator and ends the stream — not silently swallowed to console only | Automated tests (`AC4: write failure surfaces an SSE error event`, `AC4: stream ends after the error`) | None |
| AC5 | ✅ | Pre-revision content is captured into memory before the overwrite executes and handed forward to the materiality-check hook within the same turn-handling flow — not re-read from disk afterward | Automated tests (`AC5: hook does not fire on a stage's first-ever completion`, `AC5: hook fires exactly once on a revision`, `AC5: hook receives the correct pre-revision content`, `AC5: hook receives the correct post-revision content`, `AC5: hook receives journeyId and skillName`) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None recorded — all 5 ACs match their story wording exactly, including AC5's amendment already reflected in the story text at DoR (not a post-merge change).

---

## Scope Deviations

None. Diff confirmed to touch exactly `src/web-ui/routes/skills.js`, one new test file, the implementation plan, and the DoR-contract/decisions/capture-log artefacts corrected during `/implementation-plan` — matching the corrected DoR contract's touch points (see decisions.md's 2026-08-28 ARCH entry, `journey.js` → `skills.js` correction). No versioning, diffing, or "preserve the pre-revision copy" mechanism was introduced (explicitly out of scope per discovery's clarify Q3); materiality judgment itself was not implemented (correctly deferred to res-s3 — this story only captures and hands forward the pre/post content).

---

## Test Plan Coverage

**Tests from plan implemented:** 19 tests across 2 tasks (matches the test plan's count).
**Tests passing in CI:** 19/19 — confirmed via the merged PR's "Lint, typecheck, test, build" check (SUCCESS) and independently re-run directly against the merged `master` HEAD during this DoD check (19 passed, 0 failed).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| Task 1 — path traversal guard, write-failure surfacing, pre-revision capture (10 tests) | ✅ | ✅ | The traversal sub-test was rewritten mid-implementation after a code-quality reviewer proved the original was vacuous (Windows `EPERM` coincidence, not the guard, was making it pass) — see DoD Observation #1 |
| Task 2 — duplicate-completion guard and materiality-check hook (9 tests) | ✅ | ✅ | Includes the `_existingStageEntry` duplicate-guard test, discovered as a real pre-existing bug during implementation planning, not originally anticipated at story-write time |

**Gaps (tests not implemented):** None. Full suite: 563/563 passing (`run-all-tests`, confirmed during `/verify-completion`). Route/handler E2E coverage check (mandatory per `/verify-completion`): 3 matched specs — 2 local/mocked run fresh (5/5 passing), 1 `@real-staging` (`a4-ideate-session-resume.spec.js`) could not be verified locally, flagged as residual risk at `/verify-completion` — now confirmed passing on the merged commit's real CI run (`Scenario A E2E (staging)` and `Scenario B E2E (staging)` both SUCCESS). The residual risk is now closed.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — path traversal guard on artefact writes | ✅ | `pathTraversalGuardBlocksResolvedPathOutsideRepoRoot`-equivalent tests passing (`Path traversal: the specific traversal-rejection event fires`, 4 tests total); resolved path validated via `path.resolve` + `startsWith(repoRoot + path.sep)` before any write; raw path never logged on rejection (CLAUDE.md rule), only `sessionId` |
| Security — audit logging (artefact-overwrite portion) | ⚠️ | The pre-existing `artefact_auto_amended`/`artefact_auto_saved` log fires on every overwrite with `sessionId` and `artefactPath` (which embeds the stage name and feature slug as part of the path string). It does **not** emit `journeyId` as a discrete field, and carries no explicit ISO timestamp field in the JSON payload (unlike the structured pino-style events elsewhere in this file). No dedicated test asserts on this event's shape for the overwrite path specifically — deviation from the NFR profile's literal wording ("logged with journeyId, stage name, and timestamp"), though the practical audit trail is not absent, just less structured than specified. See DoD Observation #2. |
| Performance | N/A | No performance NFR assigned to res-s2 in the feature's NFR profile (only res-s1 and res-s3 have performance rows) |
| Data classification (Internal) | ✅ N/A | No new data classification introduced by this story |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Earlier-stage revisions completed without a journey restart | ✅ (0% — capability didn't exist) | Not yet — this story completes the reopen→revise→persist mechanism, but res-s4 (operator-facing "act on the revision" flow) has not merged yet, so end-to-end usage isn't observable as a real operator action | Mechanically, an operator can now reopen a stage (res-s1) and have a revision persist correctly (res-s2) — the technical loop closes here, but M1 tracks *usage*, which needs the full feature live |
| M3 — Recurrence of the original blocking pain | ✅ (2 known occurrences) | Not yet — meaningful tracking requires the full feature (all 4 stories) live | No new occurrence reported since res-s1 or res-s2 merged — consistent with res-s1's DoD note, still a preliminary, not-yet-statistically-meaningful signal |

**Measurement-ready gate:** Not yet, for both metrics — recorded per the skill's `not-yet-measured` path rather than asking for a premature signal value. (M2 does not list res-s2 in its `contributingStories` — not assessed here.)

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. Tighten `artefact_auto_amended`/`artefact_auto_saved` (and the sibling `materiality_check_hook_failed` log) to emit `journeyId` and an explicit ISO timestamp field directly, closing the audit-logging NFR gap noted above. Owner: next available implementation slot, not blocking res-s3/res-s4.
2. Reconsider whether the single bundled `NFR-audit-logging-reopen-flow` guardrail ID (covering reopen + overwrite + materiality-suggestion + flag set/cleared as one requirement) should be split into per-sub-flow guardrail entries — only 1 of the 4 sub-flows it describes has ever been directly test-evidenced. Candidate for `/improve`.

---

## DoD Observations

1. **A code-quality reviewer's mutation-testing methodology (disable the guard, confirm the test then fails) caught a genuinely vacuous security test, and I independently repeated the exact same methodology before trusting the fix.** The original path-traversal test's escape path resolved under `C:\Users\` on this Windows machine, which a non-admin process can't write into — so the test's three assertions passed because of a generic `EPERM` write failure, not because the guard's rejection branch ever ran. Proven by setting the guard's `if` condition to `if (false && ...)` and observing the same test still pass. Fixed using `fs.mkdtempSync()` for a genuinely writable escape target and asserting on the specific `artefact_path_traversal_rejected` log event rather than a generic error shape. **Already captured to `workspace/capture-log.md`** as a general pattern (2026-08-28, subagent-execution phase) — this is not a new finding, just confirming it held through to merge and CI.

2. **The audit-logging NFR was marked `met` at res-s1's DoD based on a test that only covers the *reopen* sub-flow, but the guardrail's own label bundles four distinct sub-flows (reopen, overwrite, materiality suggestion, flag set/cleared) under one ID.** Investigating res-s2's own "artefact overwrite" logging for this DoD found no dedicated test and a log event missing `journeyId`/explicit timestamp fields — a genuine, previously-invisible gap that the single bundled guardrail ID's premature "met" status was masking for the other 3 sub-flows. Not fixed here (out of scope for a post-merge DoD check to also patch production logging) — recorded as Follow-up action #1/#2 above. **Candidate for `/improve`:** guardrail entries that bundle multiple genuinely-distinct sub-behaviours under one ID risk exactly this kind of premature full-coverage claim from a single sub-flow's test passing; consider requiring one guardrail ID per independently-testable sub-behaviour when an NFR profile row lists more than one flow.

3. **The `pipeline-state.json` merge-conflict pattern recurred a second time in this session** (res-s1's PR #779 hit it first). Both times the conflict was purely on `pipeline-state.json` (plus, this time, an additive conflict on `workspace/capture-log.md` from two concurrent append-only writes) and resolved cleanly by taking the freshest `origin/master` copy and re-applying only this branch's own story-scoped field changes. Captured to `workspace/capture-log.md` as a pattern signal (not a new discovery, but a second data point suggesting this is close to expected for any PR left open during a busy multi-story session) — flagged there for a possible `/improve` look at a lower-conflict update strategy for this file.

4. **The temp conflict-resolution worktree cleaned up successfully this time** (`git worktree remove --force` succeeded without the intermittent Windows "Permission denied" seen elsewhere this session) — no action needed, noted only because the prior occurrences were significant enough to have been documented as a standing quirk.
