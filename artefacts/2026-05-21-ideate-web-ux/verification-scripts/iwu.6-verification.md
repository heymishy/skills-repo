# AC Verification Script: Add assumption-card marker emission to SKILL.md

**Story reference:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.6.md
**Technical test plan:** artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.6-test-plan.md
**Script version:** 1
**Verified by:** __________ | **Date:** __________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
- For AC1 and AC4: No server required — these are file/code reads.
- For AC2 and AC3: Start the server (`node --env-file=.env src/web-ui/server.js`) and open a real `/ideate` session in the browser.
- For AC3: Allow 15–30 minutes for a genuine multi-turn session.

---

## Scenarios

---

### Scenario 1: SKILL.md contains the assumption marker emission instruction

**Covers:** AC1

**Steps:**
1. Open `.github/skills/ideate/SKILL.md` in a text editor
2. Search for the string `---ASSUMPTION-JSON:`
3. Read the surrounding instruction text

**Expected outcome:**
> The file contains the literal string `---ASSUMPTION-JSON:` (with the colon). The surrounding text is a clear instruction to the model to emit this marker for each assumption identified — including the exact format of the complete marker: `---ASSUMPTION-JSON: {"id":"...","text":"...","type":"...","risk":"...","knowness":"..."}---`

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: session.assumptionCardsEnabled defaults to true

**Covers:** AC4

**Steps:**
1. Open the session initialisation code (search in `src/web-ui/` for `assumptionCardsEnabled`)
2. Find where a new session object is created
3. Check the default value assigned to `assumptionCardsEnabled`

**Expected outcome:**
> `assumptionCardsEnabled` is set to `true` in the default session creation path. No explicit flag or environment variable is required to enable it. The value `false` does not appear as the default.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Single-turn Lens B emission rate ≥70% 🔴 Manual AC2

**Covers:** AC2

**Steps:**
1. Open a fresh `/ideate` session with only `product/mission.md` as context (clean context, no prior turns)
2. Select Lens B from the lens picker
3. Run Lens B and wait for the full response
4. In the browser, count the number of assumption cards that appeared in `#assumption-cards` (each card = one emitted marker)
5. Read the full lens output text to count the total number of distinct assumptions mentioned (whether emitted as cards or described inline without a marker)
6. Calculate: `cards_count / total_assumptions_identified`

**Expected outcome:**
> The ratio is ≥ 0.70. If Lens B identified 12 distinct assumptions in the response text, at least 9 appeared as assumption cards in `#assumption-cards`.

**Pass threshold:** ≥70%
**Result:** [ ] Pass  [ ] Fail  [ ] Not yet verified
**Emission count / Total identified:** ___ / ___
**Rate:** _____
**Session ID for evidence file:** _____________
**Notes:**

---

### Scenario 4: Multi-turn session emission rate ≥70% 🔴 Human DoD — BLOCKING GATE

**Covers:** AC3

**⚠️ This scenario must be completed and its evidence file committed before the story can be marked DoD-complete. It is a blocking gate.**

**Steps:**
1. Start a genuine `/ideate` session on a real product topic (use your actual product context)
2. Run at least 6 turns of human–model interaction across multiple lenses
3. After the session, count all distinct assumptions identified by the model (from card count AND any inline assumptions mentioned without markers)
4. Count the number that were emitted as `---ASSUMPTION-JSON---` markers (visible as cards)
5. Calculate the emission rate
6. Create the evidence file at `artefacts/2026-05-21-ideate-web-ux/verification/iwu.6-emission-verification.md` with the following fields:
   - Session ID
   - Date
   - Turn count
   - Lenses run
   - Total assumptions identified
   - Total assumptions emitted as markers
   - Emission rate
   - Operator sign-off (name + date)

**Pass threshold:** ≥70% emission rate over the full session

**Result:** [ ] Pass  [ ] Fail  [ ] Not yet verified
**Evidence file committed:** [ ] Yes  [ ] No — MUST commit before story close
**Emission count / Total identified:** ___ / ___
**Rate:** _____
**Notes:**
