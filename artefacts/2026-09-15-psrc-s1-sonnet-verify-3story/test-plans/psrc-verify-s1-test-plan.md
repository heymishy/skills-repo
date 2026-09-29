## Test Plan: Verify Sonnet 4.6 resolves both known Haiku failure modes across all 5 governance-critical skills

**Story reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/stories/psrc-verify-s1.md

---

## AC Coverage

| AC | Description | Manual | Gap type | Risk |
|----|-------------|--------|----------|------|
| AC1 | test-plan on Sonnet: genuine elicitation + correct markers | 1 scenario | — | 🟢 |
| AC2 | definition-of-ready on Sonnet: same 2 conditions | 1 scenario | — | 🟢 |
| AC3 | review, design, definition on Sonnet: same 2 conditions | 3 scenarios | — | 🟢 |
| AC4 | Go/no-go decision recorded | 1 scenario | — | 🟢 |

## Coverage gaps

None. This story has no shippable code — it is entirely a manual verification exercise (per-skill override is a temporary, per-session env var, not a permanent change), so every AC is verified by directly driving a real web-UI session and inspecting the resulting PostHog trace + artefact output, exactly as the 2026-09-29 bug itself was originally found.

## Test Data Strategy

**Source:** Real, live web-UI sessions against `wuce-staging` (never production) with `WUCE_MODEL_OVERRIDE_<SKILL>=claude-sonnet-4-6` set as a temporary Fly secret for the duration of this verification only, removed afterward regardless of outcome.
**PCI/sensitivity in scope:** No.
**Availability:** Available now — any in-flight or fresh feature slug on `wuce-staging` works as the test subject.
**Owner:** Self-contained (operator-run).

## Manual Scenarios

### Scenario 1 — test-plan on Sonnet

**Verifies:** AC1
**Steps:** Set `WUCE_MODEL_OVERRIDE_TEST_PLAN=claude-sonnet-4-6` on `wuce-staging`. Drive a real `/test-plan` session for any real in-flight story. Pull the `skill_turn` PostHog trace for that session.
**Expected:** Turn sequence reflects genuine conversational elicitation appropriate to the story's complexity (not an unexplained single-turn `done:true`); the produced test-plan artefact has correctly-placed `---ARTEFACT-START---`/`---ARTEFACT-END---` markers.

### Scenario 2 — definition-of-ready on Sonnet

**Verifies:** AC2
**Steps:** Same pattern, `WUCE_MODEL_OVERRIDE_DEFINITION_OF_READY=claude-sonnet-4-6`, real `/definition-of-ready` session.
**Expected:** Same two conditions as Scenario 1.

### Scenario 3 — review, design, definition on Sonnet

**Verifies:** AC3
**Steps:** Same pattern, once each for `WUCE_MODEL_OVERRIDE_REVIEW`, `WUCE_MODEL_OVERRIDE_DESIGN`, `WUCE_MODEL_OVERRIDE_DEFINITION`.
**Expected:** Same two conditions, for each of the 3 skills independently.

### Scenario 4 — Go/no-go decision

**Verifies:** AC4
**Steps:** After Scenarios 1-3 all pass, write a `decisions.md` entry recording the explicit go decision (or no-go, with reasoning, if any scenario failed).
**Expected:** A real, dated `decisions.md` entry exists before `psrc-verify-s2` begins.

## Out of Scope for This Test Plan

- Any permanent Fly secret (temporary, per-session overrides only, removed after this story).
- Production (`skills-framework`) — this verification runs against `wuce-staging` only.

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
