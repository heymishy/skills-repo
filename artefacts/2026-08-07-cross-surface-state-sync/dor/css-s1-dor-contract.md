# Contract Proposal — Automatically reflect a CLI-side gate advance on the corresponding web-UI journey (css-s1)

**What will be built:**
- `src/sync/journey-sync-client.js` (new, CLI-side) — exports `resolveJourneyForFeatureSlug(featureSlug)` and `syncGateAdvanceToJourney(journey, gate)` as D37 injectable functions (`setJourneySyncClient()`/`getJourneySyncClient()`), calling a new internal HTTP endpoint on the deployed web-UI server. The stub default throws if not wired.
- A new internal endpoint (e.g. `POST /internal/journey-sync` on `src/web-ui/server.js`, or a new `src/web-ui/routes/internal-sync.js` module) — gated by a shared service-level credential (read from an environment variable, e.g. `INTERNAL_SYNC_SECRET`), backed by the existing `journeys` Postgres table. Handles both "resolve journey by feature slug" and "update completedStages" requests.
- Wiring in `src/enforcement/cli-gate-advance.js` — after a successful `discovery-approved` advance, synchronously call the new client before the command exits; log a mismatch (not a modification) when the resolved journey's repo has no matching feature slug in `pipeline-state.json`.

**What will NOT be built:**
- Any gate type other than `discovery-approved` — deferred to css-s4.
- The reverse sync direction (web-UI → pipeline-state.json) — css-s2.
- Conflict detection — css-s3.
- A public-facing or user-authenticated version of the internal endpoint — it is machine-to-machine only, gated by the shared service credential, never a per-user token.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `journeySyncClient_callsInternalEndpoint_withServiceCredential`, `syncGateAdvanceToJourney_updatesCompletedStages_forDiscoveryApprovedGate`, `gateAdvanceCommand_completesSynchronously_withJourneyUpdateIncluded` | unit + integration |
| AC2 | `journeySyncClient_returnsNull_whenEndpointReportsNoJourney`, `gateAdvanceCommand_completesNormally_whenNoConnectedJourney` | unit + integration |
| AC3 | `syncGateAdvanceToJourney_logsMismatch_whenJourneyRepoHasNoMatchingFeatureSlug` | unit |
| AC4 | `syncGateAdvanceToJourney_doesNotAttemptSync_forNonDiscoveryApprovedGate` | unit |
| AC5 | `internalEndpoint_rejectsRequest_withMissingOrIncorrectCredential`, `internalEndpoint_acceptsRequest_withCorrectCredential` | unit |
| AC6 | `journeySyncClient_noOps_whenSyncEnvNotConfigured` | unit |

**Assumptions:**
- The CLI process has a configured base URL to reach the deployed web-UI server (`INTERNAL_SYNC_URL`) and a shared credential (`INTERNAL_SYNC_SECRET`) — both new required environment variables for repo-connected sync to activate at all; both must be documented in `.env.example`. AC6 (added during Contract Review, confirmed by the operator 2026-08-07) covers the case where neither is set: identical to "no connected journey."
- `ownerRepoForFeature` (already shipped, `mtrr-s1`) is called from the new internal endpoint's server-side handler, which already runs inside `src/web-ui/` — no new access pattern needed there.

**Estimated touch points:**
Files: `src/enforcement/cli-gate-advance.js`, `src/sync/journey-sync-client.js` (new), `src/web-ui/routes/internal-sync.js` (new) or `src/web-ui/server.js` (route mount), `.env.example` (document the two new env vars)
Services: None external
APIs: One new internal HTTP endpoint (not public-facing)
