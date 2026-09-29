## Story: Verify Sonnet 4.6 resolves both known Haiku failure modes across all 5 governance-critical skills

**Epic reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/epics/route-governance-skills-to-sonnet.md
**Discovery reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/discovery.md
**Benefit-metric reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/benefit-metric.md
**Domain:** [platform, ai-infra]

## User Story

As **the platform owner**,
I want **direct confirmation that Sonnet 4.6 actually fixes both known Haiku failure modes on `design`, `definition`, `review`, `test-plan`, and `definition-of-ready` before deploying the fix**,
So that **the Fly secrets set in `psrc-verify-s2` are known-good, not a repeat of the 2026-09-15 investigation that assumed the fix would work but never actually confirmed it**.

## Benefit Linkage

**Metric moved:** Governance-critical skill completion integrity (Tier 1, `benefit-metric.md`)
**How:** Directly exercises each of the 5 skills via `WUCE_MODEL_OVERRIDE_<SKILL>=claude-sonnet-4-6` set as a per-skill, per-session override (not yet a permanent Fly secret), and confirms both failure modes are absent.

## Architecture Constraints

- Uses `psrc-s1`'s existing `WUCE_MODEL_OVERRIDE_<SKILL>` mechanism exactly as built — no new code, no new routing logic.
- Does not touch `HAIKU_BLOCKED_SKILLS` (EXP-021) — `discovery` is not part of this story's scope at all.
- This story's own verification runs are throwaway (no permanent config change) — `psrc-verify-s2` is the story that actually deploys anything.

## Dependencies

- **Upstream:** None.
- **Downstream:** `psrc-verify-s2` depends on this story's own PASS result — do not deploy the Fly secrets if any of the 5 skills fails verification here.

## Acceptance Criteria

**AC1:** Given `WUCE_MODEL_OVERRIDE_TEST_PLAN=claude-sonnet-4-6` set for a single session, When a real `/test-plan` run is driven through the web UI for a genuine story (any in-flight feature is acceptable), Then the resulting `skill_turn` PostHog trace shows a `turnIndex` sequence consistent with genuine conversational elicitation (not a single `done:true` on `turnIndex:1` unless the story is trivial enough that a one-turn completion is independently judged correct by the operator), and the produced artefact's `---ARTEFACT-START---`/`---ARTEFACT-END---` markers are present and correctly placed.

**AC2:** Given the same override set for `definition-of-ready`, When a real `/definition-of-ready` run completes for the same story, Then the same two conditions from AC1 hold (genuine multi-turn elicitation where warranted; correct marker emission).

**AC3:** Given the same override set for `review`, `design`, and `definition` in turn, When each is run for real, Then the same two conditions hold for each.

**AC4:** Given all 5 verifications from AC1-AC3 pass, When the operator reviews the combined evidence, Then a go/no-go decision is explicitly recorded in `decisions.md` before `psrc-verify-s2` begins.

## Out of Scope

- Deploying any Fly secret (that is `psrc-verify-s2`).
- Any skill not in the 5-skill scope (`discovery`, `ideate` unaffected; any other skill in the library not part of this feature).

## NFRs

- **Performance:** Not applicable — this is a verification story, not a shipped code change.
- **Security:** Not applicable — no new credentials or attack surface.
- **Accessibility:** Not applicable — no rendered UI.
- **Audit:** The go/no-go decision itself is the audit trail (decisions.md entry), not a runtime log.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
