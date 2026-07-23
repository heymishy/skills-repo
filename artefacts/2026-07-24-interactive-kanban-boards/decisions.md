# Decisions: Interactive Kanban Boards

## CORRECTION — the real stage-advance mechanism is `handlePostGateConfirm`, not the `skills` CLI (2026-07-24)

**Context:** Discovery's `/clarify` pass resolved an assumption about whether "the existing `skills gate-advance`/`advance` machinery" could be safely called from a web handler, concluding yes based on `cli-advance.js`/`cli-gate-advance.js` being pure, `require()`-able functions.

**The correction:** That check answered the wrong question. `node bin/skills advance`/`gate-advance` (`src/enforcement/cli-advance.js`, `cli-gate-advance.js`) is **this repository's own meta-governance tool** — it reads/writes `.github/pipeline-state.json` to track how the skills-platform repo delivers features to itself (the exact mechanism used earlier this session for `bssm-s1`, `eatrl-s1`, and now this very kanban feature's own bookkeeping).

The kanban boards in scope for this feature (`/products/:id/kanban`, `/org/kanban`, `/dashboard?view=board`) show a completely different thing: **real customer/product journeys**, stored in the deployed web-app's own Postgres `journeys` table (`src/web-ui/adapters/journey-store-pg.js`), each with a `data->>'activeSkill'` stage field. Advancing one of these journeys to its next stage already has a real, existing, web-callable mechanism: `POST /api/journey/:journeyId/gate-confirm` (`handlePostGateConfirm`, `src/web-ui/routes/journey.js:1712`) — the same route the skill-chat UI's own "gate confirm" button already calls today. It validates the artefact (`_validate()`), persists it to disk and Postgres, calls `completeStage()`, and (via the injected `pipelineStateWriterFactory` adapter) writes the equivalent governance fields to the **customer's own** target repo's `pipeline-state.json` — not this repo's.

**Real, load-bearing precondition found:** `handlePostGateConfirm` requires `session.done === true` on the journey's current active session — if the operator's current skill turn hasn't completed (mid-conversation, no artefact produced yet), the route returns HTTP 400 "Session not complete yet." This means a kanban card cannot simply be dragged to any arbitrary next column at any time — only once its current stage's session has genuinely finished. This is a real, must-encode constraint for the drag/click "move to next stage" stories, not an edge case to gloss over.

**Consequences:**
- All references to "the real governed stage-advance machinery ... skills gate-advance/advance" in `discovery.md` and `benefit-metric.md` refer, in implementation reality, to `POST /api/journey/:journeyId/gate-confirm`, not the CLI tool.
- `/definition`'s stories for drag/click stage-advance must explicitly handle the `session.done !== true` case: either disable the drag/action for a card whose journey isn't ready, or handle the 400 response with a clear, plain-language explanation (per CLAUDE.md's abbreviation/plain-language writing convention) — "revert and explain why," not "gate-advance failed."
- No change needed to the discovery's MVP scope or benefit metrics — this correction is about implementation mechanism accuracy, not scope.

**Verification performed:** Direct code read of `src/web-ui/routes/journey.js` (`handlePostGateConfirm`, lines 1712–1786) and `src/web-ui/routes/products.js` (`handleGetProductKanban`, confirming `journey_id`/`activeSkill` come from the real `journeys` Postgres table, not `.github/pipeline-state.json`). Confirmed `setPipelineStateWriter`'s wiring in `server.js` (`pipelineStateWriterFactory(repoRootForAdapter)`) targets a per-deployment target repo root, not this repo specifically.

## RISK-ACCEPT — S2.1 AC2 rendered visual match, no automated tooling (2026-07-24)

**Context:** Review finding s2.1-1-M1 flagged that AC2's "visually match the product-view redesign mockup" assertion cannot be automated — this repo has no visual-regression/screenshot-diff tooling.

**Decision:** Per CLAUDE.md's B2 rule ("CSS-layout-dependent ACs must be classified at DoR time"), accepted as **manual verification + smoke test**, not automated visual regression. AC2 is marked 🔴 in `verification-scripts/s2.1-shared-token-redesign-verification.md`, with a negative check included.
**Rationale:** Building visual-regression tooling for a single-operator, personal-scale repo is disproportionate to this story's risk — a manual side-by-side comparison at DoD, repeated as a post-deployment smoke test, is proportionate.
**Action item:** Add a post-deployment smoke-test reminder to `workspace/state.json`'s `pendingActions` when this story reaches branch-complete.
**Accepted by:** Hamish King, Founder/Operator, 2026-07-24.

## RISK-ACCEPT — S2.2 artefact-count data availability is an implementation-time investigation (2026-07-24)

**Context:** Review finding s2.2-1-M1 flagged that AC4/AC5 are conditional on an investigation outcome (whether `getArtefactsForJourney()` can be wired into the board query without unbounded query cost) not yet resolved at /definition time.

**Decision:** Accepted — AC5's fallback (title truncation ships regardless of AC4's outcome) ensures real value ships either way. The coding agent's investigation and choice must be documented in this file before the story reaches branch-complete.
**Rationale:** Forcing the investigation to complete before DoR would gate a low-risk, additive story on open-ended discovery work; the fallback path makes this an acceptable, bounded risk.
**Accepted by:** Hamish King, Founder/Operator, 2026-07-24.

## RISK-ACCEPT — S3.4 destination route/identifier mapping is an implementation-time investigation (2026-07-24)

**Context:** Review finding s3.4-1-M1 flagged the same class of issue as S2.2 — AC1/AC2 depend on confirming whether `/features/:slug` or a journey-specific route is the correct navigation target, not yet resolved at /definition time.

**Decision:** Accepted — the coding agent must complete this investigation as its first implementation step and document the confirmed route/identifier mapping here before writing AC1/AC2's final tests.
**Rationale:** Same as S2.2 — low-risk, additive navigation feature; the investigation is a natural first implementation task, not a DoR blocker.
**Accepted by:** Hamish King, Founder/Operator, 2026-07-24.
