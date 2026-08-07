# Contract Proposal — Extend automatic sync to the full gate/stage vocabulary and add the reconciliation safety net (css-s4)

**What will be built:**
- Generalisation of css-s1's CLI-side sync and css-s2's web-UI-side write path to iterate over all 7 values exported by `src/enforcement/gate-map.js`'s `GATE_MAP`, rather than special-casing `discovery-approved` only.
- `src/sync/reconciliation.js` (new) — a function called opportunistically from any subsequent authenticated web-UI request touching a feature with an open `sync_log` gap entry; re-attempts the `pipeline-state.json` write using that new request's own live session token, then marks the gap resolved (or logs a fresh gap if it fails again).
- A small source-level structural check (new `scripts/check-*.js`, matching this repo's own convention) asserting the sync mechanism is one parameterized implementation, not 7 gate-specific copies.

**What will NOT be built:**
- Real-time push notifications for reconciliation gaps.
- Any change to `gate-map.js`'s own 7 values or structure.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `syncMechanism_appliesUniformly_acrossAllSevenGateValues`, `fullVocabularyCoverage_noGateTypeLeftUnsynced` | unit + integration |
| AC2 | `reconciliation_reAttemptsLoggedGap_onSubsequentLiveRequest`, `reconciliation_neverReusesOriginalFailedAttemptsToken` | unit |
| AC3 | Manual scenario (real 4-week measurement) — see verification script | Manual |

**Assumptions:**
- "A subsequent live, authenticated request touching that same feature" (AC2) means any request already routed through `handlePostGateConfirm` or an equivalent authenticated journey-touching handler for that feature — not a new polling mechanism. The reconciliation check is a lightweight lookup ("does this feature have an open gap?") added to that existing request path, not a separate background process.
- `gate-map.js`'s `GATE_MAP` export is imported directly by the parameterized test (per the test plan's own AC1 data requirement) — the coding agent must not re-type the 7 values as a second array anywhere in the sync mechanism or its tests, per this story's own NFR and this repo's own anti-pattern warning against duplicating fixed sequences.

**Estimated touch points:**
Files: `src/sync/journey-sync-client.js` (css-s1, generalise from single-gate to all 7), `src/web-ui/adapters/pipeline-state-commit-writer.js` (css-s2, same generalisation), `src/web-ui/routes/journey.js` (add the reconciliation-check call to `handlePostGateConfirm` or equivalent), `src/sync/reconciliation.js` (new), a new `scripts/check-sync-mechanism-is-parameterized.js` (structural NFR check)
Services: None new
APIs: None new
