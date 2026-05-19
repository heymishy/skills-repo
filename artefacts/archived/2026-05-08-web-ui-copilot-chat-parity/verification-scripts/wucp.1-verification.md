# AC Verification Script: wucp.1 — Pipeline context auto-loader at session start

**Story reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/stories/wucp.1.md
**Verification script author:** Copilot
**Date:** 2026-05-08

---

## Purpose

This script serves three moments:
1. **Pre-code sign-off** — confirm the described behaviour is the correct behaviour before implementation begins
2. **Post-merge smoke test** — confirm the shipped implementation matches the specification
3. **Delivery review** — structured walkthrough for stakeholders

Read each scenario description and confirm you agree with the expected outcome before marking it complete.

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

Open a browser to the web UI (default: http://localhost:3000). Log in with a GitHub account that has a Copilot licence.

---

## Scenario 1 — AC1: Pipeline state files appear in session context

**Trigger:** Start a new journey session in the web UI.

**What to check:** Before the operator sends any message, the model's opening response (or the first response to any orientation question like "where are we?") should reference information from `pipeline-state.json`, `workspace/state.json`, and `context.yml`.

**Expected outcome:** The model mentions the active feature name, the current pipeline stage, and any toolchain settings from `context.yml`. These reflect the actual contents of the three files at the time the session was started.

**Broken behaviour:** The model says it has no context and asks the operator to paste pipeline state, OR the model gives a response about a feature or stage that does not match what is in `pipeline-state.json`.

---

## Scenario 2 — AC2: Missing context files do not crash the session

**Trigger:** Temporarily rename or remove `workspace/state.json` from the repo root, then start a new journey session.

**What to check:** The session starts normally. No error page is shown. No error message appears in the session response about a missing file.

**Expected outcome:** Session starts. If the model asks for orientation context, it may note that workspace state is not available, but no crash or error occurs.

**Broken behaviour:** An error page is displayed, or the server returns a 500 error, or the session fails to start with an error about a missing file.

**Reset:** Restore `workspace/state.json` after the check.

---

## Scenario 3 — AC3: Artefact listing scoped to the active feature

**Trigger:** Start a new journey session. In the first message, ask: "What artefacts are available for my current feature?"

**What to check:** The model lists files under `artefacts/[active-feature-slug]/` — only for the active feature, not for other features in the repository.

**Expected outcome:** The model names artefact files (e.g. `discovery.md`, `benefit-metric.md`, story files) that match the active feature's directory. It does not list artefacts from other feature directories.

**Broken behaviour:** The model lists artefacts from all features, or lists no artefacts, or states it cannot see any artefact files.

---

## Scenario 4 — AC4 and AC6: Learning context and optional files

**Trigger:** Start a new journey session. Ask: "What have we learned so far this project?"

**What to check:** The model references content from `workspace/learnings.md`. If the file has more than 50 lines, the model should reflect content from the first portion only — not cite learning entries that appear after line 50.

**Also check:** If `fleet-state.json` is present in the repo root, the model should be able to answer basic questions about the fleet. If `artefact-coverage-exemptions.json` is present, the model should know about it.

**Expected outcome:** The model references actual learning entries from `workspace/learnings.md`. Coverage exemptions and fleet state are available for reference if the operator asks about them.

**Broken behaviour:** The model says no learning history is available, OR the model references learning entries beyond line 50 (indicating the file was not truncated), OR fleet/exemptions files cause an error.

---

## Scenario 5 🟡 — AC5: Schema inspection artefact reviewed (operator review — do not skip)

**Trigger:** Navigate to `artefacts/2026-05-08-web-ui-copilot-chat-parity/reference/context-yml-schema-inspection.md` in the repository.

**What to check:**
1. The file exists.
2. Section (a): All top-level fields in `context.yml` are listed with their value types.
3. Section (b): The document explicitly states that no field value contains a credential (token, password, key, or secret value).
4. Section (c): The document confirms all sensitive values use the `secretRef` pattern (a reference name only — not the secret value itself).

**Expected outcome:** All three confirmation statements are present and unambiguous. The operator (you) reads the field list and agrees that no field value is a credential.

**Broken behaviour:** The file does not exist, OR it is incomplete, OR a field is listed without a clear declaration about whether it contains a credential value.

**This scenario must pass before the story is merged. Mark it 🔴 BLOCKED if the file does not exist.**

---

## Scenario 6 — AC2 edge case: Session starts with ALL context files missing

**Trigger:** Temporarily move `pipeline-state.json`, `workspace/state.json`, and `context.yml` out of the repo root. Start a new journey session.

**What to check:** The session starts without errors. The model may note that context is unavailable, but no crash occurs.

**Expected outcome:** Web UI loads. Session starts. The model gracefully notes the absence of pipeline context and asks the operator to describe the current situation.

**Broken behaviour:** Server error page, 500 response, or session fails to initialise.

**Reset:** Restore all three files after the check.

---

## Scenario 7 🟡 — AC7: Dogfood orientation (live model — run after first deploy)

**Trigger:** Start a new journey session when `pipeline-state.json` has an active feature in progress. Send the message: "Where are we and what's next?"

**What to check:** The model's response correctly states:
- The active feature name (e.g. "2026-05-08-web-ui-copilot-chat-parity")
- The current pipeline stage of that feature (e.g. "test-plan")
- A concrete next action (e.g. "run /definition-of-ready for wucp.1")

**Expected outcome:** The model gives a specific, accurate orientation that matches the actual state in `pipeline-state.json` and `workspace/state.json`. No manual context injection was needed.

**Broken behaviour:** The model gives a generic response, states incorrect phase or feature, OR asks the operator to paste pipeline state manually before it can orient.

---

## Scenario 8 — NFR: Assembly completes without perceptible delay

**Trigger:** Start a new journey session on a repo with 10+ active features.

**What to check:** The session loads and the first model response arrives within a normal response time (no multi-second delay attributable to context assembly).

**Expected outcome:** Session start and first response feel no slower than a session on a repo with 1 feature.

**Broken behaviour:** Noticeable delay (>3 seconds beyond normal model latency) before the first response.

---

## Verification checklist

| Scenario | AC covered | Status |
|----------|------------|--------|
| 1 | AC1 | ☐ |
| 2 | AC2 | ☐ |
| 3 | AC3 | ☐ |
| 4 | AC4, AC6 | ☐ |
| 5 🟡 | AC5 (merge blocker) | ☐ |
| 6 | AC2 (edge) | ☐ |
| 7 🟡 | AC7 (post-deploy) | ☐ |
| 8 | NFR performance | ☐ |
