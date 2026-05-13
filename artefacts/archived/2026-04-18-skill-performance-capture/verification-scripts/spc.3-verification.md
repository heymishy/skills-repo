# AC Verification Script: Add instrumentation instruction to copilot-instructions.md

**Story reference:** artefacts/2026-04-18-skill-performance-capture/stories/spc.3-copilot-instructions-instrumentation.md
**Technical test plan:** artefacts/2026-04-18-skill-performance-capture/test-plans/spc.3-test-plan.md
**Script version:** 1
**Verified by:** _______________ | **Date:** _______________ | **Pre-code** [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open `.github/copilot-instructions.md` in an editor or text viewer.
2. Have `contexts/personal.yml` (or `.github/context.yml`) available.
3. Scenarios 1–3 require only the file — no live agent session.
4. **Scenarios 4–5 require a live Copilot Chat session with this repository as context.** These are the 🔴 manual scenarios that cannot be automated.

**Reset between scenarios:** Switch `.github/context.yml` back to the state appropriate for the next scenario (enabled/disabled).

---

## Scenarios

---

### Scenario 1: Section heading exists in copilot-instructions.md

**Covers:** AC1 (existence)

**Steps:**
1. Open `.github/copilot-instructions.md`.
2. Search for a section heading containing the words "Skill Performance Capture" or "instrumentation".

**Expected outcome:**
> A section heading — for example `## Skill Performance Capture (instrumentation)` — is present in the file. The section is not commented out.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Section contains the three required instructions

**Covers:** AC1 (full — all three instructions present)

**Steps:**
1. In the Skill Performance Capture section, read the instruction text.
2. Check instruction (a): is there a sentence instructing the agent to read `context.yml` at session start?
3. Check instruction (b): is there a sentence instructing the agent to check whether `instrumentation.enabled` is `true` before appending a capture block?
4. Check instruction (c): is there a sentence instructing the agent to append the capture block at the end of each artefact that matches the specified list?

**Expected outcome:**
> All three instructions are present: (a) read context.yml, (b) check `instrumentation.enabled`, (c) append capture block when enabled. Each instruction is clear enough for an agent to act on without reading another file first.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Appendix constraint and artefact scope are explicit

**Covers:** AC4, AC5

**Steps:**
1. In the Skill Performance Capture section, look for text about where the capture block goes.
2. Check AC4: is there a sentence saying the capture block is an appendix that must not be edited or reordered as part of normal artefact content?
3. Check AC5: does the section name at least 5 specific artefact types where blocks are expected (e.g. discovery.md, benefit-metric.md, story artefacts, test-plan artefacts)?
4. Check AC5 exclusion: does the section explicitly say capture blocks are NOT added to gate artefacts such as DoR or DoD?

**Expected outcome:**
> The appendix constraint is stated. The list of 5+ artefact types is present. The DoR/DoD exclusion is explicit — gate artefacts are not in scope.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4 (Manual — AC2): Capture block appears in artefact when instrumentation is enabled

🔴 **This scenario requires a live Copilot Chat session. Requires instrumentation to be enabled in `.github/context.yml`.**

**Setup:**
1. Copy `contexts/personal.yml` to `.github/context.yml`.
2. In `.github/context.yml`, set `instrumentation.enabled: true`, provide a valid `experiment_id`, `model_label`, and `cost_tier`.
3. Open a Copilot Chat session with this repository as context.

**Steps:**
1. Run a short pipeline skill — for example, `/discovery` for a simple idea.
2. After the skill runs, open the output artefact file (e.g. `artefacts/[date]-[slug]/discovery.md`).
3. Scroll to the end of the file.

**Expected outcome:**
> A `## Capture Block` section is appended at the end of the discovery artefact. The block contains the metadata fields from `/github/templates/capture-block.md`. The `experiment_id`, `model_label`, and `cost_tier` fields match what was set in `.github/context.yml`.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5 (Manual — AC3): No capture block appears when instrumentation is disabled

🔴 **This scenario requires a live Copilot Chat session. Requires instrumentation to be disabled.**

**Setup:**
1. In `.github/context.yml`, set `instrumentation.enabled: false` (or comment out the instrumentation block).
2. Open a Copilot Chat session with this repository as context.

**Steps:**
1. Run a short pipeline skill — for example, `/discovery` for a simple idea.
2. After the skill runs, open the output artefact file.
3. Scroll to the end of the file.

**Expected outcome:**
> The file ends at the normal final section of the artefact. There is no `## Capture Block` section at the end. The artefact is identical to what the skill would produce without any instrumentation configured.

**Result:** [ ] Pass  [ ] Fail
**Notes:**
