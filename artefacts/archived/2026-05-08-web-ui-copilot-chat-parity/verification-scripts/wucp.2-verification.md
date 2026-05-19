# AC Verification Script: wucp.2 — Slash command router for freeform skill invocation

**Story reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/stories/wucp.2.md
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

Open the web UI in a browser and log in. Start a journey session so you are on an active journey stage (e.g. the definition stage).

---

## Scenario 1 — AC1: Typing /workflow loads the workflow skill for that turn

**Trigger:** While in an active journey session (e.g. on definition stage), type `/workflow` in the message input and press Enter.

**What to check:** The model's response reflects the `/workflow` skill's instructions — it should diagnose the current pipeline state and tell you what to do next (not respond as the definition skill would).

**Expected outcome:** The model responds as if `/workflow` was invoked in VS Code: it reads the pipeline state and reports where you are and what the next step is. The response is clearly from the workflow skill context, not the journey stage.

**Broken behaviour:** The model responds as the definition stage skill (asks about the discovery you want to decompose), OR returns an error, OR fails to respond.

---

## Scenario 2 — AC4: Journey stage position preserved after /decisions side-trip

**Trigger:** While in a journey session on definition stage (working on story 2 of 4), type `/decisions` and record a decision. Then on the NEXT message, type a normal definition-related message (no slash command).

**What to check:** On the next message after the `/decisions` invocation, the model responds as the definition stage skill again — at the same position (story 2 of 4). The session has not been reset to stage 0.

**Expected outcome:** The session seamlessly returns to definition stage after the `/decisions` side-trip. The model continues where it left off without prompting to restart.

**Broken behaviour:** The model starts from scratch (asks for a raw idea as if at discovery stage), OR the session shows stage 0, OR the `/decisions` turn corrupts the journey state.

---

## Scenario 3 — AC2: A skill added to .github/skills/ is immediately available

**Trigger:** Create a new directory `.github/skills/my-probe-skill/` with a file `SKILL.md` containing any text. Without restarting the server, type `/my-probe-skill` in the message input.

**What to check:** The model's response reflects the content of your new `SKILL.md` file.

**Expected outcome:** The model uses the content of the file you just created — it was discovered automatically via the directory read with no code change or server restart required.

**Broken behaviour:** The model returns "unknown skill" or an error, OR uses a cached skill list that doesn't include your new skill.

**Reset:** Delete `.github/skills/my-probe-skill/` after the check.

---

## Scenario 4 — AC3: Capability notice appears for surface-limited skills

**Trigger:** Type `/branch-setup` in the message input and press Enter.

**What to check:** The model's response includes a notice similar to: "NOTE: This skill requires git worktree. Some outputs may be limited or unavailable in the web UI."

**Expected outcome:** The capability notice appears before or at the beginning of the skill's response. The skill content is still available — the notice supplements it, not replaces it.

**Broken behaviour:** No notice appears and the model attempts to guide through branch setup steps that require a local git worktree (which the web UI cannot run), OR the skill fails to load entirely.

---

## Scenario 5 — AC5: Unknown skill name returns helpful message

**Trigger:** Type `/workfow` (deliberately misspelled) in the message input and press Enter.

**What to check:** The model (or UI) responds with a message that:
1. Notes that `workfow` is not a known skill
2. Lists the available skills so you can pick the correct one

**Expected outcome:** You see a message like "Skill 'workfow' not found. Available skills: workflow, decisions, definition, ..." with the actual list of skills.

**Broken behaviour:** A server error, a blank response, OR the model loads a random skill, OR the model guesses and loads `workflow` silently.

---

## Scenario 6 — AC6 + NFR security: Path injection in skill name is blocked

**Trigger:** In the browser's developer console or via a direct API call, POST to `/api/journey/slash` (or equivalent endpoint) with body `{ "skillName": "../../../etc/passwd" }`.

**What to check:** The server returns HTTP 400 with an error indicating the skill name is invalid. No file system access is attempted for the injected path.

**Expected outcome:** HTTP 400 response. The response body contains an error code like `INVALID_SKILL_NAME`. No file content from outside `.github/skills/` is returned.

**Broken behaviour:** HTTP 200 with file contents, OR HTTP 500 (error during file read), OR any response that indicates the server attempted to read the injected path.

---

## Scenario 7 — AC1 + AC2: Multiple skills accessible in the same session

**Trigger:** In one journey session, type `/workflow` → receive response → then type `/decisions` → receive response → then type `/coverage-map` → receive response.

**What to check:** Each slash command loads a distinct skill with its own distinct instructions. The workflow response differs from the decisions response, which differs from the coverage-map response.

**Expected outcome:** Each response reflects the specific skill's purpose. Workflow orients you in the pipeline. Decisions helps you log a decision. Coverage-map explains coverage analysis. None bleed into the others.

**Broken behaviour:** Two or more slash commands produce the same or similar responses, suggesting the same skill content is being loaded regardless of input.

---

## Scenario 8 — NFR performance: Slash command responds without noticeable delay

**Trigger:** Type `/workflow` and press Enter. Time from Enter to first token of model response.

**What to check:** The delay between pressing Enter and the first model response is comparable to a normal journey-stage message. There is no additional multi-second wait that would indicate a slow skill file load.

**Expected outcome:** Response feels immediate (skill file read is synchronous and < 100ms for any skill in the library).

**Broken behaviour:** Noticeable multi-second delay before the model responds (more than 1–2 seconds beyond normal model latency).

---

## Verification checklist

| Scenario | AC covered | Status |
|----------|------------|--------|
| 1 | AC1 | ☐ |
| 2 | AC4 | ☐ |
| 3 | AC2 | ☐ |
| 4 | AC3 | ☐ |
| 5 | AC5 | ☐ |
| 6 | AC6 + NFR security | ☐ |
| 7 | AC1 + AC2 (multi-skill) | ☐ |
| 8 | NFR performance | ☐ |
