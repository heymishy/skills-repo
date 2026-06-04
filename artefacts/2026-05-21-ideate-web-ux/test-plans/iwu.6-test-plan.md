## Test Plan: Add assumption-card marker emission instruction to ideate/SKILL.md and enable session flag by default

**Story reference:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.6.md
**Epic reference:** artefacts/2026-05-21-ideate-web-ux/epics/iwu-assumption-card-flow.md
**Test plan author:** Copilot
**Date:** 2026-06-04

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | ideate/SKILL.md contains explicit marker emission instruction with exact marker format | 1 test | — | — | — | — | 🟢 |
| AC2 | Clean-context single-turn Lens B: ≥70% emission rate (≥9 of 12 assumptions) | — | — | — | 1 scenario | Untestable-by-nature | 🔴 |
| AC3 | Real ≥6-turn session: ≥70% emission rate; evidence file at artefacts/.../verification/iwu.6-emission-verification.md | — | — | — | 1 scenario (human DoD) | Untestable-by-nature | 🔴 |
| AC4 | session.assumptionCardsEnabled defaults true post-merge | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in automated test | Handling |
|-----|----|----------|-------------------------------------|---------|
| Clean-context Lens B emission rate ≥70% | AC2 | Untestable-by-nature | Requires live AI model run; result is probabilistic | Manual scenario in verification script; evidence file required at DoD |
| Multi-turn session emission rate ≥70% | AC3 | Untestable-by-nature | Requires real human-in-the-loop session; cannot be replayed reliably | Human-in-the-loop DoD scenario; evidence file `artefacts/2026-05-21-ideate-web-ux/verification/iwu.6-emission-verification.md` REQUIRED before story can be closed |

**Risk level for untestable gaps:** 🔴 HIGH — emission behaviour depends on model instruction-following. Mitigation: clear SKILL.md instruction at AC1 reduces the risk; human verification at DoD is the only acceptance gate.

---

## Test Data Strategy

**Source:** Static file reads — no runtime data required for automatable ACs
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Content of `.github/skills/ideate/SKILL.md` | File read | None | |
| AC2 | Live Lens B session run with clean context | Manual operator run | None | Manual only |
| AC3 | ≥6-turn session transcript with assumption counts | Manual operator run | None | Human DoD |
| AC4 | Server default configuration in `src/web-ui/` | Code read | None | |

### PCI / sensitivity constraints

None.

### Gaps

AC2 and AC3 cannot be automated. Automated test coverage is 2/4 ACs. This is the expected outcome for a SKILL.md tuning story where emission rate is an emergent model behaviour.

---

## Unit Tests

### ideate/SKILL.md contains the assumption marker emission instruction

- **Verifies:** AC1
- **Precondition:** `.github/skills/ideate/SKILL.md` exists on disk
- **Action:** Read the file contents; search for the exact marker format string `---ASSUMPTION-JSON:`
- **Expected result:** The file contains the string `---ASSUMPTION-JSON:` (with the colon); the file also contains an instruction telling the model to emit this marker alongside each identified assumption
- **Edge case:** No

### session.assumptionCardsEnabled defaults to true

- **Verifies:** AC4
- **Precondition:** Session initialisation code is readable (e.g. in `src/web-ui/server.js`, route handler, or session factory module)
- **Action:** Inspect the code that initialises a new session; look for the `assumptionCardsEnabled` field assignment
- **Expected result:** The `assumptionCardsEnabled` field is set to `true` by default (not `false`, not undefined); the code does not require an explicit flag to be passed to enable the feature post-merge
- **Edge case:** No

---

## Integration Tests

None — the two automatable ACs are covered by unit tests (file read and code read). No server integration path is required for a config-file-only change.

---

## NFR Tests

None — iwu.6 has no NFRs.

---

## Manual Verification Scenarios

### AC2: Single-turn Lens B emission rate ≥70% (pre-DoD operator check)

**Verification type:** Manual — cannot be automated

**Protocol:**
1. Open a fresh `/ideate` session with a clean context (only `product/mission.md` loaded; no prior turns in the session)
2. Select Lens B from the lens picker
3. Run Lens B for a single turn (no follow-up turns)
4. Count the total number of distinct assumptions identified by the model in the response
5. Count the number of those assumptions that were emitted with a `---ASSUMPTION-JSON:` marker
6. Calculate: `emitted / identified ≥ 0.70`

**Pass threshold:** ≥70% (if Lens B identifies 12 assumptions, ≥9 must be emitted as markers)
**Evidence:** Record the session ID and counts in `artefacts/2026-05-21-ideate-web-ux/verification/iwu.6-emission-verification.md`

### AC3: Multi-turn session emission rate ≥70% (Human-in-the-loop DoD)

**Verification type:** Human DoD — blocking gate for story close

**Protocol:**
1. Run a real `/ideate` session with ≥6 turns of genuine human–model interaction
2. Track all assumptions identified by the model across all turns
3. Track how many were emitted with a `---ASSUMPTION-JSON:` marker vs identified inline without a marker
4. Calculate: `emitted / identified ≥ 0.70`

**Pass threshold:** ≥70% over the full session
**Evidence file:** MUST be created at `artefacts/2026-05-21-ideate-web-ux/verification/iwu.6-emission-verification.md` before the story can be closed. The evidence file must include: session ID, turn count, assumption count, emission count, rate, and operator sign-off.

---

## Out of Scope for This Test Plan

- Server SSE handling of the marker — iwu.3
- Browser card rendering — iwu.3
- Confirm/flag endpoint — iwu.4
- Nudge bar behaviour — iwu.5
- Model quality of identified assumptions — out of pipeline scope

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC2: emission rate (single-turn) | Probabilistic model output; untestable by automation | Manual pre-DoD check with evidence file |
| AC3: emission rate (multi-turn) | Human-in-the-loop; untestable by automation | Human DoD scenario; evidence file is blocking gate |
