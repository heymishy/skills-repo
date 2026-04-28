# AC Verification Script: Define `workspace/capture-log.md` schema and `/capture` operator command

**Story reference:** artefacts/2026-04-28-inflight-learning-capture/stories/ilc.1.md
**Technical test plan:** artefacts/2026-04-28-inflight-learning-capture/test-plans/ilc.1-test-plan.md
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open the repository in your editor or file explorer.
2. Locate `copilot-instructions.md` in the repository root.
3. Locate `.gitignore` in the repository root.
4. No other tools or environment needed — all checks are reading file contents.

**Reset between scenarios:** Each scenario is independent — no reset needed.

---

## Scenarios

---

### Scenario 1: `/capture` command is described in the instructions

**Covers:** AC1

**Steps:**
1. Open `copilot-instructions.md`.
2. Search (Ctrl+F) for `/capture`.

**Expected outcome:**
> You find a section or instruction block that describes the `/capture` operator command. The description explains that invoking `/capture [signal text]` writes a new entry to `workspace/capture-log.md`. The instruction is phrased as a command the operator can use during a session — not buried in a comment or example.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The 5-field schema is specified in the instructions

**Covers:** AC1

**Steps:**
1. In `copilot-instructions.md`, find the `/capture` instruction block.
2. Check that all five of these field names appear: `date`, `session-phase`, `signal-type`, `signal-text`, `source`.

**Expected outcome:**
> All five field names are explicitly listed in the `/capture` instruction. The instruction makes clear what each field contains — at minimum it names them. The fields are not scattered across unrelated sections; they appear together as the schema for a capture entry.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The 6 valid signal-type values are listed

**Covers:** AC1

**Steps:**
1. In the `/capture` instruction block, look for the list of valid `signal-type` values.
2. Check that all six appear: `decision`, `learning`, `assumption-validated`, `assumption-invalidated`, `pattern`, `gap`.

**Expected outcome:**
> All six signal-type values are explicitly enumerated. The operator reading this instruction can identify which category their capture belongs to without guessing.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The instructions guard against blank entries

**Covers:** AC4

**Steps:**
1. In the `/capture` instruction block, look for text about what happens when `/capture` is invoked without any signal text.

**Expected outcome:**
> The instruction states that if `/capture` is invoked with no text, the agent asks the operator for the signal text before writing. The instruction does not permit a blank entry to be written. It uses language like "prompt", "ask", or "require" the operator to provide text.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: `workspace/capture-log.md` is excluded from git

**Covers:** AC6

**Steps:**
1. Open `.gitignore` in the repository root.
2. Search for `workspace/capture-log.md` or a wildcard pattern that covers it (e.g. `workspace/capture-log.md`, `workspace/*.md`, or `workspace/`).

**Expected outcome:**
> The file `workspace/capture-log.md` is listed in `.gitignore`, either by its exact path or via a matching wildcard. Running `git status` after creating the file should show it as untracked (not as a new file to stage). The file should never appear in a `git add .` result.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: Entry is appended, not overwritten (post-merge smoke test)

**Covers:** AC2, AC3, AC5

**Steps:**
1. In a chat session, invoke `/capture This is a test signal` and confirm it writes to `workspace/capture-log.md`.
2. Invoke `/capture A second test signal` in the same session.
3. Open `workspace/capture-log.md`.

**Expected outcome:**
> The file contains two entries. The first entry is unchanged — it has the original `signal-text` ("This is a test signal") and `source: operator-manual`. The second entry appears after it. The file has not been truncated. Each entry contains all five fields.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 7: New session does not erase previous entries (post-merge smoke test)

**Covers:** AC5

**Steps:**
1. After completing Scenario 6, close your current chat session and start a new one.
2. Invoke `/capture Entry from new session`.
3. Open `workspace/capture-log.md`.

**Expected outcome:**
> The file contains at least 3 entries. The entries from the previous session (Scenario 6) are still present — unchanged — at the top of the file. The new entry appears at the end. The file has not been cleared or rewritten.

**Result:** [ ] Pass  [ ] Fail
**Notes:**
