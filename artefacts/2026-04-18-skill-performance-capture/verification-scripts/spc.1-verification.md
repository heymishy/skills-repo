# AC Verification Script: Define `context.yml` instrumentation config schema

**Story reference:** artefacts/2026-04-18-skill-performance-capture/stories/spc.1-context-yml-instrumentation-config.md
**Technical test plan:** artefacts/2026-04-18-skill-performance-capture/test-plans/spc.1-test-plan.md
**Script version:** 1
**Verified by:** _______________ | **Date:** _______________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open the repository in a file browser or code editor.
2. Navigate to the `contexts/` folder at the root of the repository.
3. Open `contexts/personal.yml`.

**Reset between scenarios:** Not needed — all scenarios are read-only inspections of committed files.

---

## Scenarios

---

### Scenario 1: Template file has an `instrumentation:` block

**Covers:** AC1 (partial — block exists)

**Steps:**
1. Open `contexts/personal.yml`.
2. Search the file for the text `instrumentation:`.

**Expected outcome:**
> You find an `instrumentation:` block in the file. It may be commented out (each line starts with `#`), but the structure is visible.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Instrumentation block documents all four required fields

**Covers:** AC1 (full — all 4 fields present)

**Steps:**
1. In `contexts/personal.yml`, locate the `instrumentation:` block.
2. Check that each of the following four field names appears within the block (they may be commented out): `enabled`, `experiment_id`, `model_label`, `cost_tier`.

**Expected outcome:**
> All four field names are visible in the `instrumentation:` block, each with a short comment or description of what the field is for.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Block is turned off by default with workflow instructions

**Covers:** AC5

**Steps:**
1. In `contexts/personal.yml`, find the `instrumentation:` block.
2. Check whether `enabled` is set to `false`, or the whole block is commented out.
3. Check whether there is a comment explaining how to enable it — something like "uncomment this block and fill in the three required fields."

**Expected outcome:**
> Instrumentation is off by default. There is a comment explaining how an operator turns it on — set `enabled: true` and provide `experiment_id`, `model_label`, and `cost_tier`. The workflow is clear enough to follow without reading another document.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Credential warning — model_label and cost_tier are description fields, not secret fields

**Covers:** AC1 NFR Security

**Steps:**
1. Read the comment text in the `instrumentation:` block for `model_label` and `cost_tier`.
2. Check whether the comment makes clear these are human-readable descriptions (e.g. "claude-sonnet-4-6", "standard") — not API keys or tokens.

**Expected outcome:**
> The comments or example values make clear that `model_label` and `cost_tier` are descriptive labels. There is no example value that looks like an API key (no long random strings, no `sk-` prefix, no `Bearer` tokens).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5 (Manual gap — AC4): No capture blocks appear in an outer loop run when instrumentation is disabled

**Covers:** AC4 (runtime behaviour — manual verification required; see test plan gap table)

🔴 **This scenario requires a live agent session. Do not skip at post-merge smoke test.**

**Steps:**
1. Confirm `contexts/personal.yml` (or the active `.github/context.yml`) has `instrumentation.enabled: false` or the block commented out.
2. Run a short outer loop with the agent — for example, start a `/discovery` session for a small idea.
3. After the agent writes `discovery.md`, open the file.
4. Scroll to the end of the file.

**Expected outcome:**
> The file ends at the normal final section of the discovery artefact. There is no `## Capture Block` section appended at the end. The file is unmodified from what the skill would normally produce.

**Result:** [ ] Pass  [ ] Fail
**Notes:**
