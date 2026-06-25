# AC Verification Script — sri.1: Add git fetch timeout and fallback in inner-loop skills

**Story:** artefacts/2026-05-18-skill-robustness-improvements/stories/sri.1.md
**Date:** 2026-06-25
**For use:** Pre-code sign-off (confirm the spec is correct) · Post-merge smoke test · Delivery review

---

## Setup

This story modifies three skill instruction files. All verification is a reading and running exercise — no server required. You need a terminal at the repo root and Node.js installed.

**Automated test command:**
```
node tests/check-sri1-fetch-timeout.js
```
Expected output: all 13 tests pass.

---

## Scenario 1 — branch-complete handles a missing origin gracefully (AC1)

**What to check:** After the changes are merged, open `skills/branch-complete/SKILL.md` in an editor.

1. Find the section where the skill reads `pipeline-state.json` from the remote.
2. Confirm there is now a 5-second timeout around the `git fetch origin master` step — the instruction text should mention "5 seconds" or "5-second timeout".
3. Confirm the instructions describe a fallback: if the fetch fails or times out, the skill should use the local branch copy (or the worktree file) instead.
4. Confirm the instructions include a warning message for the operator — something like "origin not reachable — using local copy" — that appears when the fallback activates.

**Broken behaviour to watch for:** The skill instructions still say `execSync('git fetch origin master')` with no timeout or fallback — that is the unfixed version.

---

## Scenario 2 — implementation-plan handles a missing origin gracefully (AC2)

**What to check:** Open `skills/implementation-plan/SKILL.md`.

Repeat the same three checks from Scenario 1:
1. 5-second timeout around the `git fetch` instruction.
2. Fallback to local branch copy on failure.
3. Warning message instruction for the operator.

**Broken behaviour:** Bare `execSync('git fetch origin master')` with no fallback.

---

## Scenario 3 — subagent-execution handles a missing origin gracefully (AC3)

**What to check:** Open `skills/subagent-execution/SKILL.md`. Repeat Scenario 1 checks.

---

## Scenario 4 — 5-second timeout is explicitly named in all three skills (AC4)

**What to check:** In each of the three SKILL.md files from Scenarios 1–3:

Confirm the timeout value is explicitly 5 seconds — not "a short timeout" or "a few seconds". The instruction must name the value so the operator knows how long to wait before the fallback activates.

**Broken behaviour:** Timeout instruction is vague or missing the specific duration.

---

## Scenario 5 — no change in behaviour when origin is healthy (AC5)

**What to check:** In each of the three SKILL.md files, confirm the `git fetch origin master` instruction is still present as the primary step. The fallback should be described as a conditional path (only when fetch fails), not the default path.

The skill should still fetch from origin when it can — the fallback is only for when it cannot.

**Broken behaviour:** The skill instructions remove the `git fetch` step entirely, or always use the local copy without attempting the fetch first.

---

## Scenario 6 — warning message does not expose credentials (NFR-SEC)

**What to check:** In each of the three SKILL.md files, find the warning message instruction (the text that will be shown to the operator when the fallback activates).

Confirm the warning is a plain-text message that does NOT:
- Tell the agent to log the remote URL (e.g. `https://github.com/...`)
- Tell the agent to print the full `git fetch` error output
- Include any mention of tokens, passwords, or credentials in the message text

The warning should read like: "origin not reachable — using local copy" — a clear, safe message.

**Broken behaviour:** Warning instruction includes `error.message` from the failed `git fetch` (which could contain a URL or auth failure message) or explicitly logs a remote URL.

---

## Automated check (post-merge)

```
node tests/check-sri1-fetch-timeout.js
```

Expected: 13 tests pass. The 9 content-assertion tests (T1–T9) should now pass after the changes are merged.
