# Test Plan: Workshopping and facilitation mode

**Story reference:** artefacts/2026-04-27-prioritise-skill/stories/pr.4.md
**Epic reference:** artefacts/2026-04-27-prioritise-skill/epics/pr-e1.md
**Test plan author:** Copilot
**Date:** 2026-04-27

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Mode selection: skill offers solo vs workshopping at session start | 1 test | — | — | — | — | 🟢 |
| AC2 | Facilitation prompts include ≥2 named stakeholder roles + open question | 2 tests | — | — | — | — | 🟢 |
| AC3 | Conflict detection: surfaces score range with explicit framing | 1 test | — | — | 1 scenario | Partially untestable (live group session) | 🟡 |
| AC4 | Conflict resolution: records final agreed value + disagreement note | 1 test | — | — | — | — | 🟢 |
| AC5 | Facilitation pace: pauses after each dimension and asks if ready to proceed | 2 tests | — | — | — | — | 🟢 |
| AC6 | Mode switch: accepts switch from solo to workshopping mid-session | 1 test | — | — | — | — | 🟢 |
| AC7 | Group-attribution phrasing in closing statement — does not say "I recommend" | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| Live multi-participant conflict scenario | AC3 | Partially untestable-by-nature | Structural instruction (surfacing the score range) can be verified by text pattern; the actual effectiveness of the conflict resolution facilitation requires a live workshop with real participants giving different scores | Manual scenario 3 in verification script (operator acts both facilitator and conflicting participant) 🟡 |

---

## Test Data Strategy

**Source:** Synthetic / self-contained — `.github/skills/prioritise/SKILL.md` is the artifact under test.
**PCI/sensitivity in scope:** No
**Availability:** Available when implementation exists
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1–AC7 | SKILL.md file contents | File system read | None | All checks are text pattern assertions |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### instructs the skill to offer mode selection at session start

- **Verifies:** AC1
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction to ask the operator to choose between solo and workshopping mode at session start (check for: `workshopping`, `solo`, `mode selection`, `facilitation mode`)
- **Expected result:** Mode selection instruction present with both modes named
- **Edge case:** No

### instructs facilitation prompts to name at least two specific stakeholder roles

- **Verifies:** AC2
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction for facilitation prompts that name at least two roles — check for any two of: `product manager`, `engineer`, `designer`, `stakeholder`, `tech lead`, `business owner`
- **Expected result:** At least two named roles present in facilitation prompt instruction
- **Edge case:** No

### instructs facilitation prompts to use an open question about score reasoning

- **Verifies:** AC2
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction for an open facilitation question during scoring (check for: `What's driving your score`, `what factors`, `open question`, `open-ended`)
- **Expected result:** Open-question instruction present in workshopping facilitation section
- **Edge case:** No

### instructs the skill to surface the score range explicitly when conflict is detected

- **Verifies:** AC3 (structural)
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction to detect and surface conflicting scores explicitly by naming both scores heard — check for: `I heard.*and.*what's driving the gap`, `surface the range`, `conflicting scores`, `explicitly surface`
- **Expected result:** Conflict surfacing instruction with explicit range framing present (NOT just "there seems to be disagreement")
- **Edge case:** No

### instructs the skill to record the final agreed value alongside a note about the disagreement

- **Verifies:** AC4
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction to record both the agreed value and the disagreement note (check for: `agreed value.*disagreement`, `record.*agreed.*note`, `note.*disagreement`, `records the final.*note`)
- **Expected result:** Both agreed-value and disagreement-note recording instructions present
- **Edge case:** No

### instructs the skill to pause after each dimension and ask if the group is ready to proceed

- **Verifies:** AC5
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains an explicit pause instruction in workshopping mode (check for: `pause after each dimension`, `asks if the group is ready`, `ready to proceed`, `does not auto-advance`)
- **Expected result:** Pause-and-ask instruction present for workshopping mode
- **Edge case:** No

### instructs the skill not to auto-advance in workshopping mode

- **Verifies:** AC5
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains an explicit no-auto-advance constraint for workshopping mode (check for one of: `does not auto-advance`, `does not proceed automatically`, `waits for confirmation`)
- **Expected result:** No-auto-advance instruction present
- **Edge case:** No

### instructs the skill to accept a mode switch mid-session without losing progress

- **Verifies:** AC6
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction to accept a mode switch at any point during the session (check for: `mode switch`, `switch.*mid-session`, `accepts a switch`, `can switch`)
- **Expected result:** Mid-session mode switch instruction present
- **Edge case:** No

### instructs the closing statement to use group-attribution phrasing

- **Verifies:** AC7
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains instruction for group-attribution closing phrasing — check for: `Based on your group's agreed scores` or `group's agreed` or `group-attributed`
- **Expected result:** Group-attribution phrasing instruction present in workshopping mode closing
- **Edge case:** No

### instructs the closing statement not to use first-person recommendation framing

- **Verifies:** AC7
- **Precondition:** `.github/skills/prioritise/SKILL.md` exists
- **Action:** Read SKILL.md; check it contains an instruction to avoid "I recommend" framing in the workshopping closing (check for: `does not say.*I recommend`, `not.*I recommend`, `avoid.*I recommend`)
- **Expected result:** Explicit avoidance of "I recommend" framing in workshopping closing instruction
- **Edge case:** No

---

## Integration Tests

None beyond the contract check inherited from earlier stories. pr.4 adds to the existing SKILL.md — no new file seams.

---

## NFR Tests

### SKILL.md additions contain no embedded HTML except HTML comments

- **NFR addressed:** Architecture constraint — Markdown only
- **Measurement method:** Read SKILL.md; assert no non-comment HTML tags present (cumulative check)
- **Pass threshold:** 0 non-comment HTML tags found
- **Tool:** Node.js regex check

---

## Out of Scope for This Test Plan

- Effectiveness of conflict resolution when real participants have genuinely opposing motivations — this is a quality concern validated by M3 metrics (facilitation NPS / workshop utility) in production
- Whether the skill correctly identifies all forms of score conflict (e.g. participants who give scores sequentially vs. simultaneously) — real-world variation beyond scope of text pattern tests

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Live multi-participant conflict scenario | Cannot be replicated in an automated text-pattern check — requires a real workshop session with participants providing different scores | Manual scenario 3 in verification script; operator acts as both facilitator and conflicting participant to test the surfacing behaviour 🟡 |
| Mode-switch state preservation quality | Text-pattern check confirms the instruction exists; cannot validate whether all previously captured scores are retained correctly when mode switches from solo to workshopping mid-session | Manual scenario 6 in verification script |
