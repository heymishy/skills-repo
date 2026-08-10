## Story: Fix three /ideate UX gaps found via live Chrome staging review — resume panel loss, no way to signal completion, cramped canvas layout

**Epic reference:** None — short-track (found via a live Chrome-driven staging review requested by the operator, immediately after isc-s1/isc-s2's /ideate mock-gateway fix)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gaps below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator using /ideate on staging**,
I want **the assumptions/conditions panels to survive a page resume, an explicit way to signal "I'm ready to finish" instead of guessing, and a canvas panel that stays usable once the other panels have real content**,
So that **/ideate is actually usable end-to-end instead of appearing broken or stuck once its mock (or real) data genuinely populates every panel**.

## Benefit Linkage

**Metric moved:** Direct UX-defect fix (short-track, no formal benefit-metric artefact) — found live, by the operator, immediately after isc-s1/isc-s2 shipped: "So testing ideate on staging, I can now see the 4 different lens although they are pushed to very bottom with not much height. There doesn't seem to be a way to proceed with that work to discovery (which is the point), nor is there a way to resume." A live Chrome investigation (this session) confirmed and precisely diagnosed all three:

1. **Resume loses assumption/condition state.** `mergeRedisSessionData` already correctly restores `session.assumptionCards`/`session.conditionItems` on resume (it's denylist-based, per `wusl-s2`) — but unlike `canvasBlocks` (fixed by `a4`), that restored data was never read back into the initial page HTML to seed the CONDITIONS/ASSUMPTIONS panels. A page reload silently reset them to empty even with real markers present in the resumed conversation text.
2. **"No way to proceed" is a discoverability gap, not a broken mechanism.** Live-verified the completion mechanism itself works (isc-s1/isc-s2 correctly reach the final artefact-completion turn) — but after the last lens, the model only asks a conversational question ("Ready for me to write this up... ?") with no explicit UI control. An operator reading that as "I've seen everything" has no discoverable way to say "yes, finish this."
3. **Canvas panel layout.** `#canvas-section` had `min-height:0` while its siblings (`#condition-items`, `#assumption-cards`) can grow to `max-height:28%`/`42%` each with `flex:0 0 auto` (never shrinking). Invisible while those siblings were always empty (before isc-s1's fix populated them with real content) — now that they hold real entries, canvas can be squeezed to a small sliver.

**How:** (1) Mirror `a4`'s exact `canvasBlocksInitScript`/hydration pattern for `assumptionCards`/`conditionItems`. (2) Add a persistent "Wrap up ideation →" quick-action button (visible only for an in-progress `/ideate` session) that submits a canned ready-to-finish reply through the same `sendTurn()` path a typed reply uses. (3) Give `#canvas-section` a real `min-height` floor (240px, matching the non-ideate branch's own `min-height:200px` convention) so it can't be squeezed below a usable size.

## Architecture Constraints

- **No new persistence mechanism** — `session.assumptionCards`/`conditionItems` and their Redis round-trip already exist and work correctly (confirmed: `mergeRedisSessionData` is denylist-based, not the narrow allowlist `wusl-s2` replaced). This story only wires already-correct server-side state into the initial page render, exactly as `a4` already did for `canvasBlocks`.
- **The "Wrap up ideation" button does not force completion** — it submits a real turn through the existing `sendTurn()` path; the model (real or mocked) decides how to respond exactly as it would to an equivalent typed reply. This is a discoverability fix, not a new completion mechanism.
- **Gated to `isIdeate && !session.done`** — never renders for other skills, never renders once the stage is already complete (the existing journey-gate panel already covers that state).
- **Canvas min-height is a floor, not a fixed height** — `flex:1 1 auto` is unchanged, so canvas still grows to fill available space when there's room; the 240px floor only stops it shrinking below a usable size when conditions/assumptions are tall.

## Dependencies

- **Upstream:** `isc-s1`/`isc-s2` (merged) — the /ideate mock-gateway fix that made these three latent gaps visible for the first time (conditions/assumptions were always empty before, so their resume-loss and layout impact were invisible).
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given an `/ideate` session with `session.assumptionCards` populated, When the chat page is rendered (fresh load or resume), Then the response HTML contains a `window.__SW_INITIAL_ASSUMPTION_CARDS__=` assignment embedding the real assumption data.

**AC2:** Given an `/ideate` session with `session.conditionItems` populated, When the chat page is rendered, Then the response HTML contains a `window.__SW_INITIAL_CONDITION_ITEMS__=` assignment embedding the real condition data.

**AC3:** Given an `/ideate` session with neither field populated, When the chat page is rendered, Then neither init-assignment appears.

**AC4:** Given a non-ideate skill session (even if `assumptionCards`/`conditionItems` were somehow present), When the chat page is rendered, Then neither init-assignment appears — gated to `isIdeate` only, matching the panels' own existing render gate.

**AC5:** Given the rendered client-side script, When inspected, Then it hydrates `__SW_INITIAL_ASSUMPTION_CARDS__`/`__SW_INITIAL_CONDITION_ITEMS__` via `appendAssumptionCard`/`appendConditionItem` on page load, mirroring the existing canvas-block hydration call exactly.

**AC6:** Given an in-progress (`!session.done`) `/ideate` session, When the chat page is rendered, Then the actual `<button id="sw-wrap-ideation-btn">` element is present.

**AC7:** Given a completed (`session.done`) `/ideate` session, When the chat page is rendered, Then the button element is absent.

**AC8:** Given any non-ideate skill session, When the chat page is rendered, Then the button element never appears.

**AC9:** Given the `/ideate` 3-panel layout, When the chat page is rendered, Then `#canvas-section`'s inline style declares a pixel `min-height` greater than 0 (not `min-height:0`).

## Out of Scope

- **Fixing the 4 pre-existing, unrelated test failures** discovered while regression-testing this story (`check-mfc2-chat-ux-improvements`, `check-iwu2-right-panel-layout`, `check-inc2.1-conditions-panel`, `check-inc4-canvas-panel`) — confirmed via a clean-master comparison (identical failure counts before this story's changes) to be pre-existing, unrelated to this fix. Logged separately for a future investigation, not touched here.
- **Rebalancing `#condition-items`/`#assumption-cards`'s own `max-height:28%`/`42%` percentages** — the `min-height` floor on canvas is the minimal, lower-risk fix; changing the other two panels' own caps is a separate design decision with more subjective tradeoffs, not needed to resolve the reported symptom.
- **Making the "Wrap up ideation" button re-appear if the model responds without completing** (e.g. asks a clarifying question instead of writing up the artefact) — the button hides itself on click (one-shot); if this edge case matters in practice, the operator can still type a normal reply. Not observed in the mock's own scripted sequence, which always completes on the next reply once the core lenses are covered.
- **Changing the real (non-mocked) `/ideate` skill's own system-prompt wording** to be more explicit about "reply to finish" — this story's button fix already resolves the discoverability gap regardless of what the model's own text says; a system-prompt wording change is a separate, optional follow-on.

## NFRs

- **Correctness:** Every init-assignment must be genuinely parseable JS and correctly consumed by the existing, unmodified `appendAssumptionCard`/`appendConditionItem` client functions — no new parsing logic introduced.
- **No regression to the resume mechanism drh-s1/rht-s1/rdac-s1 already proved works** — verified via `rdac-s1`'s own real-browser Playwright spec (definition-stage diagram/artefact/conversation resume) re-run unmodified against this story's canvas/hydration changes.

## Complexity Rating

**Rating:** 2 — three distinct, well-diagnosed fixes across two files, each individually well-understood (mirrors an existing, already-proven pattern) but touching real production render/client-JS code, not just fixture content.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
