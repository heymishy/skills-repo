# Decision Log: psrc-s1-sonnet-verify-3story

**Feature:** Route governance-critical skills to Sonnet by default
**Discovery reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/discovery.md
**Last updated:** 2026-09-29

---

## `psrc-verify-s1` AC4: Go/no-go decision — GO, on reasoning rather than a live re-verification (2026-09-29)

**Context:** `psrc-verify-s1`'s own test plan called for driving 5 real, live sessions through `wuce-staging` (one per governance-critical skill) with a temporary `WUCE_MODEL_OVERRIDE_<SKILL>=claude-sonnet-4-6` override, to directly re-confirm Sonnet avoids both the 2026-09-15 marker-emission bug and the 2026-09-29 shallow-completion bug before deploying anything permanently. The 5 temporary overrides were set on `wuce-staging` (confirmed via `fly secrets list -a wuce-staging` — all 5 present and deployed). The live verification itself could not be completed: the Claude-in-Chrome browser extension disconnected mid-session and did not reconnect across 3 separate retry attempts (2 explicitly confirmed by the operator as "checked, try again"), and no other authenticated path to `wuce-staging` was available (GitHub login requires either a live browser session or the operator's own manual sign-in; per this session's own credential-handling policy, real credentials on a non-localhost host are never entered directly).

**Decision:** GO — deploy the permanent secrets (`psrc-verify-s2`) without completing the live re-verification session, based on reasoning rather than direct re-observation:
1. Sonnet 4.6 has no documented history of either failure mode (marker-emission omission, shallow single-turn "done" completion) anywhere in this repo's own `capture-log.md`/`decisions.md`/`workspace/learnings.md` — both confirmed incidents (2026-09-15, 2026-09-29) were specifically and exclusively on `claude-haiku-4-5`.
2. Sonnet is ALREADY the default for `discovery` and `ideate` (`DEFAULT_SONNET_SKILLS`) in real production, with no equivalent failure ever reported for those two skills.
3. The change itself is low-risk and fully reversible: `WUCE_MODEL_OVERRIDE_<SKILL>` is a per-skill Fly secret, not a code deploy — removing it instantly reverts to the prior (known-working, if unreliable) Haiku default with no rollback procedure beyond `fly secrets unset`.
4. `psrc-verify-s3`'s own drift guard (shipping next) provides an ongoing, automated correctness check going forward, reducing the cost of having skipped a one-time manual pre-verification.

**Alternatives considered:** (a) wait indefinitely for the browser extension to reconnect before proceeding — rejected, open-ended blocker with no ETA, and the operator explicitly asked to skip it and proceed; (b) attempt to verify without a browser via a direct local call to the real skill-turn-executor with a live Anthropic API key — not pursued, since no `ANTHROPIC_API_KEY` is available in this local environment (it exists only as a Fly secret on the deployed apps).

**Rationale:** The test plan's own manual-verification approach was the RIGHT thing to attempt first (directly observing real behaviour beats reasoning from prior history) — the fallback to reasoning-based sign-off is an explicit, logged compromise made only after the live path was genuinely exhausted, not a shortcut taken by default. The story's own risk-first slicing (verify before deploy) is somewhat weakened by this compromise, but the 4 reasoning points above, combined with `psrc-verify-s3`'s ongoing drift guard, are judged sufficient to proceed.

**Story:** `psrc-verify-s1` AC4 — closes this story (with the caveat that AC1-AC3's own live-scenario steps were not directly executed, only reasoned about); `psrc-verify-s2` may now proceed.
**Made by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh) — explicit "go, skip live verification" direction from Hamish King, Platform Owner, 2026-09-29.
**Revisit trigger:** the first time Chrome/browser access is available again, run the originally-planned live verification as a bonus confirmation (not a blocking gate at this point) — if it ever reveals either failure mode still present on Sonnet, immediately `fly secrets unset` the 5 overrides on both environments and reopen this decision.

---

## `psrc-verify-s2`: AC1/AC2 confirmed with real evidence; AC3/AC4 deferred (2026-09-29)

**Context:** `WUCE_MODEL_OVERRIDE_DESIGN`/`DEFINITION`/`REVIEW`/`TEST_PLAN`/`DEFINITION_OF_READY` (all `=claude-sonnet-4-6`) were set via `fly secrets set` on both `wuce-staging` and `skills-framework` (production).
**Decision:** AC1 and AC2 are satisfied with real, direct evidence — `fly secrets list` on both environments shows all 5 secrets present and `Deployed`. AC3 (confirm the real resolved model via a fresh `$ai_generation` PostHog event) and AC4 (confirm `discovery`/`ideate` unaffected) require a live authenticated session, which is blocked by the same Claude-in-Chrome disconnect documented in the `psrc-verify-s1` entry above — deferred to the same "when browser reconnects" bonus check, not treated as a blocker for closing this story.
**Rationale:** The secrets being present and deployed is itself strong, direct evidence the mechanism is live (this is exactly what `getModelForSkill` reads) — the remaining gap is purely "prove it end-to-end via a live call," which the drift guard (`psrc-verify-s3`) will also continuously provide going forward once it ships.
**Story:** `psrc-verify-s2` — AC1/AC2 ✅ with evidence; AC3/AC4 deferred, not blocking.
**Made by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh).
**Revisit trigger:** same as the `psrc-verify-s1` entry above — first live browser session available, confirm AC3/AC4 directly.

---
