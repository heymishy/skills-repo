## Story: Centralize per-skill model routing into one config module with scoped override support

**Track:** Short-track (found while trying to run a real production model-comparison test; fixes a real duplication defect along the way)
**Epic reference:** (none — standalone tooling fix)
**Domain:** web-ui

## User Story

As **an operator who needs to change which model a specific skill (e.g. `test-plan`, `definition-of-ready`, `review`) uses**,
I want **a single, committed source of truth for per-skill model routing, with a scoped per-skill override mechanism that doesn't require touching unrelated skills**,
So that **I can run a real, bounded model-comparison test without a blanket production toggle that affects every skill and every concurrent session, and future changes to routing can't silently drift between the two places that currently duplicate it**.

## Problem

`src/web-ui/routes/skills.js` has model routing logic defined **twice, independently**:

1. `getModelForSkill(skillName)` (line ~710) — used for the UI's displayed model badge (`modelLabel` at line ~4621) and by `registerHtmlSession` (line ~2471) to resolve the model shown to the operator.
2. An inline block inside the real streaming turn handler (line ~5059, `var _SONNET_SKILLS = ['discovery', 'ideate']; if (_SONNET_SKILLS.indexOf(session.skillName) === -1) { ... }`) — this is what actually decides which model executes the turn the operator sees in the browser.

Both currently list the same two skills (`discovery`, `ideate`), so there is no live drift today — but there is nothing preventing one from being edited without the other, which would make the displayed model badge lie about what actually ran. This was found directly while investigating a separate reliability question (marker-emission flakiness on `test-plan`/`definition-of-ready`/`review`, all `claude-haiku-4-5`) — testing that question required changing routing for exactly those three skills, and the only existing lever (`WUCE_FAST_MODEL`) is a blanket, all-skills, all-traffic override with no per-skill scoping and no audit trail beyond a Fly secret.

There is also a **second, entirely disconnected** routing table (`MODEL_ROUTING` in `scripts/run-model-sweep.js`, sourced from `workspace/proposals/routing-policy-framework.md`) that documents the eval-backed routing decision (which experiment justified which skill's model) but is never read by the live production code — it only drives the offline sweep tool's `--policy` flag. Reconciling that second table with production is out of scope for this story (noted below) but worth flagging.

## Fix

1. New module `src/web-ui/config/model-routing.js` — single source of truth for default per-skill routing (the same two arrays, moved here) plus a new per-skill override mechanism read from scoped env vars: `WUCE_MODEL_OVERRIDE_<SKILL_NAME_UPPER_SNAKE>` (e.g. `WUCE_MODEL_OVERRIDE_TEST_PLAN=claude-sonnet-4-6`). Precedence, most to least specific: per-skill override → existing blanket `WUCE_FAST_MODEL` → config module default. The existing Haiku-fabrication safety invariant (`HAIKU_BLOCKED_SKILLS`, EXP-021) is preserved and applies regardless of which mechanism selected the model — a per-skill or blanket override that resolves to a Haiku model for a Haiku-blocked skill is refused, exactly as the current `WUCE_FAST_MODEL` bypass-guard already does.
2. `src/web-ui/routes/skills.js`: both call sites (`getModelForSkill()` and the streaming turn handler's inline block) now delegate to the new module instead of maintaining their own copies.
3. `.github/architecture-guardrails.md` / `decisions.md`: record this as an architectural decision (routing mechanism, precedence order, safety invariant) per CLAUDE.md's `decisions.md` mandate for architectural choices.

## Acceptance Criteria

**AC1:** Given no per-skill or blanket override env vars are set, When `getModelForSkill('test-plan')` (or any other previously-Haiku-routed skill) is called, Then it returns the same default (`claude-haiku-4-5`, or `WUCE_HAIKU_MODEL` if set) as before this change — no behavioural change to the default routing.

**AC2:** Given `WUCE_MODEL_OVERRIDE_TEST_PLAN=claude-sonnet-4-6` is set, When `getModelForSkill('test-plan')` is called, Then it returns `claude-sonnet-4-6`, and `getModelForSkill('definition-of-ready')` (a different skill, no override set) is unaffected and still returns the default.

**AC3:** Given `WUCE_MODEL_OVERRIDE_DISCOVERY=claude-haiku-4-5` is set (attempting to route a Haiku-blocked skill to Haiku), When `getModelForSkill('discovery')` is called, Then the override is refused and the safe default (Sonnet) is returned — mirroring the existing `WUCE_FAST_MODEL` Haiku-blocked-skill guard.

**AC4:** Given both a per-skill override and the blanket `WUCE_FAST_MODEL` are set for the same skill, When `getModelForSkill()` is called for that skill, Then the per-skill override wins (more specific takes precedence).

**AC5:** Given the real streaming turn handler (`handlePostTurnStreamHtml`) and the UI-display path (`registerHtmlSession`/`modelLabel`) both resolve a skill's model, When either is exercised, Then both call the same centralized module and return identical results — the duplication that made them able to silently drift is eliminated.

## Out of Scope

- Reconciling `scripts/run-model-sweep.js`'s separate `MODEL_ROUTING` table / `workspace/proposals/routing-policy-framework.md` with this new production module — flagged as a real gap, not fixed here.
- Fixing `htmlSubmitTurn`'s (non-streaming path) apparent lack of any model routing at all — confirmed it passes no `model` option to `_skillTurnExecutor` at all; this is a pre-existing, separate inconsistency, and the real browser chat UI uses the streaming path (`handlePostTurnStreamHtml`), not this one, per the existing `srmw-s1` comment in the codebase.
- Building any UI/admin surface for setting overrides — this story only builds the mechanism (env-var-driven, Fly-secret-settable), not a control panel.

## NFRs

- **Safety:** the Haiku-fabrication block (EXP-021) must be unconditional — no override path, per-skill or blanket, can route a Haiku-blocked skill to a Haiku model.
- **None else new.**

## Complexity Rating

**Rating:** 2 — touches a real duplication defect across 3 call sites, but the logic itself (env-var precedence chain) is well understood and directly modeled on the existing `WUCE_FAST_MODEL` guard pattern already in the codebase.
**Scope stability:** Stable.
