# Discovery: Interactive, Trello-style Kanban Boards (product / org / tenant scope)

**Status:** Approved
**Created:** 2026-07-24
**Approved by:** Hamish King — Founder/Operator — 2026-07-24
**Author:** Claude (agent), operator-directed

---

## Problem Statement

The web UI has three kanban board routes today — `/products/:id/kanban` (product scope), `/org/kanban` (org scope), and `/dashboard?view=board` (tenant scope, aggregating every journey across every product a tenant owns). All three render through one shared function (`renderKanban`, generalised by `kbc-s1`, merged) and already carry per-card truncated titles, artefact-count badges, and design-system-styled feature/artefact detail pages (`kfd1`, merged). But the boards themselves are **visually out of step** with the rest of the platform's current design language (the cool slate-blue neutral/steel-blue-accent system established in the recent product-view redesign) — confirmed directly by the operator (2026-07-24: "I've noticed the kanban boards are not styled along with everything else"). More importantly, the boards are **read-only**: an operator can see which stage a feature/story is in, but cannot act on that view. Every real stage transition still requires leaving the board and going through the CLI (`node bin/skills advance`/`gate-advance`) or a separate skill invocation. `kbc-s1`'s own story explicitly scoped "drag-and-drop or any other new interactive board behaviour" as **out of scope** for that consolidation pass — this discovery is the natural next step it deferred.

Separately, and confirmed by the same operator observation: `/admin/credits` (the admin credit top-up page, `src/web-ui/routes/admin-credits.js`) is also unstyled bare HTML with no shared nav/shell — noted here for completeness, but scoped as its own separate short-track story (operator decision, 2026-07-24), not part of this discovery.

## Who It Affects

