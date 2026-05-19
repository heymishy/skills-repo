# AC Verification Script: wucp.4 — Session start wizard — project/repo selection before journey begins

**Story reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/stories/wucp.4.md
**Verification script author:** Copilot
**Date:** 2026-05-08

---

## Purpose

This script serves three moments:
1. **Pre-code sign-off** — confirm the described behaviour is correct before implementation begins
2. **Post-merge smoke test** — confirm the shipped implementation matches the specification
3. **Delivery review** — structured walkthrough for stakeholders

---

## Setup

Start the web UI server locally:

```powershell
# PowerShell
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
node src/web-ui/server.js
```

```bash
# bash/zsh
export $(grep -v '^#' .env | xargs) && node src/web-ui/server.js
```

Open the web UI in a browser. Log in with a GitHub account that has a Copilot licence. Ensure the repo has `pipeline-state.json` with at least one active feature and one released/archived feature.

---

## Scenario 1 🟡 — AC1: Wizard appears first; no journey content visible before selection

**Trigger:** Open the web UI and navigate to the journey start page (e.g. /journey or the home page).

**What to check:** The FIRST thing displayed is a project selection screen with two options: "New project" and "Existing project". No journey stage content (such as a discovery prompt, a skill instruction block, or a "Start guided outer loop journey" form) appears on screen before you make a selection.

**Expected outcome:** The screen shows only the project selection choices. After you make a selection and confirm it, THEN the journey stage content appears.

**Broken behaviour:** The journey stage (e.g. discovery skill prompt) appears immediately without showing the wizard, OR the wizard appears but the journey stage content is visible behind or below it, OR the screen is blank.

---

## Scenario 2 — AC2: "New project" starts a fresh session at discovery

**Trigger:** On the wizard screen, click "New project".

**What to check:** You are taken directly to the discovery stage of the journey. No feature name or slug is pre-selected. The model's first response treats this as a brand new feature with no prior context.

**Expected outcome:** Journey starts at discovery stage (stage 0). The model asks about your idea or problem statement — it does not reference any specific active feature from `pipeline-state.json`.

**Broken behaviour:** The session loads with an active feature pre-selected, OR a feature slug is visible in the URL or UI, OR you land on a stage other than discovery.

---

## Scenario 3 — AC3: "Existing project" shows only active features

**Trigger:** On the wizard screen, click "Existing project".

**What to check:** A list of features is shown. Verify:
1. Features with stage "released" do NOT appear in the list.
2. Features with stage "archived" do NOT appear in the list.
3. Each listed feature shows its name, current stage, and a health indicator.

**Expected outcome:** Only active (non-released, non-archived) features appear. Each entry shows enough information to identify the right project.

**Broken behaviour:** Released or archived features appear in the list, OR the list is empty when active features exist, OR entries show no stage or health information.

---

## Scenario 4 — AC3 edge case: All features released/archived → helpful message

**Trigger:** Temporarily update `pipeline-state.json` so every feature has `"stage": "released"`. Navigate to "Existing project".

**What to check:** Instead of a blank list, the UI displays the message: "No active projects found. Start a new project instead." A single "New project" action is present.

**Expected outcome:** Exact message: "No active projects found. Start a new project instead." plus a clickable "New project" option. No blank list or confusing empty state.

**Broken behaviour:** An empty list with no message, OR an error, OR the message text differs significantly from the specified wording.

**Reset:** Restore `pipeline-state.json` to its original state after the check.

---

## Scenario 5 — AC4: Selecting a feature starts the journey at the feature's current stage

**Trigger:** On the "Existing project" list, select a feature that is currently at the "review" stage.

**What to check:** The journey opens at the review stage (stage index 3). The model's first response is in review context — it does not restart from discovery.

**Expected outcome:** Journey stage indicator (if visible) shows "review". The model's instructions reflect the review skill. The session is associated with the selected feature slug.

**Broken behaviour:** Journey starts at discovery (stage 0) instead of the feature's current stage, OR the wrong feature is loaded, OR the model opens a different stage.

---

## Scenario 6 — AC5: pipeline-state.json absent → graceful fallback to new project

**Trigger:** Temporarily rename `pipeline-state.json` to `pipeline-state.json.bak`. Navigate to the "Existing project" option.

**What to check:** The UI displays an informational message: "No pipeline state found. Starting a new project." The session then proceeds as a new project (discovery stage, no active feature slug).

**Expected outcome:** Informational message with exact wording. No crash, no error page, no 500 response.

**Broken behaviour:** Server error page, blank screen, 500 response, OR the app continues as if pipeline-state.json exists.

**Reset:** Rename `pipeline-state.json.bak` back to `pipeline-state.json` after the check.

---

## Scenario 7 — AC6: Returning to an active session skips the wizard

**Trigger:** Start a session, select "Existing project", and choose a feature. Note the stage you land on. Then refresh the browser page (F5 or Ctrl+R) WITHOUT closing the browser (session cookie still valid).

**What to check:** The wizard does NOT appear on the refreshed page. The journey resumes at the same stage it was at before the refresh.

**Expected outcome:** After refresh, you go directly back to your active journey stage — no project selection prompt is shown again.

**Broken behaviour:** The wizard appears again after every refresh, requiring the operator to re-select the project on every page load.

---

## Scenario 8 🟡 — NFR accessibility: Keyboard navigation works for all wizard options

**Trigger:** Navigate to the wizard screen. Do NOT use the mouse.

**What to check:** Using Tab key only:
1. Press Tab until "New project" is focused — it should have a visible focus ring.
2. Press Tab again until "Existing project" is focused — visible focus ring.
3. If on the "Existing project" list, press Tab to move between feature entries — each entry should have a visible focus state.
4. Press Enter on a focused option — it should activate the selection (equivalent to clicking).

**Expected outcome:** All interactive elements are reachable by keyboard. Focus states are visible. Enter key activates the focused option.

**Broken behaviour:** Tab skips one of the options, focus states are invisible, or Enter does not activate the focused option.

---

## Scenario 9 — NFR security: Invalid feature slug rejected

**Trigger:** Using the browser developer console, submit a POST request to the wizard selection endpoint with a feature slug that does NOT exist in `pipeline-state.json` (e.g. `"featureSlug": "injected-slug"`).

**What to check:** The server returns HTTP 400. The session is NOT updated with the injected slug. A subsequent GET of the journey shows the wizard again (no feature was selected).

**Expected outcome:** HTTP 400 response. Session unchanged. No injected slug stored.

**Broken behaviour:** HTTP 200 response with the injected slug accepted, OR the session stores a slug that was not in the allowlist.

---

## Verification checklist

| Scenario | AC covered | Status |
|----------|------------|--------|
| 1 🟡 | AC1 (wizard blocks journey — manual) | ☐ |
| 2 | AC2 | ☐ |
| 3 | AC3 | ☐ |
| 4 | AC3 (all-excluded edge) | ☐ |
| 5 | AC4 | ☐ |
| 6 | AC5 | ☐ |
| 7 | AC6 | ☐ |
| 8 🟡 | NFR accessibility (keyboard navigation — manual) | ☐ |
| 9 | NFR security | ☐ |
