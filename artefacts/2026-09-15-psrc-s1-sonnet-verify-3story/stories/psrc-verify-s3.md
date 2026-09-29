## Story: Startup drift guard — warn loudly if a governance-critical skill silently resolves to Haiku

**Epic reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/epics/route-governance-skills-to-sonnet.md
**Discovery reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/discovery.md
**Benefit-metric reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/benefit-metric.md
**Domain:** [platform, ai-infra]

## User Story

As **the platform owner**,
I want **a loud, impossible-to-miss startup log warning if any of the 5 governance-critical skills is actually resolving to a Haiku model**,
So that **a future accidental removal of a `WUCE_MODEL_OVERRIDE_<SKILL>` Fly secret (or an operator setting a blanket `WUCE_FAST_MODEL` override without realising it silently affects these 5 skills too) is caught at the next deploy, not discovered the hard way a third time**.

## Benefit Linkage

**Metric moved:** Model-routing intent matches deployed reality (Tier 3, `benefit-metric.md`)
**How:** A real, server-startup-time check (visible in `fly logs`) directly calling the existing, unmodified `getModelForSkill()` for each of the 5 intended-Sonnet skills, comparing the result against the intended set.

## Architecture Constraints

- **Hard dependency on `psrc-verify-s2`:** this guard's own correctness depends on the real Fly secrets from that story actually being deployed — testing it meaningfully requires those secrets to exist (or to be deliberately unset, to prove the guard fires).
- The new constant naming `getModelForSkill` calls against must be clearly distinct from the EXISTING `DEFAULT_SONNET_SKILLS` (`['discovery', 'ideate']`) — the two represent different concepts (skills that default to Sonnet with no override at all, vs. skills whose Fly-secret override is intended to resolve to Sonnet) and must not be conflated or merged. Use `DRIFT_GUARD_SONNET_SKILLS` (not `INTENDED_SONNET_SKILLS`, which reads too similarly to `DEFAULT_SONNET_SKILLS` for a future maintainer skimming the file) — found during `/review` (finding 1-M1, fixed here before DoR).
- The check logic itself MUST be a small, separately-exported, directly-testable pure function (e.g. `checkModelRoutingDrift(envVars)` returning an array of `{skill, resolvedModel}` drift entries, taking an injectable `envVars` parameter mirroring `getModelForSkill`'s own existing testability pattern) — NOT inline logic buried in `server.js`'s startup IIFE. `server.js` calls this function and logs its result; the function itself is unit-testable without booting a real server or mutating real `process.env`. Found during `/review` (finding 1-H1, fixed here before DoR) — AC3's own test (deliberately unsetting one override) is not reliably automatable against inline server.js logic, matching this repo's own established D37 testability principle even though this isn't a D37 adapter.
- No change to `src/web-ui/config/model-routing.js`'s EXISTING exports/behaviour — `getModelForSkill` is called as-is, read-only, never wrapped or monkeypatched. The new `checkModelRoutingDrift` function and `DRIFT_GUARD_SONNET_SKILLS` constant are purely additive.
- Must not fire on a DELIBERATE override to Haiku for a specific skill for a specific, intentional reason (e.g. a future operator explicitly wants to cost-test one skill on Haiku) — the guard checks whether the INTENDED set (`DRIFT_GUARD_SONNET_SKILLS`, a small, explicit, checked-in list of 5 skill names this story defines) resolves correctly, not whether "any override exists."

## Dependencies

- **Upstream:** `psrc-verify-s2` (soft — the guard is correct code regardless, but its real-world value is only provable once the secrets exist; `schemaDepends` not required since this is a soft, non-schema dependency).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the 5 intended-Sonnet skill names (`design`, `definition`, `review`, `test-plan`, `definition-of-ready`) are exported as `DRIFT_GUARD_SONNET_SKILLS` from `model-routing.js`, and a new exported function `checkModelRoutingDrift(envVars)` that, for each skill in that list, calls `getModelForSkill(skillName, envVars)` and returns an array of `{skill, resolvedModel}` entries for any skill whose resolved model contains `"haiku"`, When this function is called directly with a real `process.env`-shaped object (unit-testable, no server boot required), Then it returns an empty array when all 5 skills resolve to non-Haiku models, and a correctly-populated array otherwise.

**AC2:** Given `checkModelRoutingDrift`'s result, When `server.js` starts up, Then it calls this function once with `process.env` and, for each returned drift entry, logs a clear `console.warn('[model-routing-drift] ...')` line naming the specific skill and resolved model; if the returned array is empty, nothing is logged (no noise on the healthy path).

**AC3:** Given one skill's `WUCE_MODEL_OVERRIDE_<SKILL>` env var is deliberately unset in a test-injected `envVars` object (simulating an accidental Fly secret removal) while the others remain set, When `checkModelRoutingDrift(envVars)` is called directly in a unit test, Then it returns exactly one drift entry, naming that specific skill — proving the guard is precise, not a blanket "something's wrong" signal.

**AC4:** Given `discovery` or `ideate` (already correctly Sonnet-routed by `DEFAULT_SONNET_SKILLS`, unrelated to this story), When `checkModelRoutingDrift` runs, Then neither appears in its result regardless of their own routing state — `DRIFT_GUARD_SONNET_SKILLS` strictly contains the 5 skills named in AC1, not a general-purpose "audit every skill" list.

## Out of Scope

- Any alerting/paging integration (email, Slack, PagerDuty) — a startup log line is the full scope of this story; wiring it to an external alert channel is a future story if the log-only approach proves insufficient.
- A UI/dashboard surface for this check.
- Checking any skill outside the 5 named here.

## NFRs

- **Performance:** Negligible — 5 synchronous function calls at startup, no I/O.
- **Security:** Not applicable.
- **Accessibility:** Not applicable — log output only.
- **Audit:** The startup log itself (captured in `fly logs`) is the audit trail.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
