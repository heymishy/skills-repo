# Contract Proposal — Extend automatic sync to the full gate/stage vocabulary and add the reconciliation safety net (css-s4)

**REVISED 2026-10-25** — see `decisions.md`'s css-s4 ARCH entries. Two corrections from the original (August) contract, matching the same pattern already found in css-s2/css-s3: (1) `pipeline-state-commit-writer.js` was never built; css-s2's real direction is already generic (any `stage` value flows through `pipeline-state-github-writer.js`'s `STORY_LEVEL_KEYS`/`applyAdvance` uniformly — no per-gate special-casing exists to generalise). (2) `gate-map.js`'s 7 gate names do NOT map 1:1 onto the web journey's own 8-value `STAGE_SEQUENCE` — 2 gates (`branch-complete`, `definition-of-done`) are CLI-only inner-loop milestones with no journey-trackable session at all. "Full vocabulary coverage" (AC1) means the mechanism correctly handles all 7, including correctly no-opping the 2 journey-unrepresentable ones (matching css-s1's own existing "no journey connected → no-op" precedent), not forcing all 7 into a journey model that structurally cannot represent 2 of them.

**What will be built:**
- `src/sync/journey-sync-client.js` (css-s1's direction) generalised: remove the single-`SYNC_GATE` hardcoding, accept any of the 7 `gate-map.js` gates, map each to its corresponding journey stage (or `null`) via a new `GATE_TO_JOURNEY_STAGE` map whose keys are derived from `gate-map.js`'s own export (not re-typed). For the 5 journey-representable gates, this now ALSO reuses css-s3's `detectConflict`/`resolveConflict` for real (a genuine conflict is reachable here once multiple distinct gate values are in play — the exact scenario css-s3's own "Revisit trigger" named).
- `src/web-ui/adapters/pipeline-state-github-writer.js` (css-s2's direction): confirmed ALREADY generic — no implementation change needed; a new test proves full-vocabulary coverage rather than adding new logic.
- `sync_log` gains `resolved_at TIMESTAMPTZ NULL` (new `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, following this file's own established incremental-column pattern) to track reconciliation status.
- `src/sync/reconciliation.js` (new) — `findOpenGap(featureSlug)` and `reconcile(featureSlug, storyId, context)`, called opportunistically from `journey.js`'s `handlePostGateConfirm` (which already resolves a live `_pipelineStateContext` for the feature on every request) — not a new polling/background process.
- A small source-level structural check (new `scripts/check-*.js`) asserting `GATE_TO_JOURNEY_STAGE`'s keys are derived from `gate-map.js`, not a second hardcoded array.

**What will NOT be built:**
- Real-time push notifications for reconciliation gaps.
- Any change to `gate-map.js`'s own 7 values or structure.
- Extending `STAGE_SEQUENCE` to cover the 2 journey-unrepresentable gates — out of scope, deferred (see decisions.md).

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `syncMechanism_appliesUniformly_acrossAllSevenGateValues`, `fullVocabularyCoverage_noGateTypeLeftUnsynced` | unit + integration |
| AC2 | `reconciliation_reAttemptsLoggedGap_onSubsequentLiveRequest`, `reconciliation_neverReusesOriginalFailedAttemptsToken` | unit |
| AC3 | Manual scenario (real 4-week measurement) — see verification script | Manual |

**Assumptions:**
- "A subsequent live, authenticated request touching that same feature" (AC2) means any request already routed through `handlePostGateConfirm` — not a new polling mechanism.
- `gate-map.js`'s own export is imported directly (per this story's own NFR against duplicating the fixed 7-value list) for both the parameterized test AND `GATE_TO_JOURNEY_STAGE`'s own key derivation.

**Estimated touch points:**
Files: `src/sync/journey-sync-client.js` (css-s1, generalise + real conflict detection for the 5 representable gates), `src/web-ui/server.js` (sync_log's new `resolved_at` column), `src/sync/reconciliation.js` (new), `src/web-ui/routes/journey.js` (reconciliation hook), `scripts/check-sync-mechanism-is-parameterized.js` (new, structural NFR check)
Services: None new
APIs: None new
