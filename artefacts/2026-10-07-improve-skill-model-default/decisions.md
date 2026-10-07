# Decisions: /improve model-routing default fix

## Short-track exemption (2026-10-07)

**Context:** While investigating production errors earlier this session, the operator asked whether `/improve`-launched sessions (the default CTA for most signals in the signals panel) default to Sonnet or Haiku. Confirmed: `src/web-ui/config/model-routing.js`'s `DEFAULT_SONNET_SKILLS` and `DRIFT_GUARD_SONNET_SKILLS` both omit `improve`, so it silently falls through to the Haiku default with zero skill-specific eval evidence backing that choice.
**Decision:** Handled as a short-track story (`/test-plan → /definition-of-ready → coding agent`), per CLAUDE.md's own short-track path — a single-array-literal config change, not a new feature requiring discovery/benefit-metric/definition/review.
**Rationale:** Matches this session's own established precedent for a real, narrowly-scoped gap found mid-session, fixed via the governed short-track path.
**Made by:** Hamish King (operator decision, "Let's fix improve defaults"), recorded by Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU), 2026-10-07.

## Scope decision: add to DEFAULT_SONNET_SKILLS, not DRIFT_GUARD_SONNET_SKILLS (2026-10-07)

**Context:** Two lists in `model-routing.js` could receive `improve`: `DEFAULT_SONNET_SKILLS` (a direct, unconditional code default — no operator action needed) or `DRIFT_GUARD_SONNET_SKILLS` (monitoring for drift on a skill whose Sonnet routing is *intended* to come from a separately-provisioned `WUCE_MODEL_OVERRIDE_<SKILL>` Fly secret).
**Decision:** `DEFAULT_SONNET_SKILLS`.
**Rationale:** `DRIFT_GUARD_SONNET_SKILLS` membership alone changes nothing — without also provisioning the matching Fly secret, `/improve` would keep silently defaulting to Haiku while incorrectly implying monitoring coverage backed by a real override. `DEFAULT_SONNET_SKILLS` immediately and unconditionally fixes the actual gap, with no follow-up ops action required, matching exactly how `/ideate`'s own equivalent precedent is implemented.
**Made by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU), 2026-10-07.

## Precedent-based justification, not a fresh eval (2026-10-07)

**Context:** This codebase's own `model-routing.js` comments show `/ideate` was kept on Sonnet despite `EXP-044` finding "no Haiku/Sonnet gap ... (eval gap noted in scorecard)" — i.e. inconclusive evidence, not a clean "Haiku is fine" result. `/improve` has strictly weaker evidence than that (zero dedicated eval exists at all).
**Decision:** Apply the same conservative-absent-evidence default to `/improve` now, rather than first commissioning a dedicated eval (mirroring EXP-044) to justify the change.
**Rationale:** The already-established practice in this exact codebase, applied to a comparably open-ended, judgment-heavy synthesis skill (`/ideate`), is to default to Sonnet when evidence is inconclusive or absent — not to default cheap and wait for a complaint. `/improve`'s own task (synthesizing patterns across thousands of heterogeneous real signals into an actionable proposal) is at least as demanding as `/ideate`'s lens-cycling work. A dedicated eval remains a legitimate, separate follow-up (named explicitly out of scope in the story) that could justify reverting to Haiku later with real evidence — but is not required to close today's gap.
**Made by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU), 2026-10-07.