**Primary: Hamish King (Founder/Operator)** — the sole active operator of this platform today. Runs the pipeline daily across multiple in-flight features/stories at once (confirmed by this session's own concurrent work across `bssm-s1`, `eatrl-s1`, `cmtt-s1`, and others). Currently has to either mentally track stage state or drop into `pipeline-state.json`/CLI output to see where each story actually sits — the kanban board exists to answer "what's in flight, and what needs my attention" at a glance, but today only half-does that job (visibility yes, action no).

**Secondary: any future tech lead / squad lead** (per `product/mission.md`'s persona list) who inherits this platform at team scale — the org/tenant board scopes exist specifically for a multi-product, multi-squad future this repo's own product mission anticipates, even though today's real usage is single-operator.

## Why Now

Two converging triggers, both confirmed directly with the operator this session:
1. **Sequencing signal:** the operator explicitly deferred this work until the E2E core-journey-coverage epic and its follow-on bug-fix chain (`catc-s1`, `icrh-s1`, `icv-s1`, `cmtt-s1`, `bssm-s1`, `eatrl-s1`) were fully resolved and merged — that chain is now complete, unblocking this as the next priority.
2. **Visual debt accumulation:** the product-view redesign (published earlier this session as a design mockup) established a real, current visual language for the rest of the app. The kanban boards — arguably the highest-traffic view for a daily-active operator — are the most visible remaining gap against that language, and this gap will only get more conspicuous as more of the app catches up.

## MVP Scope

All three existing board scopes (product, org, tenant) — confirmed by the operator (2026-07-24) that all three should be redesigned together in this pass, rather than sequencing one first:

1. **Visual redesign of all three board routes** to match the current design system (slate-blue neutrals, steel-blue accent, light/dark theme via CSS custom properties) — carrying forward `kfd1`'s existing card-truncation/artefact-count-badge/detail-page work, not replacing it.
2. **Drag-and-drop card movement between columns**, where a column represents a real pipeline stage from the existing `STAGE_SEQUENCE`/gate-map (`journey-store.js`, `gate-map.js`). Confirmed by the operator (2026-07-24): a completed drag **triggers the real, governed stage-advance machinery** (`skills gate-advance`/`advance` — the same validated, hash-checked path a CLI-driven transition already uses), not a purely cosmetic reorder. A drag that fails a real gate (e.g. DoR not signed off) must visibly fail and revert, showing why.
3. **Vertical reordering/prioritisation of cards within a column** — a lighter-weight, non-gated action (does not trigger a stage transition, just changes display/priority order within the same stage).
4. **Advisory (soft) WIP limits per column** — confirmed by the operator (2026-07-24): exceeding a column's configured WIP limit shows a visible warning but does not block the drop. No hard enforcement.
5. **Item detail view** reachable from a card (building on `kfd1`'s existing detail-page pattern) — surfaces enough of the underlying artefact/story state (DoR/DoD status, test-plan coverage, current stage, linked artefact files) for the operator to decide their next action without leaving the board.
6. **"Move to next stage/skill" as a direct board action** (not just a drag) — for an operator who wants to advance a card without dragging (e.g. keyboard/click alternative), reusing the same governed gate-advance path as #2.

## Out of Scope

- **Admin credits page styling** (`/admin/credits`) — explicitly deferred to its own separate short-track story per operator decision (2026-07-24), not part of this discovery's scope even though it was raised in the same conversation.
- **Custom/user-defined board views, swimlanes, or filters** beyond the three existing scopes (product/org/tenant) — no new board scope is being introduced in this pass.
- **Real-time multi-operator collaborative editing of the board itself** (e.g. live cursors, concurrent-drag conflict resolution) — this platform's current real usage is single-operator; multi-operator board contention handling is deferred until there's a real, multi-operator usage signal to design against.
- **Changing the underlying pipeline stage sequence, gate definitions, or `pipeline-state.json` schema** — this feature consumes the existing, already-governed stage/gate model; it does not redesign it.
- **The "ideas" concept** (`_readIdeas`/`_writeIdeas`) that `kbc-s1`'s own story flagged as possibly-orphaned — if still unused, this feature does not resurrect or repurpose it; a separate decision on removing it is out of scope here.

## Assumptions and Risks

~~[ASSUMPTION] The existing `skills gate-advance`/`advance` machinery can be safely invoked from a web request handler (not just the CLI) without any behavioural difference in validation, hash-checking, or state-write safety~~ — **CORRECTED at /definition, 2026-07-24:** the initial /clarify pass checked the wrong mechanism. `cli-advance.js`/`cli-gate-advance.js` (`node bin/skills advance`/`gate-advance`) is THIS repository's own meta-governance CLI tool — it operates on THIS repo's `.github/pipeline-state.json`, tracking how the skills-platform repo delivers features to itself. The kanban boards in scope for this feature show a DIFFERENT thing entirely: real customer/product journeys stored in the deployed web-app's own Postgres `journeys` table (`src/web-ui/adapters/journey-store-pg.js`), advanced via the web-app's own existing route, `POST /api/journey/:journeyId/gate-confirm` (`src/web-ui/routes/journey.js`, `handlePostGateConfirm`). That route is already real, governed, web-callable (it IS a web route today, called by the skill-chat UI's own gate-confirm button) — so the underlying "can this be called from a web handler" question is trivially yes, it already is one. The real, more important constraint /definition must encode: `handlePostGateConfirm` requires `session.done === true` on the journey's current active session (returns HTTP 400 "Session not complete yet" otherwise) — a card can only be drag-advanced once its current in-progress skill turn has actually completed and produced a real artefact, not mid-conversation. See `decisions.md` for the full correction writeup.

[ASSUMPTION] A hard product/org/tenant board redesign done in one pass (rather than product-first, sequenced) is the right sizing for this MVP given single-operator real usage today — unconfirmed against actual delivery-time cost; the operator confirmed the intent (all three at once) but /benefit-metric and /definition should sanity-check the estimated effort against this scope before committing.

[ASSUMPTION] Drag-and-drop as the primary interaction model is genuinely more useful than a lighter "click to advance" pattern for a keyboard/accessibility-first operator — unconfirmed; the MVP scope explicitly keeps a non-drag "move to next stage" action (#6) as a hedge against this risk, but the design pass at /definition should treat drag-and-drop as enhancement, not the only path to the same action (accessibility floor).

**Risk:** Real stage-gate validation failures (e.g. a DoR gate rejecting a drag because the target story's DoR isn't signed off) need a UX treatment that clearly explains *why* the drag failed, in the same operator-facing plain language this repo's own writing conventions require (CLAUDE.md's "expand abbreviations on first use" rule) — a bare "gate-advance failed" error would be a real regression in usability, not an improvement, if this isn't designed carefully.

**Risk:** This is the single largest UI feature attempted in this repo's history to date by story count/interaction complexity (drag-and-drop, real-time gate validation feedback, three board scopes) — if `/definition` reveals the true complexity is much higher than this discovery estimates, the operator should be prepared to re-scope down (e.g. product-scope only for a true MVP) rather than absorb a much longer outer-loop-to-ship cycle than planned.

## Directional Success Indicators

**Board-to-CLI parity for stage transitions:** Baseline: 0% of real stage transitions happen from the board today (100% go through CLI/skill invocation, confirmed — the board is currently read-only). Target: the operator can complete a real stage transition entirely from the board for at least half of their real transitions, without dropping to the CLI. Measured via: a simple before/after self-report from the operator after two weeks of real use (no existing telemetry hook for this — `[UNKNOWN BASELINE]` beyond the operator's own current-state confirmation that it's 0% today).

**Visual consistency:** Baseline: kanban boards do not use the current design system's tokens (confirmed by direct operator observation, 2026-07-24). Target: all three board routes visually match the product-view redesign's palette/type/layout tokens, confirmed via a side-by-side screenshot comparison at DoD.

**WIP visibility retained:** Baseline: `kfd1`'s existing benefit-metric M1 ("all active features visible ... without scrolling") is already met for card-level visibility. Target: this feature must not regress M1 — confirmed via the existing M1 measurement approach (see `artefacts/2026-06-14-web-ui-pm-flow/benefit-metric.md`) re-run after this feature ships.

## Constraints

- **No new npm dependencies assumed without justification** — a drag-and-drop interaction could be built with a lightweight library (e.g. native HTML5 drag-and-drop API, no dependency) or a small dedicated library; `/definition` should evaluate native-API-only first given this repo's existing "no new npm dependencies" bias seen in prior kanban stories (`kfd1`), and only justify a dependency if native drag-and-drop proves genuinely insufficient for accessibility or cross-browser reasons.
- **Reuse, don't replace, `kbc-s1`'s shared `renderKanban` pattern** and `kfd1`'s card/detail-page work — this is a visual and interactive enhancement layered on the existing consolidated renderer, not a rewrite.
- **Real gate-advance/advance semantics must not be weakened or duplicated** — the board's drag action must call into the SAME governed path (`skills gate-advance`/`advance`) already used by the CLI, per the operator's explicit confirmation (2026-07-24) — not a parallel, lighter-weight web-only transition mechanism that could drift out of sync with CLI behaviour.
- **Single-operator real usage today** — design and complexity decisions should be sized for real, current usage (one operator, personal/small-scale repo per `product/mission.md`'s scope: personal, non-regulated) rather than a hypothetical enterprise-scale team, while not foreclosing the org/tenant scopes this product's mission already anticipates.
- **Team capability:** solo operator + AI coding agents (this session's own established working pattern) — no dedicated frontend/design specialist beyond the `frontend-design`/`artifact-design` skill-assisted mockup process already used earlier this session for the product-view and settings-page redesigns.

## Contributors

- Hamish King — Founder/Operator
- Claude (agent) — discovery facilitation, drafting

## Reviewers

- Hamish King — Founder/Operator — 2026-07-24

## Approved By

Hamish King — Founder/Operator — 2026-07-24

---

## /clarify recommendation

~~This discovery contains 3 unconfirmed assumptions~~ — **superseded by the Clarification log below (2026-07-24).** 1 of 3 assumptions was resolved via direct code investigation; the remaining 2 are carried forward into /definition as sizing/design inputs rather than blocking questions (see Clarification log).

---

## Clarification log

**2026-07-24** — Clarified via /clarify:

- **Q (INTEGRATION category):** Can the existing `skills gate-advance`/`advance` machinery be safely invoked from a web request handler, not just the CLI, without any behavioural difference?
  **A:** Yes — confirmed via direct code inspection, not operator judgment. `cli-advance.js`/`cli-gate-advance.js` are already pure, `require()`-able functions with no `process.exit()` or subprocess calls (ADR-H7.1 compliant). A web handler can call the identical function the CLI calls. Resolved — no remaining integration risk on this point. See the struck-through assumption above for the full finding.

- **Q (SCOPE category):** Given the operator already confirmed all three board scopes (product/org/tenant) in one MVP pass rather than sequencing, does this discovery need to re-litigate that choice?
  **A:** No — this was an operator decision, not an open question; the discovery's assumption language was flagging effort/sizing risk, not scope ambiguity. Carried forward as an explicit sizing check for `/benefit-metric` and `/definition` to apply (see Assumptions and Risks — still listed, not struck through, since the actual delivery-time cost is genuinely unconfirmed until /definition decomposes it into stories).

- **Q (USER JOURNEY category):** Is drag-and-drop the right primary interaction model given no confirmed accessibility/keyboard-only usage pattern for this single operator?
  **A:** Already hedged in the MVP scope (item #6, a non-drag "move to next stage" action exists independent of drag-and-drop) — no further clarification needed before /benefit-metric; /definition should still treat drag-and-drop as an enhancement layer, not the only path to the same action.

No assumptions were added or materially changed beyond what's captured above — no `/decisions` log entry needed for this clarify pass.

**Status:** Clarified. Ready for `/benefit-metric`.

---

**Next step:** Human review and approval → /benefit-metric
